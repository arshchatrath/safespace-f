# Voice Audio Processing for Stress Detection

This document describes the voice audio processing functionality that has been added to the SafeSpace stress detection API.

## Overview

The system now supports real-time voice audio analysis for stress detection using a deep learning model trained on IEMOCAP and RAVDESS datasets. Instead of using hardcoded voice probabilities, users can now upload or record their voice, which will be processed through the voice model to extract stress-related features.

## Features

- **Real-time voice recording**: Users can record their voice directly in the browser
- **Audio file upload**: Support for WAV, MP3, M4A, FLAC, OGG, and WebM files
- **MFCC feature extraction**: Automatic extraction of Mel-frequency cepstral coefficients
- **Deep learning analysis**: Voice stress prediction using a CNN-GRU-Attention model
- **Audio verification**: Playback functionality to verify recordings before submission
- **Multi-modal fusion**: Integration with physiological and questionnaire data

## API Endpoints

### 1. Full Prediction (`POST /predict`)

Predicts stress level using all available modalities (physiological, questionnaire, and voice).

**Parameters:**
- `physiological_file`: CSV file with physiological data (required)
- `dass21_responses`: DASS-21 questionnaire responses (required)
- `voice_audio`: Audio file for voice analysis (optional)

**Example Response:**
```json
{
  "success": true,
  "predictions": {
    "physio_probs": [0.2, 0.3, 0.5],
    "dass21_probs": [0.1, 0.4, 0.5],
    "voice_probs": [0.15, 0.35, 0.5],
    "fusion_probs": [0.18, 0.32, 0.5],
    "fusion_pred": 2,
    "prediction_label": "High",
    "confidence": 0.5
  },
  "explanations": {
    "physiological": {...},
    "questionnaire": {...},
    "voice": {...},
    "fusion": {...}
  },
  "metadata": {
    "voice_provided": true,
    "voice_filename": "user_voice.wav",
    "modalities_used": ["physiological", "questionnaire", "voice"]
  }
}
```

Voice-only prediction and `/debug/explanations` are not implemented. To use voice analysis, include `voice_audio` in the full `POST /predict` request along with the required CSV and DASS-21 answers. The interactive API docs are available at `http://localhost:8000/docs`.

## Voice Model Architecture

The voice model uses a CNN-GRU-Attention architecture:

1. **Input**: MFCC features (228 time steps × 40 coefficients)
2. **Convolutional layers**: 2D CNN for feature extraction
3. **Recurrent layers**: Bidirectional GRU for temporal modeling
4. **Attention mechanism**: Custom attention layer for focus on important features
5. **Output**: 3-class softmax (Low, Medium, High stress)

## Audio Processing Pipeline

1. **Audio Loading**: Supports multiple audio formats using librosa
2. **Feature Extraction**: MFCC extraction with 40 coefficients
3. **Preprocessing**: Padding/truncation to 228 time steps
4. **Model Input**: Reshape to (1, 228, 40, 1) for batch processing
5. **Prediction**: Forward pass through the voice model
6. **Post-processing**: Softmax probabilities for stress levels

## Installation and Setup

### 1. Install Dependencies

```powershell
cd Server
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 2. Ensure Voice Model is Available

Make sure your voice model is located at:
```
Server/models/model_finetuned.h5
```

### 3. Start the Server

```powershell
cd Server
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

## Testing

Open `http://localhost:3000/check`, upload the sample CSV from the repository root, answer all seven questionnaire items, then record or upload an audio clip before submitting. The voice upload is optional. The backend also provides `test_voice_integration.py` for local model and feature-extraction checks; run it from `Server/` with the project virtual environment.

## Frontend Integration

### VoiceRecorder Component

The `VoiceRecorder` component provides:

- **Recording**: Start/stop voice recording with timer
- **Upload**: File upload for existing audio files
- **Playback**: Verify recordings before submission
- **Error handling**: Permission and format validation

The assessment page at `Client/app/check/page.tsx` uses the shared `VoiceRecorder` component and submits the audio as `voice_audio` to `http://localhost:8000/predict`. It also sends the required physiological CSV and DASS-21 responses in the same multipart request.

## Supported Audio Formats

- **WAV**: Uncompressed audio (recommended)
- **MP3**: Compressed audio
- **M4A**: Apple audio format
- **FLAC**: Lossless compression
- **OGG**: Open source format
- **WebM**: Browser recording format

## Audio Quality Recommendations

- **Sample Rate**: 44.1 kHz or higher
- **Duration**: 10-30 seconds
- **Quality**: Clear speech, minimal background noise
- **Format**: WAV preferred for best quality

## Troubleshooting

### Common Issues

1. **Microphone Permission Denied**
   - Check browser permissions
   - Ensure HTTPS for production (required for getUserMedia)

2. **Audio Format Not Supported**
   - Convert to WAV or MP3
   - Check file extension matches content

3. **Model Loading Failed**
   - Verify model file exists at `models/model_finetuned.h5`
   - Check TensorFlow version compatibility

4. **Feature Extraction Failed**
   - Ensure audio file is not corrupted
   - Check audio duration (minimum 1 second)

### API availability

Open `http://localhost:8000/docs` to verify the backend is serving requests. The active prediction route is `POST /predict`.

## Performance Considerations

- **Audio Processing**: ~1-2 seconds for typical audio files
- **Model Inference**: ~0.5-1 second
- **Memory Usage**: ~100-200MB for audio processing
- **File Size**: Recommended < 10MB for web uploads

## Security Notes

- Audio files are processed temporarily and not stored permanently
- Temporary files are cleaned up after processing
- Input validation prevents malicious file uploads
- HTTPS required for microphone access in production 