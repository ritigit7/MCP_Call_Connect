const Call = require('../models/Call');

// Get all calls
exports.getAllCalls = async (req, res) => {
  try {
    const calls = await Call.find()
      .populate('agent', 'name email')
      .populate('customer', 'name email phone')
      .sort({ startTime: -1 });

    res.json({ calls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get calls by agent
exports.getCallsByAgent = async (req, res) => {
  try {
    const calls = await Call.find({ agent: req.agent._id })
      .populate('customer', 'name email phone')
      .sort({ startTime: -1 });

    res.json({ calls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get call by ID
exports.getCallById = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate('agent', 'name email')
      .populate('customer', 'name email phone');

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json({ call });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get call statistics
exports.getCallStats = async (req, res) => {
  try {
    const totalCalls = await Call.countDocuments();
    const completedCalls = await Call.countDocuments({ status: 'completed' });
    const ongoingCalls = await Call.countDocuments({ status: 'ongoing' });

    const avgDuration = await Call.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
    ]);

    res.json({
      totalCalls,
      completedCalls,
      ongoingCalls,
      averageDuration: avgDuration[0]?.avgDuration || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};