const db = require('../db');

const addBudget = async (req, res) => {
  const userId = req.user.userId;
  const { category, limit_amount, month, year } = req.body;

  if (!category || !limit_amount || !month || !year) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO budgets (user_id, category, limit_amount, month, year) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, category, limit_amount, month, year]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("🔴 ADD BUDGET ERROR:", err.message);
    res.status(500).json({ error: 'Failed to add budget' });
  }
};

const getBudgets = async (req, res) => {
  const userId = req.user.userId;
  const { month, year } = req.query;

  try {
    const result = await db.query(
      'SELECT * FROM budgets WHERE user_id = $1 AND month = $2 AND year = $3',
      [userId, month, year]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("🔴 GET BUDGET ERROR:", err.message);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};
const getBudgetSummary = async (req, res) => {
  const userId = req.user.userId;
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: 'Month and year are required' });
  }

  try {
    // Get budget limits
    const budgetsRes = await db.query(
      'SELECT category, limit_amount FROM budgets WHERE user_id = $1 AND month = $2 AND year = $3',
      [userId, month, year]
    );

    // Get actual expenses
    const expensesRes = await db.query(
      `SELECT category, SUM(amount) as total_spent
       FROM transactions
       WHERE user_id = $1 AND type = 'expense' AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
       GROUP BY category`,
      [userId, month, year]
    );

    const expensesMap = {};
    for (const row of expensesRes.rows) {
      expensesMap[row.category] = parseFloat(row.total_spent);
    }

    const summary = budgetsRes.rows.map(budget => {
      const spent = expensesMap[budget.category] || 0;
      return {
        category: budget.category,
        budget_limit: parseFloat(budget.limit_amount),
        spent: spent,
        remaining: parseFloat(budget.limit_amount) - spent,
        status: spent > budget.limit_amount ? 'Over Budget' : 'Within Budget'
      };
    });

    res.json(summary);
  } catch (err) {
    console.error('🔴 BUDGET SUMMARY ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch budget summary' });
  }
};


module.exports = {
  addBudget,
  getBudgets,
   getBudgetSummary
};
