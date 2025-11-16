import os
from dotenv import load_dotenv

load_dotenv()

# Hugging Face token for Pyannote
HF_TOKEN = os.getenv('HF_TOKEN', 'your_token_here')

# Whisper model size (tiny, base, small, medium, large)
WHISPER_MODEL = 'base'  # Start with base, upgrade to large for better accuracy

# Recordings directory from your WebRTC server
RECORDINGS_DIR = '../webrtc-call-server/recordings'  # Path to your backend recordings folder

# Output directory for transcriptions
OUTPUT_DIR = './output'

# Supported audio formats
SUPPORTED_FORMATS = ['.webm', '.mp3', '.wav', '.m4a']

# Speaker labels
SPEAKER_LABELS = {
    'SPEAKER_00': 'Agent',
    'SPEAKER_01': 'Customer'
}

# FastAPI settings
FASTAPI_HOST = '0.0.0.0'
FASTAPI_PORT = 8000

# Max file size (50MB)
MAX_FILE_SIZE = 50 * 1024 * 1024