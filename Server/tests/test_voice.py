import subprocess

import librosa
import numpy as np
import pytest

from conftest import requires_ffmpeg, wav_bytes
from safespace import voice
from safespace.config import MFCC_FRAMES, N_MFCC, VOICE_SAMPLE_RATE


def test_model_shapes(models):
    assert models.voice.input_shape == (None, MFCC_FRAMES, N_MFCC, 1)
    assert models.voice.output_shape == (None, 3)
    assert any(isinstance(layer, voice.Attention) for layer in models.voice.layers)


def test_speech_is_resampled_and_featurised(speech_wav_bytes):
    waveform, rate, original = voice.load_audio(speech_wav_bytes, "speech.wav")
    assert rate == VOICE_SAMPLE_RATE and original == 16000
    features, frames = voice.mfcc_features(waveform, rate)
    assert features.shape == (1, MFCC_FRAMES, N_MFCC, 1)
    expected_frames = 1 + len(waveform) // 512
    assert frames == min(expected_frames, MFCC_FRAMES)
    assert not np.allclose(features, 0)


def test_long_audio_is_truncated_to_model_length():
    rng = np.random.default_rng(0)
    waveform = (0.1 * rng.standard_normal(VOICE_SAMPLE_RATE * 8)).astype(np.float32)
    features, frames = voice.mfcc_features(waveform, VOICE_SAMPLE_RATE)
    assert features.shape[1] == MFCC_FRAMES and frames == MFCC_FRAMES


def test_prediction_is_a_real_model_output(models, speech_wav_bytes):
    waveform, rate, _ = voice.load_audio(speech_wav_bytes, "speech.wav")
    features, _ = voice.mfcc_features(waveform, rate)
    probs = voice.predict(models.voice, features)
    assert probs.shape == (3,)
    assert probs.sum() == pytest.approx(1.0, abs=1e-5)
    # The old pipeline silently fed an all-zero matrix when decoding failed; make sure speech differs from that.
    zero_probs = voice.predict(models.voice, np.zeros_like(features))
    assert not np.allclose(probs, zero_probs, atol=1e-3)


def test_prediction_does_not_depend_on_recording_sample_rate(models, speech_wav_bytes):
    waveform, rate, _ = voice.load_audio(speech_wav_bytes, "speech.wav")
    reference = voice.predict(models.voice, voice.mfcc_features(waveform, rate)[0])
    at_48k = librosa.resample(waveform, orig_sr=rate, target_sr=48000)
    upsampled, rate48, original = voice.load_audio(wav_bytes(at_48k, 48000), "speech48.wav")
    assert original == 48000
    probs = voice.predict(models.voice, voice.mfcc_features(upsampled, rate48)[0])
    assert np.argmax(probs) == np.argmax(reference)
    np.testing.assert_allclose(probs, reference, atol=0.1)


def test_attention_weights_form_a_distribution(models, speech_wav_bytes):
    waveform, rate, _ = voice.load_audio(speech_wav_bytes, "speech.wav")
    features, _ = voice.mfcc_features(waveform, rate)
    weights = voice.attention_over_time(models.voice, features)
    assert weights.shape == (MFCC_FRAMES,)
    assert weights.sum() == pytest.approx(1.0, abs=1e-4)


@pytest.mark.parametrize(
    "payload, filename, message",
    [
        (b"", "voice.wav", "empty"),
        (b"RIFF not really audio", "voice.wav", "Could not decode"),
        (b"abc", "voice.txt", "Unsupported audio format"),
    ],
)
def test_bad_audio_is_rejected_not_replaced(payload, filename, message):
    with pytest.raises(voice.VoiceInputError, match=message):
        voice.load_audio(payload, filename)


def test_silence_is_rejected():
    with pytest.raises(voice.VoiceInputError, match="silent"):
        voice.load_audio(wav_bytes(np.zeros(VOICE_SAMPLE_RATE * 2), VOICE_SAMPLE_RATE), "silence.wav")


@requires_ffmpeg
def test_browser_webm_recording_decodes(tmp_path, models, speech_wav_bytes):
    source = tmp_path / "speech.wav"
    source.write_bytes(speech_wav_bytes)
    webm = tmp_path / "speech.webm"
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-i", str(source), "-ar", "48000", "-c:a", "libopus", str(webm)],
        check=True,
    )
    waveform, rate, _ = voice.load_audio(webm.read_bytes(), "recorded_audio.webm")
    assert rate == VOICE_SAMPLE_RATE
    probs = voice.predict(models.voice, voice.mfcc_features(waveform, rate)[0])
    assert probs.sum() == pytest.approx(1.0, abs=1e-5)
