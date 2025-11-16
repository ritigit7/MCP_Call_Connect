const fs = require('fs');
const path = require('path');
const Call = require('../models/Call');

class RecordingService {
  constructor() {
    this.recordingPath = process.env.RECORDING_PATH || './recordings';
    this.ensureRecordingDirectory();
  }

  ensureRecordingDirectory() {
    if (!fs.existsSync(this.recordingPath)) {
      fs.mkdirSync(this.recordingPath, { recursive: true });
      console.log(`✅ Recording directory created: ${this.recordingPath}`);
    }
  }

  // Save recording buffer to file
  async saveRecording(callId, audioBuffer, format = 'webm') {
    try {
      const filename = `${callId}_${Date.now()}.${format}`;
      const filePath = path.join(this.recordingPath, filename);

      // Write buffer to file
      fs.writeFileSync(filePath, audioBuffer);

      // Update call record with recording path
      await Call.findOneAndUpdate(
        { callId },
        { recordingUrl: filePath }
      );

      console.log(`💾 Recording saved: ${filename}`);
      return filePath;
    } catch (error) {
      console.error('❌ Error saving recording:', error);
      throw error;
    }
  }

  // Get recording file
  getRecording(callId) {
    try {
      const recordings = fs.readdirSync(this.recordingPath);
      const recordingFile = recordings.find(file => file.startsWith(callId));

      if (!recordingFile) {
        return null;
      }

      return path.join(this.recordingPath, recordingFile);
    } catch (error) {
      console.error('❌ Error getting recording:', error);
      return null;
    }
  }

  // Delete recording
  deleteRecording(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Recording deleted: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error deleting recording:', error);
      return false;
    }
  }

  // Handle recording upload from client
  setupRecordingSocket(io) {
    io.on('connection', (socket) => {
      console.log(`🎙️ Recording service ready for: ${socket.id}`);

      // Receive complete recording
      socket.on('recording:complete', async (data) => {
        try {
          console.log('📥 Receiving recording for call:', data.callId);

          const { callId, audioBlob, format } = data;

          if (!callId || !audioBlob) {
            throw new Error('Missing callId or audioBlob');
          }

          // Convert base64 to buffer
          let buffer;
          if (typeof audioBlob === 'string') {
            buffer = Buffer.from(audioBlob, 'base64');
          } else {
            buffer = Buffer.from(audioBlob);
          }

          console.log(`📦 Recording buffer size: ${(buffer.length / 1024).toFixed(2)} KB`);

          if (buffer.length === 0) {
            throw new Error('Empty recording buffer');
          }

          const filePath = await this.saveRecording(callId, buffer, format);

          socket.emit('recording:saved', {
            callId,
            filePath,
            size: buffer.length
          });

          console.log(`✅ Recording saved successfully: ${filePath}`);
        } catch (error) {
          console.error('❌ Error saving recording:', error);
          socket.emit('recording:error', {
            error: error.message,
            callId: data?.callId
          });
        }
      });
    });
  }
}

module.exports = RecordingService;