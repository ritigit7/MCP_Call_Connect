const Call = require('../models/Call');
const TranscriptionService = require('../services/transcription.service');

const transcriptionService = new TranscriptionService();

// Get transcription
exports.getTranscription = async (req, res) => {
    console.log('Fetching transcription...');
    try {
        const { callId } = req.params;
        console.log('Call ID:', callId);

        const transcription = await transcriptionService.getTranscription(callId);

        res.json({
            callId,
            transcription
        });
        console.log('Transcription fetched successfully for call:', callId);
    } catch (error) {
        console.error('Error fetching transcription:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Manually trigger transcription
exports.transcribeCall = async (req, res) => {
    console.log('Manually triggering transcription...');
    try {
        const { callId } = req.params;
        console.log('Call ID for transcription trigger:', callId);

        const call = await Call.findOne({ callId });
        if (!call) {
            console.log('Call not found for transcription:', callId);
            return res.status(404).json({ error: 'Call not found' });
        }

        if (!call.recordingUrl) {
            console.log('No recording found for call:', callId);
            return res.status(400).json({ error: 'No recording found for this call' });
        }

        // Trigger transcription
        transcriptionService.triggerTranscription(callId, call.recordingUrl);
        console.log('Transcription service triggered for call:', callId);

        res.json({
            message: 'Transcription started',
            callId,
            status: 'processing'
        });
        console.log('Transcription process started for call:', callId);
    } catch (error) {
        console.error('Error triggering transcription:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Get transcription status
exports.getTranscriptionStatus = async (req, res) => {
    console.log('Fetching transcription status...');
    try {
        const { callId } = req.params;
        console.log('Call ID for status check:', callId);

        const call = await Call.findOne({ callId }).select('transcription.status transcription.error');

        if (!call) {
            console.log('Call not found for status check:', callId);
            return res.status(404).json({ error: 'Call not found' });
        }

        res.json({
            callId,
            status: call.transcription?.status || 'pending',
            error: call.transcription?.error
        });
        console.log('Transcription status fetched for call:', callId, 'Status:', call.transcription?.status || 'pending');
    } catch (error) {
        console.error('Error fetching transcription status:', error.message);
        res.status(500).json({ error: error.message });
    }
};