const db = require('../db');
const { sendBudgetTransferEmail } = require('../utils/emailService');
const { createBudgetTransferNotification } = require('./notificationController');

// Get available budgets for transfer (budgets with remaining amount)
const getAvailableBudgetsForTransfer = async (req, res) => {
  console.log('🔍 Available budgets endpoint called');
  
  try {
    const userId = req.user.userId;
    const { excludeCategory } = req.query;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    console.log('Parameters:', { userId, excludeCategory, currentMonth, currentYear });

    // Simplified query to avoid potential issues
    const budgetsQuery = `
      SELECT 
        b.id,
        b.category,
        b.limit_amount,
        COALESCE(spent.total_spent, 0) as spent_amount,
        (b.limit_amount - COALESCE(spent.total_spent, 0)) as remaining_amount
      FROM budgets b
      LEFT JOIN (
        SELECT 
          category,
          SUM(amount) as total_spent
        FROM transactions 
        WHERE user_id = $1 
          AND type = 'expense' 
          AND EXTRACT(MONTH FROM date) = $2 
          AND EXTRACT(YEAR FROM date) = $3
        GROUP BY category
      ) spent ON b.category = spent.category
      WHERE b.user_id = $1 
        AND b.month = $2 
        AND b.year = $3
        AND b.category != $4
        AND (b.limit_amount - COALESCE(spent.total_spent, 0)) > 0
      ORDER BY remaining_amount DESC
    `;

    console.log('Executing budget query...');
    const result = await db.query(budgetsQuery, [userId, currentMonth, currentYear, excludeCategory || '']);
    
    console.log(`✅ Found ${result.rows.length} available budgets`);
    
    res.json({
      availableBudgets: result.rows,
      message: `Found ${result.rows.length} categories with available budget`
    });
  } catch (err) {
    console.error('🔴 GET AVAILABLE BUDGETS ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch available budgets', details: err.message });
  }
};

// Process budget transfer
const processBudgetTransfer = async (req, res) => {
  const userId = req.user.userId;
  const { overflowId, fromCategory, toCategory, transferAmount, reason } = req.body;

  if (!overflowId || !fromCategory || !toCategory || !transferAmount) {
    return res.status(400).json({ error: 'Missing required transfer information' });
  }

  const client = await db.connect();
  
  try {
    await client.query('BEGIN');

    // Get overflow details
    const overflowResult = await client.query(
      'SELECT * FROM budget_overflows WHERE id = $1 AND user_id = $2 AND is_resolved = FALSE',
      [overflowId, userId]
    );

    if (overflowResult.rows.length === 0) {
      throw new Error('Overflow record not found or already resolved');
    }

    const overflow = overflowResult.rows[0];

    // Verify transfer amount matches overflow
    if (parseFloat(transferAmount) !== parseFloat(overflow.overflow_amount)) {
      throw new Error('Transfer amount must match overflow amount');
    }

    // Check if fromCategory has enough remaining budget
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    
    const fromBudgetResult = await client.query(
      `SELECT b.*, COALESCE(spent.total_spent, 0) as spent_amount,
       (b.limit_amount - COALESCE(spent.total_spent, 0)) as remaining_amount
       FROM budgets b
       LEFT JOIN (
         SELECT SUM(amount) as total_spent
         FROM transactions 
         WHERE user_id = $1 AND category = $2 AND type = 'expense'
           AND EXTRACT(MONTH FROM date) = $3 AND EXTRACT(YEAR FROM date) = $4
       ) spent ON true
       WHERE b.user_id = $1 AND b.category = $2 AND b.month = $3 AND b.year = $4`,
      [userId, fromCategory, month, year]
    );

    if (fromBudgetResult.rows.length === 0) {
      throw new Error('Source budget category not found');
    }

    const fromBudget = fromBudgetResult.rows[0];
    
    if (fromBudget.remaining_amount < transferAmount) {
      throw new Error(`Insufficient budget in ${fromCategory}. Available: ${fromBudget.remaining_amount}, Required: ${transferAmount}`);
    }

    // Create budget transfer record
    const transferResult = await client.query(
      `INSERT INTO budget_transfers (user_id, transaction_id, from_category, to_category, transfer_amount, reason)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, overflow.transaction_id, fromCategory, toCategory, transferAmount, reason || 'Budget overflow reallocation']
    );

    const transfer = transferResult.rows[0];

    // 🔄 ACTUALLY UPDATE BUDGET LIMITS
    // Decrease from_category budget limit
    await client.query(
      `UPDATE budgets 
       SET limit_amount = limit_amount - $1
       WHERE user_id = $2 AND category = $3 AND month = $4 AND year = $5`,
      [transferAmount, userId, fromCategory, month, year]
    );

    // Increase to_category budget limit (or create if doesn't exist)
    const toBudgetExists = await client.query(
      'SELECT id FROM budgets WHERE user_id = $1 AND category = $2 AND month = $3 AND year = $4',
      [userId, toCategory, month, year]
    );

    if (toBudgetExists.rows.length > 0) {
      // Update existing budget
      await client.query(
        `UPDATE budgets 
         SET limit_amount = limit_amount + $1
         WHERE user_id = $2 AND category = $3 AND month = $4 AND year = $5`,
        [transferAmount, userId, toCategory, month, year]
      );
    } else {
      // Create new budget for to_category
      await client.query(
        `INSERT INTO budgets (user_id, category, limit_amount, month, year)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, toCategory, transferAmount, month, year]
      );
    }

    console.log(`✅ Budget limits updated: ${fromCategory} -${transferAmount}, ${toCategory} +${transferAmount}`);

    // Mark overflow as resolved
    await client.query(
      'UPDATE budget_overflows SET is_resolved = TRUE, resolution_method = $1 WHERE id = $2',
      ['transfer', overflowId]
    );

    // Update the transaction with transfer details
    await client.query(
      `UPDATE transactions 
       SET is_overflow = TRUE, 
           overflow_amount = $1, 
           transfer_from_category = $2,
           transfer_details = $3
       WHERE id = $4`,
      [
        transferAmount,
        fromCategory,
        JSON.stringify({
          transferId: transfer.id,
          fromCategory: fromCategory,
          transferAmount: transferAmount,
          transferDate: new Date().toISOString()
        }),
        overflow.transaction_id
      ]
    );

    // Create success alert
    await client.query(
      `INSERT INTO budget_alerts (user_id, category, alert_type, message, amount)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, toCategory, 'transfer_completed', 
       `Budget transfer completed: LKR ${transferAmount} transferred from ${fromCategory} to ${toCategory}`, 
       transferAmount]
    );

    // Get user details for email
    const userResult = await client.query('SELECT email, username FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    await client.query('COMMIT');

    // 📱 Create FinGuard notification 
    try {
      await createBudgetTransferNotification(
        userId, 
        fromCategory, 
        toCategory, 
        transferAmount, 
        reason
      );
      console.log('📱 Budget transfer notification created in FinGuard notifications');
    } catch (notifError) {
      console.error('❌ Failed to create FinGuard notification:', notifError);
      // Don't fail the transfer if notification fails
    }

    // Send email notification
    if (user?.email) {
      try {
        await sendBudgetTransferEmail(
          user.email, 
          user.username, 
          fromCategory, 
          toCategory, 
          transferAmount,
          overflow.category,
          overflow.overflow_amount
        );
        console.log('📧 Budget transfer email sent to:', user.email);
      } catch (emailErr) {
        console.error('❌ Failed to send transfer email:', emailErr);
      }
    }

    res.json({
      message: 'Budget transfer completed successfully',
      transfer: transfer,
      overflow: { ...overflow, is_resolved: true }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('🔴 BUDGET TRANSFER ERROR:', err.message);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

// Get user's budget alerts (notifications)
const getBudgetAlerts = async (req, res) => {
  const userId = req.user.userId;
  const { limit = 10, unreadOnly = false } = req.query;

  try {
    let query = `
      SELECT * FROM budget_alerts 
      WHERE user_id = $1
    `;
    let params = [userId];

    if (unreadOnly === 'true') {
      query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY alert_date DESC';
    
    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));
    }

    const result = await db.query(query, params);
    
    res.json({
      alerts: result.rows,
      unreadCount: unreadOnly === 'true' ? result.rows.length : 
        (await db.query('SELECT COUNT(*) as count FROM budget_alerts WHERE user_id = $1 AND is_read = FALSE', [userId])).rows[0].count
    });
  } catch (err) {
    console.error('🔴 GET BUDGET ALERTS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch budget alerts' });
  }
};

// Mark alerts as read
const markAlertsAsRead = async (req, res) => {
  const userId = req.user.userId;
  const { alertIds } = req.body;

  try {
    if (alertIds && alertIds.length > 0) {
      // Mark specific alerts as read
      const placeholders = alertIds.map((_, index) => `$${index + 2}`).join(',');
      await db.query(
        `UPDATE budget_alerts SET is_read = TRUE 
         WHERE user_id = $1 AND id IN (${placeholders})`,
        [userId, ...alertIds]
      );
    } else {
      // Mark all alerts as read
      await db.query(
        'UPDATE budget_alerts SET is_read = TRUE WHERE user_id = $1',
        [userId]
      );
    }

    res.json({ message: 'Alerts marked as read successfully' });
  } catch (err) {
    console.error('🔴 MARK ALERTS READ ERROR:', err.message);
    res.status(500).json({ error: 'Failed to mark alerts as read' });
  }
};

// Get budget transfer history
const getBudgetTransferHistory = async (req, res) => {
  const userId = req.user.userId;
  const { limit = 20 } = req.query;

  try {
    const result = await db.query(
      `SELECT bt.*, t.amount as transaction_amount, t.description as transaction_description
       FROM budget_transfers bt
       LEFT JOIN transactions t ON bt.transaction_id = t.id
       WHERE bt.user_id = $1
       ORDER BY bt.transfer_date DESC
       LIMIT $2`,
      [userId, parseInt(limit)]
    );

    res.json({
      transfers: result.rows,
      message: `Found ${result.rows.length} budget transfers`
    });
  } catch (err) {
    console.error('🔴 GET TRANSFER HISTORY ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch transfer history' });
  }
};

module.exports = {
  getAvailableBudgetsForTransfer,
  processBudgetTransfer,
  getBudgetAlerts,
  markAlertsAsRead,
  getBudgetTransferHistory
};