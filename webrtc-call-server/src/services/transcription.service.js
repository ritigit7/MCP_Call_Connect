const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const Call = require('../models/Call');

class TranscriptionService {
    constructor() {
        // FastAPI server URL
        this.apiUrl = process.env.TRANSCRIPTION_API_URL || 'http://localhost:8000';
    }

    /**
     * Transcribe a recording file
     */
    async transcribeRecording(callId, audioFilePath) {
        try {
            console.log(`🎤 Starting transcription for call: ${callId}`);

            // Update status to processing
            await Call.findOneAndUpdate(
                { callId },
                { 'transcription.status': 'processing' }
            );

            // Call FastAPI endpoint
            const result = await this.callTranscriptionAPI(audioFilePath);

            // Save transcription to database
            await this.saveTranscription(callId, result);

            console.log(`✅ Transcription completed for call: ${callId}`);
            return result;

        } catch (error) {
            console.error(`❌ Transcription failed for call ${callId}:`, error.message);

            // Update status to failed
            await Call.findOneAndUpdate(
                { callId },
                {
                    'transcription.status': 'failed',
                    'transcription.error': error.message
                }
            );

            throw error;
        }
    }

    /**
     * Call FastAPI transcription endpoint (using file path)
     */
    async callTranscriptionAPI(audioFilePath) {
        try {
            console.log(`📡 Calling transcription API...`);

            // Use the path-based endpoint (faster, no file upload)
            const response = await axios.post(
                `${this.apiUrl}/transcribe-from-path`,
                { file_path: audioFilePath },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 300000 // 5 minutes timeout
                }
            );

            if (response.data.status === 'success') {
                return response.data;
            } else {
                throw new Error('Transcription failed');
            }

        } catch (error) {
            if (error.response) {
                // API returned an error
                throw new Error(error.response.data.detail || 'API error');
            } else if (error.request) {
                // No response from API
                throw new Error('Transcription API is not responding. Make sure Python server is running.');
            } else {
                throw error;
            }
        }
    }

    /**
     * Alternative: Call FastAPI with file upload
     */
    async callTranscriptionAPIWithUpload(audioFilePath) {
        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(audioFilePath));

            const response = await axios.post(
                `${this.apiUrl}/transcribe`,
                formData,
                {
                    headers: formData.getHeaders(),
                    timeout: 300000,
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );

            if (response.data.status === 'success') {
                return response.data;
            } else {
                throw new Error('Transcription failed');
            }

        } catch (error) {
            if (error.response) {
                throw new Error(error.response.data.detail || 'API error');
            } else if (error.request) {
                throw new Error('Transcription API is not responding');
            } else {
                throw error;
            }
        }
    }

    /**
     * Save transcription to database
     */
    async saveTranscription(callId, transcriptionData) {
        await Call.findOneAndUpdate(
            { callId },
            {
                'transcription.status': 'completed',
                'transcription.conversation': transcriptionData.conversation,
                'transcription.metadata': {
                    duration: transcriptionData.metadata.duration,
                    language: transcriptionData.metadata.language,
                    processedAt: new Date()
                }
            }
        );
    }

    /**
     * Get transcription for a call
     */
    async getTranscription(callId) {
        const call = await Call.findOne({ callId })
            .select('transcription')
            .lean();

        if (!call) {
            throw new Error('Call not found');
        }

        return call.transcription;
    }

    /**
     * Check if transcription API is available
     */
    async checkAPIHealth() {
        try {
            const response = await axios.get(`${this.apiUrl}/health`, {
                timeout: 5000
            });
            return response.data.status === 'healthy';
        } catch (error) {
            return false;
        }
    }

    /**
     * Trigger transcription after call ends (async)
     */
    async triggerTranscription(callId, recordingPath) {
        // Run in background without blocking
        setImmediate(async () => {
            try {
                // Check if API is available
                const isHealthy = await this.checkAPIHealth();
                if (!isHealthy) {
                    console.error('⚠️ Transcription API is not available');
                    await Call.findOneAndUpdate(
                        { callId },
                        {
                            'transcription.status': 'failed',
                            'transcription.error': 'Transcription service unavailable'
                        }
                    );
                    return;
                }

                await this.transcribeRecording(callId, recordingPath);
            } catch (error) {
                console.error(`Background transcription failed: ${error.message}`);
            }
        });
    }
}

module.exports = TranscriptionService;