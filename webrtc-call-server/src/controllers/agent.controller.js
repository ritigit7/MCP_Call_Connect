const Agent = require('../models/Agent');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register new agent
exports.register = async (req, res) => {
  console.log('Registering new agent...');
  try {
    const { name, email, password } = req.body;
    console.log('Request body:', req.body);

    // Check if agent exists
    const existingAgent = await Agent.findOne({ email });
    if (existingAgent) {
      console.log('Agent already exists:', email);
      return res.status(400).json({ error: 'Agent already exists' });
    }

    // Create agent
    const agent = new Agent({ name, email, password });
    await agent.save();
    console.log('Agent created successfully:', agent._id);

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
    console.log('Agent registered successfully:', agent.email);
  } catch (error) {
    console.error('Error in agent registration:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Login agent
exports.login = async (req, res) => {
  try {
    console.log('Agent login attempt...');
    const { email, password } = req.body;
    console.log('Login credentials:', { email });

    const agent = await Agent.findOne({ email });
    if (!agent) {
      console.log('Invalid credentials - agent not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await agent.comparePassword(password);
    if (!isMatch) {
      console.log('Invalid credentials - password mismatch for agent:', email);
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
    console.log('Agent logged in successfully:', agent.email);
  } catch (error) {
    console.error('Error in agent login:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get agent profile
exports.getProfile = async (req, res) => {
  try {
    console.log('Fetching profile for agent:', req.agent._id);
    res.json({
      agent: {
        id: req.agent._id,
        name: req.agent.name,
        email: req.agent.email,
        status: req.agent.status
      }
    });
    console.log('Agent profile fetched successfully for:', req.agent.email);
  } catch (error) {
    console.error('Error fetching agent profile:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get all agents
exports.getAllAgents = async (req, res) => {
  try {
    console.log('Fetching all agents...');
    const agents = await Agent.find().select('-password');
    res.json({ agents });
    console.log('All agents fetched successfully.');
  } catch (error) {
    console.error('Error fetching all agents:', error.message);
    res.status(500).json({ error: error.message });
  }
};