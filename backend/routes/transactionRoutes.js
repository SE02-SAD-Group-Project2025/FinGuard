// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const {
  addTransaction,
  getTransactions,
} = require('../controllers/transactionController');

router.post('/', authenticateToken, addTransaction);
router.get('/', authenticateToken, getTransactions);

module.exports = router;
