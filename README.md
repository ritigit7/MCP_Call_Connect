# 📞 MCP Call Connect

A comprehensive WebRTC-based call center solution featuring real-time audio calls, intelligent transcription, and a modern agent dashboard. This project integrates a robust Node.js backend, a high-performance Next.js frontend, and a Python-based AI transcription service.

---

## 🚀 Key Features

- **Real-time WebRTC Calls**: Low-latency audio communication between agents and customers.
- **AI Transcription & Diarization**: Automated transcription of calls with speaker separation (Agent vs. Customer) using OpenAI's Whisper and Pyannote.
- **Live Call Status**: Real-time status updates (Online, Busy, Offline) for agents.
- **Call Recording**: Automatic server-side recording of all calls (WebM format).
- **Secure Authentication**: JWT-based authentication for agents.
- **Modern Dashboard**: Responsive and accessible UI built with Next.js 16 and Radix UI.
- **Call History**: Detailed logs with downloadable recordings and transcripts.

---

## 🏗️ System Architecture

The system consists of three main components:

1.  **Frontend (`frontend/my-app`)**: A Next.js 16 application acting as the user interface for agents and customers. It uses Socket.IO for signaling and WebRTC for media streaming.
2.  **Backend (`webrtc-call-server`)**: A Node.js/Express server that manages signaling (Socket.IO), user authentication (MongoDB), and handles call recordings.
3.  **Transcriber Service (`transcriber`)**: A Python FastAPI service dedicated to processing audio files, generating transcripts, and identifying speakers.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 16 (App Router)
- **Library**: React 19
- **Styling**: Tailwind CSS v4
- **Components**: Radix UI (Headless accessible components)
- **Icons**: Lucide React
- **Real-time**: Socket.IO Client

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.IO
- **Processing**: Fluent-ffmpeg
- **AI Integration**: OpenAI SDK

### **AI Service**
- **Framework**: FastAPI (Python)
- **Models**: Whisper (Transcription), Pyannote (Diarization)
- **Server**: Uvicorn

---

## 📋 Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js** (v18+ recommended)
- **Python** (v3.10+ recommended)
- **MongoDB** (Running locally or a cloud URI)
- **FFmpeg** (Required for audio processing)

---

## ⚙️ Installation & Setup

Clone the repository and follow these steps for each service.

### 1. Backend Setup (`webrtc-call-server`)

```bash
cd webrtc-call-server
npm install
```

Create a `.env` file in `webrtc-call-server` (see `.env.example` if available) and configure:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/call-connect
JWT_SECRET=your_super_secret_key
OPENAI_API_KEY=your_openai_key  # Optional if using OpenAI features
```

### 2. Transcriber Service Setup (`transcriber`)

```bash
cd transcriber
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `transcriber`:
```env
HF_TOKEN=your_huggingface_token  # Required for Pyannote speaker diarization
WHISPER_MODEL=base               # Model size: tiny, base, small, medium, large
FASTAPI_PORT=8000
```
*Note: You may need to accept the user agreement for `pyannote/speaker-diarization` on Hugging Face to get a token.*

### 3. Frontend Setup (`frontend/my-app`)

```bash
cd frontend/my-app
npm install
```

---

## 🏃 Running the Application

You need to run all three services concurrently (in separate terminal windows).

**Terminal 1: Backend**
```bash
cd webrtc-call-server
npm start
# Server will run on http://localhost:3000
```

**Terminal 2: Transcriber**
```bash
cd transcriber
source venv/bin/activate
uvicorn transcriber_api:app --reload --port 8000
# API will be available at http://localhost:8000
```

**Terminal 3: Frontend**
```bash
cd frontend/my-app
npm run dev
# App will run on http://localhost:3000 (Next.js default)
```

> **Note**: Both Backend and Frontend might try to use port 3000. If so, Next.js typically auto-selects 3001. Check the terminal output to confirm the URL.

---

## 📖 API Documentation

The backend exposes a REST API for user management and call data, parallel to the Socket.IO event system.

### **Core Endpoints**

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/agents/register` | Register a new agent |
| `POST` | `/api/agents/login` | Login an agent |
| `GET` | `/api/agents/profile` | Get current agent profile |
| `POST` | `/api/customers/register` | Register a customer (guest) |
| `GET` | `/api/calls/all` | specific Get call history |
| `GET` | `/api/calls/:id/recording` | Download call recording |

> For detailed API examples, including Socket.IO events and cURL commands, see [webrtc-call-server/API-EXAMPLE.md](./webrtc-call-server/API-EXAMPLE.md).

### **Transcriber API**

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/transcribe` | Upload a file for transcription |
| `POST` | `/transcribe-from-path` | Transcribe a file existing on the server |

---

## 📂 Project Structure

```
.
├── frontend/
│   ├── my-app/              # Next.js Application
│   │   ├── src/             # Source code
│   │   │   ├── app/         # App Router pages
│   │   │   ├── components/  # Reusable UI components
│   │   │   └── lib/         # Utilities (socket, utils)
│   │   └── ...
│   └── FRONTEND-GUIDE.md    # Simple HTML frontend guide (legacy)
├── webrtc-call-server/      # Node.js Backend
│   ├── src/
│   │   ├── controllers/     # Route logic
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   └── server.js        # Entry point
│   └── recordings/          # Default storage for audio files
└── transcriber/             # Python AI Service
    ├── transcriber_api.py   # FastAPI entry point
    └── transcriber.py       # Transcription logic
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.
