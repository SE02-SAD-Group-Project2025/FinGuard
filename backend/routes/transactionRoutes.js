const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  addTransaction,
  getTransactions,
  deleteTransaction,
  updateTransaction
} = require('../controllers/transactionController');

// Protected transaction routes
router.post('/', authenticateToken, addTransaction);
router.get('/', authenticateToken, getTransactions);
router.put('/:id', authenticateToken, updateTransaction);
router.delete('/:id', authenticateToken, deleteTransaction);

module.exports = router;