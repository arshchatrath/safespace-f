# SafeSpace Code Walkthrough

This guide follows one request through the SafeSpace backend in everyday language. It is for a first-time reader and assumes no machine-learning background.

SafeSpace is a research prototype. Its output is not a medical diagnosis, and the synthetic sample files do not show whether the model is accurate for real people.

A **model** is a saved program that learned patterns from example data. A **feature** is one number that summarizes part of an input. A **class** is one possible result: Low, Medium, or High. A model's **probability score** is its strength of support for a class; it is not a promise that the result is correct.

## The main backend files

- `Server/main.py` starts the FastAPI service, loads the saved models, checks incoming files, prepares the data, calls each model, combines the results, and sends JSON back to the browser.
- `Server/latefusion_final.py` contains the small rule that combines the model probability lists. “Fusion” here just means combining separate results at the end.
- `Server/models/regularized_global_model.pkl` is the saved physiological-signal model.
- `Server/models/stacking_classifier_model.pkl` is the saved questionnaire model.
- `Server/models/scaler.pkl` stores the questionnaire scaling values learned during training.
- `Server/models/model_finetuned.h5` is the saved voice model.
- `Server/requirements.txt` lists the exact Python package versions used by the backend.
- `Server/test_voice_integration.py` checks voice-model loading, sound-feature creation, and prediction.

## What the API receives

The active endpoint is `POST /predict`, documented at `http://localhost:8000/docs`. It accepts one web form with:

- `physiological_file`: a CSV file with the columns `ECG`, `EDA`, `EMG`, and `Temp`.
- `dass21_responses`: exactly seven numbers, each from 0 to 3. They can be sent as `1,2,0,3,1,2,0` or `[1,2,0,3,1,2,0]`.
- `voice_audio`: an optional WAV, MP3, M4A, FLAC, OGG, or WebM file.

The seven answers are the seven questions selected by this app; they are not all 21 questions in the full DASS-21 questionnaire.

## Step 1: Load the saved models

When `main.py` starts, it loads the physiological model, questionnaire model, scaler, and voice model from `Server/models/`. The server must be launched with `Server/` as its current folder because these model paths are relative to that folder. If a required model file is missing or cannot load, startup stops with an error instead of starting a partly working API.

The voice model has an attention layer: a part that helps it focus on useful moments in the sound. `main.py` defines that part so TensorFlow can rebuild the saved model when loading it.

## Step 2: Turn CSV rows into signal windows

`process_csv_data` reads the uploaded CSV. It expects 100 samples per second:

- A 10-second window contains `100 samples/second × 10 seconds = 1,000 rows`.
- The next window starts 5 seconds later, so it advances by `100 × 5 = 500 rows`.
- The windows overlap by 500 rows, or 5 seconds.

For example, the 2,000-row project sample creates three windows, starting at rows 0, 500, and 1,000. Each window produces one set of model inputs.

Before calculating summaries, the code normalizes each sensor separately inside each window. For each value it subtracts that window's average and divides by that window's standard deviation:

```text
normalized value = (value - window average) / window standard deviation
```

This puts signals on a comparable scale. Standard deviation is a measure of how far values tend to be from their average. A constant signal, whose standard deviation is zero, becomes all zeros. If a required sensor column is missing, the current code prints a warning and fills that sensor with zeros; it is better to provide all four required columns than to rely on this fallback.

## Step 3: Calculate 180 signal summaries per window

The model does not receive the full 1,000 rows directly. `extract_window_features` turns each sensor window into a list of summaries called features. A feature is one number that describes part of the signal.

For every sensor, the code calculates:

- **13 basic measurements:** average, standard deviation and variance (how spread out the values are), skew (whether values lean to one side), kurtosis (how often unusually large or small values occur), minimum, maximum, range, median, 25th percentile, 75th percentile, average change between neighboring readings, and root-mean-square size (another measure of overall signal size).
- **11 frequency measurements:** using Welch's method (a way to estimate signal strength at different repeating speeds), it measures signal power in four frequency bands: 0–0.04 Hz, 0.04–0.15 Hz, 0.15–0.4 Hz, and 0.4–0.5 Hz. For each band it records both the power and the share of total power, then records the average frequency, frequency spread, and strongest frequency.
- **20 wavelet measurements:** a wavelet is a way to separate quick changes from slow changes in a signal. The code makes five levels using `db4`; for each level it records the average, standard deviation, variance, and largest absolute value.

ECG receives four additional measurements from detected heartbeat peaks: average time between peaks, variation in that time, RMSSD (a summary of how much the time between nearby beats changes), and estimated beats per minute.

That makes the feature count:

```text
ECG:                 13 + 11 + 20 + 4 = 48
EDA, EMG, and Temp:   13 + 11 + 20     = 44 each
Total:               48 + 44 + 44 + 44 = 180 values per window
```

The API replaces invalid numeric results such as `NaN` with zero before asking the physiological model to score the windows.

## Step 4: Get the physiological result

The saved physiological model returns three scores for each window, in class order 0, 1, 2. The current code maps these to `Low`, `Medium`, and `High`. It averages each class score across all windows, giving one three-number list for the whole CSV.

These are model scores that add to about 1. They are not a guarantee of real-world accuracy.

## Step 5: Get the questionnaire result

`validate_and_parse_dass21` checks that there are exactly seven numeric answers and each is between 0 and 3. The saved scaler then adjusts the answers using values learned when the questionnaire model was trained. The saved questionnaire model uses those seven adjusted values to return scores for Low, Medium, and High.

The saved scaler adjusts answers using averages and spreads recorded during training, so new answers use the same scale as the training examples. The exact values are stored in `scaler.pkl`; they should not be replaced with values guessed from one person's answers.

## Step 6: Optionally get the voice result

If `voice_audio` is present, the API saves it temporarily and reads it with Librosa. It turns the sound into 40 Mel-frequency cepstral coefficients (MFCCs) per time step. In plain terms, these numbers summarize the changing tone and sound shape over time.

The voice model expects a fixed-size input of `228 time steps × 40 values`. Short inputs are padded with zeros; long inputs are cut to 228 steps. The code adds batch and channel dimensions, producing this model input shape:

```text
1 × 228 × 40 × 1
```

The voice model returns three scores for Low, Medium, and High. If no audio is supplied, the API uses `[0.33, 0.34, 0.33]` internally as a nearly even voice score so the combination can still run. In that case, the response reports `voice_probs: null` and `voice_provided: false`.

## Step 7: Combine the three results

`PhysioDominantFusion` combines the physiological, questionnaire, and voice scores. Its modality weights are:

- Physiological: `0.60`
- Questionnaire: `0.25`
- Voice: `0.15`

It also gives more influence to an input when that input's highest class score is larger. In this code, that top score is named `confidence`; it is only a model score. For result `c` (Low, Medium, or High), the calculation is:

```text
raw[c] = 0.60 × max(physio) × physio[c]
       + 0.25 × max(questionnaire) × questionnaire[c]
       + 0.15 × max(voice) × voice[c]

final[c] = raw[c] / (raw[Low] + raw[Medium] + raw[High])
```

The result with the largest `final` value becomes `prediction_label`. The response's `confidence` is that largest final value. For example, `0.46` means the combined model score is 0.46; it does not mean the model is correct 46% of the time. It is not measured accuracy or medical certainty.

For one observed run on the sample CSV with answers `[1,2,0,3,1,2,0]` and no audio, the final scores were approximately Low `0.464`, Medium `0.297`, and High `0.239`. The API returned Low. This illustrates the arithmetic only; the file is synthetic.

The fusion object is also given `class_weights`, a setting that could change scores for examples with known answers. The API has no known answer when making a prediction, and its call does not supply a true label. The current code therefore does not apply `class_weights` to the API prediction.

## Step 8: Build the response

A successful request returns JSON with:

- `predictions`: per-input scores, combined scores, label, and top combined score.
- `explanations`: feature or probability summaries for each input and a summary of the combined result.
- `metadata`: number of signal windows, 180 features per window, the seven questionnaire values, and whether audio was included.

Bad CSV content or invalid questionnaire answers are returned as HTTP 422 with a message. Unexpected internal errors are returned as HTTP 500.

## How to verify it

From the repository root, start the backend as described in `README.md`, then open `/docs` or submit the root `sample_physiological_data.csv` with seven valid answers. The sample is synthetic and contains 2,000 rows at 100 samples per second. It is useful for checking that the file-to-response pipeline runs, not for evaluating model quality.

The backend checks run for this walkthrough were:

- `pip check`: no broken installed requirements.
- `test_voice_integration.py`: all four voice loading, feature, model, and pipeline checks passed.
- `POST /predict` with the saved CSV and seven answers: HTTP 200, three windows, and 180 features per window.
- `POST /predict` with a three-answer questionnaire: HTTP 422 with the expected seven-answer validation message.
- `POST /predict` with the CSV, questionnaire, and a temporary synthetic WAV tone: HTTP 200 with voice scores and a fused result.

These are software-path checks only. The test WAV was a pure tone, not speech, and the CSV was artificial; neither test measures how accurate stress predictions are.

## Important limitations found in the code

1. **Sensor sample rate:** `main.py` declares an original rate of 700 samples per second, a target rate of 100, and a downsampling factor of 7. The active `process_csv_data` function does not use that factor. Use already-resampled 100 Hz CSV files for the current API. A raw 700 Hz file will be split into windows with the wrong duration and analyzed with the wrong frequency scale.
2. **Explanation reference data:** the SHAP explainers are initialized with randomly generated background rows, not real training examples. The physiological explainer can also fall back to feature variation when SHAP errors; its response may still say the method is `SHAP`. Treat explanations as experimental until real reference data and the fallback labeling are corrected.
3. **Old test endpoints:** `test_voice.py` refers to `/predict/voice-only` and `/debug/explanations`; the active API only registers `/predict`. `test_explanations.py` sends a `voice_probabilities` field that `/predict` does not accept, so it does not test uploaded audio. Use `voice_audio` to test the actual voice path.
4. **Deployment settings:** CORS currently allows every origin. That is convenient for local testing but should be restricted before public deployment.
