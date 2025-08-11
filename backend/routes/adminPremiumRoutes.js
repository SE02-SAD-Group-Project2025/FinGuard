const express = require('express');
const router = express.Router();
const adminPremiumController = require('../controllers/adminPremiumController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Apply authentication and admin check to all admin premium routes
router.use(authenticateToken);
router.use(requireAdmin);

// ================== PREMIUM SUBSCRIPTION ANALYTICS ==================
// Admin: Get comprehensive subscription analytics
router.get('/subscription-analytics', adminPremiumController.getSubscriptionAnalytics);

// Admin: Get system-wide financial overview across all users
router.get('/financial-overview', adminPremiumController.getSystemFinancialOverview);

// Admin: Get premium feature adoption rates and usage statistics  
router.get('/feature-adoption', adminPremiumController.getPremiumFeatureAdoption);

// ================== SUBSCRIPTION MANAGEMENT ==================
// Admin: Manage individual user subscriptions (upgrade/cancel/extend)
router.put('/users/:userId/subscription', adminPremiumController.manageUserSubscription);

// ================== SYSTEM HEALTH MONITORING ==================
// Admin: Get system health metrics and performance data
router.get('/system-health', adminPremiumController.getSystemHealthMetrics);

// ================== ANOMALY OVERSIGHT ==================  
// Admin: Get cross-user anomaly review queue for oversight
router.get('/anomaly-queue', adminPremiumController.getAnomalyReviewQueue);

// Admin: Bulk update anomaly statuses across multiple users
router.patch('/anomalies/bulk-update', adminPremiumController.bulkUpdateAnomalies);

module.exports = router;