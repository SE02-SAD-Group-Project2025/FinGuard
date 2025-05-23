// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, 'secret-key', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });

    req.user = user; // userId from the login token
    next();
  });
};

module.exports = authenticateToken;
