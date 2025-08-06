const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'FinGuard API is running', 
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

// Import middleware and database
const { authenticateToken } = require('./middleware/authMiddleware');
const db = require('./db');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('./utils/emailService');

// Load routes
const authRoutes = require('./routes/authRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const liabilitiesRoutes = require('./routes/liabilitiesRoutes');
const twoFactorRoutes = require('./routes/twoFactorRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/liabilities', liabilitiesRoutes);
app.use('/api/2fa', twoFactorRoutes);
// ================== ENHANCED AUTHENTICATION ENDPOINTS ==================

// Check username availability
app.post('/api/auth/check-username', async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const result = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    res.json({ 
      available: result.rows.length === 0,
      message: result.rows.length === 0 ? 'Username is available' : 'Username is already taken'
    });
  } catch (err) {
    console.error('❌ Username check error:', err);
    res.status(500).json({ error: 'Failed to check username availability' });
  }
});

// Check email availability  
app.post('/api/auth/check-email', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    res.json({ 
      available: result.rows.length === 0,
      message: result.rows.length === 0 ? 'Email is available' : 'Email is already registered'
    });
  } catch (err) {
    console.error('❌ Email check error:', err);
    res.status(500).json({ error: 'Failed to check email availability' });
  }
});

// Enhanced registration endpoint
app.post('/api/auth/register-enhanced', async (req, res) => {
  const { username, email, password, full_name, dob, phone } = req.body;
  
  console.log('📝 Enhanced registration attempt:', { username, email, full_name });
  
  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  // Username validation
  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long' });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  try {
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      const existingEmail = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      const existingUsername = await db.query('SELECT id FROM users WHERE username = $1', [username]);
      
      if (existingEmail.rows.length > 0) {
        return res.status(409).json({ error: 'Email is already registered' });
      }
      if (existingUsername.rows.length > 0) {
        return res.status(409).json({ error: 'Username is already taken' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await db.query(
      `INSERT INTO users (username, email, password, full_name, dob, phone, role) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, username, email, role, full_name`,
      [username, email, hashedPassword, full_name || null, dob || null, phone || null, 'User']
    );

    const newUser = result.rows[0];
    console.log('✅ New user created:', newUser);

    // Create JWT token for immediate login
    const token = jwt.sign(
      {
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // ✅ ENHANCED: Log registration activity with details
    try {
      await db.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [newUser.id, 'User registered', JSON.stringify({
          username: newUser.username,
          email: newUser.email,
          full_name: full_name,
          registration_type: 'enhanced',
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
      console.log('✅ Registration log created');
    } catch (logErr) {
      console.error('❌ Failed to create registration log:', logErr);
    }

    // ✅ ENHANCED: Log immediate login after registration
    try {
      await db.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [newUser.id, 'User logged in', JSON.stringify({
          login_method: 'post_registration',
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
      console.log('✅ Post-registration login log created');
    } catch (logErr) {
      console.error('❌ Failed to create login log:', logErr);
    }

    // 📧 Send welcome email (don't wait for it, send in background)
    try {
      await sendWelcomeEmail(email, username);
      console.log('📧 Welcome email sent to:', email);
    } catch (emailErr) {
      console.error('❌ Failed to send welcome email:', emailErr);
      // Don't fail registration if email fails
    }

    res.status(201).json({ 
      message: 'Registration successful! You are now logged in.',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        full_name: newUser.full_name
      },
      token: token
    });

  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// 📧 REAL Forgot Password endpoint with EMAIL SENDING
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  console.log('🔐 Password reset requested for:', email);

  try {
    // Check if user exists
    const userResult = await db.query('SELECT id, username, email FROM users WHERE email = $1', [email]);
    
    // Always return success for security (don't reveal if email exists)
    res.json({ 
      message: 'If an account with that email exists, you will receive a reset link shortly.',
      success: true
    });

    // If user exists, ACTUALLY SEND EMAIL
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      
      console.log(`📧 Sending password reset email for user: ${user.username} (${user.email})`);
      
      // Generate a secure reset token
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email, type: 'password_reset' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      try {
        // 📧 ACTUALLY SEND THE EMAIL
        await sendPasswordResetEmail(user.email, user.username, resetToken);
        console.log('✅ Password reset email sent successfully to:', user.email);
      } catch (emailErr) {
        console.error('❌ Failed to send password reset email:', emailErr);
        // Don't reveal email sending failure to user for security
      }
      
      // ✅ ENHANCED: Log the password reset request with details
      try {
        await db.query(
          'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
          [user.id, 'Password reset email sent', JSON.stringify({
            email: user.email,
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('User-Agent'),
            reset_method: 'email'
          })]
        );
      } catch (logErr) {
        console.error('❌ Failed to log password reset request:', logErr);
      }
      
    } else {
      console.log(`❌ Password reset requested for non-existent email: ${email}`);
      
      // ✅ ENHANCED: Log failed password reset attempts
      try {
        await db.query(
          'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
          [null, 'Failed password reset attempt', JSON.stringify({
            email: email,
            reason: 'email_not_found',
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('User-Agent')
          })]
        );
      } catch (logErr) {
        console.error('❌ Failed to log failed password reset:', logErr);
      }
    }
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset Password endpoint (for when user clicks email link)
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Reset token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password in database
    const result = await db.query(
      'UPDATE users SET password = $1 WHERE id = $2 AND email = $3 RETURNING id, username',
      [hashedPassword, decoded.userId, decoded.email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or token invalid' });
    }

    const user = result.rows[0];

    // ✅ ENHANCED: Log the password reset completion with details
    try {
      await db.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [user.id, 'Password reset completed', JSON.stringify({
          username: user.username,
          reset_method: 'email_link',
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
    } catch (logErr) {
      console.error('❌ Failed to log password reset:', logErr);
    }

    console.log(`✅ Password reset completed for user: ${user.username}`);
    res.json({ message: 'Password reset successful. You can now login with your new password.' });

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Reset token has expired. Please request a new password reset.' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'Invalid reset token.' });
    }
    
    console.error('❌ Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ================== USER PROFILE ENDPOINTS ==================

// Protected profile route - GET
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, role, phone, full_name, dob, is_banned FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    
    // Don't send sensitive information
    res.json({ 
      profile: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        full_name: user.full_name,
        dob: user.dob,
        is_banned: user.is_banned
      }
    });
  } catch (err) {
    console.error('❌ Profile fetch error:', err);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Update user profile - PUT
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  console.log('🔄 PUT /api/user/profile hit');
  console.log('📝 Request body:', req.body);
  console.log('👤 User ID from token:', req.user.userId);
  
  const userId = req.user.userId;
  const { username, email, phone, full_name } = req.body;

  if (!username || !email) {
    console.log('❌ Validation failed: Missing username or email');
    return res.status(400).json({ error: 'Username and email are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  // Validate username format
  if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username must be at least 3 characters and contain only letters, numbers, and underscores' });
  }

  try {
    // ✅ ENHANCED: Get current user data for detailed logging
    const currentUserResult = await db.query(
      'SELECT username, email, phone, full_name FROM users WHERE id = $1',
      [userId]
    );
    const currentUser = currentUserResult.rows[0];

    // Check if new email/username is already taken by another user
    const existingUser = await db.query(
      'SELECT id FROM users WHERE (email = $1 OR username = $2) AND id != $3',
      [email, username, userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email or username is already taken by another user' });
    }

    console.log('🗄️ Executing database update...');
    const result = await db.query(
      'UPDATE users SET username = $1, email = $2, phone = $3, full_name = $4 WHERE id = $5 RETURNING id, username, email, role, phone, full_name',
      [username, email, phone || null, full_name || null, userId]
    );

    console.log('📊 Database result:', result.rows);

    if (result.rows.length === 0) {
      console.log('❌ No user found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Profile updated successfully');
    
    // ✅ ENHANCED: Log the profile update with detailed changes
    try {
      const changes = {};
      if (currentUser.username !== username) changes.username = { old: currentUser.username, new: username };
      if (currentUser.email !== email) changes.email = { old: currentUser.email, new: email };
      if (currentUser.phone !== phone) changes.phone = { old: currentUser.phone, new: phone };
      if (currentUser.full_name !== full_name) changes.full_name = { old: currentUser.full_name, new: full_name };

      await db.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Profile updated', JSON.stringify({
          changes: changes,
          fields_changed: Object.keys(changes),
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
    } catch (logErr) {
      console.error('❌ Failed to log profile update:', logErr);
    }

    res.json({ 
      message: 'Profile updated successfully', 
      profile: result.rows[0] 
    });
  } catch (err) {
    console.error('❌ Profile update error:', err);
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
});

// Change password - POST
app.post('/api/user/change-password', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body;

  console.log('🔐 Password change request for user:', userId);

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  try {
    // Get current password hash
    const userResult = await db.query('SELECT password, username FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    
    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      console.log('❌ Invalid current password for user:', userId);
      
      // ✅ ENHANCED: Log failed password change attempts
      try {
        await db.query(
          'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
          [userId, 'Failed password change attempt', JSON.stringify({
            username: user.username,
            reason: 'incorrect_current_password',
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('User-Agent')
          })]
        );
      } catch (logErr) {
        console.error('❌ Failed to log failed password change:', logErr);
      }
      
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [newPasswordHash, userId]);

    // ✅ ENHANCED: Log successful password change with details
    try {
      await db.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Password changed', JSON.stringify({
          username: user.username,
          change_method: 'user_initiated',
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
    } catch (logErr) {
      console.error('❌ Failed to log password change:', logErr);
    }

    console.log('✅ Password changed successfully for user:', user.username);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('❌ Password change error:', err);
    res.status(500).json({ message: 'Error changing password' });
  }
});

// ================== SERVER STARTUP ==================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('🚀 FinGuard Server Status:');
  console.log('=====================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log('✅ Enhanced authentication endpoints loaded');
  console.log('✅ Username/Email availability checking enabled');
  console.log('✅ Enhanced registration with full_name, dob, phone');
  console.log('📧 REAL email sending enabled (Gmail)');
  console.log('✅ Password reset emails with beautiful HTML templates');
  console.log('🎉 Welcome emails for new registrations');
  console.log('✅ Profile management endpoints loaded');
  console.log('📝 Enhanced logging system enabled');
  console.log('✅ All routes loaded successfully');
  console.log('=====================================');
  console.log('🌐 API Base URL: http://localhost:' + PORT);
  console.log('📱 Frontend URL: http://localhost:3000');
  console.log('🔧 Admin Panel: http://localhost:3000/admin');
  console.log('📧 Email Service: Gmail (' + process.env.EMAIL_USER + ')');
  console.log('=====================================');
});