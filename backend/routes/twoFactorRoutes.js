const express = require('express');
const router = express.Router();
const twoFactorController = require('../controllers/twoFactorController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Setup 2FA (requires authentication)
router.post('/setup', authenticateToken, twoFactorController.setup2FA);

// Verify 2FA setup (requires authentication)
router.post('/verify', authenticateToken, twoFactorController.verify2FA);

// Verify 2FA during login (public route)
router.post('/verify-login', twoFactorController.verify2FALogin);

// Disable 2FA (requires authentication)
router.post('/disable', authenticateToken, twoFactorController.disable2FA);

// Get 2FA status (requires authentication)
router.get('/status', authenticateToken, twoFactorController.get2FAStatus);

// Generate new backup codes (requires authentication)
router.post('/backup-codes', authenticateToken, twoFactorController.generateBackupCodes);

module.exports = router;