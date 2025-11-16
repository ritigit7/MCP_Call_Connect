const Agent = require('../models/Agent');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register new agent
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if agent exists
    const existingAgent = await Agent.findOne({ email });
    if (existingAgent) {
      return res.status(400).json({ error: 'Agent already exists' });
    }

    // Create agent
    const agent = new Agent({ name, email, password });
    await agent.save();

    const token = generateToken(agent._id);

    res.status(201).json({
      message: 'Agent registered successfully',
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        status: agent.status
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login agent
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const agent = await Agent.findOne({ email });
    if (!agent) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await agent.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(agent._id);

    res.json({
      message: 'Login successful',
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        status: agent.status
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get agent profile
exports.getProfile = async (req, res) => {
  try {
    res.json({
      agent: {
        id: req.agent._id,
        name: req.agent.name,
        email: req.agent.email,
        status: req.agent.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all agents
exports.getAllAgents = async (req, res) => {
  try {
    const agents = await Agent.find().select('-password');
    res.json({ agents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};