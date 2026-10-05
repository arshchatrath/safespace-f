"""Physiological pipeline: CSV -> validated signals -> 10 s windows -> 180 features per window.

The feature code reproduces the extraction used to build the training set of
``models/regularized_global_model.pkl`` (the model's scaler expects exactly 180
inputs in this order). Do not change a feature without retraining the model.
"""

import io

import numpy as np
import pandas as pd
import pywt
from scipy import signal
from scipy.stats import kurtosis, skew

from .config import SAMPLE_RATE_HZ, SENSORS, STRIDE_SAMPLES, WINDOW_SAMPLES


class PhysiologicalInputError(ValueError):
    """The uploaded CSV cannot be analysed."""


# --- Feature names (same order as the extracted vector) ---------------------
TIME_FEATURES = [
    "mean", "std", "var", "skew", "kurtosis", "min", "max", "ptp", "median",
    "q25", "q75", "mean_abs_diff", "rms",
]
FREQ_FEATURES = [
    "vlow_power", "vlow_rel", "low_power", "low_rel", "mid_power", "mid_rel",
    "high_power", "high_rel", "freq_mean", "freq_std", "peak_freq",
]
# db4 wavelet decomposition, level 4: coefficient arrays [a4, d4, d3, d2, d1].
WAVELET_FEATURES = [
    f"wav_{band}_{stat}"
    for band in ("a4", "d4", "d3", "d2", "d1")
    for stat in ("mean", "std", "var", "max")
]
ECG_HRV_FEATURES = ["mean_rr", "std_rr", "rmssd", "heart_rate"]


def _sensor_feature_names(sensor):
    names = TIME_FEATURES + FREQ_FEATURES + WAVELET_FEATURES
    if sensor == "ECG":
        names = names + ECG_HRV_FEATURES
    return [f"{sensor}_{name}" for name in names]


FEATURE_NAMES = [name for sensor in SENSORS for name in _sensor_feature_names(sensor)]
N_FEATURES = len(FEATURE_NAMES)  # 48 (ECG) + 3 x 44 = 180


# --- Feature extraction ------------------------------------------------------
def zscore(x):
    """Standardise one sensor inside one window; a constant signal becomes zeros."""
    x = np.asarray(x)
    std = x.std()
    if std == 0:
        return np.zeros_like(x)
    return (x - x.mean()) / std


def extract_time_features(signal_data):
    """13 time-domain statistics."""
    signal_data = np.asarray(signal_data).astype(float)
    if len(signal_data) == 0:
        return [0.0] * 13

    std_val = np.std(signal_data)
    if std_val == 0:
        skew_val = kurtosis_val = 0.0
    else:
        skew_val = skew(signal_data)
        kurtosis_val = kurtosis(signal_data)

    return [
        np.mean(signal_data), std_val, np.var(signal_data), skew_val, kurtosis_val,
        np.min(signal_data), np.max(signal_data), np.ptp(signal_data),
        np.median(signal_data), np.percentile(signal_data, 25),
        np.percentile(signal_data, 75),
        np.mean(np.abs(np.diff(signal_data))) if len(signal_data) > 1 else 0.0,
        np.sqrt(np.mean(signal_data ** 2)),
    ]


def extract_freq_features(signal_data, fs=SAMPLE_RATE_HZ):
    """11 Welch power-spectrum features: 4 bands x (power, relative power) + 3 summary values.

    With fs=100 Hz and nperseg=250 the frequency resolution is 0.4 Hz, so the
    0.04-0.15 Hz band never contains a bin (its features are always 0) and the
    0.4 Hz bin is counted in both the 0.15-0.4 and 0.4-0.5 Hz bands. The trained
    model was fitted on these same values, so they are kept as-is.
    """
    signal_data = np.asarray(signal_data).astype(float)
    if len(signal_data) < 8:
        return [0.0] * 11

    try:
        freqs, psd = signal.welch(signal_data, fs=fs, nperseg=min(256, len(signal_data) // 4))
        bands = ((0.0, 0.04), (0.04, 0.15), (0.15, 0.4), (0.4, 0.5))
        total_power = np.sum(psd)
        if total_power == 0:
            return [0.0] * 11

        features = []
        for low, high in bands:
            band_power = np.sum(psd[(freqs >= low) & (freqs <= high)])
            features.append(band_power)
            features.append(band_power / total_power)
        features.extend([np.mean(freqs), np.std(freqs), freqs[np.argmax(psd)]])
        return features
    except ValueError:
        return [0.0] * 11


def extract_wavelet_features(signal_data):
    """20 features: mean, std, var and max |coefficient| for each of 5 db4 levels."""
    signal_data = np.asarray(signal_data).astype(float)
    try:
        coeffs = pywt.wavedec(signal_data, "db4", level=4)
    except ValueError:
        return [0.0] * 20

    features = []
    for coeff in coeffs:
        if len(coeff) > 0:
            features.extend([np.mean(coeff), np.std(coeff), np.var(coeff), np.max(np.abs(coeff))])
    features = features[:20]
    return features + [0.0] * (20 - len(features))


def extract_ecg_features(signal_data, fs=SAMPLE_RATE_HZ):
    """4 heart-rate-variability features from R-peaks (minimum 333 ms apart)."""
    signal_data = np.asarray(signal_data).astype(float)
    peaks, _ = signal.find_peaks(signal_data, height=np.std(signal_data), distance=fs // 3)
    if len(peaks) <= 1:
        return [0.0] * 4

    rr_intervals = np.diff(peaks) / fs * 1000  # milliseconds
    return [
        np.mean(rr_intervals),
        np.std(rr_intervals),
        np.sqrt(np.mean(np.diff(rr_intervals) ** 2)),
        len(peaks) / (len(signal_data) / fs) * 60,  # beats per minute
    ]


def extract_window_features(window_signals):
    """Concatenate the features of all sensors for one window (180 values)."""
    features = []
    for sensor in SENSORS:
        data = window_signals[sensor]
        features.extend(extract_time_features(data))
        features.extend(extract_freq_features(data))
        features.extend(extract_wavelet_features(data))
        if sensor == "ECG":
            features.extend(extract_ecg_features(data))
    return np.array(features, dtype=float)


# --- Ingestion and validation -----------------------------------------------
def read_signals(csv_bytes):
    """Parse and validate the uploaded CSV; return a DataFrame with exactly the four sensor columns."""
    try:
        text = csv_bytes.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise PhysiologicalInputError("The physiological file is not UTF-8 text.") from exc

    try:
        data = pd.read_csv(io.StringIO(text))
    except (pd.errors.ParserError, pd.errors.EmptyDataError) as exc:
        raise PhysiologicalInputError(f"The physiological file is not a readable CSV: {exc}") from exc

    columns = {str(column).strip().lower(): column for column in data.columns}
    missing = [sensor for sensor in SENSORS if sensor.lower() not in columns]
    if missing:
        raise PhysiologicalInputError(
            f"Missing required column(s): {', '.join(missing)}. Expected columns: {', '.join(SENSORS)}."
        )

    signals = pd.DataFrame(
        {sensor: pd.to_numeric(data[columns[sensor.lower()]], errors="coerce") for sensor in SENSORS}
    )
    bad = signals.isna() | ~np.isfinite(signals.to_numpy(dtype=float))
    if bad.to_numpy().any():
        counts = {sensor: int(n) for sensor, n in bad.sum().items() if n}
        raise PhysiologicalInputError(
            f"Found empty or non-numeric values in: {counts}. Every row needs a number for each sensor."
        )

    if len(signals) < WINDOW_SAMPLES:
        raise PhysiologicalInputError(
            f"Need at least {WINDOW_SAMPLES} rows ({WINDOW_SAMPLES // SAMPLE_RATE_HZ} s at {SAMPLE_RATE_HZ} Hz); "
            f"got {len(signals)}."
        )
    return signals


def window_features(signals):
    """Slide a 1000-row window in 500-row steps and return a (n_windows, 180) feature matrix.

    Rows after the last complete window are not used.
    """
    rows = []
    for start in range(0, len(signals) - WINDOW_SAMPLES + 1, STRIDE_SAMPLES):
        window = signals.iloc[start:start + WINDOW_SAMPLES]
        normalised = {sensor: zscore(window[sensor].to_numpy()) for sensor in SENSORS}
        rows.append(extract_window_features(normalised))
    features = np.array(rows)
    return np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)


def predict(model, features):
    """Score every window and average the class probabilities over windows."""
    window_probs = model.predict_proba(features)
    return window_probs.mean(axis=0), window_probs
