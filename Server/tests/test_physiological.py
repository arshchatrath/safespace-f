import numpy as np
import pandas as pd
import pytest

from safespace import physiological as ph
from safespace.config import SENSORS, WINDOW_SAMPLES

# Output of the pre-refactor API (commit 1460fb9) for sample_physiological_data.csv.
BASELINE_SAMPLE_PROBS = [0.48839734789829564, 0.2431447025832069, 0.26845794951849733]


def csv_bytes(frame):
    return frame.to_csv(index=False).encode()


def test_feature_layout_matches_model(models):
    assert ph.N_FEATURES == 180 == models.physiological.n_features_in_
    assert ph.FEATURE_NAMES[:2] == ["ECG_mean", "ECG_std"]
    assert ph.FEATURE_NAMES[44:48] == ["ECG_mean_rr", "ECG_std_rr", "ECG_rmssd", "ECG_heart_rate"]
    assert ph.FEATURE_NAMES[48] == "EDA_mean"
    assert len(set(ph.FEATURE_NAMES)) == 180


def test_sample_csv_windows(sample_csv_bytes):
    signals = ph.read_signals(sample_csv_bytes)
    features = ph.window_features(signals)
    # 2000 rows, 1000-row windows every 500 rows -> starts at 0, 500, 1000
    assert features.shape == (3, 180)
    assert np.all(np.isfinite(features))


def test_prediction_matches_pre_refactor_output(models, sample_csv_bytes):
    features = ph.window_features(ph.read_signals(sample_csv_bytes))
    probs, window_probs = ph.predict(models.physiological, features)
    assert window_probs.shape == (3, 3)
    assert probs.sum() == pytest.approx(1.0)
    np.testing.assert_allclose(probs, BASELINE_SAMPLE_PROBS, rtol=0, atol=1e-12)


def test_model_structure(models):
    steps = [name for name, _ in models.physiological.steps]
    assert steps == ["scaler", "feature_selection", "classifier"]
    assert models.physiological.named_steps["feature_selection"].k == 50
    assert list(models.physiological.classes_) == [0, 1, 2]


def test_columns_are_case_insensitive(sample_csv_bytes):
    frame = pd.read_csv(ph.io.BytesIO(sample_csv_bytes))
    frame.columns = [c.lower() for c in frame.columns]
    signals = ph.read_signals(csv_bytes(frame))
    assert list(signals.columns) == list(SENSORS)


def test_missing_column_rejected(sample_csv_bytes):
    frame = pd.read_csv(ph.io.BytesIO(sample_csv_bytes)).drop(columns=["EMG"])
    with pytest.raises(ph.PhysiologicalInputError, match="EMG"):
        ph.read_signals(csv_bytes(frame))


def test_non_numeric_values_rejected(sample_csv_bytes):
    frame = pd.read_csv(ph.io.BytesIO(sample_csv_bytes)).astype(object)
    frame.loc[10, "EDA"] = "n/a"
    with pytest.raises(ph.PhysiologicalInputError, match="non-numeric"):
        ph.read_signals(csv_bytes(frame))


def test_too_few_rows_rejected(sample_csv_bytes):
    frame = pd.read_csv(ph.io.BytesIO(sample_csv_bytes)).head(WINDOW_SAMPLES - 1)
    with pytest.raises(ph.PhysiologicalInputError, match="at least 1000 rows"):
        ph.read_signals(csv_bytes(frame))


def test_not_a_csv_rejected():
    with pytest.raises(ph.PhysiologicalInputError):
        ph.read_signals(b"\xff\xfe\x00binary")


def test_constant_signal_is_handled():
    window = {sensor: ph.zscore(np.full(WINDOW_SAMPLES, 5.0)) for sensor in SENSORS}
    features = ph.extract_window_features(window)
    assert features.shape == (180,)
    assert np.all(np.isfinite(features))


def test_heart_rate_feature_on_synthetic_ecg():
    # 1.2 Hz spike train = 72 beats per minute over a 10 s window at 100 Hz
    ecg = np.zeros(WINDOW_SAMPLES)
    ecg[::83] = 1.0
    mean_rr, _, _, heart_rate = ph.extract_ecg_features(ph.zscore(ecg))
    assert mean_rr == pytest.approx(830, abs=1)
    assert heart_rate == pytest.approx(72, abs=1)
