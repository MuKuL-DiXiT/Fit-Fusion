const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getFoodLogs,
  addFoodLog,
  getExerciseLogs,
  addExerciseLog,
  getDailySummary,
  deleteFoodLog,
  deleteExerciseLog
} = require('../controllers/healthController');

// All health routes require authentication
router.use(authenticateToken);

// Food logging routes
router.get('/food-logs', getFoodLogs);
router.post('/food-logs', addFoodLog);
router.delete('/food-logs/:logId', deleteFoodLog);

// Exercise logging routes
router.get('/exercise-logs', getExerciseLogs);
router.post('/exercise-logs', addExerciseLog);
router.delete('/exercise-logs/:logId', deleteExerciseLog);

// Summary routes
router.get('/summary', getDailySummary);

module.exports = router;