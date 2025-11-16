# 📡 API Integration Examples

Examples of how to integrate with the WebRTC Call Server API from different platforms.

---

## JavaScript (Browser/Node.js)

### Setup

```bash
npm install axios socket.io-client
```

### API Client

```javascript
const axios = require('axios');
const io = require('socket.io-client');

class CallClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.token = null;
    this.socket = null;
  }

  // Register Agent
  async registerAgent(name, email, password) {
    const response = await axios.post(`${this.baseURL}/api/agents/register`, {
      name, email, password
    });
    this.token = response.data.token;
    return response.data;
  }

  // Login Agent
  async loginAgent(email, password) {
    const response = await axios.post(`${this.baseURL}/api/agents/login`, {
      email, password
    });
    this.token = response.data.token;
    return response.data;
  }

  // Get Profile
  async getProfile() {
    return axios.get(`${this.baseURL}/api/agents/profile`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }

  // Register Customer
  async registerCustomer(name, email, phone) {
    return axios.post(`${this.baseURL}/api/customers/register`, {
      name, email, phone
    });
  }

  // Connect Socket
  connectSocket() {
    this.socket = io(this.baseURL);
    
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('call:incoming', (data) => {
      console.log('Incoming call:', data);
    });

    return this.socket;
  }

  // Join as Agent
  joinAsAgent(agentId) {
    this.socket.emit('agent:join', { agentId });
  }

  // Initiate Call
  initiateCall(customerId, agentId) {
    this.socket.emit('call:initiate', { customerId, agentId });
  }
}

// Usage
const client = new CallClient();
await client.loginAgent('agent@example.com', 'password123');
client.connectSocket();
client.joinAsAgent('AGENT_ID');
```

---

## React Frontend

### Installation

```bash
npm install axios socket.io-client
```

### React Hook for Calls

```javascript
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

export const useWebRTCCall = (serverURL) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const peerConnection = useRef(null);

  useEffect(() => {
    const newSocket = io(serverURL);
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('call:incoming', (data) => {
      setIncomingCall(data);
    });

    newSocket.on('call:accepted', (data) => {
      setCurrentCall(data.callId);
    });

    newSocket.on('webrtc:offer', async (data) => {
      await handleOffer(data.offer);
    });

    newSocket.on('webrtc:answer', async (data) => {
      await handleAnswer(data.answer);
    });

    newSocket.on('webrtc:ice-candidate', async (data) => {
      await handleIceCandidate(data.candidate);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [serverURL]);

  const joinAsAgent = (agentId) => {
    socket?.emit('agent:join', { agentId });
  };

  const initiateCall = (customerId, agentId) => {
    socket?.emit('call:initiate', { customerId, agentId });
  };

  const acceptCall = (callId) => {
    socket?.emit('call:accept', { callId });
    setCurrentCall(callId);
  };

  const endCall = (callId) => {
    socket?.emit('call:end', { callId });
    setCurrentCall(null);
    peerConnection.current?.close();
  };

  const handleOffer = async (offer) => {
    // WebRTC logic here
  };

  const handleAnswer = async (answer) => {
    // WebRTC logic here
  };

  const handleIceCandidate = async (candidate) => {
    // WebRTC logic here
  };

  return {
    socket,
    isConnected,
    incomingCall,
    currentCall,
    joinAsAgent,
    initiateCall,
    acceptCall,
    endCall
  };
};
```

---

## Python Client

### Installation

```bash
pip install requests python-socketio
```

### Python API Client

```python
import requests
import socketio

class CallClient:
    def __init__(self, base_url='http://localhost:3000'):
        self.base_url = base_url
        self.token = None
        self.sio = socketio.Client()
        self._setup_socket_handlers()
    
    def _setup_socket_handlers(self):
        @self.sio.on('connect')
        def on_connect():
            print('Connected to server')
        
        @self.sio.on('call:incoming')
        def on_incoming_call(data):
            print(f'Incoming call: {data}')
        
        @self.sio.on('call:accepted')
        def on_call_accepted(data):
            print(f'Call accepted: {data}')
    
    def register_agent(self, name, email, password):
        response = requests.post(
            f'{self.base_url}/api/agents/register',
            json={'name': name, 'email': email, 'password': password}
        )
        data = response.json()
        self.token = data.get('token')
        return data
    
    def login_agent(self, email, password):
        response = requests.post(
            f'{self.base_url}/api/agents/login',
            json={'email': email, 'password': password}
        )
        data = response.json()
        self.token = data.get('token')
        return data
    
    def get_profile(self):
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.get(
            f'{self.base_url}/api/agents/profile',
            headers=headers
        )
        return response.json()
    
    def connect_socket(self):
        self.sio.connect(self.base_url)
    
    def join_as_agent(self, agent_id):
        self.sio.emit('agent:join', {'agentId': agent_id})
    
    def initiate_call(self, customer_id, agent_id):
        self.sio.emit('call:initiate', {
            'customerId': customer_id,
            'agentId': agent_id
        })
    
    def disconnect(self):
        self.sio.disconnect()

# Usage
client = CallClient()
client.login_agent('agent@example.com', 'password123')
client.connect_socket()
client.join_as_agent('AGENT_ID')
```

---

## cURL Examples

### Register Agent

```bash
curl -X POST http://localhost:3000/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

### Login Agent

```bash
curl -X POST http://localhost:3000/api/agents/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

### Get Profile (with token)

```bash
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:3000/api/agents/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Register Customer

```bash
curl -X POST http://localhost:3000/api/customers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Customer",
    "email": "jane@example.com",
    "phone": "+1234567890"
  }'
```

### Get All Calls

```bash
curl -X GET http://localhost:3000/api/calls/all \
  -H "Authorization: Bearer $TOKEN"
```

### Download Recording

```bash
curl -X GET http://localhost:3000/api/calls/CALL_ID/recording \
  -H "Authorization: Bearer $TOKEN" \
  -o recording.webm
```

---

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "WebRTC Call Server API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register Agent",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Test Agent\",\n  \"email\": \"agent@test.com\",\n  \"password\": \"password123\"\n}"
        },
        "url": "{{baseUrl}}/api/agents/register"
      }
    },
    {
      "name": "Login Agent",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"agent@test.com\",\n  \"password\": \"password123\"\n}"
        },
        "url": "{{baseUrl}}/api/agents/login"
      }
    },
    {
      "name": "Get Profile",
      "request": {
        "method": "GET",
        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
        "url": "{{baseUrl}}/api/agents/profile"
      }
    }
  ],
  "variable": [
    {"key": "baseUrl", "value": "http://localhost:3000"},
    {"key": "token", "value": ""}
  ]
}
```

---

## Complete WebRTC Implementation (Browser)

```javascript
class WebRTCCallManager {
  constructor(socket, callId) {
    this.socket = socket;
    this.callId = callId;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = new MediaStream();
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }

  async initialize() {
    // Get local audio stream
    this.localStream = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: false 
    });

    // Create peer connection
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local stream to peer connection
    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('webrtc:ice-candidate', {
          callId: this.callId,
          candidate: event.candidate
        });
      }
    };

    // Start recording
    this.startRecording();
  }

  async createOffer() {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    this.socket.emit('webrtc:offer', {
      callId: this.callId,
      offer: offer
    });
  }

  async handleOffer(offer) {
    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    this.socket.emit('webrtc:answer', {
      callId: this.callId,
      answer: answer
    });
  }

  async handleAnswer(answer) {
    await this.peerConnection.setRemoteDescription(answer);
  }

  async handleIceCandidate(candidate) {
    await this.peerConnection.addIceCandidate(candidate);
  }

  startRecording() {
    // Combine local and remote streams for recording
    const mixedStream = new MediaStream([
      ...this.localStream.getTracks(),
      ...this.remoteStream.getTracks()
    ]);

    this.mediaRecorder = new MediaRecorder(mixedStream, {
      mimeType: 'audio/webm'
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(1000); // Record in 1-second chunks
  }

  async stopRecording() {
    return new Promise((resolve) => {
      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        
        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];
          
          // Upload to server
          this.socket.emit('recording:complete', {
            callId: this.callId,
            audioBlob: base64data,
            format: 'webm'
          });

          resolve(blob);
        };
      };

      this.mediaRecorder.stop();
    });
  }

  async endCall() {
    await this.stopRecording();
    
    this.localStream.getTracks().forEach(track => track.stop());
    this.peerConnection?.close();
    
    this.socket.emit('call:end', { callId: this.callId });
  }
}

// Usage
const callManager = new WebRTCCallManager(socket, callId);
await callManager.initialize();
await callManager.createOffer();
```

---

## Testing Workflow

### 1. Open Two Browser Windows

**Window 1 - Agent:**
```javascript
const socket = io('http://localhost:3000');
const agentId = 'AGENT_ID_FROM_REGISTRATION';

socket.emit('agent:join', { agentId });

socket.on('call:incoming', async (data) => {
  console.log('Incoming call from:', data.customer.name);
  socket.emit('call:accept', { callId: data.callId });
  
  const callManager = new WebRTCCallManager(socket, data.callId);
  await callManager.initialize();
});
```

**Window 2 - Customer:**
```javascript
const socket = io('http://localhost:3000');
const customerId = 'CUSTOMER_ID_FROM_REGISTRATION';
const agentId = 'AGENT_ID';

socket.emit('customer:join', { customerId });
socket.emit('call:initiate', { customerId, agentId });

socket.on('call:accepted', async (data) => {
  console.log('Call accepted!');
  const callManager = new WebRTCCallManager(socket, data.callId);
  await callManager.initialize();
  await callManager.createOffer();
});
```

---

## Error Handling Best Practices

```javascript
const callWithRetry = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Usage
await callWithRetry(() => client.loginAgent(email, password));
```

---

Happy coding! 🚀