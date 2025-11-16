require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');
const SignalingService = require('./services/signaling.service');
const RecordingService = require('./services/recording.service');

// Import routes
const agentRoutes = require('./routes/agent.routes');
const customerRoutes = require('./routes/customer.routes');
const callRoutes = require('./routes/call.routes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS and configuration
const io = socketIo(server, {
  cors: {
    origin: '*', // In production, specify your frontend URL
    methods: ['GET', 'POST'],
    credentials: true
  },
  maxHttpBufferSize: 50e6, // 50MB - Important for large audio files
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
  origin: '*',  // In production, specify allowed origins
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware (optional but useful)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Connect to MongoDB
connectDB();

// Initialize services AFTER MongoDB connection
const signalingService = new SignalingService(io);
const recordingService = new RecordingService();

// Setup socket handlers
recordingService.setupRecordingSocket(io);
signalingService.initialize();

// API Routes
app.use('/api/agents', agentRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/calls', callRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'WebRTC Call Server is running',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'WebRTC Call Server API',
    version: '1.0.0',
    endpoints: {
      agents: '/api/agents',
      customers: '/api/customers',
      calls: '/api/calls',
      health: '/health'
    }
  });
});

// Socket.io connection monitoring
io.on('connection', (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);
  
  socket.on('disconnect', (reason) => {
    console.log(`❌ Socket disconnected: ${socket.id} - Reason: ${reason}`);
  });

  socket.on('error', (error) => {
    console.error(`⚠️ Socket error: ${socket.id}`, error);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(err.status || 500).json({ 
    error: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   WebRTC Call Server Running! 🚀      ║
║   Port: ${PORT.toString().padEnd(30)}║
║   Host: ${HOST.padEnd(30)}║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(23)}║
║   Socket.IO: Active                   ║
║   MongoDB: Connected                  ║
╚═══════════════════════════════════════╝

📍 Access the server at:
   - Local: http://localhost:${PORT}
   - Network: http://${HOST}:${PORT}

🔗 Available Endpoints:
   - Health: http://localhost:${PORT}/health
   - Agents: http://localhost:${PORT}/api/agents
   - Customers: http://localhost:${PORT}/api/customers
   - Calls: http://localhost:${PORT}/api/calls
  `);
});

module.exports = { app, server, io };