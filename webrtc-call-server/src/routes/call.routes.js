const express = require('express');
const router = express.Router();
const callController = require('../controllers/call.controller');
const authMiddleware = require('../middleware/auth.middleware');
const fs = require('fs');
const path = require('path');

router.get('/all', authMiddleware, callController.getAllCalls);
router.get('/my-calls', authMiddleware, callController.getCallsByAgent);
router.get('/stats', callController.getCallStats);
router.get('/:id', authMiddleware, callController.getCallById);

// Download recording
router.get('/:id/recording', authMiddleware, async (req, res) => {
  try {
    const Call = require('../models/Call');
    const call = await Call.findById(req.params.id);

    if (!call || !call.recordingUrl) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    const filePath = call.recordingUrl;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Recording file not found' });
    }

    const filename = path.basename(filePath);
    res.download(filePath, filename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;