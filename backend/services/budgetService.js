const pool = require('../db');

/**
 * Ensures user has budgets for the current month by copying from previous month
 * This makes the system realistic - budgets carry forward month to month
 */
const ensureCurrentMonthBudgets = async (userId) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  try {
    // Check if user already has budgets for current month
    const existingBudgets = await pool.query(
      'SELECT COUNT(*) as count FROM budgets WHERE user_id = $1 AND month = $2 AND year = $3',
      [userId, currentMonth, currentYear]
    );
    
    if (parseInt(existingBudgets.rows[0].count) > 0) {
      console.log(`✅ User ${userId} already has budgets for ${currentMonth}/${currentYear}`);
      return; // Already has budgets for current month
    }
    
    // Find the most recent month's budgets to copy
    const previousBudgets = await pool.query(`
      SELECT category, limit_amount 
      FROM budgets 
      WHERE user_id = $1 
        AND (year < $2 OR (year = $2 AND month < $3))
      ORDER BY year DESC, month DESC
    `, [userId, currentYear, currentMonth]);
    
    if (previousBudgets.rows.length === 0) {
      console.log(`ℹ️ User ${userId} has no previous budgets to copy`);
      return; // No previous budgets to copy
    }
    
    // Get unique categories from previous budgets (in case of duplicates)
    const uniqueBudgets = previousBudgets.rows.reduce((acc, budget) => {
      if (!acc.find(b => b.category === budget.category)) {
        acc.push(budget);
      }
      return acc;
    }, []);
    
    console.log(`🔄 Copying ${uniqueBudgets.length} budgets for user ${userId} to ${currentMonth}/${currentYear}`);
    
    // Copy budgets to current month
    for (const budget of uniqueBudgets) {
      await pool.query(`
        INSERT INTO budgets (user_id, category, limit_amount, month, year, alert_triggered, spent)
        VALUES ($1, $2, $3, $4, $5, FALSE, 0)
        ON CONFLICT (user_id, category, month, year) DO NOTHING
      `, [userId, budget.category, budget.limit_amount, currentMonth, currentYear]);
    }
    
    console.log(`✅ Successfully created budgets for user ${userId} for ${currentMonth}/${currentYear}`);
    
    // Log the budget creation
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Monthly budgets auto-created', JSON.stringify({
          month: currentMonth,
          year: currentYear,
          budgets_copied: uniqueBudgets.length,
          categories: uniqueBudgets.map(b => b.category)
        })]
      );
    } catch (logErr) {
      console.error('❌ Failed to log budget auto-creation:', logErr);
    }
    
  } catch (error) {
    console.error(`❌ Error ensuring budgets for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Auto-create budgets for all users for the current month
 * This should be run as a monthly cron job or on system startup
 */
const ensureAllUsersCurrentMonthBudgets = async () => {
  try {
    const users = await pool.query('SELECT id FROM users');
    console.log(`🔄 Ensuring current month budgets for ${users.rows.length} users...`);
    
    for (const user of users.rows) {
      await ensureCurrentMonthBudgets(user.id);
    }
    
    console.log('✅ Completed current month budget creation for all users');
  } catch (error) {
    console.error('❌ Error in ensureAllUsersCurrentMonthBudgets:', error);
    throw error;
  }
};

/**
 * Get budgets for a specific month/year with proper defaults
 */
const getBudgetsForMonth = async (userId, month = null, year = null) => {
  // Default to current month if not specified
  const targetMonth = month || new Date().getMonth() + 1;
  const targetYear = year || new Date().getFullYear();
  
  // Ensure current month budgets exist if requesting current month
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  if (targetMonth === currentMonth && targetYear === currentYear) {
    await ensureCurrentMonthBudgets(userId);
  }
  
  const result = await pool.query(`
    SELECT 
      b.*,
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
    WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
    ORDER BY b.category
  `, [userId, targetMonth, targetYear]);
  
  return {
    budgets: result.rows,
    month: targetMonth,
    year: targetYear
  };
};

module.exports = {
  ensureCurrentMonthBudgets,
  ensureAllUsersCurrentMonthBudgets,
  getBudgetsForMonth
};