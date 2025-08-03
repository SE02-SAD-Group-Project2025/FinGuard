const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Add this import for password hashing
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

// Import middleware
const { authenticateToken } = require('./middleware/authMiddleware');
const db = require('./db');

// Load routes
const authRoutes = require('./routes/authRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/admin', adminRoutes);

// Protected profile route - GET
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, role, phone FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Update user profile - PUT
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { username, email, phone } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required' });
  }

  try {
    const result = await db.query(
      'UPDATE users SET username = $1, email = $2, phone = $3 WHERE id = $4 RETURNING id, username, email, role, phone',
      [username, email, phone || null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Profile updated successfully', 
      profile: result.rows[0] 
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Change password - POST
app.post('/api/user/change-password', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  try {
    // Get current password hash
    const userResult = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    
    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [newPasswordHash, userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'Error changing password' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});