// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, complete2FALogin } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/complete-2fa-login', complete2FALogin);

module.exports = router;