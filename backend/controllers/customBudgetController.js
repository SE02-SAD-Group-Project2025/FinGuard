const db = require('../db');

// Get user's custom budget periods
const getCustomBudgetPeriods = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const periods = await db.query(`
      SELECT 
        cbp.*,
        COALESCE((
          SELECT SUM(t.amount) 
          FROM transactions t 
          WHERE t.user_id = cbp.user_id 
            AND t.type = 'expense'
            AND t.date >= cbp.start_date 
            AND t.date <= cbp.end_date
        ), 0) as total_spent
      FROM custom_budget_periods cbp
      WHERE cbp.user_id = $1
      ORDER BY cbp.created_at DESC
    `, [userId]);
    
    const formattedPeriods = periods.rows.map(period => {
      const totalBudget = parseFloat(period.total_budget) || 0;
      const totalSpent = parseFloat(period.total_spent) || 0;
      const startDate = new Date(period.start_date);
      const endDate = new Date(period.end_date);
      const now = new Date();
      
      // Calculate days remaining
      const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
      
      // Calculate progress percentage
      const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
      
      return {
        id: period.id,
        name: period.name,
        description: period.description,
        totalBudget,
        totalSpent,
        startDate: period.start_date,
        endDate: period.end_date,
        status: period.status,
        categories: period.categories || {},
        daysRemaining,
        percentageUsed: Math.round(percentageUsed * 10) / 10,
        isOverBudget: totalSpent > totalBudget,
        isActive: period.status === 'active' && endDate >= now
      };
    });
    
    res.json({
      success: true,
      periods: formattedPeriods
    });
  } catch (error) {
    console.error('Error fetching custom budget periods:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching budget periods',
      error: error.message 
    });
  }
};

// Create new custom budget period
const createCustomBudgetPeriod = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, start_date, end_date, total_budget, categories, description } = req.body;
    
    if (!name || !start_date || !end_date || !total_budget) {
      return res.status(400).json({
        success: false,
        message: 'Name, start date, end date, and total budget are required'
      });
    }
    
    const result = await db.query(`
      INSERT INTO custom_budget_periods 
      (user_id, name, start_date, end_date, total_budget, categories, description, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      RETURNING *
    `, [userId, name, start_date, end_date, total_budget, JSON.stringify(categories || {}), description || '']);
    
    res.json({
      success: true,
      message: 'Custom budget period created successfully',
      period: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating custom budget period:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating budget period',
      error: error.message 
    });
  }
};

// Update custom budget period
const updateCustomBudgetPeriod = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, start_date, end_date, total_budget, categories, description, status } = req.body;
    
    const result = await db.query(`
      UPDATE custom_budget_periods 
      SET name = $1, start_date = $2, end_date = $3, total_budget = $4, 
          categories = $5, description = $6, status = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND user_id = $9
      RETURNING *
    `, [name, start_date, end_date, total_budget, JSON.stringify(categories || {}), description, status, id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget period not found or unauthorized'
      });
    }
    
    res.json({
      success: true,
      message: 'Budget period updated successfully',
      period: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating budget period:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating budget period',
      error: error.message 
    });
  }
};

// Delete custom budget period
const deleteCustomBudgetPeriod = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    
    const result = await db.query(`
      DELETE FROM custom_budget_periods 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget period not found or unauthorized'
      });
    }
    
    res.json({
      success: true,
      message: 'Budget period deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting budget period:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting budget period',
      error: error.message 
    });
  }
};

module.exports = {
  getCustomBudgetPeriods,
  createCustomBudgetPeriod,
  updateCustomBudgetPeriod,
  deleteCustomBudgetPeriod
};