# 🎨 WebRTC Call Center - Frontend Guide

## 📁 Setup

### Step 1: Save the Frontend File

Save the HTML file as `index.html` in your project directory (or anywhere you like).

```
your-project/
├── backend/
│   └── (all backend files)
└── frontend/
    └── index.html  ← Save here
```

### Step 2: Update Server URL (if needed)

Open `index.html` and find this line:

```javascript
const SERVER_URL = 'http://localhost:3000';
```

Change it to your backend URL if different.

---

## 🚀 Running the Frontend

### Option 1: Open Directly in Browser

```bash
# Just double-click the index.html file
# Or open it with your browser
```

### Option 2: Use a Local Server (Recommended)

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js (http-server)
npx http-server -p 8080

# Using VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Then open: `http://localhost:8080`

---

## 📖 How to Use

### 🎯 Test Scenario 1: Agent Receives Call

**Window 1 - Agent:**

1. Open the frontend in Browser Window 1
2. Click **"Agent"** tab
3. Fill in registration details:
   - Name: `John Agent`
   - Email: `john@agent.com`
   - Password: `password123`
4. Click **"Register"**
5. ✅ You're now logged in and online!

**Window 2 - Customer:**

1. Open the **same URL** in Browser Window 2 (or Incognito mode)
2. Click **"Customer"** tab
3. Fill in customer details:
   - Name: `Jane Customer`
   - Email: `jane@customer.com`
   - Phone: `+1234567890`
4. Click **"Register & Connect"**
5. Select the agent from dropdown
6. Click **"Call Agent"**

**Back to Window 1 - Agent:**

7. 🔔 You'll see an incoming call notification
8. Click **"Accept Call"**
9. 🎙️ Call starts! Audio streaming begins
10. Recording automatically starts
11. Click **"End Call"** when done

---

### 🎯 Test Scenario 2: View Call History

1. Login as Agent (if not already)
2. Click **"Call History"** tab
3. Click **"Refresh"** button
4. View:
   - Total calls
   - Completed calls
   - Average duration
   - List of all calls
5. Click **"Download"** on any call with recording

---

## ✨ Features Demonstration

### 1. **Agent Features**
- ✅ Register/Login
- ✅ View profile
- ✅ Online status indicator
- ✅ Receive incoming calls
- ✅ Accept/Reject calls
- ✅ Mute/Unmute microphone
- ✅ End call
- ✅ Real-time event logs

### 2. **Customer Features**
- ✅ Quick registration
- ✅ View available agents
- ✅ Initiate calls
- ✅ Mute/Unmute microphone
- ✅ End call
- ✅ Real-time event logs

### 3. **Call History**
- ✅ Total call statistics
- ✅ Call duration tracking
- ✅ Download recordings
- ✅ View agent/customer details

---

## 🧪 Testing Checklist

### Basic Flow Test:
- [ ] Agent can register
- [ ] Agent can login
- [ ] Customer can register
- [ ] Customer can see available agents
- [ ] Customer can initiate call
- [ ] Agent receives call notification
- [ ] Agent can accept call
- [ ] Audio streams between both parties
- [ ] Recording indicator shows
- [ ] Mute/unmute works
- [ ] Either party can end call
- [ ] Recording is saved on server

### Advanced Tests:
- [ ] Agent logout and re-login
- [ ] Multiple customers (open 3+ windows)
- [ ] Call rejection (future feature)
- [ ] Network disconnect handling
- [ ] Browser permission handling
- [ ] Recording download works
- [ ] Call statistics update correctly

---

## 🎤 Microphone Permissions

When you start a call, your browser will ask for microphone permission:

**Chrome/Edge:**
```
"http://localhost:8080 wants to use your microphone"
[Block] [Allow]
```

**Firefox:**
```
"Share your microphone with http://localhost:8080?"
[Don't Allow] [Allow]
```

⚠️ **Important:** You MUST click **"Allow"** for the call to work!

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to server"

**Solution:**
1. Check if backend is running:
   ```bash
   curl http://localhost:3000/health
   ```
2. Check `SERVER_URL` in frontend code
3. Check browser console for errors (F12)

---

### Problem: "No audio in call"

**Solution:**
1. Check microphone permissions
2. Try different browser (Chrome works best)
3. Check browser console for WebRTC errors
4. Make sure you're using HTTPS (or localhost)

---

### Problem: "Agent not showing in dropdown"

**Solution:**
1. Make sure agent is logged in
2. Click "Refresh" or reload customer page
3. Check if agent status is "online"
4. Check browser console for API errors

---

### Problem: "Recording not saved"

**Solution:**
1. Check if `recordings/` folder exists on server
2. Check server logs for errors
3. Make sure call was ended properly
4. Check file permissions on server

---

### Problem: "CORS errors in console"

**Solution:**
Add to backend `server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:8080', // Your frontend URL
  credentials: true
}));
```

---

## 📱 Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Full | Best experience |
| Edge 90+ | ✅ Full | Chromium-based |
| Firefox 88+ | ✅ Full | Works well |
| Safari 14+ | ⚠️ Partial | May have issues |
| Opera 76+ | ✅ Full | Chromium-based |
| Mobile Chrome | ⚠️ Limited | Desktop recommended |

---

## 🎨 Customization

### Change Colors:

Find these lines in the CSS section:

```css
/* Primary color (purple) */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Change to blue */
background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);

/* Change to green */
background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
```

### Change Server URL:

```javascript
const SERVER_URL = 'https://your-production-server.com';
```

### Add Your Logo:

```html
<div class="header">
  <img src="your-logo.png" alt="Logo" style="height: 40px;">
  <h1>📞 Your Company Call Center</h1>
</div>
```

---

## 📊 Understanding the UI

### Connection Status Badge:
- 🟢 **Green (Connected)**: Socket.io connected to server
- 🔴 **Red (Disconnected)**: No connection to server

### Agent Status Badge:
- 🟢 **Online**: Ready to receive calls
- 🔴 **Offline**: Not available
- 🟡 **Busy**: Currently on a call

### Call Recording Indicator:
- 🔴 **Pulsing red dot**: Recording in progress
- ⚪ **No indicator**: No active recording

---

## 🔐 Security Notes for Production

Before deploying to production:

1. **Use HTTPS**: WebRTC requires HTTPS in production
2. **Add Authentication**: Protect API endpoints
3. **Rate Limiting**: Prevent abuse
4. **Input Validation**: Sanitize all inputs
5. **CORS Configuration**: Restrict to your domain
6. **Content Security Policy**: Add CSP headers

---

## 📹 Screen Recording for Demo

To record a demo:

1. Use OBS Studio or similar
2. Record both browser windows side by side
3. Show the complete flow:
   - Agent registration
   - Customer registration
   - Call initiation
   - Call acceptance
   - Active call with audio
   - Call termination
   - Recording download

---

## 🚀 Next Steps

After testing the basic frontend:

1. **Add Features:**
   - Call queue system
   - Agent availability schedule
   - Customer call history
   - Call ratings/feedback
   - Screen sharing
   - Video calls
   - Chat during calls

2. **Improve UI:**
   - Add animations
   - Better mobile responsiveness
   - Dark mode toggle
   - Agent profile pictures
   - Call quality indicators

3. **Production Ready:**
   - Convert to React/Vue app
   - Add proper state management
   - Implement error boundaries
   - Add loading states
   - Add offline detection
   - Implement reconnection logic

---

## 📞 Quick Test Commands

Open browser console (F12) and try:

```javascript
// Check socket connection
socket.connected

// Get current user info
currentUser

// Get current call ID
currentCallId

// Check peer connection state
peerConnection?.connectionState

// Check local stream
localStream?.active
```

---

## 🎓 Learning Resources

- [WebRTC Basics](https://webrtc.org/getting-started/overview)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [RTCPeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)

---

## ✅ Success Criteria

Your setup is working correctly if:

1. ✅ Agent can register and login
2. ✅ Customer can register
3. ✅ Customer sees available agents
4. ✅ Call can be initiated
5. ✅ Call can be accepted
6. ✅ Audio flows both ways
7. ✅ Recording starts automatically
8. ✅ Call can be ended
9. ✅ Recording appears in history
10. ✅ Recording can be downloaded

---

## 🆘 Get Help

If you're stuck:

1. Check browser console (F12) for errors
2. Check backend logs (`pm2 logs` or terminal)
3. Check MongoDB is running
4. Verify all dependencies installed
5. Try a different browser
6. Clear browser cache
7. Restart backend server

---

**You're all set! Open two browser windows and start testing! 🎉**