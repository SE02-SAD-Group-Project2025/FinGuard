const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
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
router.delete('/:id', authenticateToken, deleteBudget);
router.put('/:id', authenticateToken, updateBudget);

module.exports = router;
// This module defines the budget routes for adding, fetching, and updating budgets
// It uses the `authenticateToken` middleware to protect the routes