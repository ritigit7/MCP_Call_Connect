const mongoose = require('mongoose');

const callAnalysisSchema = new mongoose.Schema({
    callId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    call: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Call',
        required: true
    },

    // 1. Summary
    summary: {
        brief: String,
        keyPoints: [String],
        outcome: String
    },

    // 2. Sentiment Analysis
    sentiment: {
        overall: {
            type: String,
            enum: ['positive', 'neutral', 'negative']
        },
        customer: {
            type: String,
            enum: ['satisfied', 'neutral', 'frustrated', 'angry']
        },
        agent: {
            type: String,
            enum: ['professional', 'empathetic', 'neutral', 'frustrated']
        },
        timeline: [{ // sentiment changes during call
            timestamp: Number,
            sentiment: String,
            reason: String
        }],
        scores: {
            overall: Number, // -1 to 1
            customer: Number,
            agent: Number
        }
    },

    // 3. Topics & Categories
    topics: {
        main: String,
        subTopics: [String],
        tags: [String],
        department: String
    },

    // 4. Action Items
    actionItems: {
        customerTasks: [{
            task: String,
            deadline: String,
            priority: String
        }],
        agentFollowUps: [{
            action: String,
            deadline: String,
            status: String
        }],
        promisesMade: [String]
    },

    // 5. Issues
    issues: {
        primary: String,
        secondary: [String],
        rootCause: String,
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical']
        },
        status: {
            type: String,
            enum: ['resolved', 'pending', 'escalated', 'unresolved']
        },
        resolutionTime: Number // in seconds
    },

    // 6. Agent Performance
    agentPerformance: {
        strengths: [String],
        areasForImprovement: [String],
        scores: {
            overall: Number, // 1-10
            communication: Number,
            professionalism: Number,
            empathy: Number,
            problemSolving: Number,
            productKnowledge: Number
        },
        firstCallResolution: Boolean,
        scriptAdherence: String
    },

    // 7. Customer Experience
    customerExperience: {
        satisfactionIndicators: [String],
        painPoints: [String],
        effortLevel: {
            type: String,
            enum: ['easy', 'moderate', 'difficult']
        },
        waitTimeComplaints: Boolean,
        repeatCall: Boolean,
        transferCount: Number
    },

    // 8. Compliance
    compliance: {
        greetingQuality: {
            type: String,
            enum: ['proper', 'adequate', 'missing', 'poor']
        },
        closingQuality: {
            type: String,
            enum: ['proper', 'adequate', 'missing', 'poor']
        },
        policyAdherence: Boolean,
        dataSecurityFollowed: Boolean,
        requiredDisclosures: [String],
        violations: [String]
    },

    // 9. Business Insights
    businessInsights: {
        featureRequests: [String],
        productFeedback: [String],
        improvementSuggestions: [String],
        competitorMentions: [String],
        bugReports: [String]
    },

    // 10. Recommendations
    recommendations: {
        forAgent: [String],
        forManager: [String],
        forTraining: [String],
        forProduct: [String]
    },

    // Metadata
    analysisMetadata: {
        analyzedAt: {
            type: Date,
            default: Date.now
        },
        llmModel: String,
        processingTime: Number, // milliseconds
        confidence: Number, // 0-1
        version: String
    },

    // Risk Flags
    riskFlags: {
        churnRisk: {
            level: String, // low/medium/high
            reasons: [String]
        },
        escalationRequired: Boolean,
        legalRisk: Boolean,
        vipCustomer: Boolean
    }

}, {
    timestamps: true
});

// Indexes for faster queries
callAnalysisSchema.index({ 'sentiment.overall': 1 });
callAnalysisSchema.index({ 'agentPerformance.scores.overall': 1 });
callAnalysisSchema.index({ 'topics.main': 1 });
callAnalysisSchema.index({ 'analysisMetadata.analyzedAt': -1 });

module.exports = mongoose.model('CallAnalysis', callAnalysisSchema);