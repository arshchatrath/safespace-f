"""Load the saved models from ``Server/models`` (paths do not depend on the working directory)."""

from dataclasses import dataclass
from functools import lru_cache

import joblib
import numpy as np
from tensorflow.keras.models import load_model

from . import config, voice
from .explanations import Explainer
from .fusion import PhysioDominantFusion
from .voice import Attention


@dataclass(frozen=True)
class Models:
    physiological: object      # Pipeline: StandardScaler -> SelectKBest(k=50) -> RandomForest
    questionnaire: object      # StackingClassifier(RF, LogisticRegression, GaussianNB -> LogisticRegression)
    questionnaire_scaler: object
    voice: object              # Keras CNN -> 2x BiGRU -> Attention -> Dense
    fusion: PhysioDominantFusion
    explainer: Explainer


@lru_cache(maxsize=1)
def load_models():
    """Load every artifact once. Raises if any file is missing, so the API never runs partially."""
    physio = joblib.load(config.PHYSIOLOGICAL_MODEL_PATH)
    questionnaire_model = joblib.load(config.QUESTIONNAIRE_MODEL_PATH)
    questionnaire_scaler = joblib.load(config.QUESTIONNAIRE_SCALER_PATH)
    voice_model = load_model(config.VOICE_MODEL_PATH, compile=False, custom_objects={"Attention": Attention})
    # TensorFlow compiles its prediction functions on first use (~5 s); do it now, not on the first request.
    blank = np.zeros((1, config.MFCC_FRAMES, config.N_MFCC, 1), dtype=np.float32)
    voice.predict(voice_model, blank)
    voice.attention_over_time(voice_model, blank)
    return Models(
        physiological=physio,
        questionnaire=questionnaire_model,
        questionnaire_scaler=questionnaire_scaler,
        voice=voice_model,
        fusion=PhysioDominantFusion(),
        explainer=Explainer(physio, questionnaire_model, questionnaire_scaler),
    )
