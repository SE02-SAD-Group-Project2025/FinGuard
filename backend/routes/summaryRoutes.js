const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { getMonthlySummary, getFinancialHealth } = require('../controllers/summaryController');

// Protected summary routes
router.get('/', authenticateToken, getMonthlySummary);
router.get('/financial-health', authenticateToken, getFinancialHealth);

module.exports = router;