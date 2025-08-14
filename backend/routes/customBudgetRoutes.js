const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getCustomBudgetPeriods,
  createCustomBudgetPeriod,
  updateCustomBudgetPeriod,
  deleteCustomBudgetPeriod
} = require('../controllers/customBudgetController');

// All routes require authentication
router.use(authenticateToken);

// Get user's custom budget periods
router.get('/', getCustomBudgetPeriods);

// Create new custom budget period
router.post('/', createCustomBudgetPeriod);

// Update custom budget period
router.put('/:id', updateCustomBudgetPeriod);

// Delete custom budget period
router.delete('/:id', deleteCustomBudgetPeriod);

module.exports = router;