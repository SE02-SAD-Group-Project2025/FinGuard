const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { getMonthlySummary } = require('../controllers/summaryController');

// Protected summary route
router.get('/', authenticateToken, getMonthlySummary);

module.exports = router;