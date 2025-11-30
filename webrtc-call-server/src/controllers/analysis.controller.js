const LLMAnalysisService = require('../services/llm-analysis.service');
const CallAnalysis = require('../models/CallAnalysis');

const analysisService = new LLMAnalysisService();

// Analyze a call
exports.analyzeCall = async (req, res) => {
    console.log('Analyzing call...');
    try {
        const { callId } = req.params;
        console.log('Call ID:', callId);

        const analysis = await analysisService.analyzeCall(callId);

        res.json({
            message: 'Analysis completed',
            analysis
        });
        console.log('Analysis completed for call:', callId);
    } catch (error) {
        console.error('Error in call analysis:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Get analysis for a call
exports.getAnalysis = async (req, res) => {
    console.log('Fetching analysis for a call...');
    try {
        const { callId } = req.params;

        const analysis = await analysisService.getAnalysis(callId);

        res.json({ analysis });
    } catch (error) {
        console.error('Error fetching analysis:', error.message);
        res.status(404).json({ error: error.message });
    }
};

// Get all analyses
exports.getAllAnalyses = async (req, res) => {
    try {
        console.log('Fetching all analyses...');
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        console.log(`Pagination: page=${page}, limit=${limit}`);
        const analyses = await CallAnalysis.find()
            .populate('call')
            .sort({ 'analysisMetadata.analyzedAt': -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await CallAnalysis.countDocuments();

        res.json({
            analyses,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
        console.log('All analyses fetched successfully.');
    } catch (error) {
        console.error('Error fetching all analyses:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Get analytics summary
exports.getAnalyticsSummary = async (req, res) => {
    console.log('Fetching analytics summary...');
    try {
        const filters = {
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo
        };
        console.log('Summary filters:', filters);

        const summary = await analysisService.getAnalyticsSummary(filters);

        res.json({ summary });
        console.log('Analytics summary fetched successfully.');
    } catch (error) {
        console.error('Error fetching analytics summary:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Get agent performance metrics
exports.getAgentMetrics = async (req, res) => {
    try {
        console.log('Fetching agent performance metrics...');
        const { agentId } = req.params;

        console.log('Agent ID:', agentId);
        const metrics = await CallAnalysis.aggregate([
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
                    'callData.agent': require('mongoose').Types.ObjectId(agentId)
                }
            },
            {
                $group: {
                    _id: null,
                    totalCalls: { $sum: 1 },
                    avgScore: { $avg: '$agentPerformance.scores.overall' },
                    avgEmpathy: { $avg: '$agentPerformance.scores.empathy' },
                    avgCommunication: { $avg: '$agentPerformance.scores.communication' },
                    resolvedCalls: {
                        $sum: {
                            $cond: [{ $eq: ['$issues.status', 'resolved'] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        res.json({ metrics: metrics[0] || {} });
        console.log('Agent metrics fetched successfully for agent:', agentId);
    } catch (error) {
        console.error('Error fetching agent metrics:', error.message);
        res.status(500).json({ error: error.message });
    }
};