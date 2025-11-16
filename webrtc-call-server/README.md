# WebRTC Call Server - Backend

Complete backend for WebRTC-based calling system with automatic recording.

## 🚀 Features

- ✅ Agent & Customer registration/authentication
- ✅ Real-time WebRTC signaling via Socket.io
- ✅ Automatic call recording to local storage
- ✅ Call history and analytics
- ✅ Agent status management (online/offline/busy)
- ✅ MongoDB for data persistence
- ✅ RESTful API endpoints

---

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (running locally or remote connection)
- **FFmpeg** (optional, for advanced audio processing)

---

## 🛠️ Installation

### Step 1: Clone and Install Dependencies

```bash
# Create project directory
mkdir webrtc-call-server
cd webrtc-call-server

# Initialize npm (if not already done)
npm init -y

# Install dependencies
npm install express socket.io mongoose dotenv cors bcryptjs jsonwebtoken fluent-ffmpeg uuid

# Install dev dependencies
npm install --save-dev nodemon
```

### Step 2: Create Project Structure

```bash
mkdir -p src/config src/models src/routes src/controllers src/services src/middleware recordings
```

### Step 3: Environment Configuration

Create `.env` file in root directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/webrtc_call_db
JWT_SECRET=your_super_secret_jwt_key_change_in_production
RECORDING_PATH=./recordings
NODE_ENV=development
```

### Step 4: Start MongoDB

```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud) and update MONGODB_URI
```

---

## 🎯 Running the Server

### Development Mode (with auto-reload):

```bash
npm run dev
```

### Production Mode:

```bash
npm start
```

Server will start on `http://localhost:3000`

---

## 📡 API Endpoints

### **Agent APIs**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/agents/register` | Register new agent | No |
| POST | `/api/agents/login` | Agent login | No |
| GET | `/api/agents/profile` | Get agent profile | Yes |
| GET | `/api/agents/all` | Get all agents | Yes |

### **Customer APIs**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/customers/register` | Register customer | No |
| GET | `/api/customers/all` | Get all customers | Yes |
| GET | `/api/customers/:id` | Get customer by ID | Yes |

### **Call APIs**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/calls/all` | Get all calls | Yes |
| GET | `/api/calls/my-calls` | Get agent's calls | Yes |
| GET | `/api/calls/stats` | Get call statistics | Yes |
| GET | `/api/calls/:id` | Get specific call | Yes |
| GET | `/api/calls/:id/recording` | Download recording | Yes |

---

## 🔌 Socket.io Events

### **Connection Events**

#### Agent Connection:
```javascript
socket.emit('agent:join', { agentId: 'AGENT_ID' });
```

#### Customer Connection:
```javascript
socket.emit('customer:join', { customerId: 'CUSTOMER_ID' });
```

### **Call Flow Events**

#### 1. Initiate Call (Customer → Server):
```javascript
socket.emit('call:initiate', { 
  customerId: 'CUSTOMER_ID', 
  agentId: 'AGENT_ID' 
});
```

#### 2. Incoming Call (Server → Agent):
```javascript
socket.on('call:incoming', (data) => {
  console.log(data); // { callId, customer: {...} }
});
```

#### 3. Accept Call (Agent → Server):
```javascript
socket.emit('call:accept', { callId: 'CALL_ID' });
```

#### 4. WebRTC Signaling:
```javascript
// Send offer
socket.emit('webrtc:offer', { callId, offer });

// Receive offer
socket.on('webrtc:offer', (data) => { ... });

// Send answer
socket.emit('webrtc:answer', { callId, answer });

// Receive answer
socket.on('webrtc:answer', (data) => { ... });

// ICE candidates
socket.emit('webrtc:ice-candidate', { callId, candidate });
socket.on('webrtc:ice-candidate', (data) => { ... });
```

#### 5. End Call:
```javascript
socket.emit('call:end', { callId: 'CALL_ID' });
socket.on('call:ended', (data) => { ... });
```

### **Recording Events**

#### Upload Complete Recording:
```javascript
socket.emit('recording:complete', {
  callId: 'CALL_ID',
  audioBlob: base64String, // or buffer
  format: 'webm' // or 'mp3', 'wav'
});
```

---

## 🧪 Testing with Postman/cURL

### 1. Register Agent:

```bash
curl -X POST http://localhost:3000/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Agent",
    "email": "agent@example.com",
    "password": "password123"
  }'
```

### 2. Login Agent:

```bash
curl -X POST http://localhost:3000/api/agents/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@example.com",
    "password": "password123"
  }'
```

Copy the `token` from response.

### 3. Get Agent Profile:

```bash
curl -X GET http://localhost:3000/api/agents/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Register Customer:

```bash
curl -X POST http://localhost:3000/api/customers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Customer",
    "email": "customer@example.com",
    "phone": "+1234567890"
  }'
```

---

## 🎬 Complete Call Flow

1. **Agent logs in** → Receives JWT token
2. **Agent connects to socket** → Sends `agent:join` event
3. **Customer registers** → Gets customer ID
4. **Customer connects to socket** → Sends `customer:join` event
5. **Customer initiates call** → Sends `call:initiate` with agent ID
6. **Agent receives notification** → Gets `call:incoming` event
7. **Agent accepts call** → Sends `call:accept`
8. **WebRTC negotiation** → Exchange offer/answer/ICE candidates
9. **Call starts** → Audio streaming begins
10. **Recording starts** → Client-side recording captures audio
11. **Call ends** → Either party sends `call:end`
12. **Recording uploads** → Client sends `recording:complete`
13. **Recording saved** → Stored in `/recordings` directory

---

## 📁 Project Structure

```
webrtc-call-server/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── Agent.js             # Agent schema
│   │   ├── Customer.js          # Customer schema
│   │   └── Call.js              # Call schema
│   ├── routes/
│   │   ├── agent.routes.js      # Agent endpoints
│   │   ├── customer.routes.js   # Customer endpoints
│   │   └── call.routes.js       # Call endpoints
│   ├── controllers/
│   │   ├── agent.controller.js
│   │   ├── customer.controller.js
│   │   └── call.controller.js
│   ├── services/
│   │   ├── signaling.service.js # WebRTC signaling
│   │   └── recording.service.js # Recording management
│   ├── middleware/
│   │   └── auth.middleware.js   # JWT authentication
│   └── server.js                # Main entry point
├── recordings/                   # Audio recordings storage
├── package.json
├── .env
└── README.md
```

---

## 🔒 Security Notes

⚠️ **For Production:**

1. Change `JWT_SECRET` to a strong random string
2. Use HTTPS for all connections
3. Implement rate limiting
4. Add input validation
5. Use environment-specific CORS origins
6. Enable MongoDB authentication
7. Implement proper file upload validation
8. Add request size limits

---

## 🐛 Troubleshooting

### MongoDB Connection Error:
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

### Port Already in Use:
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 PID
```

### Socket.io Connection Issues:
- Check CORS configuration in `server.js`
- Ensure client is using correct server URL
- Verify firewall settings

---

## 📊 Database Schema

### Agents Collection:
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  status: 'online' | 'offline' | 'busy',
  socketId: String,
  createdAt: Date
}
```

### Customers Collection:
```javascript
{
  name: String,
  email: String,
  phone: String,
  socketId: String,
  createdAt: Date
}
```

### Calls Collection:
```javascript
{
  agent: ObjectId (ref: Agent),
  customer: ObjectId (ref: Customer),
  startTime: Date,
  endTime: Date,
  duration: Number (seconds),
  recordingUrl: String,
  status: 'initiated' | 'ongoing' | 'completed' | 'failed',
  callId: String (UUID)
}
```

---

## 📝 Next Steps

After backend is running:

1. **Build frontend client** (React/Vue/HTML)
2. **Implement WebRTC peer connection**
3. **Add MediaRecorder for audio capture**
4. **Test with 2 browser windows**
5. **Deploy to production server**

---

## 🤝 Support

If you encounter any issues, check:
- Server logs for errors
- MongoDB logs
- Browser console for client-side errors
- Network tab for failed requests

---

## 📄 License

MIT License - Feel free to use this in your projects!