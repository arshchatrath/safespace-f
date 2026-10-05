import joblib
import numpy as np
import pytest

from safespace.config import MODELS_DIR
from safespace.fusion import BASE_WEIGHTS, FusionInputError, PhysioDominantFusion

PHYS = np.array([0.5, 0.3, 0.2])
TEXT = np.array([0.1, 0.2, 0.7])
VOICE = np.array([0.2, 0.6, 0.2])


def test_base_weights():
    assert BASE_WEIGHTS == {"phys": 0.60, "text": 0.25, "voice": 0.15}
    assert sum(BASE_WEIGHTS.values()) == pytest.approx(1.0)


def test_formula_by_hand():
    fusion = PhysioDominantFusion()
    # effective weights: 0.60*0.5=0.30, 0.25*0.7=0.175, 0.15*0.6=0.09
    raw = 0.30 * PHYS + 0.175 * TEXT + 0.09 * VOICE
    expected = raw / raw.sum()
    probs = fusion.predict_proba({"phys": PHYS, "text": TEXT, "voice": VOICE})
    np.testing.assert_allclose(probs, expected)
    assert probs.sum() == pytest.approx(1.0)
    assert fusion.predict({"phys": PHYS, "text": TEXT, "voice": VOICE}) == int(np.argmax(expected))


def test_effective_weights():
    weights = PhysioDominantFusion().effective_weights({"phys": PHYS, "text": TEXT, "voice": VOICE})
    assert weights == pytest.approx({"phys": 0.30, "text": 0.175, "voice": 0.09})


def test_unanimous_inputs_keep_their_class():
    for c in range(3):
        p = np.full(3, 0.1)
        p[c] = 0.8
        assert PhysioDominantFusion().predict({"phys": p, "text": p, "voice": p}) == c


def test_voice_changes_the_result():
    # Physiological and questionnaire tie between Low and High; voice breaks the tie.
    phys, text = np.array([0.45, 0.10, 0.45]), np.array([0.45, 0.10, 0.45])
    fusion = PhysioDominantFusion()
    assert fusion.predict({"phys": phys, "text": text, "voice": np.array([0.9, 0.05, 0.05])}) == 0
    assert fusion.predict({"phys": phys, "text": text, "voice": np.array([0.05, 0.05, 0.9])}) == 2


@pytest.mark.parametrize("missing", ["phys", "text", "voice"])
def test_every_modality_is_required(missing):
    inputs = {"phys": PHYS, "text": TEXT, "voice": VOICE}
    del inputs[missing]
    with pytest.raises(FusionInputError, match="missing"):
        PhysioDominantFusion().predict_proba(inputs)


@pytest.mark.parametrize("bad", [[0.5, 0.5], [0.5, 0.6, 0.2], [np.nan, 0.5, 0.5], [-0.1, 0.6, 0.5]])
def test_malformed_probabilities_rejected(bad):
    with pytest.raises(FusionInputError):
        PhysioDominantFusion().predict_proba({"phys": bad, "text": TEXT, "voice": VOICE})


def test_saved_fusion_artifact_still_loads_and_agrees():
    saved = joblib.load(MODELS_DIR / "fusion_model.pkl")
    inputs = {"phys": PHYS, "text": TEXT, "voice": VOICE}
    np.testing.assert_allclose(saved.predict_proba(inputs), PhysioDominantFusion().predict_proba(inputs))
