const db = require('../db');
const { sendBudgetAlertEmail } = require('../utils/emailService');

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
    const insertResult = await db.query(
      `INSERT INTO transactions (user_id, type, category, amount, description, date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, type, category, amount, description, date]
    );

    const newTransaction = insertResult.rows[0];
    console.log('✅ Transaction saved:', newTransaction);

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

    // Only proceed for expenses
    if (type === 'expense') {
      const month = new Date(date).getMonth() + 1;
      const year = new Date(date).getFullYear();

      // Get budget
      const budgetRes = await db.query(
        `SELECT * FROM budgets WHERE user_id = $1 AND category = $2 AND month = $3 AND year = $4`,
        [userId, category, month, year]
      );
      const budget = budgetRes.rows[0];

      if (budget) {
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

        if (totalSpent > limit && !budget.alert_triggered) {
          // Get user's email and username
          const userRes = await db.query(
            `SELECT email, username FROM users WHERE id = $1`,
            [userId]
          );
          const user = userRes.rows[0];

          console.log('📧 Sending email to:', user.email);

          if (user?.email) {
            await sendBudgetAlertEmail(user.email, user.username, category, totalSpent, limit);
            console.log('✅ Email sent successfully!');
          }

          // Update alert status
          await db.query(
            `UPDATE budgets SET alert_triggered = TRUE WHERE id = $1`,
            [budget.id]
          );

          // ✅ ENHANCED: Log budget alert triggered
          try {
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
            console.log('✅ Budget alert log created');
          } catch (logErr) {
            console.error('❌ Failed to log budget alert:', logErr);
          }
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

  try {
    const result = await db.query(
      `SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC`,
      [userId]
    );
    res.json(result.rows);
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

module.exports = {
  addTransaction,
  getTransactions,
  deleteTransaction,
  updateTransaction
};