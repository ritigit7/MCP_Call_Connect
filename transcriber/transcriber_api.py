from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import tempfile
from datetime import datetime
from pydantic import BaseModel

from transcriber import AudioTranscriber
from config import *
from utils import convert_to_wav, save_transcription

# Initialize FastAPI
app = FastAPI(
    title="Audio Transcription API",
    description="Transcribe audio with speaker diarization",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Node.js server URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize transcriber (load models once at startup)
print("🔄 Loading AI models...")
transcriber = AudioTranscriber(
    whisper_model=WHISPER_MODEL,
    hf_token=HF_TOKEN
)
print("✅ Models loaded successfully!")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Audio Transcription API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "whisper_model": WHISPER_MODEL,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio file with speaker diarization
    
    Args:
        file: Audio file (webm, mp3, wav, m4a)
    
    Returns:
        JSON with conversation and metadata
    """
    temp_file = None
    wav_file = None
    
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        file_ext = file.filename.split('.')[-1].lower()
        if f'.{file_ext}' not in SUPPORTED_FORMATS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format. Supported: {', '.join(SUPPORTED_FORMATS)}"
            )
        
        # Read file content
        content = await file.read()
        
        # Check file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        print(f"\n{'='*60}")
        print(f"📁 Processing: {file.filename} ({len(content)} bytes)")
        print(f"{'='*60}")
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(
            delete=False, 
            suffix=f'.{file_ext}'
        ) as temp:
            temp.write(content)
            temp_file = temp.name
        
        print(f"💾 Saved to temp: {temp_file}")
        
        # Convert to WAV if needed
        if file_ext != 'wav':
            wav_file = convert_to_wav(temp_file)
            if not wav_file:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to convert audio file"
                )
        else:
            wav_file = temp_file
        
        # Transcribe
        print("🎤 Transcribing audio...")
        transcription = await run_in_threadpool(transcriber.transcribe_audio, wav_file)
        
        # Diarize
        print("👥 Performing speaker diarization...")
        diarization = await run_in_threadpool(transcriber.diarize_audio, wav_file)
        
        # Merge
        print("🔗 Merging transcription with speakers...")
        conversation = await run_in_threadpool(transcriber.merge_transcription_and_diarization,
            transcription,
            diarization
        )
        
        # Prepare response
        result = {
            "status": "success",
            "conversation": conversation,
            "metadata": {
                "filename": file.filename,
                "duration": transcription['segments'][-1]['end'] if transcription['segments'] else 0,
                "language": transcription.get('language', 'en'),
                "speakers_detected": len(set([s['speaker'] for s in diarization])),
                "processed_at": datetime.now().isoformat()
            }
        }
        
        print(f"✅ Processing complete!")
        print(f"   - Duration: {result['metadata']['duration']:.2f}s")
        print(f"   - Speakers: {result['metadata']['speakers_detected']}")
        print(f"   - Turns: {len(conversation)}")
        
        return JSONResponse(content=result)
    
    except HTTPException as e:
        raise e
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Cleanup temporary files
        if temp_file and os.path.exists(temp_file):
            os.remove(temp_file)
        if wav_file and wav_file != temp_file and os.path.exists(wav_file):
            os.remove(wav_file)


class FilePathRequest(BaseModel):
    file_path: str


@app.post("/transcribe-from-path")
async def transcribe_from_path(request: FilePathRequest):
    """
    Transcribe audio file from server path
    
    Args:
        file_path: Full path to audio file on server
    
    Returns:
        JSON with conversation and metadata
    """
    wav_file = None
    file_path = request.file_path
    file_path = f"/home/ritik-maurya/Documents/Node/MCP_Call_Connect/webrtc-call-server/{file_path}"

    
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        print(f"\n{'='*60}")
        print(f"📁 Processing: {file_path}")
        print(f"{'='*60}")
        
        # Convert to WAV if needed
        if not file_path.endswith('.wav'):
            wav_file = convert_to_wav(file_path)
            if not wav_file:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to convert audio file"
                )
        else:
            wav_file = file_path
        
        # Transcribe
        print("🎤 Transcribing audio...")
        transcription = await run_in_threadpool(transcriber.transcribe_audio, wav_file)
        
        # Diarize
        print("👥 Performing speaker diarization...")
        diarization = await run_in_threadpool(transcriber.diarize_audio, wav_file)
        
        # Merge
        print("🔗 Merging transcription with speakers...")
        conversation = await run_in_threadpool(transcriber.merge_transcription_and_diarization,
            transcription,
            diarization
        )
        
        metadata = {
            'filename': os.path.basename(wav_file),
            'duration': transcription['segments'][-1]['end'] if transcription['segments'] else 0,
            'language': transcription.get('language', 'en'),
            'processed_at': datetime.now().isoformat()
        }

        base_name = os.path.basename(wav_file).rsplit('.', 1)[0]
        output_file = os.path.join(OUTPUT_DIR, f"{base_name}_transcript.txt")
        
        save_transcription(output_file, conversation, metadata)
        # Prepare response
        result = {
            "status": "success",
            "conversation": conversation,
            "metadata": {
                "filename": os.path.basename(file_path),
                "duration": transcription['segments'][-1]['end'] if transcription['segments'] else 0,
                "language": transcription.get('language', 'en'),
                "speakers_detected": len(set([s['speaker'] for s in diarization])),
                "processed_at": datetime.now().isoformat()
            }
        }
        
        print(f"✅ Processing complete!")
        return JSONResponse(content=result)
    
    except HTTPException as e:
        raise e
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Cleanup temporary WAV file if created
        if wav_file and wav_file != file_path and os.path.exists(wav_file):
            os.remove(wav_file)


if __name__ == "__main__":
    print(f"""
╔════════════════════════════════════════════╗
║   Audio Transcription API                  ║
║   Whisper Model: {WHISPER_MODEL:<26} ║
║   Port: {FASTAPI_PORT:<34} ║
╚════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        app,
        host=FASTAPI_HOST,
        port=FASTAPI_PORT,
        log_level="info"
    )