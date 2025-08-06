// controllers/liabilitiesController.js
const pool = require('../db');

// Get all liabilities for user
exports.getUserLiabilities = async (req, res) => {
  const userId = req.user.userId;
  
  try {
    const result = await pool.query(`
      SELECT 
        l.*,
        COALESCE(SUM(lp.amount), 0) as total_payments
      FROM liabilities l
      LEFT JOIN liability_payments lp ON l.id = lp.liability_id
      WHERE l.user_id = $1 AND l.is_active = true
      GROUP BY l.id
      ORDER BY l.current_balance DESC, l.created_at DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching liabilities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new liability
exports.createLiability = async (req, res) => {
  const userId = req.user.userId;
  const {
    name,
    type,
    creditor,
    total_amount,
    current_balance,
    interest_rate,
    minimum_payment,
    due_date,
    payment_frequency = 'monthly',
    start_date,
    target_payoff_date,
    notes
  } = req.body;
  
  if (!name || !type || !total_amount || current_balance === undefined) {
    return res.status(400).json({ 
      error: 'Name, type, total amount, and current balance are required' 
    });
  }
  
  const validTypes = ['credit_card', 'loan', 'mortgage', 'personal_debt', 'other'];
  const validFrequencies = ['weekly', 'monthly', 'quarterly'];
  
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid liability type' });
  }
  
  if (!validFrequencies.includes(payment_frequency)) {
    return res.status(400).json({ error: 'Invalid payment frequency' });
  }
  
  // Validate amounts
  if (parseFloat(total_amount) < 0 || parseFloat(current_balance) < 0) {
    return res.status(400).json({ error: 'Amounts cannot be negative' });
  }
  
  if (parseFloat(current_balance) > parseFloat(total_amount)) {
    return res.status(400).json({ 
      error: 'Current balance cannot exceed total amount' 
    });
  }
  
  try {
    // ✅ FIXED: Properly handle date fields - convert empty strings to null
    const sanitizedStartDate = start_date && start_date.trim() ? start_date : null;
    const sanitizedTargetDate = target_payoff_date && target_payoff_date.trim() ? target_payoff_date : null;
    
    console.log('🔄 Creating liability with sanitized dates:', {
      name,
      type,
      total_amount,
      current_balance,
      start_date: sanitizedStartDate,
      target_payoff_date: sanitizedTargetDate
    });

    const result = await pool.query(`
      INSERT INTO liabilities (
        user_id, name, type, creditor, total_amount, current_balance,
        interest_rate, minimum_payment, due_date, payment_frequency,
        start_date, target_payoff_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      userId, 
      name, 
      type, 
      creditor || null, 
      parseFloat(total_amount), 
      parseFloat(current_balance),
      interest_rate ? parseFloat(interest_rate) : null, 
      minimum_payment ? parseFloat(minimum_payment) : null, 
      due_date ? parseInt(due_date) : null, 
      payment_frequency,
      sanitizedStartDate,
      sanitizedTargetDate, 
      notes || null
    ]);
    
    const newLiability = result.rows[0];
    console.log('✅ Liability created successfully:', newLiability.id);
    
    // Log liability creation
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Liability added', JSON.stringify({
          liability_id: newLiability.id,
          name: name,
          type: type,
          total_amount: parseFloat(total_amount),
          current_balance: parseFloat(current_balance),
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
    } catch (logErr) {
      console.error('Failed to log liability creation:', logErr);
    }
    
    res.status(201).json({
      message: 'Liability added successfully',
      liability: newLiability
    });
  } catch (error) {
    console.error('Error creating liability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update liability
exports.updateLiability = async (req, res) => {
  const userId = req.user.userId;
  const liabilityId = req.params.id;
  const {
    name,
    creditor,
    current_balance,
    interest_rate,
    minimum_payment,
    due_date,
    target_payoff_date,
    notes
  } = req.body;
  
  try {
    // Get current liability for logging
    const currentResult = await pool.query(
      'SELECT * FROM liabilities WHERE id = $1 AND user_id = $2',
      [liabilityId, userId]
    );
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Liability not found' });
    }
    
    const currentLiability = currentResult.rows[0];
    
    // ✅ FIXED: Handle target_payoff_date properly
    const sanitizedTargetDate = target_payoff_date && target_payoff_date.trim() ? target_payoff_date : null;
    
    const result = await pool.query(`
      UPDATE liabilities 
      SET name = COALESCE($1, name),
          creditor = COALESCE($2, creditor),
          current_balance = COALESCE($3, current_balance),
          interest_rate = COALESCE($4, interest_rate),
          minimum_payment = COALESCE($5, minimum_payment),
          due_date = COALESCE($6, due_date),
          target_payoff_date = COALESCE($7, target_payoff_date),
          notes = COALESCE($8, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND user_id = $10
      RETURNING *
    `, [
      name, 
      creditor, 
      current_balance ? parseFloat(current_balance) : null, 
      interest_rate ? parseFloat(interest_rate) : null, 
      minimum_payment ? parseFloat(minimum_payment) : null,
      due_date ? parseInt(due_date) : null, 
      sanitizedTargetDate, 
      notes, 
      liabilityId, 
      userId
    ]);
    
    // Log the changes
    const changes = {};
    if (name && name !== currentLiability.name) changes.name = { old: currentLiability.name, new: name };
    if (current_balance && parseFloat(current_balance) !== parseFloat(currentLiability.current_balance)) {
      changes.current_balance = { old: parseFloat(currentLiability.current_balance), new: parseFloat(current_balance) };
    }
    
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Liability updated', JSON.stringify({
          liability_id: liabilityId,
          liability_name: currentLiability.name,
          changes: changes,
          fields_changed: Object.keys(changes),
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
    } catch (logErr) {
      console.error('Failed to log liability update:', logErr);
    }
    
    res.json({
      message: 'Liability updated successfully',
      liability: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating liability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete liability (mark as inactive)
exports.deleteLiability = async (req, res) => {
  const userId = req.user.userId;
  const liabilityId = req.params.id;
  
  try {
    const result = await pool.query(`
      UPDATE liabilities 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [liabilityId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Liability not found' });
    }
    
    const deletedLiability = result.rows[0];
    
    // Log the deletion
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Liability deleted', JSON.stringify({
          liability_id: liabilityId,
          liability_name: deletedLiability.name,
          type: deletedLiability.type,
          total_amount: parseFloat(deletedLiability.total_amount),
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
    } catch (logErr) {
      console.error('Failed to log liability deletion:', logErr);
    }
    
    res.json({ message: 'Liability deleted successfully' });
  } catch (error) {
    console.error('Error deleting liability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Record payment towards liability
exports.recordPayment = async (req, res) => {
  const userId = req.user.userId;
  const liabilityId = req.params.id;
  const { amount, payment_date, payment_type = 'regular', description } = req.body;
  
  if (!amount || !payment_date) {
    return res.status(400).json({ 
      error: 'Amount and payment date are required' 
    });
  }
  
  if (parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Payment amount must be positive' });
  }
  
  const validPaymentTypes = ['regular', 'extra', 'minimum'];
  if (!validPaymentTypes.includes(payment_type)) {
    return res.status(400).json({ error: 'Invalid payment type' });
  }
  
  try {
    // Check if liability exists and belongs to user
    const liabilityResult = await pool.query(
      'SELECT * FROM liabilities WHERE id = $1 AND user_id = $2 AND is_active = true',
      [liabilityId, userId]
    );
    
    if (liabilityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Liability not found' });
    }
    
    const liability = liabilityResult.rows[0];
    const paymentAmount = parseFloat(amount);
    
    // Check if payment doesn't exceed current balance
    if (paymentAmount > parseFloat(liability.current_balance)) {
      return res.status(400).json({ 
        error: 'Payment amount cannot exceed current balance' 
      });
    }
    
    // Begin transaction
    await pool.query('BEGIN');
    
    try {
      // Record the payment
      const paymentResult = await pool.query(`
        INSERT INTO liability_payments (user_id, liability_id, amount, payment_date, payment_type, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [userId, liabilityId, paymentAmount, payment_date, payment_type, description || null]);
      
      // Update liability balance
      const newBalance = parseFloat(liability.current_balance) - paymentAmount;
      await pool.query(
        'UPDATE liabilities SET current_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newBalance, liabilityId]
      );
      
      await pool.query('COMMIT');
      
      const newPayment = paymentResult.rows[0];
      
      // Log the payment
      try {
        await pool.query(
          'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
          [userId, 'Liability payment recorded', JSON.stringify({
            liability_id: liabilityId,
            liability_name: liability.name,
            payment_amount: paymentAmount,
            payment_type: payment_type,
            new_balance: newBalance,
            payment_date: payment_date,
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('User-Agent')
          })]
        );
      } catch (logErr) {
        console.error('Failed to log payment:', logErr);
      }
      
      res.status(201).json({
        message: 'Payment recorded successfully',
        payment: newPayment,
        new_balance: newBalance
      });
      
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get payments for a liability
exports.getLiabilityPayments = async (req, res) => {
  const userId = req.user.userId;
  const liabilityId = req.params.id;
  
  try {
    // Verify liability belongs to user
    const liabilityResult = await pool.query(
      'SELECT name FROM liabilities WHERE id = $1 AND user_id = $2',
      [liabilityId, userId]
    );
    
    if (liabilityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Liability not found' });
    }
    
    const paymentsResult = await pool.query(`
      SELECT *
      FROM liability_payments
      WHERE liability_id = $1 AND user_id = $2
      ORDER BY payment_date DESC, created_at DESC
    `, [liabilityId, userId]);
    
    res.json({
      liability_name: liabilityResult.rows[0].name,
      payments: paymentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching liability payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get liability summary/statistics
exports.getLiabilitySummary = async (req, res) => {
  const userId = req.user.userId;
  
  try {
    // Total liabilities summary
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_liabilities,
        COALESCE(SUM(total_amount), 0) as total_original_amount,
        COALESCE(SUM(current_balance), 0) as total_current_balance,
        COALESCE(AVG(interest_rate), 0) as avg_interest_rate
      FROM liabilities
      WHERE user_id = $1 AND is_active = true
    `, [userId]);
    
    // Payments summary
    const paymentsResult = await pool.query(`
      SELECT 
        COALESCE(SUM(lp.amount), 0) as total_payments,
        COUNT(lp.id) as total_payment_count
      FROM liability_payments lp
      JOIN liabilities l ON lp.liability_id = l.id
      WHERE lp.user_id = $1 AND l.is_active = true
    `, [userId]);
    
    // Liabilities by type
    const typeBreakdownResult = await pool.query(`
      SELECT 
        type,
        COUNT(*) as count,
        COALESCE(SUM(current_balance), 0) as total_balance
      FROM liabilities
      WHERE user_id = $1 AND is_active = true
      GROUP BY type
      ORDER BY total_balance DESC
    `, [userId]);
    
    // Upcoming payments (within next 7 days)
    const today = new Date();
    const currentDay = today.getDate();
    const upcomingResult = await pool.query(`
      SELECT 
        l.id,
        l.name,
        l.minimum_payment,
        l.due_date,
        l.current_balance
      FROM liabilities l
      WHERE l.user_id = $1 
        AND l.is_active = true 
        AND l.due_date IS NOT NULL
        AND l.minimum_payment IS NOT NULL
        AND (
          (l.due_date >= $2 AND l.due_date <= $3) OR
          (l.due_date < $2 AND l.due_date + 7 >= $2)
        )
      ORDER BY l.due_date
    `, [userId, currentDay, currentDay + 7]);
    
    res.json({
      summary: summaryResult.rows[0],
      payments_summary: paymentsResult.rows[0],
      by_type: typeBreakdownResult.rows,
      upcoming_payments: upcomingResult.rows
    });
  } catch (error) {
    console.error('Error fetching liability summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get liability categories for reference
exports.getLiabilityCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM liability_categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching liability categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Calculate debt payoff scenarios
exports.getPayoffScenarios = async (req, res) => {
  const userId = req.user.userId;
  const liabilityId = req.params.id;
  const { extra_payment = 0 } = req.query;
  
  try {
    const liabilityResult = await pool.query(
      'SELECT * FROM liabilities WHERE id = $1 AND user_id = $2 AND is_active = true',
      [liabilityId, userId]
    );
    
    if (liabilityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Liability not found' });
    }
    
    const liability = liabilityResult.rows[0];
    const currentBalance = parseFloat(liability.current_balance);
    const interestRate = parseFloat(liability.interest_rate || 0) / 100 / 12; // Monthly rate
    const minPayment = parseFloat(liability.minimum_payment || 0);
    const extraPayment = parseFloat(extra_payment || 0);
    
    if (currentBalance <= 0) {
      return res.json({
        message: 'Liability is already paid off',
        scenarios: []
      });
    }
    
    // Calculate payoff scenarios
    const scenarios = [];
    
    // Scenario 1: Minimum payments only
    if (minPayment > 0) {
      const minPayoffMonths = calculatePayoffTime(currentBalance, interestRate, minPayment);
      const minTotalPaid = minPayoffMonths * minPayment;
      const minTotalInterest = minTotalPaid - currentBalance;
      
      scenarios.push({
        name: 'Minimum Payments Only',
        monthly_payment: minPayment,
        months_to_payoff: minPayoffMonths,
        total_paid: minTotalPaid,
        total_interest: minTotalInterest
      });
    }
    
    // Scenario 2: Minimum + extra payment
    if (minPayment > 0 && extraPayment > 0) {
      const totalPayment = minPayment + extraPayment;
      const extraPayoffMonths = calculatePayoffTime(currentBalance, interestRate, totalPayment);
      const extraTotalPaid = extraPayoffMonths * totalPayment;
      const extraTotalInterest = extraTotalPaid - currentBalance;
      
      scenarios.push({
        name: `Minimum + ${extraPayment} Extra`,
        monthly_payment: totalPayment,
        months_to_payoff: extraPayoffMonths,
        total_paid: extraTotalPaid,
        total_interest: extraTotalInterest,
        savings: minPayment > 0 ? (scenarios[0].total_interest - extraTotalInterest) : 0,
        time_saved: minPayment > 0 ? (scenarios[0].months_to_payoff - extraPayoffMonths) : 0
      });
    }
    
    res.json({
      liability: {
        name: liability.name,
        current_balance: currentBalance,
        interest_rate: parseFloat(liability.interest_rate || 0),
        minimum_payment: minPayment
      },
      scenarios
    });
  } catch (error) {
    console.error('Error calculating payoff scenarios:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to calculate payoff time
function calculatePayoffTime(balance, monthlyRate, payment) {
  if (monthlyRate === 0) {
    return Math.ceil(balance / payment);
  }
  
  if (payment <= balance * monthlyRate) {
    return Infinity; // Payment doesn't cover interest
  }
  
  const months = Math.log(1 + (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate) * -1;
  return Math.ceil(months);
}