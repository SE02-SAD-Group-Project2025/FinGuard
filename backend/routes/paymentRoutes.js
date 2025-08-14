const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  handleWebhook,
  createSetupIntent
} = require('../controllers/paymentController');

// Webhook endpoint (no auth required, Stripe handles verification)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Apply authentication to other routes
router.use(authenticateToken);

// Create payment intent for subscription purchase
router.post('/create-payment-intent', createPaymentIntent);

// Confirm payment after 3D Secure authentication
router.post('/confirm-payment', confirmPayment);

// Create setup intent for saving payment methods
router.post('/create-setup-intent', createSetupIntent);

// Get user payment history
router.get('/history', getPaymentHistory);

module.exports = router;