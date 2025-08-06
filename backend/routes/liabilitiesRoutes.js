const express = require('express');
const router = express.Router();
const liabilitiesController = require('../controllers/liabilitiesController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Get user's liabilities
router.get('/', liabilitiesController.getUserLiabilities);

// Create new liability
router.post('/', liabilitiesController.createLiability);

// Get liability summary/statistics
router.get('/summary', liabilitiesController.getLiabilitySummary);

// Get liability categories
router.get('/categories', liabilitiesController.getLiabilityCategories);

// Update liability
router.put('/:id', liabilitiesController.updateLiability);

// Delete liability (mark as inactive)
router.delete('/:id', liabilitiesController.deleteLiability);

// Record payment for liability
router.post('/:id/payments', liabilitiesController.recordPayment);

// Get payments for a liability
router.get('/:id/payments', liabilitiesController.getLiabilityPayments);

// Get payoff scenarios
router.get('/:id/payoff', liabilitiesController.getPayoffScenarios);

module.exports = router;