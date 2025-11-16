const express = require('express');
const router = express.Router();
const transcriptionController = require('../controllers/transcription.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Get transcription for a call
router.get('/:callId', transcriptionController.getTranscription);

// Manually trigger transcription
router.post('/:callId/transcribe', transcriptionController.transcribeCall);

// Get transcription status
router.get('/:callId/status', transcriptionController.getTranscriptionStatus);

module.exports = router;