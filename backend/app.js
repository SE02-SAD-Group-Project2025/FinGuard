// app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('FinGuard API is running 🚀');
});

// Test DB connection route
app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ success: true, serverTime: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
