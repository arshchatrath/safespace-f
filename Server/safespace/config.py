"""Constants shared by every stage of the pipeline."""

from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = SERVER_DIR / "models"

# Every model outputs probabilities in this class order.
CLASS_NAMES = ("Low", "Medium", "High")

# --- Physiological signals -------------------------------------------------
# The API expects CSV data already sampled at 100 Hz (one row = 10 ms).
# No resampling is performed: 700 Hz WESAD chest data must be downsampled first.
SAMPLE_RATE_HZ = 100
WINDOW_SECONDS = 10
STRIDE_SECONDS = 5
WINDOW_SAMPLES = WINDOW_SECONDS * SAMPLE_RATE_HZ  # 1000 rows
STRIDE_SAMPLES = STRIDE_SECONDS * SAMPLE_RATE_HZ  # 500 rows
SENSORS = ("ECG", "EDA", "EMG", "Temp")

# --- Questionnaire ----------------------------------------------------------
DASS21_ITEM_COUNT = 7
DASS21_MIN_SCORE = 0
DASS21_MAX_SCORE = 3

# --- Voice ------------------------------------------------------------------
# Uploads are resampled to librosa's default rate before MFCC extraction so the
# model sees the same time scale whatever the microphone rate (browsers record
# at 44.1/48 kHz). The training rate is not stored in the artifacts; 22,050 Hz is
# inferred (228 frames x 512-sample hop = 5.3 s, the length of the longest RAVDESS
# clips) and should be confirmed against the training notebook.
VOICE_SAMPLE_RATE = 22050
N_MFCC = 40
MFCC_FRAMES = 228  # fixed time dimension of the voice model input
MFCC_HOP_LENGTH = 512  # librosa.feature.mfcc default
ANALYSED_SAMPLES = MFCC_FRAMES * MFCC_HOP_LENGTH  # audio the model sees: 116,736 samples = 5.3 s
MIN_AUDIO_SECONDS = 1.0  # shorter clips are zero-padded to this length
MAX_AUDIO_DECODE_SECONDS = 60  # only the first 5.3 s are analysed; cap decoding of long uploads
SILENCE_RMS_THRESHOLD = 1e-4
# Reject recordings whose analysed part is >20 dB quieter than the rest (speech starts too late).
QUIET_START_RATIO = 0.1
AUDIO_EXTENSIONS = (".wav", ".mp3", ".m4a", ".flac", ".ogg", ".webm")

# --- Upload limits ---------------------------------------------------------
MAX_CSV_BYTES = 50 * 1024 * 1024    # ~2 days of 4-channel 100 Hz data
MAX_AUDIO_BYTES = 25 * 1024 * 1024

# --- Saved artifacts --------------------------------------------------------
PHYSIOLOGICAL_MODEL_PATH = MODELS_DIR / "regularized_global_model.pkl"
QUESTIONNAIRE_MODEL_PATH = MODELS_DIR / "stacking_classifier_model.pkl"
QUESTIONNAIRE_SCALER_PATH = MODELS_DIR / "scaler.pkl"
VOICE_MODEL_PATH = MODELS_DIR / "model_finetuned.h5"
