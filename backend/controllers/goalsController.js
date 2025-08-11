const db = require('../db');

// Get user's financial goals
const getGoals = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `SELECT * FROM financial_goals WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('🔴 GET GOALS ERROR:', err.message);
    
    // If table doesn't exist, return empty array instead of error
    if (err.message.includes('does not exist')) {
      console.log('📝 financial_goals table not implemented yet, returning empty array');
      return res.json([]);
    }
    
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

// Add a new financial goal
const addGoal = async (req, res) => {
  const userId = req.user.userId;
  const { name, target_amount, current_amount = 0, target_date, category = 'Savings' } = req.body;

  if (!name || !target_amount) {
    return res.status(400).json({ error: 'Goal name and target amount are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO financial_goals (user_id, name, target_amount, current_amount, target_date, category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, name, parseFloat(target_amount), parseFloat(current_amount), target_date, category]
    );

    const newGoal = result.rows[0];

    // Log goal creation
    try {
      await db.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Financial goal created', JSON.stringify({
          goal_id: newGoal.id,
          name: name,
          target_amount: parseFloat(target_amount),
          category: category
        })]
      );
    } catch (logErr) {
      console.error('❌ Failed to log goal creation:', logErr);
    }

    res.status(201).json(newGoal);
  } catch (err) {
    console.error('🔴 ADD GOAL ERROR:', err.message);
    
    // If table doesn't exist, return error message about feature not implemented
    if (err.message.includes('does not exist')) {
      console.log('📝 financial_goals table not implemented yet');
      return res.status(501).json({ error: 'Goals feature not implemented yet - database table missing' });
    }
    
    res.status(500).json({ error: 'Failed to add goal' });
  }
};

// Update goal progress
const updateGoal = async (req, res) => {
  const userId = req.user.userId;
  const goalId = req.params.id;
  const { name, target_amount, current_amount, target_date, category, status } = req.body;

  try {
    // Get current goal for comparison
    const currentGoal = await db.query(
      'SELECT * FROM financial_goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );

    if (currentGoal.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const oldGoal = currentGoal.rows[0];
    
    const result = await db.query(
      `UPDATE financial_goals 
       SET name = COALESCE($3, name),
           target_amount = COALESCE($4, target_amount),
           current_amount = COALESCE($5, current_amount),
           target_date = COALESCE($6, target_date),
           category = COALESCE($7, category),
           status = COALESCE($8, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [goalId, userId, name, target_amount, current_amount, target_date, category, status]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const updatedGoal = result.rows[0];

    // Check if goal was just completed
    const oldProgress = (parseFloat(oldGoal.current_amount) / parseFloat(oldGoal.target_amount)) * 100;
    const newProgress = (parseFloat(updatedGoal.current_amount) / parseFloat(updatedGoal.target_amount)) * 100;
    
    if (oldProgress < 100 && newProgress >= 100) {
      // Goal just completed - mark for notifications
      updatedGoal.justCompleted = true;
    } else if (Math.floor(newProgress / 25) > Math.floor(oldProgress / 25)) {
      // Milestone reached (every 25%)
      updatedGoal.milestoneHit = Math.floor(newProgress / 25) * 25;
    }

    updatedGoal.progress = newProgress;

    res.json(updatedGoal);
  } catch (err) {
    console.error('🔴 UPDATE GOAL ERROR:', err.message);
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

// Delete goal
const deleteGoal = async (req, res) => {
  const userId = req.user.userId;
  const goalId = req.params.id;

  try {
    const result = await db.query(
      'DELETE FROM financial_goals WHERE id = $1 AND user_id = $2 RETURNING *',
      [goalId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });
  } catch (err) {
    console.error('🔴 DELETE GOAL ERROR:', err.message);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
};

// Get goal achievements for notifications
const getGoalAchievements = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `SELECT 
         id,
         name,
         target_amount,
         current_amount,
         (current_amount / target_amount * 100) as progress,
         status,
         category,
         created_at,
         updated_at
       FROM financial_goals 
       WHERE user_id = $1 
         AND status != 'cancelled'
       ORDER BY updated_at DESC`,
      [userId]
    );

    const goals = result.rows.map(goal => {
      const progress = Math.min(parseFloat(goal.progress) || 0, 100);
      
      // Check for recent completions (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const justCompleted = progress >= 100 && goal.status === 'completed' && 
                           new Date(goal.updated_at) > yesterday;
      
      // Check for milestone achievements (25%, 50%, 75%)
      const milestoneHit = Math.floor(progress / 25) * 25;
      
      return {
        ...goal,
        progress: Math.round(progress),
        justCompleted,
        milestoneHit: milestoneHit >= 25 && milestoneHit < 100 ? milestoneHit : null
      };
    });

    res.json(goals);
  } catch (err) {
    console.error('🔴 GOAL ACHIEVEMENTS ERROR:', err.message);
    
    // If table doesn't exist, return empty array
    if (err.message.includes('does not exist')) {
      console.log('📝 financial_goals table not implemented yet, returning empty array');
      return res.json([]);
    }
    
    res.status(500).json({ error: 'Failed to fetch goal achievements' });
  }
};

module.exports = {
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  getGoalAchievements
};