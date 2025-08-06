const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// User routes (protected)
router.use(authenticateToken);

// Get user's reports
router.get('/', reportsController.getUserReports);

// Create new report
router.post('/', reportsController.createReport);

// Get report categories
router.get('/categories', reportsController.getReportCategories);

// Update user's own report (only pending reports)
router.put('/:id', reportsController.updateReport);

// Delete user's own report (only pending reports)
router.delete('/:id', reportsController.deleteReport);

// Admin routes (require admin privileges)
router.use(requireAdmin);

// Get all reports (admin only)
router.get('/admin/all', reportsController.getAllReports);

// Update report status and add response (admin only)
router.put('/admin/:id', reportsController.adminUpdateReport);

// Get report statistics (admin only)
router.get('/admin/stats', reportsController.getReportStats);

module.exports = router;