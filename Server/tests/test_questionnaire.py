import numpy as np
import pytest

from safespace import questionnaire as q

# Output of the pre-refactor API (commit 1460fb9) for answers 1,2,0,3,1,2,0.
BASELINE_PROBS = [0.460174126075934, 0.41474939698385127, 0.12507647694021468]


@pytest.mark.parametrize("raw", ["1,2,0,3,1,2,0", "[1,2,0,3,1,2,0]", " 1, 2, 0, 3, 1, 2, 0 "])
def test_accepted_formats(raw):
    assert q.parse_answers(raw) == [1.0, 2.0, 0.0, 3.0, 1.0, 2.0, 0.0]


@pytest.mark.parametrize(
    "raw, message",
    [
        ("1,2,3", "exactly 7"),
        ("1,2,0,3,1,2,4", "between 0 and 3"),
        ("1,2,0,3,1,2,-1", "between 0 and 3"),
        ("a,b,c,d,e,f,g", "Invalid DASS-21 format"),
        ('{"a": 1}', "list of 7"),
        ("[1,2,0,3,1,2,true]", "not a number"),
        ("", "empty"),
    ],
)
def test_rejected_inputs(raw, message):
    with pytest.raises(q.QuestionnaireInputError, match=message):
        q.parse_answers(raw)


def test_items_match_frontend_order():
    assert len(q.ITEMS) == 7
    assert [item for _, item, _ in q.ITEMS] == [1, 6, 8, 11, 12, 14, 18]


def test_prediction_matches_pre_refactor_output(models):
    probs = q.predict(models.questionnaire, models.questionnaire_scaler, [1, 2, 0, 3, 1, 2, 0])
    np.testing.assert_allclose(probs, BASELINE_PROBS, rtol=0, atol=1e-12)


def test_higher_answers_raise_high_class_probability(models):
    low = q.predict(models.questionnaire, models.questionnaire_scaler, [0] * 7)
    high = q.predict(models.questionnaire, models.questionnaire_scaler, [3] * 7)
    assert np.argmax(low) == 0
    assert np.argmax(high) == 2
    assert high[2] > low[2]


def test_model_structure(models):
    names = [name for name, _ in models.questionnaire.estimators]
    assert names == ["rf", "lr", "nb"]
    assert models.questionnaire.n_features_in_ == 7
    assert models.questionnaire_scaler.n_features_in_ == 7
