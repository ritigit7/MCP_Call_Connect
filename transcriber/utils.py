import os
from pydub import AudioSegment

def convert_to_wav(input_file, output_file=None):
    """
    Convert audio file to WAV format
    """
    if output_file is None:
        output_file = input_file.rsplit('.', 1)[0] + '.wav'
    
    print(f"Converting {input_file} to WAV...")
    
    # Detect input format
    file_ext = input_file.split('.')[-1].lower()
    
    try:
        if file_ext == 'webm':
            audio = AudioSegment.from_file(input_file, format='webm')
        elif file_ext == 'mp3':
            audio = AudioSegment.from_mp3(input_file)
        elif file_ext == 'm4a':
            audio = AudioSegment.from_file(input_file, format='m4a')
        else:
            audio = AudioSegment.from_wav(input_file)
        
        # Export as WAV (16kHz, mono for better performance)
        audio = audio.set_frame_rate(16000).set_channels(1)
        audio.export(output_file, format='wav')
        
        print(f"✅ Converted to: {output_file}")
        return output_file
    
    except Exception as e:
        print(f"❌ Error converting file: {e}")
        return None


def format_timestamp(seconds):
    """
    Convert seconds to HH:MM:SS format
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def save_transcription(output_file, conversation, metadata):
    """
    Save transcription in multiple formats
    """
    import json
    
    # JSON format
    json_output = {
        'metadata': metadata,
        'conversation': conversation
    }
    
    json_file = output_file.replace('.txt', '.json')
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(json_output, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Saved JSON: {json_file}")
    
    # Text format (readable)
    txt_file = output_file
    with open(txt_file, 'w', encoding='utf-8') as f:
        f.write(f"Call Transcription\n")
        f.write(f"=" * 50 + "\n\n")
        f.write(f"File: {metadata['filename']}\n")
        f.write(f"Duration: {format_timestamp(metadata['duration'])}\n")
        f.write(f"Date: {metadata['processed_at']}\n\n")
        f.write(f"Conversation:\n")
        f.write(f"-" * 50 + "\n\n")
        
        for turn in conversation:
            speaker = turn['speaker']
            timestamp = format_timestamp(turn['start'])
            text = turn['text']
            f.write(f"[{timestamp}] {speaker}: {text}\n\n")
    
    print(f"✅ Saved TXT: {txt_file}")