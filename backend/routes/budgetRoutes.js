const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  addBudget,
  getBudgets,
  getBudgetSummary,
  getBudgetAlerts,
  updateBudget,
  deleteBudget
} = require('../controllers/budgetController');

// 🔐 All routes are protected
router.post('/', authenticateToken, addBudget);
router.get('/', authenticateToken, getBudgets);
router.get('/summary', authenticateToken, getBudgetSummary);
router.get('/alerts', authenticateToken, getBudgetAlerts);
router.put('/:id', authenticateToken, updateBudget);
router.delete('/:id', authenticateToken, deleteBudget);

module.exports = router;