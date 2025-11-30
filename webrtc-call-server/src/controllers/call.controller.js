const Call = require('../models/Call');

// Get all calls
exports.getAllCalls = async (req, res) => {
  console.log('Fetching all calls');
  try {
    const calls = await Call.find()
      .populate('agent', 'name email')
      .populate('customer', 'name email phone')
      .sort({ startTime: -1 });

    console.log('Successfully fetched all calls');
    res.json({ calls });
  } catch (error) {
    console.error('Error fetching all calls:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get calls by agent
exports.getCallsByAgent = async (req, res) => {
  console.log(`Fetching calls for agent: ${req.agent._id}`);
  try {
    const calls = await Call.find({ agent: req.agent._id })
      .populate('customer', 'name email phone')
      .sort({ startTime: -1 });

    console.log(`Successfully fetched calls for agent: ${req.agent._id}`);
    res.json({ calls });
  } catch (error) {
    console.error(`Error fetching calls for agent ${req.agent._id}:`, error);
    res.status(500).json({ error: error.message });
  }
};

// Get call by ID
exports.getCallById = async (req, res) => {
  console.log(`Fetching call with ID: ${req.params.id}`);
  try {
    const call = await Call.findById(req.params.id)
      .populate('agent', 'name email')
      .populate('customer', 'name email phone');

    if (!call) {
      console.log(`Call not found with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Call not found' });
    }

    console.log(`Successfully fetched call with ID: ${req.params.id}`);
    res.json({ call });
  } catch (error) {
    console.error(`Error fetching call with ID ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
};

// Get call statistics
exports.getCallStats = async (req, res) => {
  console.log('Fetching call statistics');
  try {
    const totalCalls = await Call.countDocuments();
    const completedCalls = await Call.countDocuments({ status: 'completed' });
    const ongoingCalls = await Call.countDocuments({ status: 'ongoing' });

    const avgDuration = await Call.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
    ]);

    console.log('Successfully fetched call statistics');
    res.json({
      totalCalls,
      completedCalls,
      ongoingCalls,
      averageDuration: avgDuration[0]?.avgDuration || 0
    });
  } catch (error) {
    console.error('Error fetching call statistics:', error);
    res.status(500).json({ error: error.message });
  }
};