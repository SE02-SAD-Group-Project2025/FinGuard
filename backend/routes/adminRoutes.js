const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin: Get all users
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/ban', adminController.banOrUnbanUser);
router.put('/users/:id', adminController.updateUserRole);
router.get('/logs', adminController.getLogs);

module.exports = router;
