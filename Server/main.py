"""SafeSpace stress-detection API.

POST /predict         multipart form with all three inputs (all required):
    physiological_file  CSV with ECG, EDA, EMG, Temp columns sampled at 100 Hz (>= 1000 rows)
    dass21_responses    seven answers 0-3, e.g. "1,2,0,3,1,2,0" or "[1,2,0,3,1,2,0]"
    voice_audio         WAV, MP3, M4A, FLAC, OGG or WebM recording
POST /predict/stream  same form; streams progress as newline-delimited JSON (see predict_stream)
GET  /health          model and version status

Run from the Server directory:  uvicorn main:app --host 127.0.0.1 --port 8000
"""

import json
import logging
import os
import queue
import threading

import numpy as np
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from safespace import physiological, questionnaire, voice
from safespace.artifacts import load_models
from safespace.config import CLASS_NAMES, MAX_AUDIO_BYTES, MAX_CSV_BYTES, MFCC_FRAMES, SENSORS
from safespace.fusion import FusionInputError

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("safespace.api")

INPUT_ERRORS = (
    physiological.PhysiologicalInputError,
    questionnaire.QuestionnaireInputError,
    voice.VoiceInputError,
    FusionInputError,
)

app = FastAPI(title="SafeSpace Stress Detection API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    # Comma-separated list, e.g. "http://localhost:3000,https://safespace.example". Defaults to any origin.
    allow_origins=[o.strip() for o in os.getenv("SAFESPACE_CORS_ORIGINS", "*").split(",") if o.strip()],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Fail at startup if any model artifact is missing or cannot be loaded.
models = load_models()

# /predict is a sync endpoint, so FastAPI runs it in a worker thread and the event loop stays
# free for other requests. The shap KernelExplainer keeps per-call state on the instance, so
# model work is serialised with this lock.
_inference_lock = threading.Lock()


class UploadTooLargeError(ValueError):
    pass


def _read_limited(upload, limit, label):
    data = upload.file.read(limit + 1)
    if len(data) > limit:
        raise UploadTooLargeError(f"The {label} is larger than {limit // (1024 * 1024)} MB.")
    return data


# Pipeline stages, in order, as reported by /predict/stream.
STAGES = ("physiological", "questionnaire", "voice", "fusion", "explanations")


def _error_body(title, message, kind):
    return {"success": False, "error": title, "message": message, "error_type": kind}


def _error(status, title, message, kind):
    return JSONResponse(status_code=status, content=_error_body(title, message, kind))


@app.get("/health")
def health():
    return {
        "status": "ok",
        "models": {
            "physiological": type(models.physiological).__name__,
            "questionnaire": type(models.questionnaire).__name__,
            "voice": models.voice.name,
            "fusion": type(models.fusion).__name__,
        },
        "voice_input_shape": list(models.voice.input_shape[1:]),
        "physiological_features": int(models.physiological.n_features_in_),
        "required_csv_columns": list(SENSORS),
    }


def _read_uploads(physiological_file, voice_audio):
    """Return (csv_bytes, audio_bytes), or a JSONResponse error for a wrong type or oversized upload."""
    try:
        if not (physiological_file.filename or "").lower().endswith(".csv"):
            raise physiological.PhysiologicalInputError("Physiological file must be a .csv file")
        csv_bytes = _read_limited(physiological_file, MAX_CSV_BYTES, "physiological file")
        audio_bytes = _read_limited(voice_audio, MAX_AUDIO_BYTES, "voice recording")
    except UploadTooLargeError as exc:
        return _error(413, "Payload Too Large", str(exc), "validation")
    except physiological.PhysiologicalInputError as exc:
        return _error(422, "Validation Error", str(exc), "validation")
    return csv_bytes, audio_bytes


@app.post("/predict")
def predict(
    physiological_file: UploadFile = File(..., description="CSV with ECG, EDA, EMG, Temp columns at 100 Hz"),
    dass21_responses: str = Form(..., description="Seven DASS-21 stress-item answers (0-3), comma-separated or JSON"),
    voice_audio: UploadFile = File(..., description="Voice recording (WAV, MP3, M4A, FLAC, OGG or WebM)"),
):
    uploads = _read_uploads(physiological_file, voice_audio)
    if isinstance(uploads, JSONResponse):
        return uploads
    csv_bytes, audio_bytes = uploads
    with _inference_lock:
        status, body = _run_pipeline(csv_bytes, dass21_responses, audio_bytes, voice_audio.filename)
    return JSONResponse(status_code=status, content=body)


@app.post("/predict/stream")
def predict_stream(
    physiological_file: UploadFile = File(..., description="CSV with ECG, EDA, EMG, Temp columns at 100 Hz"),
    dass21_responses: str = Form(..., description="Seven DASS-21 stress-item answers (0-3), comma-separated or JSON"),
    voice_audio: UploadFile = File(..., description="Voice recording (WAV, MP3, M4A, FLAC, OGG or WebM)"),
):
    """Same inputs and result as /predict, streamed as newline-delimited JSON events:

        {"type": "queued"}                                         another analysis is running
        {"type": "stage", "stage": "voice", "index": 3, "total": 5} a pipeline stage has started
        {"type": "result", "status": 200, "body": {...}}           final event; body is /predict's response

    Upload errors (wrong file type, too large) are returned as a normal 413/422 JSON response
    before streaming starts. Pipeline errors arrive as a result event with status 422 or 500.
    """
    uploads = _read_uploads(physiological_file, voice_audio)
    if isinstance(uploads, JSONResponse):
        return uploads
    csv_bytes, audio_bytes = uploads
    events = queue.Queue()

    def report(stage):
        events.put({"type": "stage", "stage": stage, "index": STAGES.index(stage) + 1, "total": len(STAGES)})

    def work():
        status, body = 500, _error_body("Server Error", "Prediction failed", "server")
        try:
            if not _inference_lock.acquire(blocking=False):
                events.put({"type": "queued"})
                _inference_lock.acquire()
            try:
                status, body = _run_pipeline(csv_bytes, dass21_responses, audio_bytes, voice_audio.filename, report)
            finally:
                _inference_lock.release()
        except Exception:
            log.exception("Streaming prediction failed")
        events.put({"type": "result", "status": status, "body": body})
        events.put(None)

    def stream():
        while (event := events.get()) is not None:
            try:
                yield json.dumps(event, allow_nan=False) + "\n"
            except ValueError:
                log.exception("Result is not valid JSON")
                failed = {"type": "result", "status": 500, "body": _error_body("Server Error", "Invalid result", "server")}
                yield json.dumps(failed) + "\n"

    # The pipeline runs in its own thread so events reach the client while it works.
    threading.Thread(target=work, name="safespace-predict", daemon=True).start()
    return StreamingResponse(stream(), media_type="application/x-ndjson", headers={"Cache-Control": "no-cache"})


def _no_report(stage):
    pass


def _run_pipeline(csv_bytes, dass21_responses, audio_bytes, audio_filename, report=_no_report):
    """Run all three models, fusion and explanations. Returns (http_status, response_body)."""
    try:
        # 1. Physiological: CSV -> windows -> 180 features -> averaged window probabilities
        report("physiological")
        signals = physiological.read_signals(csv_bytes)
        physio_features = physiological.window_features(signals)
        physio_probs, _ = physiological.predict(models.physiological, physio_features)

        # 2. Questionnaire: 7 answers -> training scaler -> stacking classifier
        report("questionnaire")
        answers = questionnaire.parse_answers(dass21_responses)
        dass21_probs = questionnaire.predict(models.questionnaire, models.questionnaire_scaler, answers)

        # 3. Voice: audio -> MFCC (228 x 40) -> CNN-BiGRU-Attention model
        report("voice")
        waveform, sample_rate, original_rate = voice.load_audio(audio_bytes, audio_filename)
        voice_input, frames_used = voice.mfcc_features(waveform, sample_rate)
        voice_probs = voice.predict(models.voice, voice_input)

        # 4. Late fusion
        report("fusion")
        mod_probs = {"phys": physio_probs, "text": dass21_probs, "voice": voice_probs}
        fusion_probs = models.fusion.predict_proba(mod_probs)
        fusion_pred = int(np.argmax(fusion_probs))
    except INPUT_ERRORS as exc:
        log.info("Rejected request: %s", exc)
        return 422, _error_body("Validation Error", str(exc), "validation")
    except Exception as exc:
        log.exception("Prediction failed")
        return 500, _error_body("Server Error", str(exc), "server")

    report("explanations")
    explainer = models.explainer
    explanations = {
        "physiological": explainer.physiological(physio_features, physio_probs),
        "questionnaire": explainer.questionnaire(answers, dass21_probs),
        "voice": explainer.voice(models.voice, voice_input, voice_probs, frames_used, sample_rate),
        "fusion": explainer.fusion(models.fusion, mod_probs, fusion_probs),
    }

    result = {
        "success": True,
        "predictions": {
            "physio_probs": physio_probs.tolist(),
            "dass21_probs": dass21_probs.tolist(),
            "voice_probs": voice_probs.tolist(),
            "fusion_probs": fusion_probs.tolist(),
            "fusion_pred": fusion_pred,
            "prediction_label": CLASS_NAMES[fusion_pred],
            "confidence": float(np.max(fusion_probs)),
        },
        "explanations": explanations,
        "metadata": {
            "physio_windows": int(physio_features.shape[0]),
            "physio_features": int(physio_features.shape[1]),
            "physio_rows": int(len(signals)),
            "dass21_values": answers,
            "voice_provided": True,
            "voice_filename": audio_filename,
            "voice_duration_sec": round(len(waveform) / sample_rate, 3),
            "voice_original_sample_rate": original_rate,
            "voice_sample_rate": int(sample_rate),
            "voice_frames_analysed": int(frames_used),
            "voice_seconds_analysed": round(float(voice.frames_to_seconds(min(frames_used, MFCC_FRAMES), sample_rate)), 3),
            "modalities_used": ["physiological", "questionnaire", "voice"],
        },
    }
    log.info("Prediction: %s %s", result["predictions"]["prediction_label"], np.round(fusion_probs, 3).tolist())
    return 200, result
