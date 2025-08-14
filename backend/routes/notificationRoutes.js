const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  sendBillReminders,
  getUserUpcomingBills,
  triggerBillReminders
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticateToken);

// Get upcoming bills for current user (for dashboard notifications)
router.get('/upcoming-bills', getUserUpcomingBills);

// Manual trigger for bill reminders (typically for admin or cron jobs)
router.post('/trigger-bill-reminders', triggerBillReminders);

// Automated endpoint for bill reminders (this would typically be called by a cron job)
router.post('/send-bill-reminders', sendBillReminders);

module.exports = router;