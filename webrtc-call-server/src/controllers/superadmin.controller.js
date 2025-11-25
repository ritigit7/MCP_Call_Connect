const SuperAdmin = require('../models/SuperAdmin');
const Agent = require('../models/Agent');
const Call = require('../models/Call');
const CallAnalysis = require('../models/CallAnalysis');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ==================== SUPER ADMIN AUTH ====================

// Register SuperAdmin (first time setup)
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if SuperAdmin already exists
        const existingSuperAdmin = await SuperAdmin.findOne({ email });
        if (existingSuperAdmin) {
            return res.status(400).json({ error: 'SuperAdmin already exists' });
        }

        // Create SuperAdmin
        const superAdmin = new SuperAdmin({ name, email, password });
        await superAdmin.save();

        const token = generateToken(superAdmin._id);

        res.status(201).json({
            message: 'SuperAdmin registered successfully',
            superAdmin: {
                id: superAdmin._id,
                name: superAdmin.name,
                email: superAdmin.email,
                role: superAdmin.role
            },
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Login SuperAdmin
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const superAdmin = await SuperAdmin.findOne({ email });
        if (!superAdmin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!superAdmin.isActive) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        const isMatch = await superAdmin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        superAdmin.lastLogin = new Date();
        await superAdmin.save();

        const token = generateToken(superAdmin._id);

        res.json({
            message: 'Login successful',
            superAdmin: {
                id: superAdmin._id,
                name: superAdmin.name,
                email: superAdmin.email,
                role: superAdmin.role
            },
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get SuperAdmin profile
exports.getProfile = async (req, res) => {
    try {
        res.json({
            superAdmin: {
                id: req.superAdmin._id,
                name: req.superAdmin.name,
                email: req.superAdmin.email,
                role: req.superAdmin.role,
                lastLogin: req.superAdmin.lastLogin
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==================== AGENT MANAGEMENT ====================

// Create new agent
exports.createAgent = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if agent exists
        const existingAgent = await Agent.findOne({ email });
        if (existingAgent) {
            return res.status(400).json({ error: 'Agent already exists' });
        }

        // Create agent
        const agent = new Agent({
            name,
            email,
            password,
            createdBy: req.superAdmin._id
        });
        await agent.save();

        res.status(201).json({
            message: 'Agent created successfully',
            agent: {
                id: agent._id,
                name: agent.name,
                email: agent.email,
                status: agent.status,
                isActive: agent.isActive,
                createdAt: agent.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all agents (including deleted)
exports.getAllAgents = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            isActive,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (page - 1) * limit;
        const query = {};

        // Filters
        if (status) query.status = status;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Get agents with call statistics
        const agents = await Agent.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'calls',
                    localField: '_id',
                    foreignField: 'agent',
                    as: 'calls'
                }
            },
            {
                $lookup: {
                    from: 'callanalyses',
                    let: { agentId: '$_id' },
                    pipeline: [
                        {
                            $lookup: {
                                from: 'calls',
                                localField: 'call',
                                foreignField: '_id',
                                as: 'callData'
                            }
                        },
                        {
                            $unwind: '$callData'
                        },
                        {
                            $match: {
                                $expr: { $eq: ['$callData.agent', '$$agentId'] }
                            }
                        }
                    ],
                    as: 'analyses'
                }
            },
            {
                $addFields: {
                    totalCalls: { $size: '$calls' },
                    completedCalls: {
                        $size: {
                            $filter: {
                                input: '$calls',
                                cond: { $eq: ['$$this.status', 'completed'] }
                            }
                        }
                    },
                    avgPerformanceScore: {
                        $avg: '$analyses.agentPerformance.scores.overall'
                    },
                    avgCallDuration: { $avg: '$calls.duration' }
                }
            },
            {
                $project: {
                    password: 0,
                    calls: 0,
                    analyses: 0
                }
            },
            { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ]);

        const total = await Agent.countDocuments(query);

        res.json({
            agents,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single agent with detailed stats
exports.getAgentById = async (req, res) => {
    try {
        const { id } = req.params;

        const agent = await Agent.findById(id)
            .select('-password')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .populate('deletedBy', 'name email');

        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // Get call statistics
        const callStats = await Call.aggregate([
            { $match: { agent: mongoose.Types.ObjectId(id) } },
            {
                $group: {
                    _id: null,
                    totalCalls: { $sum: 1 },
                    completedCalls: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    avgDuration: { $avg: '$duration' },
                    totalDuration: { $sum: '$duration' }
                }
            }
        ]);

        // Get performance statistics
        const performanceStats = await CallAnalysis.aggregate([
            {
                $lookup: {
                    from: 'calls',
                    localField: 'call',
                    foreignField: '_id',
                    as: 'callData'
                }
            },
            { $unwind: '$callData' },
            { $match: { 'callData.agent': mongoose.Types.ObjectId(id) } },
            {
                $group: {
                    _id: null,
                    avgOverallScore: { $avg: '$agentPerformance.scores.overall' },
                    avgCommunication: { $avg: '$agentPerformance.scores.communication' },
                    avgEmpathy: { $avg: '$agentPerformance.scores.empathy' },
                    avgProblemSolving: { $avg: '$agentPerformance.scores.problemSolving' },
                    avgProductKnowledge: { $avg: '$agentPerformance.scores.productKnowledge' },
                    positiveSentiment: {
                        $sum: { $cond: [{ $eq: ['$sentiment.overall', 'positive'] }, 1, 0] }
                    },
                    negativeSentiment: {
                        $sum: { $cond: [{ $eq: ['$sentiment.overall', 'negative'] }, 1, 0] }
                    },
                    resolvedCalls: {
                        $sum: { $cond: [{ $eq: ['$issues.status', 'resolved'] }, 1, 0] }
                    }
                }
            }
        ]);

        // Recent calls
        const recentCalls = await Call.find({ agent: id })
            .populate('customer', 'name email phone')
            .sort({ startTime: -1 })
            .limit(10)
            .select('callId startTime endTime duration status');

        res.json({
            agent,
            statistics: {
                calls: callStats[0] || {
                    totalCalls: 0,
                    completedCalls: 0,
                    avgDuration: 0,
                    totalDuration: 0
                },
                performance: performanceStats[0] || {}
            },
            recentCalls
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update agent
exports.updateAgent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Don't allow updating certain fields
        delete updates.password; // Use separate endpoint for password
        delete updates.createdBy;
        delete updates.deletedAt;
        delete updates.deletedBy;

        const agent = await Agent.findById(id);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // Update agent
        Object.assign(agent, updates);
        agent.updatedBy = req.superAdmin._id;
        await agent.save();

        res.json({
            message: 'Agent updated successfully',
            agent: {
                id: agent._id,
                name: agent.name,
                email: agent.email,
                status: agent.status,
                isActive: agent.isActive
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update agent password
exports.updateAgentPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const agent = await Agent.findById(id);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        agent.password = newPassword;
        agent.lastPasswordChange = new Date();
        agent.updatedBy = req.superAdmin._id;
        await agent.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Soft delete agent
exports.deleteAgent = async (req, res) => {
    try {
        const { id } = req.params;

        const agent = await Agent.findById(id);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        if (!agent.isActive) {
            return res.status(400).json({ error: 'Agent is already deleted' });
        }

        // Soft delete
        agent.isActive = false;
        agent.deletedAt = new Date();
        agent.deletedBy = req.superAdmin._id;
        agent.status = 'offline';
        await agent.save();

        res.json({ message: 'Agent deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Restore deleted agent
exports.restoreAgent = async (req, res) => {
    try {
        const { id } = req.params;

        const agent = await Agent.findById(id);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        if (agent.isActive) {
            return res.status(400).json({ error: 'Agent is not deleted' });
        }

        // Restore
        agent.isActive = true;
        agent.deletedAt = null;
        agent.deletedBy = null;
        agent.updatedBy = req.superAdmin._id;
        await agent.save();

        res.json({ message: 'Agent restored successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Permanently delete agent
exports.permanentDeleteAgent = async (req, res) => {
    try {
        const { id } = req.params;

        const agent = await Agent.findById(id);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // Check if agent has calls
        const callCount = await Call.countDocuments({ agent: id });
        if (callCount > 0) {
            return res.status(400).json({
                error: 'Cannot permanently delete agent with existing calls. Use soft delete instead.',
                callCount
            });
        }

        await Agent.findByIdAndDelete(id);

        res.json({ message: 'Agent permanently deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Toggle agent active status
exports.toggleAgentStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const agent = await Agent.findById(id);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        agent.isActive = !agent.isActive;
        agent.updatedBy = req.superAdmin._id;

        if (!agent.isActive) {
            agent.status = 'offline';
        }

        await agent.save();

        res.json({
            message: `Agent ${agent.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: agent.isActive
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==================== DASHBOARD STATISTICS ====================

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        // Total agents
        const totalAgents = await Agent.countDocuments({ isActive: true });
        const deletedAgents = await Agent.countDocuments({ isActive: false });

        // Total calls
        const totalCalls = await Call.countDocuments();
        const completedCalls = await Call.countDocuments({ status: 'completed' });
        const ongoingCalls = await Call.countDocuments({ status: 'ongoing' });

        // Average metrics
        const avgMetrics = await CallAnalysis.aggregate([
            {
                $group: {
                    _id: null,
                    avgAgentScore: { $avg: '$agentPerformance.scores.overall' },
                    avgCustomerSatisfaction: { $avg: '$sentiment.scores.customer' }
                }
            }
        ]);

        // Top performing agents
        const topAgents = await CallAnalysis.aggregate([
            {
                $lookup: {
                    from: 'calls',
                    localField: 'call',
                    foreignField: '_id',
                    as: 'callData'
                }
            },
            { $unwind: '$callData' },
            {
                $group: {
                    _id: '$callData.agent',
                    avgScore: { $avg: '$agentPerformance.scores.overall' },
                    totalCalls: { $sum: 1 }
                }
            },
            { $sort: { avgScore: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'agents',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'agentInfo'
                }
            },
            { $unwind: '$agentInfo' },
            {
                $project: {
                    name: '$agentInfo.name',
                    email: '$agentInfo.email',
                    avgScore: 1,
                    totalCalls: 1
                }
            }
        ]);

        // Calls by date (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const callsByDate = await Call.aggregate([
            { $match: { startTime: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            agents: {
                total: totalAgents,
                deleted: deletedAgents,
                active: totalAgents
            },
            calls: {
                total: totalCalls,
                completed: completedCalls,
                ongoing: ongoingCalls
            },
            averages: avgMetrics[0] || {
                avgAgentScore: 0,
                avgCustomerSatisfaction: 0
            },
            topAgents,
            callsByDate
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get agent performance comparison
exports.getAgentComparison = async (req, res) => {
    try {
        const comparison = await CallAnalysis.aggregate([
            {
                $lookup: {
                    from: 'calls',
                    localField: 'call',
                    foreignField: '_id',
                    as: 'callData'
                }
            },
            { $unwind: '$callData' },
            {
                $group: {
                    _id: '$callData.agent',
                    avgOverallScore: { $avg: '$agentPerformance.scores.overall' },
                    avgCommunication: { $avg: '$agentPerformance.scores.communication' },
                    avgEmpathy: { $avg: '$agentPerformance.scores.empathy' },
                    avgProblemSolving: { $avg: '$agentPerformance.scores.problemSolving' },
                    totalCalls: { $sum: 1 },
                    resolvedCalls: {
                        $sum: { $cond: [{ $eq: ['$issues.status', 'resolved'] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: 'agents',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'agentInfo'
                }
            },
            { $unwind: '$agentInfo' },
            {
                $project: {
                    agentId: '$_id',
                    name: '$agentInfo.name',
                    email: '$agentInfo.email',
                    avgOverallScore: 1,
                    avgCommunication: 1,
                    avgEmpathy: 1,
                    avgProblemSolving: 1,
                    totalCalls: 1,
                    resolvedCalls: 1,
                    resolutionRate: {
                        $multiply: [
                            { $divide: ['$resolvedCalls', '$totalCalls'] },
                            100
                        ]
                    }
                }
            },
            { $sort: { avgOverallScore: -1 } }
        ]);

        res.json({ comparison });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};