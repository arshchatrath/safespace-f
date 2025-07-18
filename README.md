# SafeSpace Stress Detection API

A comprehensive FastAPI-based backend service for multi-modal stress detection using physiological signals, psychological questionnaires (DASS-21), and voice analysis. The system employs Explainable AI (XAI) techniques to provide interpretable stress predictions.

## 🚀 Features

- **Multi-Modal Stress Detection**: Combines physiological, psychological, and voice data
- **Explainable AI (XAI)**: SHAP and LIME-based explanations for predictions
- **Late Fusion Architecture**: Intelligent combination of multiple modalities
- **Real-time Processing**: Fast inference with optimized feature extraction
- **RESTful API**: Easy integration with frontend applications
- **Docker Support**: Containerized deployment ready

## 📊 Supported Modalities

1. **Physiological Signals** (ECG, EDA, EMG, Temperature)
2. **Psychological Assessment** (DASS-21 Questionnaire)
3. **Voice Analysis** (Optional audio processing)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Physiological │    │   DASS-21       │    │   Voice         │
│   Data (CSV)    │    │   Responses     │    │   Probabilities │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Feature Extraction                           │
│  • Time-domain features (mean, std, skew, kurtosis)            │
│  • Frequency-domain features (power spectral density)          │
│  • Wavelet features (multi-resolution analysis)                │
│  • ECG-specific features (RR intervals, heart rate)            │
└─────────────────────────────────────────────────────────────────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Physiological   │    │ DASS-21         │    │ Voice           │
│ Model           │    │ Model           │    │ Model           │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │   Late Fusion Model     │
                    │  (PhysioDominantFusion) │
                    └─────────────┬───────────┘
                                  ▼
                    ┌─────────────────────────┐
                    │   XAI Explanations      │
                    │  (SHAP + LIME)          │
                    └─────────────┬───────────┘
                                  ▼
                    ┌─────────────────────────┐
                    │   Stress Prediction     │
                    │  (Low/Medium/High)      │
                    └─────────────────────────┘
```

## 🛠️ Installation

### Prerequisites

- Python 3.10+
- pip
- Docker (optional)

### Local Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Safespace_fastapi
   ```

2. **Create virtual environment**
   ```bash
   python -m venv newenv
   # On Windows
   newenv\Scripts\activate
   # On macOS/Linux
   source newenv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8080 --reload
   ```

### Docker Setup

1. **Build the Docker image**
   ```bash
   docker build -t safespace-api .
   ```

2. **Run the container**
   ```bash
   docker run -p 8080:8080 safespace-api
   ```

## 📡 API Endpoints

### Main Prediction Endpoint

**POST** `/predict`

Combines physiological data, DASS-21 responses, and optional voice probabilities to predict stress levels.

#### Request Format

- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `physiological_file`: CSV file with physiological data
  - `dass21_responses`: DASS-21 responses (comma-separated or JSON)
  - `voice_probabilities`: Voice probabilities (optional, comma-separated or JSON)

#### Example Request

```bash
curl -X POST "http://localhost:8080/predict" \
  -H "Content-Type: multipart/form-data" \
  -F "physiological_file=@data.csv" \
  -F "dass21_responses=1,2,3,1,2,3,1" \
  -F "voice_probabilities=0.2,0.5,0.3"
```

#### Response Format

```json
{
  "prediction": {
    "stress_level": "Medium",
    "confidence": 0.85,
    "probabilities": {
      "low": 0.15,
      "medium": 0.85,
      "high": 0.00
    }
  },
  "explanations": {
    "physiological": {
      "available": true,
      "method": "SHAP",
      "feature_importance": [
        {
          "feature": "ECG_mean_rr",
          "importance": 0.25,
          "abs_importance": 0.25
        }
      ],
      "summary": "ECG heart rate variability is the most important factor..."
    },
    "dass21": {
      "available": true,
      "method": "SHAP",
      "feature_importance": [
        {
          "feature": "DASS21_Q3_positive_feelings",
          "importance": -0.30,
          "abs_importance": 0.30
        }
      ],
      "summary": "Positive feelings score significantly influences the prediction..."
    },
    "fusion": {
      "available": true,
      "method": "Late Fusion",
      "modality_contributions": {
        "physiological": 0.60,
        "dass21": 0.25,
        "voice": 0.15
      },
      "summary": "Physiological signals contribute most to the final prediction..."
    }
  },
  "processing_info": {
    "windows_processed": 10,
    "features_extracted": 180,
    "processing_time_ms": 245
  }
}
```

## 📁 Project Structure

```
Safespace_fastapi/
├── main.py                 # Main FastAPI application
├── latefusion_final.py     # Late fusion model implementation
├── predict_wesad.py        # WESAD dataset prediction utilities
├── predict_physiological.py # Physiological data processing
├── run_wesad_prediction.py # WESAD prediction runner
├── v1.py                   # Version 1 API endpoints
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker configuration
├── scaler.pkl             # Feature scaler
├── models/                # Trained model files
│   ├── fusion_model.pkl
│   ├── lateFusion.pkl
│   ├── regularized_global_model.pkl
│   ├── stacking_classifier_model.pkl
│   ├── scaler.pkl
│   └── Voice.h5
└── newenv/                # Virtual environment (ignored by git)
```

## 🔧 Configuration

### Signal Processing Parameters

```python
CFG = {
    "orig_fs": 700,        # Original sampling frequency
    "fs": 100,             # Target sampling frequency
    "window_sec": 10,      # Window size in seconds
    "stride_sec": 5,       # Stride between windows
    "sensors": ["ECG", "EDA", "EMG", "Temp"]  # Supported sensors
}
```

### Fusion Weights

```python
mod_weights = {
    'phys': 0.60,    # Physiological signals (60%)
    'text': 0.25,    # DASS-21 responses (25%)
    'voice': 0.15    # Voice analysis (15%)
}
```

## 📊 Data Formats

### Physiological Data (CSV)

Expected columns for each sensor:
- **ECG**: Raw ECG signal values
- **EDA**: Electrodermal activity values
- **EMG**: Electromyography values
- **Temp**: Temperature values

### DASS-21 Responses

7 questions with responses 0-3:
- 0: Did not apply to me at all
- 1: Applied to me to some degree, or some of the time
- 2: Applied to me to a considerable degree, or a good part of the time
- 3: Applied to me very much, or most of the time

### Voice Probabilities (Optional)

Three probability values for stress levels:
- `[low_prob, medium_prob, high_prob]`

## 🧠 Model Details

### Feature Extraction

1. **Time-domain Features**:
   - Statistical measures (mean, std, variance, skewness, kurtosis)
   - Range measures (min, max, peak-to-peak)
   - Percentiles (25th, 75th, median)

2. **Frequency-domain Features**:
   - Power spectral density in different bands
   - Frequency statistics (mean, std, peak frequency)

3. **Wavelet Features**:
   - Multi-resolution analysis using PyWavelets
   - Detail coefficients (d1-d4) and approximation coefficients (a4)

4. **ECG-specific Features**:
   - RR intervals and heart rate variability
   - Heart rate statistics

### XAI Implementation

- **SHAP (SHapley Additive exPlanations)**: For feature importance analysis
- **LIME (Local Interpretable Model-agnostic Explanations)**: For local explanations
- **Permutation Importance**: For model-agnostic feature ranking

## 🚀 Performance

- **Inference Time**: ~250ms per prediction
- **Feature Extraction**: ~180 features per window
- **Window Processing**: 10-second windows with 5-second stride
- **Memory Usage**: ~500MB (including models)

## 🔍 API Documentation

Once the server is running, visit:
- **Interactive API Docs**: http://localhost:8080/docs
- **ReDoc Documentation**: http://localhost:8080/redoc
- **OpenAPI Schema**: http://localhost:8080/openapi.json

## 🧪 Testing

### Example Data

```python
# Sample DASS-21 responses
dass21_responses = "1,2,3,1,2,3,1"

# Sample voice probabilities
voice_probabilities = "0.2,0.5,0.3"
```

### Testing with curl

```bash
# Test with sample data
curl -X POST "http://localhost:8080/predict" \
  -H "Content-Type: multipart/form-data" \
  -F "physiological_file=@sample_data.csv" \
  -F "dass21_responses=1,2,3,1,2,3,1"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **SafeSpace Team** - *Initial work*

## 🙏 Acknowledgments

- WESAD dataset for physiological data
- DASS-21 questionnaire for psychological assessment
- SHAP and LIME libraries for explainable AI
- FastAPI for the web framework

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/docs`

---

**Note**: This API is designed for research and educational purposes. For clinical applications, additional validation and medical certification may be required. 