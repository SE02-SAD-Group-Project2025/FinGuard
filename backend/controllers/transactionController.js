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

    console.log('✅ Transaction saved:', insertResult.rows[0]);

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
        }

        // Reset alert if under limit again
        if (totalSpent <= limit && budget.alert_triggered) {
          await db.query(
            `UPDATE budgets SET alert_triggered = FALSE WHERE id = $1`,
            [budget.id]
          );
        }
      }
    }

    res.status(201).json({ message: 'Transaction added successfully' });
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

    res.json({ message: 'Transaction deleted successfully', transaction: result.rows[0] });
  } catch (err) {
    console.error('🔴 DELETE TRANSACTION ERROR:', err.message);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
  
};


module.exports = {
  addTransaction,
  getTransactions,
  deleteTransaction,
};


