import os
import glob
from transcriber import AudioTranscriber
from config import *


def process_all_recordings():
    """
    Process all recordings in the recordings directory
    """
    print("🔍 Scanning for recordings...")
    
    # Find all audio files
    audio_files = []
    for ext in SUPPORTED_FORMATS:
        pattern = os.path.join(RECORDINGS_DIR, f"*{ext}")
        audio_files.extend(glob.glob(pattern))
    
    if not audio_files:
        print(f"❌ No audio files found in {RECORDINGS_DIR}")
        return
    
    print(f"✅ Found {len(audio_files)} recordings")
    
    # Initialize transcriber
    transcriber = AudioTranscriber(
        whisper_model=WHISPER_MODEL,
        hf_token=HF_TOKEN
    )
    
    # Process each file
    results = []
    for i, audio_file in enumerate(audio_files, 1):
        print(f"\n[{i}/{len(audio_files)}]")
        try:
            result = transcriber.process_recording(audio_file)
            results.append({
                'file': audio_file,
                'status': 'success',
                'result': result
            })
        except Exception as e:
            print(f"❌ Error processing {audio_file}: {e}")
            results.append({
                'file': audio_file,
                'status': 'failed',
                'error': str(e)
            })
    
    # Summary
    print(f"\n{'='*60}")
    print(f"PROCESSING SUMMARY")
    print(f"{'='*60}")
    success_count = sum(1 for r in results if r['status'] == 'success')
    print(f"✅ Successful: {success_count}/{len(audio_files)}")
    print(f"❌ Failed: {len(audio_files) - success_count}/{len(audio_files)}")


if __name__ == "__main__":
    process_all_recordings()