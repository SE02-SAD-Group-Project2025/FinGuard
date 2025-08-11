const db = require('../db');

// Get user's active challenges
const getActiveChallenges = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await db.query(`
      SELECT 
        c.*,
        COALESCE((
          SELECT SUM(t.amount) 
          FROM transactions t 
          WHERE t.user_id = c.user_id 
          AND t.type = 'expense'
          AND (c.category = 'all' OR t.category = c.category)
          AND t.date >= c.start_date 
          AND t.date <= c.end_date
        ), 0) as calculated_current,
        GREATEST(0, (c.end_date - CURRENT_DATE)) as days_left
      FROM challenges c
      WHERE c.user_id = $1 
      AND c.status = 'active'
      AND c.end_date >= CURRENT_DATE
      ORDER BY c.created_at DESC
    `, [userId]);

    const challenges = result.rows.map(row => {
      const current = parseFloat(row.calculated_current) || 0;
      const target = parseFloat(row.target_value) || 0;
      const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
      
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        type: row.type,
        target: target,
        current: current,
        startDate: row.start_date,
        endDate: row.end_date,
        category: row.category,
        difficulty: row.difficulty,
        points: parseInt(row.points) || 0,
        status: row.status,
        progress: Math.round(progress),
        daysLeft: parseInt(row.days_left) || 0,
        streak: parseInt(row.streak) || 0,
        reward: row.reward || 'Achievement Badge'
      };
    });

    res.json(challenges);
  } catch (err) {
    console.error('🔴 ACTIVE CHALLENGES ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch active challenges' });
  }
};

// Get available challenge templates
const getAvailableChallenges = async (req, res) => {
  try {
    // Return predefined challenge templates
    const templates = [
      {
        id: 'template_1',
        title: 'Coffee Budget Master',
        description: 'Limit your coffee spending to $50 this month',
        type: 'category_limit',
        target: 50,
        duration: 30,
        category: 'Food & Dining',
        difficulty: 'medium',
        points: 100,
        estimatedSavings: 30,
        reward: 'Coffee Connoisseur Badge'
      },
      {
        id: 'template_2',
        title: 'No-Spend Weekend Warrior',
        description: 'Complete 4 weekends without unnecessary spending',
        type: 'no_spend',
        target: 4,
        duration: 28,
        category: 'all',
        difficulty: 'hard',
        points: 200,
        estimatedSavings: 100,
        reward: 'Savings Warrior Badge'
      },
      {
        id: 'template_3',
        title: 'Transportation Saver',
        description: 'Keep transportation costs under $80 this month',
        type: 'category_limit',
        target: 80,
        duration: 30,
        category: 'Transportation',
        difficulty: 'medium',
        points: 100,
        estimatedSavings: 40,
        reward: 'Green Commuter Badge'
      },
      {
        id: 'template_4',
        title: 'Entertainment Budget Pro',
        description: 'Stay under $75 for entertainment this month',
        type: 'category_limit',
        target: 75,
        duration: 30,
        category: 'Entertainment',
        difficulty: 'medium',
        points: 100,
        estimatedSavings: 25,
        reward: 'Entertainment Master Badge'
      },
      {
        id: 'template_5',
        title: 'Shopping Freeze Challenge',
        description: 'No shopping purchases for 14 days',
        type: 'no_spend',
        target: 14,
        duration: 14,
        category: 'Shopping',
        difficulty: 'hard',
        points: 150,
        estimatedSavings: 75,
        reward: 'Minimalist Badge'
      }
    ];

    res.json(templates);
  } catch (err) {
    console.error('🔴 AVAILABLE CHALLENGES ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch available challenges' });
  }
};

// Get completed challenges
const getCompletedChallenges = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await db.query(`
      SELECT 
        c.*,
        c.final_value as achieved
      FROM challenges c
      WHERE c.user_id = $1 
      AND c.status = 'completed'
      ORDER BY c.completed_at DESC
      LIMIT 20
    `, [userId]);

    const challenges = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      target: parseFloat(row.target_value),
      achieved: parseFloat(row.achieved) || parseFloat(row.target_value),
      completedDate: row.completed_at,
      difficulty: row.difficulty,
      points: parseInt(row.points),
      status: row.status,
      reward: row.reward || 'Achievement Badge'
    }));

    res.json(challenges);
  } catch (err) {
    console.error('🔴 COMPLETED CHALLENGES ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch completed challenges' });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  const userId = req.user.userId;

  try {
    const statsResult = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'completed' THEN points ELSE 0 END), 0) as total_points,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as challenges_completed,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_challenges,
        COALESCE(MAX(streak), 0) as current_streak,
        COALESCE(MAX(CASE WHEN status = 'completed' THEN streak END), 0) as longest_streak
      FROM challenges 
      WHERE user_id = $1
    `, [userId]);

    // Calculate estimated savings from completed challenges
    const savingsResult = await db.query(`
      SELECT COALESCE(SUM(
        CASE 
          WHEN type = 'spending_limit' OR type = 'category_limit' THEN 
            GREATEST(0, target_value - COALESCE(final_value, current_value))
          WHEN type = 'save_amount' THEN 
            COALESCE(final_value, 0)
          ELSE 0 
        END
      ), 0) as total_saved
      FROM challenges 
      WHERE user_id = $1 AND status = 'completed'
    `, [userId]);

    const stats = statsResult.rows[0];
    const totalPoints = parseInt(stats.total_points) || 0;
    const level = Math.floor(totalPoints / 100) + 1;
    const totalSaved = parseFloat(savingsResult.rows[0].total_saved) || 0;

    // Determine rank based on points
    let rank = 'Bronze Saver';
    if (totalPoints >= 1000) rank = 'Diamond Saver';
    else if (totalPoints >= 500) rank = 'Gold Saver';
    else if (totalPoints >= 200) rank = 'Silver Saver';

    res.json({
      totalPoints,
      level,
      challengesCompleted: parseInt(stats.challenges_completed) || 0,
      totalSaved,
      currentStreak: parseInt(stats.current_streak) || 0,
      longestStreak: parseInt(stats.longest_streak) || 0,
      rank,
      nextLevelPoints: level * 100,
      activeCount: parseInt(stats.active_challenges) || 0
    });
  } catch (err) {
    console.error('🔴 USER STATS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
};

// Get user achievements
const getAchievements = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Get user stats for achievement calculations
    const statsResult = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN points ELSE 0 END), 0) as total_points,
        COALESCE(MAX(streak), 0) as max_streak,
        COUNT(CASE WHEN created_by_user = true THEN 1 END) as custom_created
      FROM challenges 
      WHERE user_id = $1
    `, [userId]);

    const stats = statsResult.rows[0];
    const completedCount = parseInt(stats.completed_count) || 0;
    const totalPoints = parseInt(stats.total_points) || 0;
    const maxStreak = parseInt(stats.max_streak) || 0;
    const customCreated = parseInt(stats.custom_created) || 0;

    const achievements = [
      {
        id: 1,
        name: 'First Challenge',
        description: 'Complete your first challenge',
        icon: 'Star',
        earned: completedCount >= 1,
        earnedDate: completedCount >= 1 ? '2024-12-01' : null
      },
      {
        id: 2,
        name: 'Streak Master',
        description: 'Maintain a 7-day streak',
        icon: 'Flame',
        earned: maxStreak >= 7,
        earnedDate: maxStreak >= 7 ? '2024-12-05' : null
      },
      {
        id: 3,
        name: 'Challenge Champion',
        description: 'Complete 10 challenges',
        icon: 'Trophy',
        earned: completedCount >= 10,
        earnedDate: completedCount >= 10 ? '2024-12-15' : null
      },
      {
        id: 4,
        name: 'Point Collector',
        description: 'Earn 500 total points',
        icon: 'Award',
        earned: totalPoints >= 500,
        earnedDate: totalPoints >= 500 ? '2024-12-20' : null
      },
      {
        id: 5,
        name: 'Challenge Creator',
        description: 'Create a custom challenge',
        icon: 'Plus',
        earned: customCreated >= 1,
        earnedDate: customCreated >= 1 ? '2024-12-10' : null
      }
    ];

    res.json(achievements);
  } catch (err) {
    console.error('🔴 ACHIEVEMENTS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
};

// Start a challenge
const startChallenge = async (req, res) => {
  const userId = req.user.userId;
  const { challengeId, isTemplate = false } = req.body;

  try {
    let challengeData;

    if (isTemplate) {
      // Starting from a template
      const templates = [
        {
          id: 'template_1',
          title: 'Coffee Budget Master',
          description: 'Limit your coffee spending to $50 this month',
          type: 'category_limit',
          target_value: 50,
          duration: 30,
          category: 'Food & Dining',
          difficulty: 'medium',
          points: 100,
          reward: 'Coffee Connoisseur Badge'
        }
        // Add other templates as needed
      ];

      challengeData = templates.find(t => t.id === challengeId);
      if (!challengeData) {
        return res.status(404).json({ error: 'Template not found' });
      }
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (challengeData.duration || 30) * 24 * 60 * 60 * 1000);

    const result = await db.query(`
      INSERT INTO challenges (
        user_id, title, description, type, target_value, 
        start_date, end_date, category, difficulty, points, 
        reward, status, current_value, streak, created_by_user
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      userId,
      challengeData.title,
      challengeData.description,
      challengeData.type,
      challengeData.target_value || challengeData.target,
      startDate,
      endDate,
      challengeData.category,
      challengeData.difficulty,
      challengeData.points,
      challengeData.reward,
      'active',
      0, // current_value
      0, // streak
      false // created_by_user
    ]);

    res.json({
      success: true,
      challenge: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        status: 'active'
      }
    });
  } catch (err) {
    console.error('🔴 START CHALLENGE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to start challenge' });
  }
};

// Create custom challenge
const createChallenge = async (req, res) => {
  const userId = req.user.userId;
  const {
    title,
    description,
    type,
    target,
    target_amount,  // Support both parameter names
    duration,
    duration_days,  // Support both parameter names
    category,
    difficulty,
    reward
  } = req.body;
  
  // Handle different parameter names
  const targetValue = target || target_amount;
  const durationDays = duration || duration_days;

  if (!title || !targetValue) {
    return res.status(400).json({ error: 'Title and target are required' });
  }

  try {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (durationDays || 30) * 24 * 60 * 60 * 1000);
    
    // Determine points based on difficulty
    const pointsMap = {
      'easy': 50,
      'medium': 100,
      'hard': 200
    };
    const points = pointsMap[difficulty] || 100;

    const result = await db.query(`
      INSERT INTO challenges (
        user_id, title, description, type, target_value, 
        start_date, end_date, category, difficulty, points, 
        reward, status, current_value, streak, created_by_user
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      userId,
      title,
      description || '',
      type || 'spending_limit',
      parseFloat(targetValue),
      startDate,
      endDate,
      category || 'all',
      difficulty || 'medium',
      points,
      reward || 'Custom Challenge Badge',
      'active',
      0, // current_value
      0, // streak
      true // created_by_user
    ]);

    res.json({
      success: true,
      message: 'Custom challenge created and started!',
      challenge: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        status: 'active'
      }
    });
  } catch (err) {
    console.error('🔴 CREATE CHALLENGE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
};

module.exports = {
  getActiveChallenges,
  getAvailableChallenges,
  getCompletedChallenges,
  getUserStats,
  getAchievements,
  startChallenge,
  createChallenge
};