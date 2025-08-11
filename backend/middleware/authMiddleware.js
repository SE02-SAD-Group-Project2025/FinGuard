// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔍 AUTH CHECK - Authorization header:', authHeader ? 'Present' : 'Missing');
  console.log('🔍 AUTH CHECK - Token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('❌ AUTH CHECK - No token provided');
    return res.status(401).json({ message: 'Token missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ AUTH CHECK - Token verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid token' });
    }

    console.log('✅ AUTH CHECK - Token verified for user:', user.userId, user.username, user.role);
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    console.log('🔍 ADMIN CHECK - User ID:', req.user?.userId, 'Username:', req.user?.username);
    
    const db = require('../db');
    const result = await db.query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
    
    console.log('🔍 ADMIN CHECK - DB Result:', result.rows);
    
    if (!result.rows.length) {
      console.log('❌ ADMIN CHECK - User not found in database');
      return res.status(403).json({ error: 'User not found' });
    }
    
    const userRole = result.rows[0].role;
    console.log('🔍 ADMIN CHECK - User role:', userRole);
    
    if (userRole !== 'Admin') {
      console.log('❌ ADMIN CHECK - User is not admin, role:', userRole);
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.user.role = userRole; // Add role to req.user
    console.log('✅ ADMIN CHECK - Admin access granted');
    next();
  } catch (error) {
    console.error('❌ ADMIN CHECK - Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
module.exports = { authenticateToken, requireAdmin };
