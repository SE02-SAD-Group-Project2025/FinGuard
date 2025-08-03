const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Apply authentication and admin check to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Admin: Get all users
router.get('/users', adminController.getAllUsers);

// Admin: Ban/unban user (specific user by ID)
router.patch('/users/:id/ban', adminController.banOrUnbanUser);

// Admin: Update user role (specific user by ID)
router.put('/users/:id', adminController.updateUserRole);

// Admin: Get system logs
router.get('/logs', adminController.getLogs);


module.exports = router;