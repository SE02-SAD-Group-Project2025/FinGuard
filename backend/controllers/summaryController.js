const db = require('../db');

const getMonthlySummary = async (req, res) => {
  const userId = req.user.userId;
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: 'Month and year are required' });
  }

  try {
    const incomeResult = await db.query(
      `SELECT SUM(amount) AS total_income
       FROM transactions
       WHERE user_id = $1 AND type = 'income'
       AND EXTRACT(MONTH FROM date) = $2
       AND EXTRACT(YEAR FROM date) = $3`,
      [userId, month, year]
    );

    const expenseResult = await db.query(
      `SELECT SUM(amount) AS total_expenses
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
       AND EXTRACT(MONTH FROM date) = $2
       AND EXTRACT(YEAR FROM date) = $3`,
      [userId, month, year]
    );

    const income = parseFloat(incomeResult.rows[0].total_income) || 0;
    const expenses = parseFloat(expenseResult.rows[0].total_expenses) || 0;

    res.json({
      income,
      expenses,
      balance: income - expenses
    });
  } catch (err) {
    console.error('🔴 MONTHLY SUMMARY ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
};

module.exports = { getMonthlySummary };
// This code defines a controller function to fetch the monthly financial summary for a user.
// It retrieves the total income and expenses for a specified month and year, calculates the balance,