const db = require('../db');
const { sendBudgetAlertEmail } = require('../utils/emailService');
const { createBudgetOverflowNotification } = require('./notificationController');
const { ensureCurrentMonthBudgets } = require('../services/budgetService');

// Helper function to check child spending limits
const checkChildSpendingLimit = async (userId, amount, type) => {
  if (type !== 'expense') {
    return { allowed: true }; // Income is always allowed
  }

  try {
    // Check if user is a child in a family group
    const childCheck = await db.query(`
      SELECT fm.monthly_budget, fm.role, u.role as user_role
      FROM family_members fm
      JOIN users u ON fm.user_id = u.id
      WHERE fm.user_id = $1 AND fm.is_active = true AND fm.role = 'child'
    `, [userId]);

    if (childCheck.rows.length === 0) {
      return { allowed: true }; // Not a child, no limits
    }

    const childData = childCheck.rows[0];
    const monthlyLimit = parseFloat(childData.monthly_budget || 0);

    if (monthlyLimit <= 0) {
      return { allowed: true }; // No limit set
    }

    // Calculate current month's expenses
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const spentResult = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total_spent
      FROM transactions
      WHERE user_id = $1 AND type = 'expense'
      AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
    `, [userId, month, year]);

    const currentSpent = parseFloat(spentResult.rows[0].total_spent || 0);
    const newTotal = currentSpent + parseFloat(amount);

    console.log(`💰 Child spending check: Spent: ${currentSpent}, Limit: ${monthlyLimit}, New expense: ${amount}, New total: ${newTotal}`);

    if (newTotal > monthlyLimit) {
      const remaining = monthlyLimit - currentSpent;
      return {
        allowed: false,
        message: `Spending limit exceeded! You have Rs.${remaining.toFixed(2)} remaining from your Rs.${monthlyLimit.toFixed(2)} monthly allowance.`,
        currentSpent: currentSpent,
        monthlyLimit: monthlyLimit,
        remaining: remaining
      };
    }

    return { 
      allowed: true,
      currentSpent: currentSpent,
      monthlyLimit: monthlyLimit,
      remaining: monthlyLimit - newTotal
    };
  } catch (error) {
    console.error('❌ Error checking child spending limit:', error);
    return { allowed: true }; // Allow transaction if check fails
  }
};

const addTransaction = async (req, res) => {
  const userId = req.user.userId;
  const { type, category, amount, description, date } = req.body;

  console.log('✅ Reached addTransaction controller');
  console.log('User ID:', userId);
  console.log('Body:', req.body);

  if (!type || !category || !amount || !date) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  try {
    // 🚀 NEW: Check child spending limits BEFORE saving transaction
    console.log('🔍 Checking child spending limits...');
    const limitCheck = await checkChildSpendingLimit(userId, amount, type);
    
    if (!limitCheck.allowed) {
      console.log('🚫 Transaction rejected: Child spending limit exceeded');
      return res.status(403).json({ 
        error: 'Spending limit exceeded',
        message: limitCheck.message,
        currentSpent: limitCheck.currentSpent,
        monthlyLimit: limitCheck.monthlyLimit,
        remaining: limitCheck.remaining,
        limitExceeded: true
      });
    }

    if (limitCheck.monthlyLimit) {
      console.log(`✅ Child spending limit check passed. Remaining: Rs.${limitCheck.remaining?.toFixed(2)}`);
    }
    const insertResult = await db.query(
      `INSERT INTO transactions (user_id, type, category, amount, description, date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, type, category, amount, description, date]
    );

    const newTransaction = insertResult.rows[0];
    console.log('✅ Transaction saved:', newTransaction);
    console.log('🚀 STARTING BUDGET OVERFLOW CHECK...');

    // ✅ ENHANCED: Log transaction addition with details
    try {
      await db.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, `${type === 'income' ? 'Income' : 'Expense'} added`, JSON.stringify({
          transaction_id: newTransaction.id,
          type: type,
          category: category,
          amount: parseFloat(amount),
          description: description,
          date: date,
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
      console.log(`✅ ${type} transaction log created`);
    } catch (logErr) {
      console.error('❌ Failed to log transaction addition:', logErr);
    }

    console.log(`🔍 ABOUT TO CHECK IF EXPENSE`);
    
    // Only proceed for expenses
    if (type === 'expense') {
      console.log(`🔍 YES THIS IS AN EXPENSE - ENSURING CURRENT MONTH BUDGETS EXIST`);
      
      // Ensure user has budgets for current month before overflow check
      await ensureCurrentMonthBudgets(userId);
      console.log(`🔍 YES THIS IS AN EXPENSE - PROCEEDING WITH BUDGET CHECK`);
      const month = new Date(date).getMonth() + 1;
      const year = new Date(date).getFullYear();

      // Get budget
      const budgetRes = await db.query(
        `SELECT * FROM budgets WHERE user_id = $1 AND category = $2 AND month = $3 AND year = $4`,
        [userId, category, month, year]
      );
      const budget = budgetRes.rows[0];

      console.log(`📊 Budget found for ${category}:`, budget ? 'YES' : 'NO');
      
      if (budget) {
        console.log(`💰 Budget details: limit=${budget.limit_amount}, alert_triggered=${budget.alert_triggered}`);
        
        // Calculate total spent in this category for the month
        const spentRes = await db.query(
          `SELECT SUM(amount) AS total_spent
           FROM transactions
           WHERE user_id = $1 AND category = $2 AND type = 'expense'
           AND EXTRACT(MONTH FROM date) = $3 AND EXTRACT(YEAR FROM date) = $4`,
          [userId, category, month, year]
        );
        const totalSpent = parseFloat(spentRes.rows[0].total_spent || 0);
        const limit = parseFloat(budget.limit_amount);

        console.log(`🧮 Total spent: ${totalSpent}, Limit: ${limit}`);

        console.log(`🔍 Checking overflow: totalSpent=${totalSpent}, limit=${limit}, condition=${totalSpent > limit}`);
        
        // Simple overflow check - always return overflow data if exceeded
        if (totalSpent > limit) {
          console.log(`🚨 SIMPLE OVERFLOW DETECTED!`);
          const overflowAmount = totalSpent - limit;
          
          // Get user's email and username
          const userRes = await db.query(
            `SELECT email, username FROM users WHERE id = $1`,
            [userId]
          );
          const user = userRes.rows[0];

          console.log(`🚨 BUDGET OVERFLOW DETECTED: ${category} exceeded by ${overflowAmount}`);
          
          // Create budget overflow record
          const overflowResult = await db.query(
            `INSERT INTO budget_overflows (user_id, transaction_id, category, budget_limit, actual_spent, overflow_amount, is_resolved)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [userId, newTransaction.id, category, limit, totalSpent, overflowAmount, false]
          );
          const overflow = overflowResult.rows[0];

          // 📱 Create FinGuard notification for budget overflow
          try {
            await createBudgetOverflowNotification(
              userId, 
              category, 
              totalSpent, 
              limit, 
              overflowAmount
            );
            console.log('📱 Budget overflow notification created in FinGuard notifications');
          } catch (notifError) {
            console.error('❌ Failed to create budget overflow notification:', notifError);
            // Don't fail the transaction if notification fails
          }

          // Create system alert
          await db.query(
            `INSERT INTO budget_alerts (user_id, category, alert_type, message, amount, email_sent)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, category, 'exceeded', `Budget exceeded in ${category} by LKR ${overflowAmount.toFixed(2)}`, overflowAmount, false]
          );

          // Send email alert if not already triggered
          if (!budget.alert_triggered && user?.email) {
            console.log('🔍 About to send budget alert email...');
            await sendBudgetAlertEmail(user.email, user.username, category, totalSpent, limit);
            console.log('✅ Email sent successfully!');
            
            console.log('🔍 About to update email sent status...');
            // Update email sent status for the most recent alert
            await db.query(
              `UPDATE budget_alerts SET email_sent = TRUE 
               WHERE user_id = $1 AND category = $2 AND alert_type = 'exceeded' 
               AND alert_date = (
                 SELECT MAX(alert_date) FROM budget_alerts 
                 WHERE user_id = $1 AND category = $2 AND alert_type = 'exceeded'
               )`,
              [userId, category]
            );
            console.log('✅ Email status updated successfully!');
          }

          console.log('🔍 About to update budget alert_triggered status...');
          // Update alert status
          await db.query(
            `UPDATE budgets SET alert_triggered = TRUE WHERE id = $1`,
            [budget.id]
          );
          console.log('✅ Budget alert_triggered updated successfully!');
          
          console.log(`🎯 RETURNING OVERFLOW DATA TO FRONTEND`);
          
          // Update the transaction to mark it as overflow BEFORE returning
          await db.query(
            `UPDATE transactions 
             SET is_overflow = TRUE, 
                 overflow_amount = $1
             WHERE id = $2`,
            [overflowAmount, newTransaction.id]
          );
          
          console.log(`✅ Transaction ${newTransaction.id} marked as overflow with amount ${overflowAmount}`);
          
          // ✅ ENHANCED: Log budget alert triggered before returning
          try {
            console.log('🔍 About to create budget alert log...');
            await db.query(
              'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
              [userId, 'Budget alert triggered', JSON.stringify({
                category: category,
                budget_id: budget.id,
                budget_limit: limit,
                total_spent: totalSpent,
                over_budget_by: totalSpent - limit,
                email_sent: true,
                triggering_transaction_id: newTransaction.id,
                month: month,
                year: year
              })]
            );
            console.log('✅ Budget alert log created successfully');
          } catch (logErr) {
            console.error('❌ Failed to log budget alert:', logErr);
            console.error('❌ Log error details:', logErr.message);
          }
          
          // Return overflow information for frontend handling
          return res.status(201).json({ 
            message: 'Transaction added successfully', 
            transaction: {
              ...newTransaction,
              is_overflow: true,
              overflow_amount: overflowAmount
            },
            budgetOverflow: {
              overflowId: overflow.id,
              category: category,
              amount: overflowAmount,
              totalSpent: totalSpent,
              budgetLimit: limit,
              requiresTransfer: true
            }
          });
        }

        // Reset alert if under limit again
        if (totalSpent <= limit && budget.alert_triggered) {
          await db.query(
            `UPDATE budgets SET alert_triggered = FALSE WHERE id = $1`,
            [budget.id]
          );

          // ✅ ENHANCED: Log budget alert reset
          try {
            await db.query(
              'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
              [userId, 'Budget alert reset', JSON.stringify({
                category: category,
                budget_id: budget.id,
                budget_limit: limit,
                total_spent: totalSpent,
                month: month,
                year: year
              })]
            );
            console.log('✅ Budget alert reset log created');
          } catch (logErr) {
            console.error('❌ Failed to log budget alert reset:', logErr);
          }
        }
      }
    }

    res.status(201).json({ message: 'Transaction added successfully', transaction: newTransaction });
  } catch (err) {
    console.error('🔴 ADD TRANSACTION ERROR:', err.message);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
};

const getTransactions = async (req, res) => {
  const userId = req.user.userId;
  const { month, year, type } = req.query;

  try {
    let query = `SELECT * FROM transactions WHERE user_id = $1`;
    let params = [userId];
    let paramIndex = 2;

    // Add month/year filtering if provided
    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM date) = $${paramIndex} AND EXTRACT(YEAR FROM date) = $${paramIndex + 1}`;
      params.push(parseInt(month), parseInt(year));
      paramIndex += 2;
    }

    // Add type filtering if provided (income/expense)
    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
    }

    query += ` ORDER BY date DESC`;

    const result = await db.query(query, params);
    
    res.json({
      transactions: result.rows,
      month: month ? parseInt(month) : null,
      year: year ? parseInt(year) : null,
      type: type || 'all',
      currentMonth: new Date().getMonth() + 1,
      currentYear: new Date().getFullYear()
    });
  } catch (err) {
    console.error('🔴 GET TRANSACTIONS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

const deleteTransaction = async (req, res) => {
  const userId = req.user.userId;
  const transactionId = req.params.id;

  try {
    const result = await db.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *',
      [transactionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    const deletedTransaction = result.rows[0];

    // ✅ ENHANCED: Log transaction deletion with details
    try {
      await db.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, `${deletedTransaction.type === 'income' ? 'Income' : 'Expense'} deleted`, JSON.stringify({
          deleted_transaction_id: deletedTransaction.id,
          type: deletedTransaction.type,
          category: deletedTransaction.category,
          amount: parseFloat(deletedTransaction.amount),
          description: deletedTransaction.description,
          original_date: deletedTransaction.date,
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
      console.log(`✅ ${deletedTransaction.type} deletion log created`);
    } catch (logErr) {
      console.error('❌ Failed to log transaction deletion:', logErr);
    }

    res.json({ message: 'Transaction deleted successfully', transaction: deletedTransaction });
  } catch (err) {
    console.error('🔴 DELETE TRANSACTION ERROR:', err.message);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

// ✅ ENHANCED: Add updateTransaction function with logging
const updateTransaction = async (req, res) => {
  const userId = req.user.userId;
  const transactionId = req.params.id;
  const { type, category, amount, description, date } = req.body;

  try {
    // Get current transaction for logging
    const currentTransaction = await db.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [transactionId, userId]
    );

    if (currentTransaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    const oldTransaction = currentTransaction.rows[0];

    const result = await db.query(
      `UPDATE transactions 
       SET type = $1, category = $2, amount = $3, description = $4, date = $5
       WHERE id = $6 AND user_id = $7 
       RETURNING *`,
      [type, category, amount, description, date, transactionId, userId]
    );

    const updatedTransaction = result.rows[0];

    // ✅ ENHANCED: Log transaction update with detailed changes
    try {
      const changes = {};
      if (oldTransaction.type !== type) changes.type = { old: oldTransaction.type, new: type };
      if (oldTransaction.category !== category) changes.category = { old: oldTransaction.category, new: category };
      if (parseFloat(oldTransaction.amount) !== parseFloat(amount)) changes.amount = { old: parseFloat(oldTransaction.amount), new: parseFloat(amount) };
      if (oldTransaction.description !== description) changes.description = { old: oldTransaction.description, new: description };
      if (oldTransaction.date !== date) changes.date = { old: oldTransaction.date, new: date };

      await db.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, `${type === 'income' ? 'Income' : 'Expense'} updated`, JSON.stringify({
          transaction_id: transactionId,
          changes: changes,
          fields_changed: Object.keys(changes),
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
      console.log(`✅ ${type} update log created`);
    } catch (logErr) {
      console.error('❌ Failed to log transaction update:', logErr);
    }

    res.json({ message: 'Transaction updated successfully', transaction: updatedTransaction });
  } catch (err) {
    console.error('🔴 UPDATE TRANSACTION ERROR:', err.message);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

// Get child allowance status
const getChildAllowanceStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Check if user is a child in a family group
    const childCheck = await db.query(`
      SELECT fm.monthly_budget, fm.role, u.username, fg.group_name
      FROM family_members fm
      JOIN users u ON fm.user_id = u.id
      JOIN family_groups fg ON fm.family_group_id = fg.id
      WHERE fm.user_id = $1 AND fm.is_active = true AND fm.role = 'child'
    `, [userId]);

    if (childCheck.rows.length === 0) {
      return res.json({ 
        isChild: false,
        message: 'User is not a child in any family group'
      });
    }

    const childData = childCheck.rows[0];
    const monthlyLimit = parseFloat(childData.monthly_budget || 0);

    // Calculate current month's expenses
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const spentResult = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total_spent
      FROM transactions
      WHERE user_id = $1 AND type = 'expense'
      AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
    `, [userId, month, year]);

    const currentSpent = parseFloat(spentResult.rows[0].total_spent || 0);
    const remaining = monthlyLimit - currentSpent;
    const utilizationPercentage = monthlyLimit > 0 ? (currentSpent / monthlyLimit) * 100 : 0;

    res.json({
      isChild: true,
      familyGroup: childData.group_name,
      monthlyLimit: monthlyLimit,
      currentSpent: currentSpent,
      remaining: remaining,
      utilizationPercentage: utilizationPercentage.toFixed(1),
      canSpend: remaining > 0,
      limitExceeded: currentSpent >= monthlyLimit
    });

  } catch (error) {
    console.error('❌ Error getting child allowance status:', error);
    res.status(500).json({ error: 'Failed to get allowance status' });
  }
};

module.exports = {
  addTransaction,
  getTransactions,
  deleteTransaction,
  updateTransaction,
  getChildAllowanceStatus
};