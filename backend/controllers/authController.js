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
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    if (user.is_banned) {
      return res.status(403).json({ error: 'Your account has been banned. Please contact support.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

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

    // ✅ Log the login activity
try {
  await db.query(
    'INSERT INTO logs (user_id, activity) VALUES ($1, $2)',
    [user.id, 'User logged in']
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
