const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0
  },
  recordingUrl: {
    type: String
  },
  // NEW: Add transcription fields
  transcription: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    conversation: [{
      start: Number,
      end: Number,
      speaker: String,
      text: String
    }],
    metadata: {
      duration: Number,
      language: String,
      processedAt: Date
    },
    error: String
  },
  status: {
    type: String,
    enum: ['initiated', 'ongoing', 'completed', 'failed'],
    default: 'initiated'
  },
  callId: {
    type: String,
    required: true,
    unique: true
  }
});

// Calculate duration before saving
callSchema.pre('save', function (next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

module.exports = mongoose.model('Call', callSchema);