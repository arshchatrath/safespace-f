"""Late fusion of the physiological, questionnaire and voice probability vectors.

Each model returns P(Low), P(Medium), P(High). For modality m with base weight
w_m and probabilities p_m:

    effective weight  e_m = w_m * max(p_m)          (more decisive outputs count more)
    raw score         r_c = sum_m e_m * p_m[c]
    fused probability f_c = r_c / sum_c' r_c'       (renormalised to sum to 1)
    predicted class       = argmax_c f_c

Base weights: physiological 0.60, questionnaire 0.25, voice 0.15. This is a
fixed rule; nothing is learned from data (``fit`` is a no-op).
"""

import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin

from .config import CLASS_NAMES

MODALITIES = ("phys", "text", "voice")
MODALITY_LABELS = {"phys": "physiological", "text": "questionnaire", "voice": "voice"}
BASE_WEIGHTS = {"phys": 0.60, "text": 0.25, "voice": 0.15}


class FusionInputError(ValueError):
    """A modality's probabilities are missing or malformed."""


class PhysioDominantFusion(BaseEstimator, ClassifierMixin):
    """Confidence-weighted average of three probability vectors.

    The class name and attributes match ``models/fusion_model.pkl`` so that
    artifact keeps unpickling. ``class_weights`` is stored for compatibility
    but is not used when predicting.
    """

    def __init__(self, class_weights=None):
        self.class_weights = class_weights if class_weights else {0: 1.0, 1: 1.0, 2: 1.0}
        self.mod_weights = dict(BASE_WEIGHTS)
        self.is_fitted_ = True

    def fit(self, X, y):
        return self

    def _validated(self, mod_probs):
        missing = [MODALITY_LABELS[m] for m in MODALITIES if m not in mod_probs]
        if missing:
            raise FusionInputError(f"Fusion needs all three modalities; missing: {', '.join(missing)}")
        probs = {}
        for modality in MODALITIES:
            p = np.asarray(mod_probs[modality], dtype=float)
            if p.shape != (len(CLASS_NAMES),):
                raise FusionInputError(f"{MODALITY_LABELS[modality]} probabilities must have length 3")
            if not np.all(np.isfinite(p)) or np.any(p < 0) or not np.isclose(p.sum(), 1.0, atol=1e-3):
                raise FusionInputError(f"{MODALITY_LABELS[modality]} probabilities must be >= 0 and sum to 1")
            probs[modality] = p
        return probs

    def effective_weights(self, mod_probs):
        """e_m = w_m * max(p_m) for each modality."""
        probs = self._validated(mod_probs)
        return {m: self.mod_weights[m] * float(np.max(probs[m])) for m in MODALITIES}

    def predict_proba(self, mod_probs):
        probs = self._validated(mod_probs)
        weights = self.effective_weights(probs)
        raw = sum(weights[m] * probs[m] for m in MODALITIES)
        return raw / raw.sum()

    def predict(self, mod_probs):
        return int(np.argmax(self.predict_proba(mod_probs)))
