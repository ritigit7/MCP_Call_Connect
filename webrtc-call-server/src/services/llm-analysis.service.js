const OpenAI = require('openai');
const CallAnalysis = require('../models/CallAnalysis');
const Call = require('../models/Call');

class LLMAnalysisService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.model = process.env.LLM_MODEL || 'gpt-4-turbo-preview';
    }

    /**
     * Analyze a call transcript
     */
    async analyzeCall(callId) {
        const startTime = Date.now();

        try {
            console.log(`🤖 Starting LLM analysis for call: ${callId}`);

            // Get call with transcription
            const call = await Call.findOne({ callId })
                .populate('agent', 'name email')
                .populate('customer', 'name email')
                .lean();

            if (!call) {
                throw new Error('Call not found');
            }

            if (!call.transcription?.conversation?.length) {
                throw new Error('No transcription available for this call');
            }

            // Format transcript
            const transcript = this.formatTranscript(call.transcription.conversation);

            // Get analysis from LLM
            const analysis = await this.callLLM(transcript, call);

            // Save to database
            const savedAnalysis = await this.saveAnalysis(callId, call._id, analysis);

            const processingTime = Date.now() - startTime;
            console.log(`✅ Analysis completed in ${processingTime}ms`);

            return savedAnalysis;

        } catch (error) {
            console.error(`❌ Analysis failed for call ${callId}:`, error.message);
            throw error;
        }
    }

    /**
     * Format transcript for LLM
     */
    formatTranscript(conversation) {
        return conversation.map(turn => {
            const timestamp = this.formatTime(turn.start);
            return `[${timestamp}] ${turn.speaker}: ${turn.text}`;
        }).join('\n');
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Call OpenAI API
     */
    async callLLM(transcript, callMetadata) {
        const prompt = this.buildPrompt(transcript, callMetadata);

        console.log('📡 Calling OpenAI API...');

        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert call center analyst specializing in customer service quality, sentiment analysis, and performance evaluation. Analyze call transcripts thoroughly and provide structured insights in JSON format.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const analysisText = response.choices[0].message.content;
        const analysis = JSON.parse(analysisText);

        return analysis;
    }

    /**
     * Build analysis prompt
     */
    buildPrompt(transcript, callMetadata) {
        return `Analyze this customer service call transcript and provide a comprehensive analysis in JSON format.

Call Information:
- Agent: ${callMetadata.agent?.name || 'Unknown'}
- Customer: ${callMetadata.customer?.name || 'Unknown'}
- Duration: ${callMetadata.duration || 0} seconds
- Date: ${callMetadata.startTime}

Transcript:
${transcript}

Provide analysis in the following JSON structure:
{
  "summary": {
    "brief": "2-3 sentence summary",
    "keyPoints": ["point 1", "point 2", "point 3"],
    "outcome": "resolved/unresolved/escalated"
  },
  "sentiment": {
    "overall": "positive/neutral/negative",
    "customer": "satisfied/neutral/frustrated/angry",
    "agent": "professional/empathetic/neutral/frustrated",
    "timeline": [
      {
        "timestamp": 30,
        "sentiment": "frustrated",
        "reason": "explanation"
      }
    ],
    "scores": {
      "overall": 0.5,
      "customer": 0.3,
      "agent": 0.8
    }
  },
  "topics": {
    "main": "main topic",
    "subTopics": ["sub 1", "sub 2"],
    "tags": ["tag1", "tag2"],
    "department": "support/billing/sales"
  },
  "actionItems": {
    "customerTasks": [
      {
        "task": "task description",
        "deadline": "deadline if mentioned",
        "priority": "high/medium/low"
      }
    ],
    "agentFollowUps": [
      {
        "action": "follow-up action",
        "deadline": "deadline",
        "status": "pending"
      }
    ],
    "promisesMade": ["promise 1", "promise 2"]
  },
  "issues": {
    "primary": "main issue",
    "secondary": ["issue 2", "issue 3"],
    "rootCause": "root cause analysis",
    "severity": "low/medium/high/critical",
    "status": "resolved/pending/escalated/unresolved",
    "resolutionTime": 180
  },
  "agentPerformance": {
    "strengths": ["strength 1", "strength 2"],
    "areasForImprovement": ["area 1", "area 2"],
    "scores": {
      "overall": 8,
      "communication": 9,
      "professionalism": 8,
      "empathy": 7,
      "problemSolving": 8,
      "productKnowledge": 7
    },
    "firstCallResolution": true,
    "scriptAdherence": "good/fair/poor"
  },
  "customerExperience": {
    "satisfactionIndicators": ["indicator 1", "indicator 2"],
    "painPoints": ["pain point 1", "pain point 2"],
    "effortLevel": "easy/moderate/difficult",
    "waitTimeComplaints": false,
    "repeatCall": false,
    "transferCount": 0
  },
  "compliance": {
    "greetingQuality": "proper/adequate/missing/poor",
    "closingQuality": "proper/adequate/missing/poor",
    "policyAdherence": true,
    "dataSecurityFollowed": true,
    "requiredDisclosures": ["disclosure 1"],
    "violations": []
  },
  "businessInsights": {
    "featureRequests": ["request 1"],
    "productFeedback": ["feedback 1"],
    "improvementSuggestions": ["suggestion 1"],
    "competitorMentions": [],
    "bugReports": []
  },
  "recommendations": {
    "forAgent": ["recommendation 1", "recommendation 2"],
    "forManager": ["recommendation 1"],
    "forTraining": ["training need 1"],
    "forProduct": ["product improvement 1"]
  },
  "riskFlags": {
    "churnRisk": {
      "level": "low/medium/high",
      "reasons": ["reason 1"]
    },
    "escalationRequired": false,
    "legalRisk": false,
    "vipCustomer": false
  }
}

Ensure all fields are filled with meaningful analysis based on the transcript. Use null for truly unavailable information.`;
    }

    /**
     * Save analysis to database
     */
    async saveAnalysis(callId, callObjectId, analysis) {
        // Check if analysis already exists
        let existingAnalysis = await CallAnalysis.findOne({ callId });

        const analysisData = {
            callId,
            call: callObjectId,
            ...analysis,
            analysisMetadata: {
                analyzedAt: new Date(),
                llmModel: this.model,
                processingTime: 0,
                confidence: 0.85,
                version: '1.0'
            }
        };

        if (existingAnalysis) {
            // Update existing
            existingAnalysis = await CallAnalysis.findOneAndUpdate(
                { callId },
                analysisData,
                { new: true }
            );
            return existingAnalysis;
        } else {
            // Create new
            const newAnalysis = new CallAnalysis(analysisData);
            return await newAnalysis.save();
        }
    }

    /**
     * Get analysis for a call
     */
    async getAnalysis(callId) {
        const analysis = await CallAnalysis.findOne({ callId })
            .populate('call')
            .lean();

        if (!analysis) {
            throw new Error('Analysis not found');
        }

        return analysis;
    }

    /**
     * Trigger analysis in background
     */
    async triggerAnalysis(callId) {
        setImmediate(async () => {
            try {
                await this.analyzeCall(callId);
            } catch (error) {
                console.error(`Background analysis failed: ${error.message}`);
            }
        });
    }

    /**
     * Get analytics summary for multiple calls
     */
    async getAnalyticsSummary(filters = {}) {
        const pipeline = [];

        // Add filters if provided
        if (filters.dateFrom) {
            pipeline.push({
                $match: {
                    'analysisMetadata.analyzedAt': { $gte: new Date(filters.dateFrom) }
                }
            });
        }

        // Aggregate statistics
        pipeline.push({
            $group: {
                _id: null,
                totalCalls: { $sum: 1 },
                avgAgentScore: { $avg: '$agentPerformance.scores.overall' },
                avgCustomerSatisfaction: { $avg: '$sentiment.scores.customer' },
                resolvedCount: {
                    $sum: {
                        $cond: [{ $eq: ['$issues.status', 'resolved'] }, 1, 0]
                    }
                },
                escalatedCount: {
                    $sum: {
                        $cond: [{ $eq: ['$issues.status', 'escalated'] }, 1, 0]
                    }
                }
            }
        });

        const result = await CallAnalysis.aggregate(pipeline);
        return result[0] || {};
    }
}

module.exports = LLMAnalysisService;