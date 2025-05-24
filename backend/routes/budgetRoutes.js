const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const { addBudget, getBudgets, getBudgetSummary } = require('../controllers/budgetController');


router.post('/', authenticateToken, addBudget);
router.get('/', authenticateToken, getBudgets);
router.get('/summary', authenticateToken, getBudgetSummary);

module.exports = router;
