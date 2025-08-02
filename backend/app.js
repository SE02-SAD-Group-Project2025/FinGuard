const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');
const authRoutes = require('./routes/authRoutes');
const authenticateToken = require('./middleware/authMiddleware');
const summaryRoutes = require('./routes/summaryRoutes');
const app = express();
const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);


app.use(cors());
app.use(express.json());
app.use('/api/summary', summaryRoutes);


// 🔐 Budget routes (add/get budgets)
const budgetRoutes = require('./routes/budgetRoutes');
app.use('/api/budgets', budgetRoutes);

// 🔓 Public route
app.get('/', (req, res) => {
  res.send('FinGuard API is running 🚀');
});

// 🔐 Auth routes (register/login)
app.use('/api/auth', authRoutes);

// 🔐 Transaction routes (add/get transactions)
const transactionRoutes = require('./routes/transactionRoutes');
app.use('/api/transactions', transactionRoutes);



// 🔐 Protected route example
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
