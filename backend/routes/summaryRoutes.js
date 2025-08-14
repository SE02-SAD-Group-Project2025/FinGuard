const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { getMonthlySummary, getFinancialHealth, getDashboardOverview, getRecentTransactions } = require('../controllers/summaryController');

// Protected summary routes
router.get('/', authenticateToken, getMonthlySummary);
router.get('/financial-health', authenticateToken, getFinancialHealth);
router.get('/overview', authenticateToken, getDashboardOverview);
router.get('/recent-transactions', authenticateToken, getRecentTransactions);

module.exports = router;