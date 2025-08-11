const db = require('../db');

// Add a new monthly budget
const addBudget = async (req, res) => {
  const userId = req.user.userId;
  const { category, limit_amount, month, year } = req.body;

  if (!category || !limit_amount || !month || !year) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO budgets (user_id, category, limit_amount, month, year)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, category, limit_amount, month, year]
    );

    const newBudget = result.rows[0];

    // ✅ ENHANCED: Log budget creation with details
    try {
      await db.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Budget created', JSON.stringify({
          budget_id: newBudget.id,
          category: category,
          limit_amount: parseFloat(limit_amount),
          month: month,
          year: year,
          period: `${month}/${year}`,
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
      console.log('✅ Budget creation log created');
    } catch (logErr) {
      console.error('❌ Failed to log budget creation:', logErr);
    }

    res.status(201).json(newBudget);
  } catch (err) {
    console.error('🔴 ADD BUDGET ERROR:', err.message);
    res.status(500).json({ error: 'Failed to add budget' });
  }
};

// Get all budgets for a specific month/year
const getBudgets = async (req, res) => {
  const userId = req.user.userId;
  const { month, year } = req.query;

  try {
    const result = await db.query(
      `SELECT * FROM budgets WHERE user_id = $1 AND month = $2 AND year = $3`,
      [userId, month, year]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('🔴 GET BUDGET ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

// Return budget summary with status (for UI display)
const getBudgetSummary = async (req, res) => {
  const userId = req.user.userId;
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: 'Month and year are required' });
  }

  try {
    const budgetsRes = await db.query(
      `SELECT category, limit_amount FROM budgets
       WHERE user_id = $1 AND month = $2 AND year = $3`,
      [userId, month, year]
    );

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
        spent,
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

// Show budgets where alert was triggered
const getBudgetAlerts = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `SELECT * FROM budgets WHERE user_id = $1 AND alert_triggered = TRUE`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('🔴 ALERT FETCH ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch budget alerts' });
  }
};

const updateBudget = async (req, res) => {
  const userId = req.user.userId;
  const budgetId = req.params.id;
  const { category, limit_amount, month, year } = req.body;

  if (!category || !limit_amount || !month || !year) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Get current budget for logging
    const currentBudget = await db.query(
      'SELECT * FROM budgets WHERE id = $1 AND user_id = $2',
      [budgetId, userId]
    );

    if (currentBudget.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found or unauthorized' });
    }

    const oldBudget = currentBudget.rows[0];

    const result = await db.query(
      `UPDATE budgets
       SET category = $1, limit_amount = $2, month = $3, year = $4
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [category, limit_amount, month, year, budgetId, userId]
    );

    const updatedBudget = result.rows[0];

    // ✅ ENHANCED: Log budget update with detailed changes
    try {
      const changes = {};
      if (oldBudget.category !== category) changes.category = { old: oldBudget.category, new: category };
      if (parseFloat(oldBudget.limit_amount) !== parseFloat(limit_amount)) changes.limit_amount = { old: parseFloat(oldBudget.limit_amount), new: parseFloat(limit_amount) };
      if (oldBudget.month !== month) changes.month = { old: oldBudget.month, new: month };
      if (oldBudget.year !== year) changes.year = { old: oldBudget.year, new: year };

      await db.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Budget updated', JSON.stringify({
          budget_id: budgetId,
          changes: changes,
          fields_changed: Object.keys(changes),
          old_period: `${oldBudget.month}/${oldBudget.year}`,
          new_period: `${month}/${year}`,
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
      console.log('✅ Budget update log created');
    } catch (logErr) {
      console.error('❌ Failed to log budget update:', logErr);
    }

    res.json(updatedBudget);
  } catch (err) {
    console.error("🔴 UPDATE BUDGET ERROR:", err.message);
    res.status(500).json({ error: 'Failed to update budget' });
  }
};

const deleteBudget = async (req, res) => {
  const userId = req.user.userId;
  const budgetId = req.params.id;

  try {
    const result = await db.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *',
      [budgetId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found or not authorized' });
    }

    const deletedBudget = result.rows[0];

    // ✅ ENHANCED: Log budget deletion with details
    try {
      await db.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Budget deleted', JSON.stringify({
          deleted_budget_id: deletedBudget.id,
          category: deletedBudget.category,
          limit_amount: parseFloat(deletedBudget.limit_amount),
          month: deletedBudget.month,
          year: deletedBudget.year,
          period: `${deletedBudget.month}/${deletedBudget.year}`,
          was_alert_triggered: deletedBudget.alert_triggered,
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
      console.log('✅ Budget deletion log created');
    } catch (logErr) {
      console.error('❌ Failed to log budget deletion:', logErr);
    }

    res.json({ message: 'Budget deleted successfully', budget: deletedBudget });
  } catch (err) {
    console.error('🔴 DELETE BUDGET ERROR:', err.message);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
};

// Apply AI budget recommendations
const applyAIRecommendations = async (req, res) => {
  const userId = req.user.userId;
  const { recommendations, totalSavings } = req.body;

  try {
    if (!recommendations || !Array.isArray(recommendations)) {
      return res.status(400).json({ error: 'Invalid recommendations data' });
    }

    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    // Update budgets based on AI recommendations
    for (const rec of recommendations) {
      try {
        // Check if budget exists for this category
        const existingBudget = await db.query(
          'SELECT * FROM budgets WHERE user_id = $1 AND category = $2 AND month = $3 AND year = $4',
          [userId, rec.category, month, year]
        );

        if (existingBudget.rows.length > 0) {
          // Update existing budget
          await db.query(
            'UPDATE budgets SET limit_amount = $1 WHERE user_id = $2 AND category = $3 AND month = $4 AND year = $5',
            [rec.new, userId, rec.category, month, year]
          );
        } else {
          // Create new budget
          await db.query(
            'INSERT INTO budgets (user_id, category, limit_amount, month, year) VALUES ($1, $2, $3, $4, $5)',
            [userId, rec.category, rec.new, month, year]
          );
        }
      } catch (budgetError) {
        console.error(`Error updating budget for ${rec.category}:`, budgetError);
      }
    }

    // Log AI recommendations application
    try {
      await db.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'AI recommendations applied', JSON.stringify({
          recommendations_count: recommendations.length,
          total_savings: totalSavings,
          categories_affected: recommendations.map(r => r.category),
          period: `${month}/${year}`,
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
      console.log('✅ AI recommendations application log created');
    } catch (logErr) {
      console.error('❌ Failed to log AI recommendations application:', logErr);
    }

    res.json({ 
      message: 'AI recommendations applied successfully',
      applied_count: recommendations.length,
      total_savings: totalSavings,
      period: `${month}/${year}`
    });
  } catch (err) {
    console.error('🔴 APPLY AI RECOMMENDATIONS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to apply AI recommendations' });
  }
};

module.exports = {
  addBudget,
  getBudgets,
  getBudgetSummary,
  getBudgetAlerts,
  updateBudget,
  deleteBudget,
  applyAIRecommendations
};