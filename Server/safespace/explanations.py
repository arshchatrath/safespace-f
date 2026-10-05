"""Explanations returned with every prediction.

physiological  Exact TreeSHAP on the pipeline's random forest, for the class the
               physiological model predicted, averaged over windows.
questionnaire  Kernel SHAP for the predicted class, measured against the average
               training respondent (the questionnaire scaler's stored mean).
voice          The voice model's class probabilities plus the attention weights
               its Attention layer assigns to each part of the recording.
fusion         The effective weight each modality received in late fusion.

Importances are in probability units: a positive value pushed the estimate
toward ``target_class``; a negative value pushed it away. They describe the
model's behaviour, not causes of stress.
"""

import logging

import numpy as np
import shap

from . import physiological, questionnaire, voice
from .config import CLASS_NAMES
from .fusion import MODALITIES, MODALITY_LABELS

log = logging.getLogger(__name__)


def _unavailable(method, exc):
    log.exception("Explanation failed: %s", method)
    return {"available": False, "method": method, "feature_importance": [], "summary": "", "error": str(exc)}


def _class_shap(shap_values, class_index):
    """shap 0.43 returns a list (one array per class) for multi-class models."""
    if isinstance(shap_values, list):
        return np.asarray(shap_values[class_index])
    values = np.asarray(shap_values)
    return values[..., class_index] if values.ndim == 3 else values


class Explainer:
    def __init__(self, physio_model, questionnaire_model, questionnaire_scaler):
        self.physio_scaler = physio_model.named_steps["scaler"]
        self.physio_selector = physio_model.named_steps["feature_selection"]
        self.physio_forest = physio_model.named_steps["classifier"]
        self.physio_tree_explainer = shap.TreeExplainer(self.physio_forest)
        selected = self.physio_selector.get_support(indices=True)
        self.selected_feature_names = [physiological.FEATURE_NAMES[i] for i in selected]

        def questionnaire_proba(x):
            return questionnaire_model.predict_proba(questionnaire_scaler.transform(x))

        self.questionnaire_reference = questionnaire_scaler.mean_.reshape(1, -1)
        self.questionnaire_explainer = shap.KernelExplainer(questionnaire_proba, self.questionnaire_reference)

    # --- physiological -------------------------------------------------------
    def physiological(self, features, probs, top_k=10):
        method = "SHAP (TreeExplainer on the random forest)"
        try:
            target = int(np.argmax(probs))
            selected = self.physio_selector.transform(self.physio_scaler.transform(features))
            values = _class_shap(self.physio_tree_explainer.shap_values(selected), target).mean(axis=0)
            order = np.argsort(-np.abs(values))[:top_k]
            items = [
                {
                    "feature": self.selected_feature_names[i],
                    "importance": float(values[i]),
                    "abs_importance": float(abs(values[i])),
                }
                for i in order
            ]
            toward = [item["feature"] for item in items[:3] if item["importance"] > 0]
            summary = (
                f"Physiological model favoured {CLASS_NAMES[target]}. "
                + (f"Strongest supporting features: {', '.join(toward)}." if toward else
                   "No single feature strongly supported this class.")
            )
            return {
                "available": True, "method": method, "target_class": CLASS_NAMES[target],
                "feature_importance": items, "summary": summary,
            }
        except Exception as exc:  # an explanation failure must not block the prediction
            return _unavailable(method, exc)

    # --- questionnaire -------------------------------------------------------
    def questionnaire(self, answers, probs):
        method = "SHAP (KernelExplainer, reference = training-average answers)"
        try:
            target = int(np.argmax(probs))
            values = _class_shap(
                self.questionnaire_explainer.shap_values(np.array([answers]), silent=True), target
            )[0]
            items = []
            for i in np.argsort(-np.abs(values)):
                name, dass_item, statement = questionnaire.ITEMS[i]
                items.append({
                    "feature": name,
                    "question": statement,
                    "dass21_item": dass_item,
                    "value": float(answers[i]),
                    "importance": float(values[i]),
                    "abs_importance": float(abs(values[i])),
                })
            toward = [f"\"{item['question']}\" ({item['value']:.0f}/3)" for item in items[:2] if item["importance"] > 0]
            summary = (
                f"Questionnaire model favoured {CLASS_NAMES[target]}. "
                + (f"Answers that pushed toward it most: {'; '.join(toward)}." if toward else
                   "No answer pushed strongly toward this class compared with the average respondent.")
            )
            return {
                "available": True, "method": method, "target_class": CLASS_NAMES[target],
                "feature_importance": items, "summary": summary,
            }
        except Exception as exc:
            return _unavailable(method, exc)

    # --- voice ---------------------------------------------------------------
    @staticmethod
    def voice(model, features, probs, frames_used, sample_rate):
        method = "Model probabilities + attention weights over time"
        try:
            target = int(np.argmax(probs))
            items = [
                {
                    "feature": f"Voice_{name}_Stress_Probability",
                    "importance": float(p), "abs_importance": float(p), "value": float(p),
                }
                for name, p in sorted(zip(CLASS_NAMES, probs), key=lambda pair: -pair[1])
            ]
            weights = voice.attention_over_time(model, features)
            on_audio = float(weights[:frames_used].sum())
            # Top attention peaks inside the real (unpadded) part of the recording.
            peaks = np.argsort(-weights[:frames_used])[:3]
            focus = sorted(round(float(voice.frames_to_seconds(f, sample_rate)), 2) for f in peaks)
            summary = (
                f"Voice model favoured {CLASS_NAMES[target]} ({probs[target]:.0%}). "
                f"{on_audio:.0%} of its attention fell on the recorded audio"
                + (f", peaking around {', '.join(f'{s:.2f}s' for s in focus)}." if focus else ".")
            )
            return {
                "available": True, "method": method, "target_class": CLASS_NAMES[target],
                "feature_importance": items,
                "attention": {"share_on_recorded_audio": on_audio, "peak_times_sec": focus},
                "summary": summary,
            }
        except Exception as exc:
            return _unavailable(method, exc)

    # --- fusion --------------------------------------------------------------
    @staticmethod
    def fusion(fusion_model, mod_probs, fused):
        method = "Late-fusion weights"
        try:
            effective = fusion_model.effective_weights(mod_probs)
            total = sum(effective.values())
            contributions = []
            for m in MODALITIES:
                p = np.asarray(mod_probs[m], dtype=float)
                contributions.append({
                    "modality": MODALITY_LABELS[m],
                    "probabilities": p.tolist(),
                    "predicted_class": int(np.argmax(p)),
                    "confidence": float(np.max(p)),
                    "entropy": float(-np.sum(p * np.log(p + 1e-10))),
                    "base_weight": fusion_model.mod_weights[m],
                    "effective_weight": effective[m],
                    "contribution_score": effective[m] / total,
                })
            contributions.sort(key=lambda c: c["contribution_score"], reverse=True)
            top = contributions[0]
            target = int(np.argmax(fused))
            summary = (
                f"Combined estimate: {CLASS_NAMES[target]} ({fused[target]:.0%}). "
                f"The {top['modality']} model carried the most weight ({top['contribution_score']:.0%})."
            )
            return {"available": True, "method": method, "modality_contributions": contributions, "summary": summary}
        except Exception as exc:
            result = _unavailable(method, exc)
            result["modality_contributions"] = []
            return result
