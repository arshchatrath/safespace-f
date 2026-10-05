"""Questionnaire pipeline: seven DASS-21 answers -> validation -> scaling -> stacking classifier.

The frontend asks the seven items of the DASS-21 *stress* subscale, in the order
below (original DASS-21 item numbers 1, 6, 8, 11, 12, 14, 18). Each answer is
0 = never, 1 = sometimes, 2 = often, 3 = almost always.
"""

import json
import math

from .config import DASS21_ITEM_COUNT, DASS21_MAX_SCORE, DASS21_MIN_SCORE


class QuestionnaireInputError(ValueError):
    """The submitted answers cannot be scored."""


# (feature name, original DASS-21 item number, statement shown to the user)
ITEMS = (
    ("Q1_hard_to_wind_down", 1, "I found it hard to wind down"),
    ("Q2_over_reacted", 6, "I tended to over-react to situations"),
    ("Q3_nervous_energy", 8, "I felt that I was using a lot of nervous energy"),
    ("Q4_agitated", 11, "I found myself getting agitated"),
    ("Q5_difficult_to_relax", 12, "I found it difficult to relax"),
    ("Q6_intolerant_of_interruptions", 14,
     "I was intolerant of anything that kept me from getting on with what I was doing"),
    ("Q7_touchy", 18, "I felt that I was rather touchy"),
)
FEATURE_NAMES = [name for name, _, _ in ITEMS]


def parse_answers(raw):
    """Accept ``"1,2,0,3,1,2,0"`` or ``"[1,2,0,3,1,2,0]"`` and return seven floats in [0, 3]."""
    text = (raw or "").strip()
    if not text:
        raise QuestionnaireInputError("dass21_responses is empty; send 7 comma-separated numbers.")

    try:
        values = json.loads(text)
    except json.JSONDecodeError:
        try:
            values = [float(part) for part in text.strip("[](){}").split(",")]
        except ValueError as exc:
            raise QuestionnaireInputError(
                f"Invalid DASS-21 format. Expected 7 comma-separated numbers or a JSON array, got: {raw!r}"
            ) from exc

    if not isinstance(values, list):
        raise QuestionnaireInputError("dass21_responses must be a list of 7 numbers.")
    if len(values) != DASS21_ITEM_COUNT:
        raise QuestionnaireInputError(
            f"DASS-21 must contain exactly {DASS21_ITEM_COUNT} values, got {len(values)}"
        )

    answers = []
    for index, value in enumerate(values):
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
            raise QuestionnaireInputError(f"DASS-21 value at index {index} is not a number: {value!r}")
        if not DASS21_MIN_SCORE <= value <= DASS21_MAX_SCORE:
            raise QuestionnaireInputError(
                f"DASS-21 values must be between {DASS21_MIN_SCORE} and {DASS21_MAX_SCORE}, "
                f"got {value} at index {index}"
            )
        answers.append(float(value))
    return answers


def predict(model, scaler, answers):
    """Standardise with the training scaler, then return the stacking classifier's 3 class probabilities."""
    return model.predict_proba(scaler.transform([answers]))[0]
