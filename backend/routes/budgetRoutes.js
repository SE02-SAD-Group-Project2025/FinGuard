const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');

// ✅ Make sure this import matches your actual export from budgetController.js
const {
  addBudget,
  getBudgets,
  getBudgetSummary,
  getBudgetAlerts,
} = require('../controllers/budgetController');

// ✅ Correct route handlers
router.post('/', authenticateToken, addBudget);
router.get('/', authenticateToken, getBudgets);
router.get('/summary', authenticateToken, getBudgetSummary);
router.get('/alerts', authenticateToken, getBudgetAlerts);

module.exports = router;
