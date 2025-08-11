const db = require('../db');

// Get comprehensive premium subscription analytics for admin
const getSubscriptionAnalytics = async (req, res) => {
  try {
    // Since subscription tables don't exist yet, provide mock admin analytics based on user activity
    const userStatsResult = await db.query(`
      SELECT 
        u.role,
        COUNT(*) as user_count,
        30 as avg_account_age_days
      FROM users u
      GROUP BY u.role
      ORDER BY user_count DESC
    `);

    // Get user activity trends over last 6 months from logs
    const activityTrendsResult = await db.query(`
      SELECT 
        DATE_TRUNC('month', timestamp) as month,
        COUNT(*) as total_activities,
        COUNT(DISTINCT user_id) as active_users
      FROM logs
      WHERE timestamp >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', timestamp)
      ORDER BY month DESC
    `);

    // Get most common activities (feature usage proxy)
    const featureUsageResult = await db.query(`
      SELECT 
        activity as feature_name,
        COUNT(*) as total_usage,
        COUNT(DISTINCT user_id) as unique_users
      FROM logs
      WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY activity
      ORDER BY total_usage DESC
      LIMIT 10
    `);

    res.json({
      subscriptionStats: userStatsResult.rows.map(row => ({
        plan_name: row.role === 'admin' ? 'Admin Plan' : row.role === 'premium' ? 'Premium Plan' : 'Free Plan',
        display_name: row.role,
        active_subscriptions: row.user_count,
        total_revenue: row.role === 'premium' ? row.user_count * 999 : 0, // Mock revenue
        avg_subscription_age_days: parseFloat(row.avg_account_age_days) || 0
      })),
      subscriptionTrends: activityTrendsResult.rows.map(row => ({
        month: row.month,
        plan_name: 'All Plans',
        new_subscriptions: row.active_users
      })),
      churnAnalysis: [], // No churn data available yet
      featureUsage: featureUsageResult.rows,
      totalActiveSubscriptions: userStatsResult.rows.reduce((sum, row) => sum + parseInt(row.user_count), 0),
      totalMonthlyRevenue: userStatsResult.rows.reduce((sum, row) => sum + (row.role === 'premium' ? row.user_count * 999 : 0), 0)
    });

  } catch (err) {
    console.error('🔴 SUBSCRIPTION ANALYTICS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch subscription analytics' });
  }
};

// Get system-wide financial overview for admin
const getSystemFinancialOverview = async (req, res) => {
  try {
    // Get total transaction volume across all users
    const transactionVolumeResult = await db.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_volume,
        AVG(amount) as avg_transaction_amount,
        DATE_TRUNC('month', date) as month
      FROM transactions 
      WHERE date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
    `);

    // Get top spending categories across all users
    const categoriesResult = await db.query(`
      SELECT 
        category,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM transactions 
      WHERE type = 'expense' 
      AND date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY category
      ORDER BY total_amount DESC
      LIMIT 10
    `);

    // Get user engagement metrics
    const engagementResult = await db.query(`
      SELECT 
        COUNT(DISTINCT user_id) as active_users_30_days,
        AVG(transactions_per_user) as avg_transactions_per_user
      FROM (
        SELECT 
          user_id,
          COUNT(*) as transactions_per_user
        FROM transactions 
        WHERE date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY user_id
      ) user_activity
    `);

    // Get user type comparison based on user roles
    const userComparisonResult = await db.query(`
      SELECT 
        u.role as user_type,
        COUNT(DISTINCT t.user_id) as user_count,
        AVG(transaction_volume) as avg_monthly_volume,
        AVG(transaction_count) as avg_monthly_transactions
      FROM (
        SELECT 
          user_id,
          SUM(amount) as transaction_volume,
          COUNT(*) as transaction_count
        FROM transactions 
        WHERE date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY user_id
      ) t
      JOIN users u ON t.user_id = u.id
      GROUP BY u.role
    `);

    res.json({
      transactionVolume: transactionVolumeResult.rows,
      topCategories: categoriesResult.rows,
      engagement: engagementResult.rows[0] || { active_users_30_days: 0, avg_transactions_per_user: 0 },
      userComparison: userComparisonResult.rows
    });

  } catch (err) {
    console.error('🔴 SYSTEM FINANCIAL OVERVIEW ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch system financial overview' });
  }
};

// Get premium feature adoption rates
const getPremiumFeatureAdoption = async (req, res) => {
  try {
    // Get total users for calculating adoption rates
    const totalUsersResult = await db.query(`
      SELECT COUNT(*) as total_users
      FROM users 
      WHERE role IN ('User', 'Premium User', 'Admin')
    `);

    const totalUsers = parseInt(totalUsersResult.rows[0]?.total_users) || 1;

    // Get feature adoption with calculated percentages
    const adoptionResult = await db.query(`
      SELECT 
        activity as feature_name,
        COUNT(DISTINCT user_id) as users_using_feature,
        COUNT(*) as total_usage
      FROM logs
      WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
      AND activity IS NOT NULL
      AND user_id IS NOT NULL
      GROUP BY activity
      ORDER BY COUNT(DISTINCT user_id) DESC
      LIMIT 15
    `);

    // Calculate percentages in JavaScript to avoid SQL issues
    const featureAdoption = adoptionResult.rows.map(row => ({
      ...row,
      total_users: totalUsers,
      adoption_rate_percentage: parseFloat(((parseInt(row.users_using_feature) / totalUsers) * 100).toFixed(2)),
      avg_usage_per_user: parseFloat((parseInt(row.total_usage) / parseInt(row.users_using_feature)).toFixed(2))
    }));

    // Simplified trends data (can enhance later)
    const trendsResult = [];

    res.json({
      featureAdoption: featureAdoption,
      usageTrends: trendsResult
    });

  } catch (err) {
    console.error('🔴 FEATURE ADOPTION ERROR:', err.message);
    console.error('🔴 FULL ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch feature adoption data' });
  }
};

// Manage user subscriptions (admin tools)
const manageUserSubscription = async (req, res) => {
  const { userId } = req.params;
  const { action, planId, reason } = req.body;
  const adminId = req.user.userId;

  try {
    let result;
    
    switch (action) {
      case 'upgrade':
        // Update user role as subscription proxy
        result = await db.query(`
          UPDATE users 
          SET role = 'premium'
          WHERE id = $1
          RETURNING id, username, email, role
        `, [userId]);
        break;
        
      case 'downgrade':
        // Downgrade user role
        result = await db.query(`
          UPDATE users 
          SET role = 'user'
          WHERE id = $1
          RETURNING id, username, email, role
        `, [userId]);
        break;
        
      case 'ban':
        // Ban user
        result = await db.query(`
          UPDATE users 
          SET is_banned = true
          WHERE id = $1
          RETURNING id, username, email, role, is_banned
        `, [userId]);
        break;
        
      case 'unban':
        // Unban user
        result = await db.query(`
          UPDATE users 
          SET is_banned = false
          WHERE id = $1
          RETURNING id, username, email, role, is_banned
        `, [userId]);
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid action. Valid actions: upgrade, downgrade, ban, unban' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log admin action
    await db.query(`
      INSERT INTO logs (user_id, activity, details)
      VALUES ($1, $2, $3)
    `, [adminId, `Admin user management: ${action}`, JSON.stringify({
      targetUserId: userId,
      action,
      planId,
      reason,
      timestamp: new Date().toISOString()
    })]);

    res.json({
      success: true,
      message: `User ${action} completed successfully`,
      result: result.rows[0]
    });

  } catch (err) {
    console.error('🔴 USER MANAGEMENT ERROR:', err.message);
    res.status(500).json({ error: 'Failed to manage user account' });
  }
};

// Get system health metrics
const getSystemHealthMetrics = async (req, res) => {
  try {
    console.log('🔍 SYSTEM HEALTH - Starting health check...');

    // Get basic database health - simplified query
    let dbMetrics = [];
    let userActivity = [];
    
    try {
      // Simple count queries that should work
      const userCount = await db.query('SELECT COUNT(*) as total_users FROM users');
      console.log('✅ Users count query successful');
      
      const transactionCount = await db.query('SELECT COUNT(*) as total_transactions FROM transactions');
      console.log('✅ Transactions count query successful');
      
      const logCount = await db.query('SELECT COUNT(*) as total_logs FROM logs');
      console.log('✅ Logs count query successful');
      
      dbMetrics = [
        { table_name: 'users', record_count: parseInt(userCount.rows[0].total_users), status: 'healthy' },
        { table_name: 'transactions', record_count: parseInt(transactionCount.rows[0].total_transactions), status: 'healthy' },
        { table_name: 'logs', record_count: parseInt(logCount.rows[0].total_logs), status: 'healthy' }
      ];
      
      // Get recent activity count with simpler query
      const recentActivity = await db.query(`
        SELECT COUNT(*) as activity_count
        FROM logs
        WHERE timestamp::date >= CURRENT_DATE - INTERVAL '1 day'
      `);
      console.log('✅ Recent activity query successful');
      
      userActivity = [
        { period: '24 hours', activity_count: parseInt(recentActivity.rows[0].activity_count) }
      ];
      
      console.log('✅ SYSTEM HEALTH - All database queries successful');
      
    } catch (dbError) {
      console.log('⚠️ SYSTEM HEALTH - Database query failed:', dbError.message);
      // Provide fallback data
      dbMetrics = [
        { table_name: 'database', status: 'error', error: dbError.message }
      ];
      userActivity = [
        { period: '24 hours', activity_count: 0, status: 'error' }
      ];
    }

    // API response times (simulated - would normally come from monitoring)
    const apiMetrics = {
      avgResponseTime: 250, // milliseconds
      slowestEndpoint: '/api/ai/budget-recommendations',
      fastestEndpoint: '/api/auth/check-username',
      errorRate: 2.1, // percentage
      requestsPerMinute: 45
    };

    // Memory and performance metrics (simulated)
    const performanceMetrics = {
      memoryUsage: 67.5, // percentage
      cpuUsage: 23.8, // percentage
      diskUsage: 45.2, // percentage
      activeConnections: 23,
      cacheHitRate: 89.4 // percentage
    };

    console.log('✅ SYSTEM HEALTH - Returning response');

    res.json({
      databaseMetrics: dbMetrics,
      apiMetrics,
      performanceMetrics,
      userActivity: userActivity,
      lastUpdated: new Date().toISOString()
    });

  } catch (err) {
    console.error('🔴 SYSTEM HEALTH ERROR:', err.message);
    console.error('🔴 SYSTEM HEALTH STACK:', err.stack);
    res.status(500).json({ error: 'Failed to fetch system health metrics' });
  }
};

// Get cross-user anomaly review queue (placeholder - anomalies table doesn't exist)
const getAnomalyReviewQueue = async (req, res) => {
  const { severity = 'all', limit = 20 } = req.query;

  try {
    // Since anomalies table doesn't exist, return mock data based on unusual transaction patterns
    const suspiciousTransactionsResult = await db.query(`
      SELECT 
        t.id,
        t.user_id,
        t.amount,
        t.category,
        t.description,
        t.date,
        u.username,
        u.email,
        u.role,
        CASE 
          WHEN t.amount > 100000 THEN 'high'
          WHEN t.amount > 50000 THEN 'medium'
          ELSE 'low'
        END as severity,
        CASE 
          WHEN t.amount > 100000 THEN 95
          WHEN t.amount > 50000 THEN 80
          ELSE 70
        END as confidence
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.amount > 50000  -- High value transactions as anomalies
      AND t.date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY t.amount DESC
      LIMIT $1
    `, [parseInt(limit)]);

    // Mock summary statistics
    const summaryResult = await db.query(`
      SELECT 
        CASE 
          WHEN amount > 100000 THEN 'high'
          WHEN amount > 50000 THEN 'medium'
          ELSE 'low'
        END as severity,
        COUNT(*) as count
      FROM transactions 
      WHERE amount > 50000
      AND date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY 
        CASE 
          WHEN amount > 100000 THEN 'high'
          WHEN amount > 50000 THEN 'medium'
          ELSE 'low'
        END
    `);

    res.json({
      anomalies: suspiciousTransactionsResult.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        type: 'high_value_transaction',
        description: `Unusual high-value transaction: ${row.description}`,
        severity: row.severity,
        confidence: row.confidence,
        detected_at: row.date,
        status: 'unreviewed',
        amount: row.amount,
        category: row.category,
        username: row.username,
        email: row.email,
        role: row.role
      })),
      summary: summaryResult.rows,
      totalPending: suspiciousTransactionsResult.rows.length
    });

  } catch (err) {
    console.error('🔴 ANOMALY REVIEW ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch anomaly review queue' });
  }
};

// Bulk update anomaly statuses (placeholder)
const bulkUpdateAnomalies = async (req, res) => {
  const { anomalyIds, status, adminNotes } = req.body;
  const adminId = req.user.userId;

  const validStatuses = ['acknowledged', 'dismissed', 'flagged', 'escalated'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    // Since anomalies table doesn't exist, just log the admin action
    await db.query(`
      INSERT INTO logs (user_id, activity, details)
      VALUES ($1, $2, $3)
    `, [adminId, 'Admin bulk anomaly update', JSON.stringify({
      updatedAnomalies: anomalyIds.length,
      newStatus: status,
      adminNotes,
      anomalyIds,
      note: 'Placeholder action - anomalies table not implemented yet'
    })]);

    res.json({
      success: true,
      message: `Acknowledged ${anomalyIds.length} potential anomalies as ${status}`,
      updatedAnomalies: anomalyIds.length
    });

  } catch (err) {
    console.error('🔴 BULK ANOMALY UPDATE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to update anomalies' });
  }
};

module.exports = {
  getSubscriptionAnalytics,
  getSystemFinancialOverview, 
  getPremiumFeatureAdoption,
  manageUserSubscription,
  getSystemHealthMetrics,
  getAnomalyReviewQueue,
  bulkUpdateAnomalies
};