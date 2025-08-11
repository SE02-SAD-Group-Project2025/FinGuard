const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getAnomalies,
  detectAnomalies,
  updateAnomalyStatus
} = require('../controllers/anomalyController');

// Protected anomaly routes
router.get('/', authenticateToken, getAnomalies);
router.post('/detect', authenticateToken, detectAnomalies);
router.patch('/:anomalyId/status', authenticateToken, updateAnomalyStatus);

module.exports = router;