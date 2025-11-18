const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysis.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Analyze a call
router.post('/:callId/analyze', authMiddleware, analysisController.analyzeCall);

// Get analysis for a call
router.get('/:callId', authMiddleware, analysisController.getAnalysis);

// Get all analyses
router.get('/', authMiddleware, analysisController.getAllAnalyses);

// Get analytics summary
router.get('/summary/stats', authMiddleware, analysisController.getAnalyticsSummary);

// Get agent metrics
router.get('/agent/:agentId/metrics', authMiddleware, analysisController.getAgentMetrics);

module.exports = router;