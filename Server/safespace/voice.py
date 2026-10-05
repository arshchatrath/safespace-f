"""Voice pipeline: uploaded audio -> decoded waveform -> 40 MFCCs x 228 frames -> CNN-BiGRU-Attention model.

The voice model is required for every prediction. Any decoding or feature
failure is reported to the caller; the pipeline never substitutes a default
waveform, feature matrix or probability vector.
"""

import os
import tempfile

import librosa
import numpy as np
import tensorflow as tf
from tensorflow.keras.layers import Layer

from .config import (
    AUDIO_EXTENSIONS, MFCC_FRAMES, MIN_AUDIO_SECONDS, N_MFCC, SILENCE_RMS_THRESHOLD, VOICE_SAMPLE_RATE,
)

# librosa.feature.mfcc default hop length; used to convert frames to seconds.
MFCC_HOP_LENGTH = 512


class VoiceInputError(ValueError):
    """The uploaded audio cannot be analysed."""


class Attention(Layer):
    """Additive attention pooling over time, as saved in ``model_finetuned.h5``.

    For a sequence ``x`` of shape (time, features):
        e_t = tanh(x_t . W + b_t),  a = softmax(e) over time,  output = sum_t a_t * x_t
    This class must keep the weight names and shapes used when the model was
    saved so Keras can rebuild it.
    """

    def build(self, input_shape):
        self.W = self.add_weight(name="att_weight", shape=(input_shape[-1], 1), initializer="normal")
        self.b = self.add_weight(name="att_bias", shape=(input_shape[1], 1), initializer="zeros")
        super().build(input_shape)

    def attention_weights(self, x):
        e = tf.keras.backend.tanh(tf.keras.backend.dot(x, self.W) + self.b)
        return tf.keras.backend.softmax(e, axis=1)

    def call(self, x):
        return tf.keras.backend.sum(x * self.attention_weights(x), axis=1)


def load_audio(audio_bytes, filename):
    """Decode an uploaded file and resample it to 22,050 Hz.

    Returns (waveform, sample_rate, original_sample_rate).
    """
    extension = os.path.splitext(filename or "")[1].lower()
    if extension not in AUDIO_EXTENSIONS:
        raise VoiceInputError(
            f"Unsupported audio format {extension or '(none)'}. Use one of: {', '.join(AUDIO_EXTENSIONS)}."
        )
    if not audio_bytes:
        raise VoiceInputError("The voice recording is empty.")

    # librosa needs a path for formats decoded through ffmpeg (WebM, M4A, MP3).
    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as handle:
        handle.write(audio_bytes)
        path = handle.name
    try:
        original_rate = librosa.get_samplerate(path)
    except Exception:  # soundfile cannot read WebM/M4A headers; only used for reporting
        original_rate = None
    try:
        waveform, sample_rate = librosa.load(path, sr=VOICE_SAMPLE_RATE)
    except Exception as exc:  # soundfile/audioread raise many unrelated exception types
        raise VoiceInputError(
            f"Could not decode the voice recording ({type(exc).__name__}). "
            "WebM, M4A and MP3 need ffmpeg installed on the server."
        ) from exc
    finally:
        os.unlink(path)

    if waveform.size == 0:
        raise VoiceInputError("The voice recording contains no audio samples.")
    if not np.all(np.isfinite(waveform)):
        raise VoiceInputError("The voice recording contains invalid samples.")
    if float(np.sqrt(np.mean(waveform ** 2))) < SILENCE_RMS_THRESHOLD:
        raise VoiceInputError("The voice recording is silent. Please record again closer to the microphone.")
    return waveform, sample_rate, original_rate


def mfcc_features(waveform, sample_rate):
    """Return the model input (1, 228, 40, 1) and the number of real (unpadded) frames.

    Clips shorter than 1 s are zero-padded to 1 s. The MFCC matrix is then
    zero-padded or truncated to 228 frames, so only the first 228 frames
    (228 x 512 / 22050 = 5.3 s) of a long recording are analysed.
    """
    min_samples = int(sample_rate * MIN_AUDIO_SECONDS)
    if len(waveform) < min_samples:
        waveform = np.pad(waveform, (0, min_samples - len(waveform)))

    mfcc = librosa.feature.mfcc(y=waveform, sr=sample_rate, n_mfcc=N_MFCC).T  # (frames, 40)
    frames_used = min(mfcc.shape[0], MFCC_FRAMES)
    if mfcc.shape[0] < MFCC_FRAMES:
        mfcc = np.vstack([mfcc, np.zeros((MFCC_FRAMES - mfcc.shape[0], N_MFCC))])
    else:
        mfcc = mfcc[:MFCC_FRAMES]
    return mfcc.astype(np.float32)[np.newaxis, :, :, np.newaxis], frames_used


def predict(model, features):
    probs = model.predict(features, verbose=0)[0]
    return np.asarray(probs, dtype=float)


_attention_encoders = {}


def attention_over_time(model, features):
    """Attention weight the model gives each of the 228 MFCC frames (inference mode)."""
    attention_layer = next(layer for layer in model.layers if isinstance(layer, Attention))
    if id(model) not in _attention_encoders:
        _attention_encoders[id(model)] = tf.keras.Model(model.inputs, attention_layer.input)
    sequence = _attention_encoders[id(model)](features, training=False)
    weights = attention_layer.attention_weights(sequence)
    return np.asarray(weights)[0, :, 0]


def frames_to_seconds(frames, sample_rate):
    return frames * MFCC_HOP_LENGTH / sample_rate
