const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');

// Get user preferences (theme, settings, etc.)
router.get('/preferences', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  
  try {
    const db = require('../db');
    
    // Get user preferences from database
    const result = await db.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Create default preferences for user
      const defaultPrefs = await db.query(`
        INSERT INTO user_preferences (user_id, theme, use_system_theme, notifications, language, currency)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [userId, 'light', true, true, 'en', 'LKR']);
      
      const prefs = defaultPrefs.rows[0];
      return res.json({
        theme: prefs.theme,
        useSystemTheme: prefs.use_system_theme,
        notifications: prefs.notifications,
        language: prefs.language,
        currency: prefs.currency
      });
    }
    
    const prefs = result.rows[0];
    res.json({
      theme: prefs.theme,
      useSystemTheme: prefs.use_system_theme,
      notifications: prefs.notifications,
      language: prefs.language,
      currency: prefs.currency
    });
    
  } catch (error) {
    console.error('Error getting user preferences:', error);
    res.status(500).json({ error: 'Failed to get user preferences' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  
  try {
    const db = require('../db');
    const { theme, useSystemTheme, notifications, language, currency } = req.body;
    
    // Update user preferences in database
    const result = await db.query(`
      INSERT INTO user_preferences (user_id, theme, use_system_theme, notifications, language, currency)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        theme = EXCLUDED.theme,
        use_system_theme = EXCLUDED.use_system_theme,
        notifications = EXCLUDED.notifications,
        language = EXCLUDED.language,
        currency = EXCLUDED.currency,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, theme, useSystemTheme, notifications, language, currency]);
    
    const updatedPrefs = result.rows[0];
    
    res.json({ 
      success: true, 
      message: 'Preferences saved successfully',
      preferences: {
        theme: updatedPrefs.theme,
        useSystemTheme: updatedPrefs.use_system_theme,
        notifications: updatedPrefs.notifications,
        language: updatedPrefs.language,
        currency: updatedPrefs.currency
      }
    });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    res.status(500).json({ error: 'Failed to save user preferences' });
  }
});

// Get dashboard configuration
router.get('/dashboard-config', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const db = require('../db');
    const result = await db.query(
      'SELECT config_data FROM user_configurations WHERE user_id = $1 AND config_type = $2',
      [userId, 'dashboard_config']
    );

    if (result.rows.length === 0) {
      // Create default dashboard config if it doesn't exist
      const defaultConfig = {
        layout: [],
        widgets: [],
        gridSettings: {
          cols: 12,
          rowHeight: 150,
          margin: [16, 16]
        }
      };

      await db.query(
        'INSERT INTO user_configurations (user_id, config_type, config_data) VALUES ($1, $2, $3)',
        [userId, 'dashboard_config', JSON.stringify(defaultConfig)]
      );

      return res.json(defaultConfig);
    }

    res.json(result.rows[0].config_data);
  } catch (err) {
    console.error('🔴 GET DASHBOARD CONFIG ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard configuration' });
  }
});

// Update dashboard configuration
router.post('/dashboard-config', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const config = req.body;

  try {
    const db = require('../db');
    
    // Upsert dashboard configuration
    await db.query(
      `INSERT INTO user_configurations (user_id, config_type, config_data, updated_at) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, config_type) 
       DO UPDATE SET config_data = $3, updated_at = CURRENT_TIMESTAMP`,
      [userId, 'dashboard_config', JSON.stringify(config)]
    );

    // Log dashboard configuration update
    try {
      await db.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Dashboard configuration updated', JSON.stringify({
          widgets_count: config.widgets?.length || 0,
          layout_items: config.layout?.length || 0,
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
    } catch (logErr) {
      console.error('❌ Failed to log dashboard config update:', logErr);
    }

    res.json({ message: 'Dashboard configuration saved successfully', config });
  } catch (err) {
    console.error('🔴 UPDATE DASHBOARD CONFIG ERROR:', err.message);
    res.status(500).json({ error: 'Failed to update dashboard configuration' });
  }
});

module.exports = router;