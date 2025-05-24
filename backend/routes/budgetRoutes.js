const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const { addBudget, getBudgets, getBudgetSummary, getBudgetAlerts } = require('../controllers/budgetController');
// Budget routes for adding and retrieving budgets
// These routes are protected by the authenticateToken middleware

router.post('/', authenticateToken, addBudget);
router.get('/', authenticateToken, getBudgets);
router.get('/summary', authenticateToken, getBudgetSummary);
router.get('/alerts', authenticateToken, getBudgetAlerts);

module.exports = router;
