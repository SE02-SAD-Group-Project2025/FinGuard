const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getCategorySpendingAnalysis,
  getBudgetVsActualAnalysis,
  getSpendingTrends,
  getBudgetEfficiencyReport,
  getFinancialOverview
} = require('../controllers/analyticsController');

// Apply authentication to all routes
router.use(authenticateToken);

// Advanced Analytics Routes

// Get category-wise spending analysis
// Query params: timeframe (year|current_year|last_year|last_6_months|last_3_months), year, category
router.get('/category-spending', getCategorySpendingAnalysis);

// Get budget vs actual spending comparison
// Query params: year, month
router.get('/budget-vs-actual', getBudgetVsActualAnalysis);

// Get spending trends and growth analysis  
// Query params: months (default: 12)
router.get('/spending-trends', getSpendingTrends);

// Get budget efficiency and variance reports
// Query params: year
router.get('/budget-efficiency', getBudgetEfficiencyReport);

// Get comprehensive financial overview
// Query params: timeframe (current_year|last_year|last_6_months)
router.get('/financial-overview', getFinancialOverview);

module.exports = router;