const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getAIBudgetRecommendations,
  getBudgetRecommendations,
  getPredictiveCashFlow,
  getAdvancedAnomalies,
  getFinancialInsights,
  getFinancialHealthData,
  getPredictiveAnalytics,
  getRiskAssessment,
  getFinancialHealthScore
} = require('../controllers/aiController');

// ML-powered AI endpoints
router.get('/ai-budget-recommendations', authenticateToken, getAIBudgetRecommendations);
router.get('/budget-recommendations', authenticateToken, getBudgetRecommendations);
router.get('/predictive-cashflow', authenticateToken, getPredictiveCashFlow);
router.get('/advanced-anomalies', authenticateToken, getAdvancedAnomalies);
router.get('/financial-insights', authenticateToken, getFinancialInsights);
router.get('/financial-health-data', authenticateToken, getFinancialHealthData);
router.get('/predictive-analytics', authenticateToken, getPredictiveAnalytics);
router.get('/risk-assessment', authenticateToken, getRiskAssessment);
router.get('/financial-health-score', authenticateToken, getFinancialHealthScore);

module.exports = router;