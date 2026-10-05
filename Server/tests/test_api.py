"""End-to-end tests of POST /predict with the real models (all three modalities together)."""

import numpy as np
import pytest
from fastapi.testclient import TestClient

from conftest import wav_bytes
from safespace import questionnaire, voice
from safespace.config import VOICE_SAMPLE_RATE

ANSWERS = "1,2,0,3,1,2,0"


@pytest.fixture(scope="module")
def client(models):
    import main

    return TestClient(main.app)


def post(client, csv, answers=ANSWERS, audio=None, audio_name="voice.wav", csv_name="signals.csv"):
    files = {"physiological_file": (csv_name, csv, "text/csv")}
    if audio is not None:
        files["voice_audio"] = (audio_name, audio, "audio/wav")
    return client.post("/predict", files=files, data={"dass21_responses": answers})


@pytest.fixture(scope="module")
def result(client, sample_csv_bytes, speech_wav_bytes):
    response = post(client, sample_csv_bytes, audio=speech_wav_bytes)
    assert response.status_code == 200, response.text
    return response.json()


def test_response_contract_used_by_frontend(result):
    assert result["success"] is True
    predictions = result["predictions"]
    for key in ("physio_probs", "dass21_probs", "voice_probs", "fusion_probs"):
        assert len(predictions[key]) == 3
        assert sum(predictions[key]) == pytest.approx(1.0, abs=1e-5)
    assert predictions["prediction_label"] == ["Low", "Medium", "High"][predictions["fusion_pred"]]
    assert predictions["confidence"] == pytest.approx(max(predictions["fusion_probs"]))
    assert set(result["explanations"]) == {"physiological", "questionnaire", "voice", "fusion"}
    metadata = result["metadata"]
    assert metadata["physio_windows"] == 3 and metadata["physio_features"] == 180
    assert metadata["dass21_values"] == [1, 2, 0, 3, 1, 2, 0]
    assert metadata["voice_provided"] is True
    assert metadata["modalities_used"] == ["physiological", "questionnaire", "voice"]


def test_fusion_in_response_matches_formula(result):
    predictions = result["predictions"]
    probs = {m: np.array(predictions[k]) for m, k in
             (("phys", "physio_probs"), ("text", "dass21_probs"), ("voice", "voice_probs"))}
    weights = {"phys": 0.60, "text": 0.25, "voice": 0.15}
    raw = sum(weights[m] * probs[m].max() * probs[m] for m in probs)
    np.testing.assert_allclose(predictions["fusion_probs"], raw / raw.sum(), atol=1e-9)


def test_all_explanations_available(result):
    for name, explanation in result["explanations"].items():
        assert explanation["available"], (name, explanation.get("error"))
        assert explanation["summary"]


def test_questionnaire_shap_values_add_up(models, result):
    explanation = result["explanations"]["questionnaire"]
    target = ["Low", "Medium", "High"].index(explanation["target_class"])
    total = sum(item["importance"] for item in explanation["feature_importance"])
    answers = result["metadata"]["dass21_values"]
    reference = models.questionnaire_scaler.mean_.tolist()
    expected = (questionnaire.predict(models.questionnaire, models.questionnaire_scaler, answers)[target]
                - questionnaire.predict(models.questionnaire, models.questionnaire_scaler, reference)[target])
    assert total == pytest.approx(expected, abs=1e-6)
    assert {item["question"] for item in explanation["feature_importance"]} == {s for _, _, s in questionnaire.ITEMS}


def test_physiological_shap_uses_selected_features(models, result):
    explanation = result["explanations"]["physiological"]
    assert explanation["method"].startswith("SHAP")
    selected = set(models.explainer.selected_feature_names)
    assert {item["feature"] for item in explanation["feature_importance"]} <= selected


def test_voice_is_required(client, sample_csv_bytes):
    response = post(client, sample_csv_bytes)
    assert response.status_code == 422
    assert "voice_audio" in response.text


def test_undecodable_voice_is_rejected(client, sample_csv_bytes):
    response = post(client, sample_csv_bytes, audio=b"not audio", audio_name="recorded_audio.webm")
    assert response.status_code == 422
    assert response.json()["error_type"] == "validation"


def test_silent_voice_is_rejected(client, sample_csv_bytes):
    silence = wav_bytes(np.zeros(VOICE_SAMPLE_RATE * 2), VOICE_SAMPLE_RATE)
    response = post(client, sample_csv_bytes, audio=silence)
    assert response.status_code == 422
    assert "silent" in response.json()["message"]


def test_different_voice_changes_voice_probabilities(client, sample_csv_bytes, result, speech_wav_bytes):
    waveform, rate, _ = voice.load_audio(speech_wav_bytes, "speech.wav")
    response = post(client, sample_csv_bytes, audio=wav_bytes(waveform[::-1], rate))  # reversed speech
    assert response.status_code == 200
    assert not np.allclose(response.json()["predictions"]["voice_probs"], result["predictions"]["voice_probs"], atol=1e-3)


@pytest.mark.parametrize("answers", ["1,2,3", "1,2,0,3,1,2,9"])
def test_invalid_questionnaire_rejected(client, sample_csv_bytes, speech_wav_bytes, answers):
    response = post(client, sample_csv_bytes, answers=answers, audio=speech_wav_bytes)
    assert response.status_code == 422


def test_non_csv_rejected(client, sample_csv_bytes, speech_wav_bytes):
    response = post(client, sample_csv_bytes, audio=speech_wav_bytes, csv_name="signals.json")
    assert response.status_code == 422
    assert ".csv" in response.json()["message"]


def test_missing_sensor_column_rejected(client, speech_wav_bytes):
    csv = b"ECG,EDA,Temp\n" + b"0,0,0\n" * 1200
    response = post(client, csv, audio=speech_wav_bytes)
    assert response.status_code == 422
    assert "EMG" in response.json()["message"]


def test_health(client):
    body = client.get("/health").json()
    assert body["status"] == "ok"
    assert body["voice_input_shape"] == [228, 40, 1]
    assert body["physiological_features"] == 180
