const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superadmin.controller');
const superAdminAuth = require('../middleware/superadmin.middleware');

// ==================== AUTH ROUTES ====================
router.post('/register', superAdminController.register);
router.post('/login', superAdminController.login);
router.get('/profile', superAdminAuth, superAdminController.getProfile);

// ==================== AGENT MANAGEMENT ====================
router.post('/agents', superAdminAuth, superAdminController.createAgent);
router.get('/agents', superAdminAuth, superAdminController.getAllAgents);
router.get('/agents/:id', superAdminAuth, superAdminController.getAgentById);
router.put('/agents/:id', superAdminAuth, superAdminController.updateAgent);
router.put('/agents/:id/password', superAdminAuth, superAdminController.updateAgentPassword);
router.delete('/agents/:id', superAdminAuth, superAdminController.deleteAgent);
router.post('/agents/:id/restore', superAdminAuth, superAdminController.restoreAgent);
router.delete('/agents/:id/permanent', superAdminAuth, superAdminController.permanentDeleteAgent);
router.patch('/agents/:id/toggle-status', superAdminAuth, superAdminController.toggleAgentStatus);

// ==================== DASHBOARD & ANALYTICS ====================
router.get('/dashboard/stats', superAdminAuth, superAdminController.getDashboardStats);
router.get('/dashboard/agent-comparison', superAdminAuth, superAdminController.getAgentComparison);

module.exports = router;