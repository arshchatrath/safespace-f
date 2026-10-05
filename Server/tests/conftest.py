"""Shared fixtures. The real saved models are loaded once per test session.

Run from the Server directory:  python -m pytest
"""

import io
import logging
import shutil
import sys
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf

SERVER_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = SERVER_DIR.parent
sys.path.insert(0, str(SERVER_DIR))
logging.getLogger("shap").setLevel(logging.WARNING)

SAMPLE_CSV = REPO_DIR / "sample_physiological_data.csv"
# Synthetic speech generated with espeak-ng ("I had a busy day at work, but I am
# feeling alright now."), 16 kHz mono. It contains no real person's voice.
SPEECH_WAV = SERVER_DIR / "tests" / "fixtures" / "speech_sample.wav"

requires_ffmpeg = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="ffmpeg not installed")


@pytest.fixture(scope="session")
def models():
    from safespace.artifacts import load_models

    return load_models()


@pytest.fixture(scope="session")
def sample_csv_bytes():
    return SAMPLE_CSV.read_bytes()


@pytest.fixture(scope="session")
def speech_wav_bytes():
    return SPEECH_WAV.read_bytes()


def wav_bytes(waveform, sample_rate):
    buffer = io.BytesIO()
    sf.write(buffer, np.asarray(waveform, dtype=np.float32), sample_rate, format="WAV")
    return buffer.getvalue()
