const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getActiveChallenges,
  getAvailableChallenges,
  getCompletedChallenges,
  getUserStats,
  getAchievements,
  startChallenge,
  createChallenge
} = require('../controllers/challengesController');

// Protected challenge routes
router.get('/', authenticateToken, getActiveChallenges); // Base route returns active challenges
router.get('/active', authenticateToken, getActiveChallenges);
router.get('/available', authenticateToken, getAvailableChallenges);
router.get('/completed', authenticateToken, getCompletedChallenges);
router.get('/stats', authenticateToken, getUserStats);
router.get('/achievements', authenticateToken, getAchievements);

router.post('/', authenticateToken, createChallenge); // Base POST route for creating challenges
router.post('/start', authenticateToken, startChallenge);
router.post('/create', authenticateToken, createChallenge);

module.exports = router;