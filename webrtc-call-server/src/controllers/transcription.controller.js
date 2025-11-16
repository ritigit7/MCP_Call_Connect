const Call = require('../models/Call');
const TranscriptionService = require('../services/transcription.service');

const transcriptionService = new TranscriptionService();

// Get transcription
exports.getTranscription = async (req, res) => {
    try {
        const { callId } = req.params;

        const transcription = await transcriptionService.getTranscription(callId);

        res.json({
            callId,
            transcription
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Manually trigger transcription
exports.transcribeCall = async (req, res) => {
    try {
        const { callId } = req.params;

        const call = await Call.findOne({ callId });
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }

        if (!call.recordingUrl) {
            return res.status(400).json({ error: 'No recording found for this call' });
        }

        // Trigger transcription
        transcriptionService.triggerTranscription(callId, call.recordingUrl);

        res.json({
            message: 'Transcription started',
            callId,
            status: 'processing'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get transcription status
exports.getTranscriptionStatus = async (req, res) => {
    try {
        const { callId } = req.params;

        const call = await Call.findOne({ callId }).select('transcription.status transcription.error');

        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }

        res.json({
            callId,
            status: call.transcription?.status || 'pending',
            error: call.transcription?.error
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};