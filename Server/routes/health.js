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
  deleteExerciseLog,
  addFoodSuggestions
} = require('../controllers/healthController');

// Allow AI suggestion ingestion but require a server-to-server ingestion key for security
router.post('/food-suggestions', (req, res, next) => {
  const ingestKey = req.headers['x-ingest-key'] || req.query.ingest_key;
  if (!process.env.INGESTION_KEY) {
    console.warn('INGESTION_KEY not set; refusing unauthenticated ingestion requests');
    return res.status(403).json({ success: false, message: 'Ingestion disabled' });
  }
  if (!ingestKey || ingestKey !== process.env.INGESTION_KEY) {
    return res.status(401).json({ success: false, message: 'Invalid ingestion key' });
  }
  return addFoodSuggestions(req, res, next);
});

router.use(authenticateToken);
router.get('/food-logs', getFoodLogs);
router.post('/food-logs', addFoodLog);
router.delete('/food-logs/:logId', deleteFoodLog);

router.get('/exercise-logs', getExerciseLogs);
router.post('/exercise-logs', addExerciseLog);
router.delete('/exercise-logs/:logId', deleteExerciseLog);

router.get('/summary', getDailySummary);

module.exports = router;