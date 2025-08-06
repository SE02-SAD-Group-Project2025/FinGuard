// controllers/twoFactorController.js
const pool = require('../db');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');

// Generate 2FA setup
exports.setup2FA = async (req, res) => {
  const userId = req.user.userId;
  
  try {
    // Check if user already has 2FA enabled
    const existingResult = await pool.query(
      'SELECT * FROM user_2fa WHERE user_id = $1',
      [userId]
    );
    
    if (existingResult.rows.length > 0 && existingResult.rows[0].is_enabled) {
      return res.status(400).json({ 
        error: '2FA is already enabled for this account' 
      });
    }
    
    // Get user info
    const userResult = await pool.query(
      'SELECT username, email FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `FinGuard (${user.username})`,
      service_name: 'FinGuard',
      length: 32
    });
    
    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    
    // Store secret (but don't enable yet)
    if (existingResult.rows.length > 0) {
      await pool.query(
        'UPDATE user_2fa SET secret = $1, backup_codes = $2 WHERE user_id = $3',
        [secret.base32, JSON.stringify(backupCodes), userId]
      );
    } else {
      await pool.query(
        'INSERT INTO user_2fa (user_id, secret, backup_codes) VALUES ($1, $2, $3)',
        [userId, secret.base32, JSON.stringify(backupCodes)]
      );
    }
    
    // Generate QR code
    const qrCodeUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: `FinGuard:${user.username}`,
      issuer: 'FinGuard',
      encoding: 'base32'
    });
    
    const qrCodeImage = await qrcode.toDataURL(qrCodeUrl);
    
    // Log 2FA setup attempt
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, '2FA setup initiated', JSON.stringify({
          username: user.username,
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
      
      await pool.query(
        'INSERT INTO twofa_attempts (user_id, attempt_type, is_successful, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
        [userId, 'setup', true, req.ip, req.get('User-Agent')]
      );
    } catch (logErr) {
      console.error('Failed to log 2FA setup:', logErr);
    }
    
    res.json({
      qr_code: qrCodeImage,
      manual_entry_key: secret.base32,
      backup_codes: backupCodes,
      message: 'Scan the QR code with your authenticator app and verify with a code to complete setup'
    });
    
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify and enable 2FA
exports.verify2FA = async (req, res) => {
  const userId = req.user.userId;
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Verification token is required' });
  }
  
  // Ensure token is a string
  const tokenString = String(token).trim();
  
  try {
    // Get user's 2FA secret
    const result = await pool.query(
      'SELECT * FROM user_2fa WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: '2FA setup not found. Please start setup process again.' 
      });
    }
    
    const user2FA = result.rows[0];
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user2FA.secret,
      encoding: 'base32',
      token: tokenString,
      window: 1 // Allow 1 step tolerance
    });
    
    // Log attempt
    try {
      await pool.query(
        'INSERT INTO twofa_attempts (user_id, attempt_type, code_used, is_successful, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, 'setup', tokenString, verified, req.ip, req.get('User-Agent')]
      );
    } catch (logErr) {
      console.error('Failed to log 2FA attempt:', logErr);
    }
    
    if (!verified) {
      return res.status(400).json({ 
        error: 'Invalid verification code. Please try again.' 
      });
    }
    
    // Enable 2FA
    await pool.query(
      'UPDATE user_2fa SET is_enabled = true WHERE user_id = $1',
      [userId]
    );
    
    await pool.query(
      'UPDATE users SET two_factor_enabled = true WHERE id = $1',
      [userId]
    );
    
    // Log successful enablement
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, '2FA enabled', JSON.stringify({
          setup_completed: true,
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
    } catch (logErr) {
      console.error('Failed to log 2FA enablement:', logErr);
    }
    
    res.json({
      message: '2FA has been successfully enabled for your account',
      backup_codes: JSON.parse(user2FA.backup_codes)
    });
    
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify 2FA token during login
exports.verify2FALogin = async (req, res) => {
  const { email, token, backup_code } = req.body;
  
  if (!email || (!token && !backup_code)) {
    return res.status(400).json({ 
      error: 'Email and either token or backup code are required' 
    });
  }
  
  try {
    // Get user and 2FA info
    const userResult = await pool.query(
      `SELECT u.*, uf.secret, uf.backup_codes, uf.is_enabled
       FROM users u 
       JOIN user_2fa uf ON u.id = uf.user_id
       WHERE u.email = $1 AND uf.is_enabled = true`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found or 2FA not enabled' 
      });
    }
    
    const user = userResult.rows[0];
    let verified = false;
    let usedBackupCode = false;
    
    if (backup_code) {
      // Verify backup code
      const backupCodes = JSON.parse(user.backup_codes || '[]');
      const codeIndex = backupCodes.findIndex(code => 
        code.toLowerCase() === backup_code.toLowerCase()
      );
      
      if (codeIndex !== -1) {
        verified = true;
        usedBackupCode = true;
        
        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        await pool.query(
          'UPDATE user_2fa SET backup_codes = $1 WHERE user_id = $2',
          [JSON.stringify(backupCodes), user.id]
        );
      }
    } else if (token) {
      // Verify TOTP token
      verified = speakeasy.totp.verify({
        secret: user.secret,
        encoding: 'base32',
        token: token,
        window: 1
      });
    }
    
    // Log attempt
    try {
      await pool.query(
        'INSERT INTO twofa_attempts (user_id, attempt_type, code_used, is_successful, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
        [user.id, 'login', token || backup_code, verified, req.ip, req.get('User-Agent')]
      );
    } catch (logErr) {
      console.error('Failed to log 2FA login attempt:', logErr);
    }
    
    if (!verified) {
      return res.status(400).json({ 
        error: 'Invalid verification code. Please try again.' 
      });
    }
    
    // Update last used
    await pool.query(
      'UPDATE user_2fa SET last_used_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.id]
    );
    
    res.json({
      message: '2FA verification successful',
      user_id: user.id,
      backup_code_used: usedBackupCode,
      remaining_backup_codes: usedBackupCode ? JSON.parse(user.backup_codes || '[]').length : null
    });
    
  } catch (error) {
    console.error('Error verifying 2FA login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Disable 2FA
exports.disable2FA = async (req, res) => {
  const userId = req.user.userId;
  const { password, token } = req.body;
  
  if (!password || !token) {
    return res.status(400).json({ 
      error: 'Current password and verification token are required' 
    });
  }
  
  try {
    // Verify user password
    const bcrypt = require('bcrypt');
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const passwordMatch = await bcrypt.compare(password, userResult.rows[0].password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Incorrect password' });
    }
    
    // Get 2FA info
    const twoFAResult = await pool.query(
      'SELECT * FROM user_2fa WHERE user_id = $1 AND is_enabled = true',
      [userId]
    );
    
    if (twoFAResult.rows.length === 0) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }
    
    const user2FA = twoFAResult.rows[0];
    
    // Verify 2FA token
    const verified = speakeasy.totp.verify({
      secret: user2FA.secret,
      encoding: 'base32',
      token: token,
      window: 1
    });
    
    // Log attempt
    try {
      await pool.query(
        'INSERT INTO twofa_attempts (user_id, attempt_type, code_used, is_successful, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, 'disable', token, verified, req.ip, req.get('User-Agent')]
      );
    } catch (logErr) {
      console.error('Failed to log 2FA disable attempt:', logErr);
    }
    
    if (!verified) {
      return res.status(400).json({ 
        error: 'Invalid verification code. Please try again.' 
      });
    }
    
    // Disable 2FA
    await pool.query(
      'UPDATE user_2fa SET is_enabled = false WHERE user_id = $1',
      [userId]
    );
    
    await pool.query(
      'UPDATE users SET two_factor_enabled = false WHERE id = $1',
      [userId]
    );
    
    // Log successful disable
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, '2FA disabled', JSON.stringify({
          disabled_by_user: true,
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
    } catch (logErr) {
      console.error('Failed to log 2FA disable:', logErr);
    }
    
    res.json({
      message: '2FA has been successfully disabled for your account'
    });
    
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get 2FA status
exports.get2FAStatus = async (req, res) => {
  const userId = req.user.userId;
  
  try {
    const result = await pool.query(
      'SELECT is_enabled, backup_codes, last_used_at FROM user_2fa WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        enabled: false,
        backup_codes_remaining: 0,
        last_used: null
      });
    }
    
    const user2FA = result.rows[0];
    let backupCodes = [];
    
    try {
      backupCodes = JSON.parse(user2FA.backup_codes || '[]');
    } catch (parseError) {
      console.error('Error parsing backup codes:', parseError);
      backupCodes = [];
    }
    
    res.json({
      enabled: user2FA.is_enabled,
      backup_codes_remaining: backupCodes.length,
      last_used: user2FA.last_used_at
    });
    
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate new backup codes
exports.generateBackupCodes = async (req, res) => {
  const userId = req.user.userId;
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  try {
    // Verify password
    const bcrypt = require('bcrypt');
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const passwordMatch = await bcrypt.compare(password, userResult.rows[0].password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Incorrect password' });
    }
    
    // Check if 2FA is enabled
    const twoFAResult = await pool.query(
      'SELECT * FROM user_2fa WHERE user_id = $1 AND is_enabled = true',
      [userId]
    );
    
    if (twoFAResult.rows.length === 0) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }
    
    // Generate new backup codes
    const newBackupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    
    await pool.query(
      'UPDATE user_2fa SET backup_codes = $1 WHERE user_id = $2',
      [JSON.stringify(newBackupCodes), userId]
    );
    
    // Log backup code generation
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, '2FA backup codes regenerated', JSON.stringify({
          codes_generated: newBackupCodes.length,
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
    } catch (logErr) {
      console.error('Failed to log backup code generation:', logErr);
    }
    
    res.json({
      message: 'New backup codes generated successfully',
      backup_codes: newBackupCodes
    });
    
  } catch (error) {
    console.error('Error generating backup codes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};