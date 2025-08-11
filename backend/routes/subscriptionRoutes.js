// routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getSubscriptionPlans, 
    getUserSubscription, 
    upgradeSubscription, 
    cancelSubscription,
    getFamilyMembers,
    inviteFamilyMember,
    removeFamilyMember,
    updateFamilyMemberBudget
} = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get all available subscription plans
router.get('/plans', getSubscriptionPlans);

// Get current user subscription details
router.get('/current', authenticateToken, getUserSubscription);

// Upgrade/change subscription plan
router.post('/upgrade', authenticateToken, upgradeSubscription);

// Cancel subscription
router.post('/cancel', authenticateToken, cancelSubscription);

// Family plan routes
router.get('/family/members', authenticateToken, getFamilyMembers);
router.post('/family/invite', authenticateToken, inviteFamilyMember);
router.delete('/family/member/:memberId', authenticateToken, removeFamilyMember);
router.put('/family/member/:memberId/budget', authenticateToken, updateFamilyMemberBudget);

module.exports = router;