const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  addTransaction,
  getTransactions,
  deleteTransaction,
} = require('../controllers/transactionController');

// Protected transaction routes
router.post('/', authenticateToken, addTransaction);
router.get('/', authenticateToken, getTransactions);
router.delete('/:id', authenticateToken, deleteTransaction);

module.exports = router;