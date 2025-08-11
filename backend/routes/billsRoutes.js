const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getBills,
  addBill,
  updateBill,
  deleteBill,
  markBillPaid,
  getUpcomingBills
} = require('../controllers/billsController');

// All routes require authentication
router.use(authenticateToken);

// Get user's bills
router.get('/', getBills);

// Get upcoming bills for notifications
router.get('/upcoming', getUpcomingBills);

// Add new bill
router.post('/', addBill);

// Update bill
router.put('/:id', updateBill);

// Delete bill
router.delete('/:id', deleteBill);

// Mark bill as paid
router.post('/:id/pay', markBillPaid);

module.exports = router;