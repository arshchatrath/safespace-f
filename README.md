# SafeSpace Stress Detection

SafeSpace is a full-stack stress assessment app. The Next.js frontend sends physiological sensor data, DASS-21 responses, and optional voice audio to a FastAPI backend for multimodal prediction.

## Project layout

```text
safespace-f/
├── Client/                         # Next.js frontend
├── Server/                         # FastAPI API, models, and ML logic
│   ├── main.py
│   ├── latefusion_final.py
│   ├── requirements.txt
│   └── models/
├── sample_physiological_data.csv   # Synthetic CSV for testing the upload flow
└── README.md
```

## Requirements

- Python 3.11.9 for the backend
- Node.js 22.14.0 with npm 10.9.2
- pnpm 10.10.0 for the frontend (pinned in `Client/package.json`)

Use these versions to match the verified workspace. The frontend lockfile resolves Next.js 15.2.8, React/React DOM 19.0.0, and Tailwind CSS 3.4.17. Its full direct and transitive dependency tree is resolved in `Client/pnpm-lock.yaml`; install with `--frozen-lockfile` so those exact lockfile versions are used instead of newer range matches. The backend's complete Python dependency set is version-pinned in [Server/requirements.txt](Server/requirements.txt), including TensorFlow 2.13.0; Python 3.13 is not compatible.

## Run the app on Windows

Start the backend first in a terminal:

```powershell
cd Server
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

In a second terminal, start the frontend:

```powershell
cd Client
pnpm --version  # expected: 10.10.0
pnpm install --frozen-lockfile
pnpm run dev
```

If pnpm is not installed, install the pinned version once with `npm install --global pnpm@10.10.0`.

Open the assessment at [http://localhost:3000/check](http://localhost:3000/check). The backend API documentation is at [http://localhost:8000/docs](http://localhost:8000/docs).

## Test a prediction

1. Keep both servers running.
2. On the assessment page, upload `sample_physiological_data.csv` from the repository root.
3. Complete all seven questionnaire answers, each from 0 to 3, and submit.
4. Confirm the result page displays a prediction and probabilities.

The sample contains 2,000 rows with the required `ECG`, `EDA`, `EMG`, and `Temp` columns. It is synthetic test data; it verifies the upload and prediction pipeline but is not real sensor data and should not be used to assess a person's stress. Voice analysis is optional and can be tested by recording or uploading audio in the app.

The API's `POST /predict` endpoint requires a CSV upload (`physiological_file`) and seven DASS-21 answers (`dass21_responses`). A voice file (`voice_audio`) is optional.

## Backend calculation, in brief

The API processes each input separately before combining their results:

1. It reads four CSV columns (`ECG`, `EDA`, `EMG`, `Temp`) as 10-second windows, moving forward 5 seconds at a time. At the expected 100 samples per second, each window has 1,000 rows and each step is 500 rows.
2. It calculates 180 summary values for every window: 13 basic measurements, 11 measurements of signal strength at different speeds, 20 measurements of fast and slow signal changes for each sensor, plus 4 extra heartbeat measurements for ECG.
3. The saved physiological model scores each window; the API averages those scores into one three-number result for Low, Medium, and High.
4. The seven questionnaire answers are scaled with the saved scaler, then scored by the saved questionnaire model.
5. If audio is provided, the API turns it into short sound-description values and scores them with the voice model. Without audio, it uses a near-even default only for the final combination.
6. `latefusion_final.py` combines the three probability lists. It gives physiological, questionnaire, and voice results weights of 0.60, 0.25, and 0.15. A result whose top class score is higher gets more influence. The combined scores are then rescaled to add up to 1, and the largest becomes the label.

The returned `confidence` is simply the highest combined score. It is not a measured accuracy rate or a medical conclusion. For the step-by-step explanation, see [CODE_WALKTHROUGH.md](CODE_WALKTHROUGH.md).

## Backend verification and limits

The backend has been checked in the Python 3.11.9 environment: `pip check` found no broken dependencies; the app loaded its saved models and exposed `/docs`; a valid sample request returned HTTP 200; a three-answer questionnaire returned HTTP 422 as expected; a request with a temporary test-tone audio file also returned HTTP 200; and `test_voice_integration.py` passed all four checks.

These checks show that the request pipeline runs; they do not prove that its stress scores are accurate on real people or real sensor recordings. The repository sample and test audio are synthetic.

Important input note: `main.py` declares a 700-to-100 sampling-rate factor, but the active CSV processing code does not apply it. Upload CSV data that is already sampled at 100 rows per second. Raw 700 Hz data needs resampling before upload; otherwise the code treats 1,000 rows as a 10-second window when they are only about 1.43 seconds.

The explanation code initializes SHAP with randomly generated background rows, not real training examples, and may fall back to feature variation if SHAP fails. Treat the explanations as experimental. Also, `test_voice.py` references voice-only and debug routes that are not present in the active API; use `test_voice_integration.py` for the voice model checks and `POST /predict` for API checks.

## Checks run

- `pnpm run build` in `Client/` completed successfully with the locked frontend dependencies.
- `python -m pip check` in `Server/.venv` reported no broken requirements.
- The voice integration script passed 4/4 checks.
- Multipart prediction requests with and without optional voice audio returned HTTP 200 using synthetic test inputs.
