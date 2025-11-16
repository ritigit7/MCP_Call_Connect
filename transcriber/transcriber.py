import whisper
from pyannote.audio import Pipeline
from faster_whisper import WhisperModel 
import torch
from datetime import datetime
import os
from config import *
from utils import *


class AudioTranscriber:
    def __init__(self, whisper_model='base', hf_token=None):
        print("🔄 Loading models...")
        
        # Load Whisper
        print(f"Loading Whisper model: {whisper_model}")
        # self.whisper_model = whisper.load_model(whisper_model)
        self.whisper_model = WhisperModel(whisper_model, device="cuda" if torch.cuda.is_available() else "cpu")
        print("✅ Whisper loaded")
        
        # Load Pyannote diarization pipeline
        print("Loading Pyannote diarization...")
        self.diarization_pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=hf_token or HF_TOKEN
        )
        
        # Use GPU if available
        if torch.cuda.is_available():
            self.diarization_pipeline.to(torch.device("cuda"))
            print("✅ Pyannote loaded (GPU)")
        else:
            print("✅ Pyannote loaded (CPU)")
    
    
    def transcribe_audio(self, audio_file):
        """
        Transcribe audio using Whisper
        """
        print(f"\n🎤 Transcribing audio...")
        segments_generator, info = self.whisper_model.transcribe(
            audio_file,
            vad_filter=True
        )
        
        # The transcribe method of faster-whisper returns a generator.
        # We need to convert it to a list of dictionaries to match the structure
        # expected by the rest of the script (similar to openai-whisper's output).
        segments = [
            {'start': s.start, 'end': s.end, 'text': s.text} 
            for s in segments_generator
        ]
        
        result = {'segments': segments, 'language': info.language}
        
        print(f"✅ Transcription complete")
        return result
    
    
    def diarize_audio(self, audio_file):
        """
        Perform speaker diarization using Pyannote
        """
        print(f"\n👥 Performing speaker diarization...")
        diarization = self.diarization_pipeline(audio_file)
        
        segments = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            segments.append({
                'start': turn.start,
                'end': turn.end,
                'speaker': speaker
            })
        
        print(f"✅ Found {len(set([s['speaker'] for s in segments]))} speakers")
        return segments
    
    
    def merge_transcription_and_diarization(self, transcription, diarization):
        """
        Merge Whisper transcription with Pyannote diarization
        """
        print(f"\n🔗 Merging transcription with speaker labels...")
        
        conversation = []
        
        for segment in transcription['segments']:
            text = segment['text'].strip()
            start = segment['start']
            end = segment['end']
            
            # Find which speaker was talking during this segment
            speaker = self.find_speaker_for_segment(start, end, diarization)
            
            # Map to readable labels (Agent/Customer)
            speaker_label = SPEAKER_LABELS.get(speaker, speaker)
            
            conversation.append({
                'start': start,
                'end': end,
                'speaker': speaker_label,
                'text': text
            })
        
        print(f"✅ Merged {len(conversation)} conversation turns")
        return conversation
    
    
    def find_speaker_for_segment(self, start, end, diarization):
        """
        Find which speaker was talking during a time segment
        """
        segment_duration = end - start
        speaker_times = {}
        
        for dia_seg in diarization:
            overlap_start = max(start, dia_seg['start'])
            overlap_end = min(end, dia_seg['end'])
            overlap_duration = max(0, overlap_end - overlap_start)
            
            if overlap_duration > 0:
                speaker = dia_seg['speaker']
                speaker_times[speaker] = speaker_times.get(speaker, 0) + overlap_duration
        
        if speaker_times:
            return max(speaker_times, key=speaker_times.get)
        
        return 'UNKNOWN'
    
    
    def process_recording(self, audio_file, output_dir=OUTPUT_DIR):
        """
        Complete pipeline: convert → transcribe → diarize → merge
        """
        print(f"\n{'='*60}")
        print(f"Processing: {audio_file}")
        print(f"{'='*60}")
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Step 1: Convert to WAV if needed
        if not audio_file.endswith('.wav'):
            wav_file = convert_to_wav(audio_file)
            if not wav_file:
                return None
        else:
            wav_file = audio_file
        
        # Step 2: Transcribe
        transcription = self.transcribe_audio(wav_file)
        
        # Step 3: Diarize
        diarization = self.diarize_audio(wav_file)
        
        # Step 4: Merge
        conversation = self.merge_transcription_and_diarization(
            transcription, 
            diarization
        )
        
        # Step 5: Save results
        base_name = os.path.basename(audio_file).rsplit('.', 1)[0]
        output_file = os.path.join(output_dir, f"{base_name}_transcript.txt")
        
        metadata = {
            'filename': os.path.basename(audio_file),
            'duration': transcription['segments'][-1]['end'] if transcription['segments'] else 0,
            'language': transcription.get('language', 'en'),
            'processed_at': datetime.now().isoformat()
        }
        
        save_transcription(output_file, conversation, metadata)
        
        print(f"\n✅ Processing complete!")
        return conversation


# Main execution
if __name__ == "__main__":
    # Initialize transcriber
    transcriber = AudioTranscriber(
        whisper_model=WHISPER_MODEL,
        hf_token=HF_TOKEN
    )
    
    # Process a single recording
    audio_file = input("Enter path to audio file: ")
    
    if os.path.exists(audio_file):
        result = transcriber.process_recording(audio_file)
        print(f"\n🎉 Done! Check the output directory.")
    else:
        print(f"❌ File not found: {audio_file}")