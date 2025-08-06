// controllers/reportsController.js
const pool = require('../db');

// Get all reports for a user
exports.getUserReports = async (req, res) => {
  const userId = req.user.userId;
  
  try {
    const result = await pool.query(`
      SELECT 
        r.*,
        u.username as admin_username
      FROM reports r
      LEFT JOIN users u ON r.admin_id = u.id
      WHERE r.user_id = $1 
      ORDER BY r.created_at DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new report
exports.createReport = async (req, res) => {
  const userId = req.user.userId;
  const { title, description, category, priority = 'medium' } = req.body;
  
  if (!title || !description || !category) {
    return res.status(400).json({ 
      error: 'Title, description, and category are required' 
    });
  }
  
  const validCategories = ['bug', 'feature_request', 'account_issue', 'payment_issue', 'data_issue', 'security_concern', 'ui_feedback', 'other'];
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }
  
  if (!validPriorities.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }
  
  try {
    const result = await pool.query(`
      INSERT INTO reports (user_id, title, description, category, priority)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, title, description, category, priority]);
    
    const newReport = result.rows[0];
    
    // Get user info for logging
    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    const username = userResult.rows[0]?.username || 'Unknown User';
    
    // Log the report creation
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Report submitted', JSON.stringify({
          report_id: newReport.id,
          title: title,
          category: category,
          priority: priority,
          username: username,
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
    } catch (logErr) {
      console.error('Failed to log report creation:', logErr);
    }
    
    res.status(201).json({ 
      message: 'Report submitted successfully',
      report: newReport 
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get report categories
exports.getReportCategories = async (req, res) => {
  try {
    const categories = [
      { name: 'bug', description: 'Technical issues and bugs', icon: '🐛' },
      { name: 'feature_request', description: 'New feature suggestions', icon: '💡' },
      { name: 'account_issue', description: 'Login, profile, or account problems', icon: '👤' },
      { name: 'payment_issue', description: 'Transaction or payment problems', icon: '💳' },
      { name: 'data_issue', description: 'Incorrect calculations or data', icon: '📊' },
      { name: 'security_concern', description: 'Security-related issues', icon: '🔒' },
      { name: 'ui_feedback', description: 'User interface feedback', icon: '🎨' },
      { name: 'other', description: 'Other issues or feedback', icon: '📝' }
    ];
    res.json(categories);
  } catch (error) {
    console.error('Error fetching report categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update report status (User can only update their own reports)
exports.updateReport = async (req, res) => {
  const userId = req.user.userId;
  const reportId = req.params.id;
  const { title, description, category, priority } = req.body;
  
  try {
    // Check if report belongs to user and is still pending
    const checkResult = await pool.query(
      'SELECT * FROM reports WHERE id = $1 AND user_id = $2',
      [reportId, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const report = checkResult.rows[0];
    if (report.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Cannot update report that is already being processed' 
      });
    }
    
    const result = await pool.query(`
      UPDATE reports 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          category = COALESCE($3, category),
          priority = COALESCE($4, priority),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND user_id = $6
      RETURNING *
    `, [title, description, category, priority, reportId, userId]);
    
    // Log the update
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Report updated', JSON.stringify({
          report_id: reportId,
          changes: { title, description, category, priority },
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
    } catch (logErr) {
      console.error('Failed to log report update:', logErr);
    }
    
    res.json({ 
      message: 'Report updated successfully',
      report: result.rows[0] 
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete report (User can only delete pending reports)
exports.deleteReport = async (req, res) => {
  const userId = req.user.userId;
  const reportId = req.params.id;
  
  try {
    const result = await pool.query(`
      DELETE FROM reports 
      WHERE id = $1 AND user_id = $2 AND status = 'pending'
      RETURNING *
    `, [reportId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Report not found or cannot be deleted' 
      });
    }
    
    // Log the deletion
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Report deleted', JSON.stringify({
          report_id: reportId,
          title: result.rows[0].title,
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
    } catch (logErr) {
      console.error('Failed to log report deletion:', logErr);
    }
    
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ADMIN FUNCTIONS

// Get all reports for admin
exports.getAllReports = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      category, 
      priority,
      sortBy = 'created_at',
      sortOrder = 'DESC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (status) {
      whereConditions.push(`r.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    
    if (category) {
      whereConditions.push(`r.category = $${paramIndex}`);
      queryParams.push(category);
      paramIndex++;
    }
    
    if (priority) {
      whereConditions.push(`r.priority = $${paramIndex}`);
      queryParams.push(priority);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reports r
      ${whereClause}
    `;
    const totalResult = await pool.query(countQuery, queryParams);
    const total = parseInt(totalResult.rows[0].total);
    
    // Get reports with user info
    const reportsQuery = `
      SELECT 
        r.*,
        u.username,
        u.email,
        admin_user.username as admin_username
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users admin_user ON r.admin_id = admin_user.id
      ${whereClause}
      ORDER BY r.${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    const reportsResult = await pool.query(reportsQuery, queryParams);
    
    res.json({
      reports: reportsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update report status and response (Admin only)
exports.adminUpdateReport = async (req, res) => {
  const adminId = req.user.userId;
  const reportId = req.params.id;
  const { status, admin_response } = req.body;
  
  const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  try {
    let resolvedAt = null;
    if (status === 'resolved' || status === 'closed') {
      resolvedAt = 'CURRENT_TIMESTAMP';
    }
    
    const result = await pool.query(`
      UPDATE reports 
      SET status = COALESCE($1, status),
          admin_response = COALESCE($2, admin_response),
          admin_id = $3,
          resolved_at = ${resolvedAt ? resolvedAt : 'resolved_at'},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *, 
        (SELECT username FROM users WHERE id = user_id) as username
    `, [status, admin_response, adminId, reportId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const updatedReport = result.rows[0];
    
    // Get admin info for logging
    const adminResult = await pool.query('SELECT username FROM users WHERE id = $1', [adminId]);
    const adminUsername = adminResult.rows[0]?.username || 'Unknown Admin';
    
    // Log the admin action
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [adminId, 'Report updated by admin', JSON.stringify({
          report_id: reportId,
          target_user: updatedReport.username,
          new_status: status,
          admin_response: admin_response,
          admin_username: adminUsername,
          admin_action: true,
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
    } catch (logErr) {
      console.error('Failed to log admin report update:', logErr);
    }
    
    res.json({ 
      message: 'Report updated successfully',
      report: updatedReport 
    });
  } catch (error) {
    console.error('Error updating report (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get report statistics for admin dashboard
exports.getReportStats = async (req, res) => {
  try {
    // Total reports by status
    const statusStatsResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM reports
      GROUP BY status
    `);
    
    // Reports by category
    const categoryStatsResult = await pool.query(`
      SELECT 
        category,
        COUNT(*) as count
      FROM reports
      GROUP BY category
      ORDER BY count DESC
    `);
    
    // Reports by priority
    const priorityStatsResult = await pool.query(`
      SELECT 
        priority,
        COUNT(*) as count
      FROM reports
      GROUP BY priority
      ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2  
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
    `);
    
    // Recent activity (last 30 days)
    const recentActivityResult = await pool.query(`
      SELECT COUNT(*) as recent_reports
      FROM reports
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);
    
    // Average response time (for resolved reports)
    const avgResponseResult = await pool.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_hours
      FROM reports
      WHERE resolved_at IS NOT NULL
    `);
    
    res.json({
      statusStats: statusStatsResult.rows,
      categoryStats: categoryStatsResult.rows,
      priorityStats: priorityStatsResult.rows,
      recentReports: parseInt(recentActivityResult.rows[0].recent_reports),
      avgResponseHours: parseFloat(avgResponseResult.rows[0].avg_hours || 0)
    });
  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};