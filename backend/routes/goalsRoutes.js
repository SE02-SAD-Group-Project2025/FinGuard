const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  getGoalAchievements
} = require('../controllers/goalsController');

// All routes require authentication
router.use(authenticateToken);

// Get user's goals
router.get('/', getGoals);

// Get goal achievements for notifications
router.get('/achievements', getGoalAchievements);

// Add new goal
router.post('/', addGoal);

// Update goal
router.put('/:id', updateGoal);

// Delete goal
router.delete('/:id', deleteGoal);

module.exports = router;