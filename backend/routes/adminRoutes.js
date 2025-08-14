const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const reportsController = require('../controllers/reportsController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Apply authentication and admin check to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// ================== USER MANAGEMENT ROUTES ==================
// Admin: Get all users
router.get('/users', adminController.getAllUsers);

// Admin: Ban/unban user (specific user by ID)
router.patch('/users/:id/ban', adminController.banOrUnbanUser);

// Admin: Update user role (specific user by ID)
router.put('/users/:id', adminController.updateUserRole);

// ================== LOGS MANAGEMENT ROUTES ==================
// Admin: Get system logs with filtering and pagination
router.get('/logs', adminController.getLogs);

// Admin: Get log statistics  
router.get('/logs/stats', adminController.getLogStats);

// ================== REPORTS MANAGEMENT ROUTES ==================
// Admin: Get all reports with filtering and pagination
router.get('/reports', reportsController.getAllReports);

// Admin: Update report status and add response
router.put('/reports/:id', reportsController.adminUpdateReport);

// Admin: Get report statistics
router.get('/reports/stats', reportsController.getReportStats);

// ================== CATEGORIES MANAGEMENT ROUTES ==================
// Admin: Get all categories
router.get('/categories', adminController.getCategories);

// Admin: Add new category
router.post('/categories', adminController.addCategory);

// Admin: Update category
router.put('/categories/:id', adminController.updateCategory);

// Admin: Delete category
router.delete('/categories/:id', adminController.deleteCategory);

// ================== ADMIN DASHBOARD ROUTES ==================
// Admin: Get system statistics
router.get('/system-stats', adminController.getSystemStats);

// Admin: Get user activity analytics
router.get('/user-activity', adminController.getUserActivity);

// Admin: Get premium user overview
router.get('/premium/overview', adminController.getPremiumOverview);

module.exports = router;