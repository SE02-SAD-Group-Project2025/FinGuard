const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config(); // Load .env variables

// ✅ Register new user
const register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hash]
    );

    const newUser = result.rows[0];

    // ✅ ENHANCED: Log basic registration with details
    try {
      await db.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [newUser.id, 'User registered', JSON.stringify({
          username: newUser.username,
          email: newUser.email,
          registration_type: 'basic',
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
      console.log('✅ Basic registration log created');
    } catch (logErr) {
      console.error('❌ Failed to log registration:', logErr);
    }

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// ✅ Login existing user
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      // ✅ ENHANCED: Log failed login attempts with details
      try {
        await db.query(
          'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
          [null, 'Failed login attempt', JSON.stringify({
            email: email,
            reason: 'user_not_found',
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('User-Agent')
          })]
        );
        console.log('✅ Failed login log created');
      } catch (logErr) {
        console.error('❌ Failed to log failed login:', logErr);
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    if (user.is_banned) {
      // ✅ ENHANCED: Log banned user access attempts
      try {
        await db.query(
          'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
          [user.id, 'Banned user access attempt', JSON.stringify({
            username: user.username,
            email: user.email,
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('User-Agent')
          })]
        );
        console.log('✅ Banned user access log created');
      } catch (logErr) {
        console.error('❌ Failed to log banned access:', logErr);
      }
      return res.status(403).json({ error: 'Your account has been banned. Please contact support.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // ✅ ENHANCED: Log failed password attempts
      try {
        await db.query(
          'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
          [user.id, 'Failed login attempt', JSON.stringify({
            username: user.username,
            email: user.email,
            reason: 'incorrect_password',
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('User-Agent')
          })]
        );
        console.log('✅ Failed password log created');
      } catch (logErr) {
        console.error('❌ Failed to log failed password:', logErr);
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // ✅ ENHANCED: Log successful login with details
    try {
      await db.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [user.id, 'User logged in', JSON.stringify({
          username: user.username,
          role: user.role,
          login_method: 'credentials',
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.get('User-Agent')
        })]
      );
      console.log('✅ Login log inserted for user:', user.username);
    } catch (err) {
      console.error('❌ Failed to insert log:', err);
    }

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
};

module.exports = { register, login };
// ✅ Middleware to protect routes