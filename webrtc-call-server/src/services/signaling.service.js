const Agent = require('../models/Agent');
const Customer = require('../models/Customer');
const Call = require('../models/Call');
const { v4: uuidv4 } = require('uuid');

class SignalingService {
  constructor(io) {
    this.io = io;
    this.activeCalls = new Map(); // callId -> { agentSocket, customerSocket, callDoc }
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log(`✅ Client connected: ${socket.id}`);

      // Agent joins
      socket.on('agent:join', async (data) => {
        try {
          const { agentId } = data;
          await Agent.findByIdAndUpdate(agentId, {
            socketId: socket.id,
            status: 'online'
          });
          socket.agentId = agentId;
          console.log(`🟢 Agent ${agentId} joined`);
          socket.emit('agent:joined', { success: true });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Agent leaves (explicit logout)
      socket.on('agent:leave', async (data) => {
        try {
          const { agentId } = data;
          await Agent.findByIdAndUpdate(agentId, {
            socketId: null,
            status: 'offline'
          });
          socket.agentId = null;
          console.log(`🔴 Agent ${agentId} logged out`);
          socket.emit('agent:left', { success: true });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Customer joins
      socket.on('customer:join', async (data) => {
        try {
          const { customerId } = data;
          await Customer.findByIdAndUpdate(customerId, { socketId: socket.id });
          socket.customerId = customerId;
          console.log(`🟢 Customer ${customerId} joined`);
          socket.emit('customer:joined', { success: true });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Initiate call (from customer to agent)
      socket.on('call:initiate', async (data) => {
        try {
          const { customerId, agentId } = data;
          console.log(`📞 Call initiate request - customerId: ${customerId}, agentId: ${agentId}`);

          const agent = await Agent.findById(agentId);
          const customer = await Customer.findById(customerId);

          if (!agent) {
            console.log(`❌ Agent not found with ID: ${agentId}`);
            return socket.emit('error', { message: `Agent not found with ID: ${agentId}` });
          }
          if (!customer) {
            console.log(`❌ Customer not found with ID: ${customerId}`);
            return socket.emit('error', { message: `Customer not found with ID: ${customerId}` });
          }

          console.log(`✅ Found agent: ${agent.name} (status: ${agent.status}, socketId: ${agent.socketId})`);
          console.log(`✅ Found customer: ${customer.name}`);

          if (agent.status !== 'online') {
            return socket.emit('error', { message: 'Agent is not available' });
          }

          // Create call record
          const callId = uuidv4();
          const call = new Call({
            agent: agentId,
            customer: customerId,
            callId,
            status: 'initiated'
          });
          await call.save();

          // Store in active calls
          this.activeCalls.set(callId, {
            agentSocketId: agent.socketId,
            customerSocketId: socket.id,
            callDoc: call
          });

          // Update agent status
          await Agent.findByIdAndUpdate(agentId, { status: 'busy' });

          // Notify agent about incoming call
          console.log(`📤 Sending call:incoming to agent socketId: ${agent.socketId}`);
          this.io.to(agent.socketId).emit('call:incoming', {
            callId,
            customer: {
              id: customer._id,
              name: customer.name,
              email: customer.email
            }
          });

          socket.emit('call:initiated', { callId });
          console.log(`📞 Call initiated: ${callId}`);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Agent accepts call
      socket.on('call:accept', async (data) => {
        try {
          const { callId } = data;
          const callData = this.activeCalls.get(callId);

          if (!callData) {
            return socket.emit('error', { message: 'Call not found' });
          }

          // Update call status
          await Call.findOneAndUpdate(
            { callId },
            { status: 'ongoing', startTime: new Date() }
          );

          // Notify customer that call was accepted
          this.io.to(callData.customerSocketId).emit('call:accepted', { callId });
          console.log(`✅ Call accepted: ${callId}`);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // WebRTC signaling - offer
      socket.on('webrtc:offer', (data) => {
        const { callId, offer } = data;
        const callData = this.activeCalls.get(callId);

        if (callData) {
          const targetSocket = socket.id === callData.agentSocketId
            ? callData.customerSocketId
            : callData.agentSocketId;

          this.io.to(targetSocket).emit('webrtc:offer', { callId, offer });
        }
      });

      // WebRTC signaling - answer
      socket.on('webrtc:answer', (data) => {
        const { callId, answer } = data;
        const callData = this.activeCalls.get(callId);

        if (callData) {
          const targetSocket = socket.id === callData.agentSocketId
            ? callData.customerSocketId
            : callData.agentSocketId;

          this.io.to(targetSocket).emit('webrtc:answer', { callId, answer });
        }
      });

      // WebRTC signaling - ICE candidate
      socket.on('webrtc:ice-candidate', (data) => {
        const { callId, candidate } = data;
        const callData = this.activeCalls.get(callId);

        if (callData) {
          const targetSocket = socket.id === callData.agentSocketId
            ? callData.customerSocketId
            : callData.agentSocketId;

          this.io.to(targetSocket).emit('webrtc:ice-candidate', { callId, candidate });
        }
      });

      // End call
      socket.on('call:end', async (data) => {
        try {
          const { callId } = data;
          await this.endCall(callId);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Disconnect
      socket.on('disconnect', async () => {
        console.log(`❌ Client disconnected: ${socket.id}`);

        // Update agent status
        if (socket.agentId) {
          await Agent.findByIdAndUpdate(socket.agentId, {
            status: 'offline',
            socketId: null
          });
        }

        // Update customer
        if (socket.customerId) {
          await Customer.findByIdAndUpdate(socket.customerId, { socketId: null });
        }

        // End any active calls
        for (const [callId, callData] of this.activeCalls.entries()) {
          if (callData.agentSocketId === socket.id || callData.customerSocketId === socket.id) {
            await this.endCall(callId);
          }
        }
      });
    });
  }

  async endCall(callId) {
    const callData = this.activeCalls.get(callId);
    if (!callData) return;

    // First, get the call to retrieve startTime
    const existingCall = await Call.findOne({ callId });
    if (!existingCall) {
      console.log(`❌ Call not found: ${callId}`);
      return;
    }

    // Calculate duration in seconds
    const endTime = new Date();
    const duration = Math.floor((endTime - existingCall.startTime) / 1000);

    // Update call record with endTime, status, and calculated duration
    const call = await Call.findOneAndUpdate(
      { callId },
      {
        endTime,
        status: 'completed',
        duration
      },
      { new: true }
    );

    console.log(`📊 Call duration calculated: ${duration}s for callId: ${callId}`);

    // Notify both parties
    this.io.to(callData.agentSocketId).emit('call:ended', { callId });
    this.io.to(callData.customerSocketId).emit('call:ended', { callId });

    // Update agent status back to online
    if (call) {
      await Agent.findByIdAndUpdate(call.agent, { status: 'online' });
    }

    // Remove from active calls
    this.activeCalls.delete(callId);
    console.log(`📴 Call ended: ${callId}`);
  }
}

module.exports = SignalingService;