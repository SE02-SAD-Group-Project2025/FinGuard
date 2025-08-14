const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getAvailableBudgetsForTransfer,
  processBudgetTransfer,
  getBudgetAlerts,
  markAlertsAsRead,
  getBudgetTransferHistory
} = require('../controllers/budgetTransferController');

// Apply auth middleware to all routes
router.use(authenticateToken);

// Get available budgets for transfer
router.get('/available-budgets', getAvailableBudgetsForTransfer);

// Process budget transfer
router.post('/transfer', processBudgetTransfer);

// Get budget alerts/notifications
router.get('/alerts', getBudgetAlerts);

// Mark alerts as read
router.put('/alerts/read', markAlertsAsRead);

// Get budget transfer history
router.get('/history', getBudgetTransferHistory);

module.exports = router;