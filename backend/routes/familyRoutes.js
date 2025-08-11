const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getFamilyGroup,
  createFamilyGroup,
  inviteFamilyMember,
  acceptFamilyInvitation,
  declineFamilyInvitation,
  removeFamilyMember,
  updateMemberBudget,
  getFamilyFinancialSummary
} = require('../controllers/familyController');

// All routes require authentication
router.use(authenticateToken);

// Get user's family group information
router.get('/family-group', getFamilyGroup);

// Create a new family group (premium users only)
router.post('/family-group', createFamilyGroup);

// Send family member invitation
router.post('/invite', inviteFamilyMember);

// Accept family invitation
router.post('/accept-invitation/:token', acceptFamilyInvitation);

// Decline family invitation
router.post('/decline-invitation/:token', declineFamilyInvitation);

// Remove family member (head only)
router.delete('/member/:memberId', removeFamilyMember);

// Update member budget (head only)
router.put('/member/:memberId/budget', updateMemberBudget);

// Get family financial summary
router.get('/financial-summary', getFamilyFinancialSummary);

module.exports = router;