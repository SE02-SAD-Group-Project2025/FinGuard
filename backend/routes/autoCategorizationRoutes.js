const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getMerchantRules,
  createOrUpdateMerchantRule,
  deleteMerchantRule,
  getRecurringTransactions,
  getCategorizationStats,
  autoCategorizeTransactions
} = require('../controllers/autoCategorizationController');

// All routes require authentication
router.use(authenticateToken);

// Get user's merchant category rules
router.get('/rules', getMerchantRules);

// Create or update merchant category rule
router.post('/rules', createOrUpdateMerchantRule);

// Delete merchant category rule
router.delete('/rules/:ruleId', deleteMerchantRule);

// Get recurring transactions analysis
router.get('/recurring', getRecurringTransactions);

// Get auto-categorization statistics
router.get('/stats', getCategorizationStats);

// Auto-categorize transactions based on rules
router.post('/categorize', autoCategorizeTransactions);

module.exports = router;