const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes
router.post('/register', agentController.register);
router.post('/login', agentController.login);

// Protected routes
router.get('/profile', authMiddleware, agentController.getProfile);
// router.get('/all', authMiddleware, agentController.getAllAgents);
router.get('/all', agentController.getAllAgents);

module.exports = router;