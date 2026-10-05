# SafeSpace Stress Detection

SafeSpace is a research prototype that estimates stress (Low / Medium / High) from three
required inputs: wearable sensor data, seven DASS-21 stress-item answers and a short voice
recording. A Next.js frontend sends them to a FastAPI backend, where three models score them
separately and a late-fusion rule combines the results. It is not a medical diagnosis.

**How it works, model by model:** see [CODE_WALKTHROUGH.md](CODE_WALKTHROUGH.md). It covers
the data flow, the three models, the fusion formula, the explanations and the known
limitations.

## Project layout

```text
safespace-f/
├── Client/                         Next.js frontend (assessment at /check)
├── Server/                         FastAPI backend
│   ├── main.py                     /predict and /health
│   ├── safespace/                  physiological, questionnaire, voice, fusion, explanations
│   ├── models/                     saved model files
│   └── tests/                      pytest suite
├── sample_physiological_data.csv   synthetic 100 Hz CSV for trying the app
└── CODE_WALKTHROUGH.md
```

## Requirements

- Python 3.11 (TensorFlow 2.13 does not support 3.12+)
- **ffmpeg** on the backend machine, needed to decode browser recordings (WebM), M4A and MP3.
  Windows: `winget install Gyan.FFmpeg`; macOS: `brew install ffmpeg`; Debian/Ubuntu: `apt install ffmpeg`.
- Node.js 22 and pnpm 10.10.0 for the frontend

## Run the app

Backend (Windows PowerShell):

```powershell
cd Server
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Backend (macOS/Linux):

```bash
cd Server
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
```

Or with Docker: `docker build -t safespace-api Server && docker run -p 8000:8000 safespace-api`.

Frontend, in a second terminal:

```bash
cd Client
pnpm install --frozen-lockfile
pnpm run dev
```

Open <http://localhost:3000/check>. API docs: <http://localhost:8000/docs>; model status:
<http://localhost:8000/health>. To restrict which sites may call the API, set
`SAFESPACE_CORS_ORIGINS` (comma-separated) before starting the backend.

## Try a prediction

1. Upload `sample_physiological_data.csv`.
2. Answer the seven statements (at least one above 0).
3. Record a few sentences or upload an audio file. Only the first ~5.3 s are analysed.
4. Press **Analyze stress level**.

`POST /predict` requires all three form fields: `physiological_file` (CSV with `ECG`, `EDA`,
`EMG`, `Temp` at 100 Hz, at least 1,000 rows), `dass21_responses` (seven numbers 0–3) and
`voice_audio`. Invalid input returns HTTP 422 with a message explaining what to fix.

The sample CSV and the test speech clip are synthetic. They show that the pipeline runs, not
that its estimates are accurate.

## Tests

```bash
cd Server
python -m pip install -r requirements-dev.txt
python -m pytest
```

The suite loads the real models and tests each model on its own, the fusion rule, and the
full `/predict` endpoint. Frontend: `cd Client && pnpm run build`.

## Known limitations

Details and evidence are in [CODE_WALKTHROUGH.md §11](CODE_WALKTHROUGH.md#11-missing-and-unverified-components).
In short: the training code, data and evaluations are not in this repository; the
physiological features the API computes do not match the normalisation seen in the training
data; and the voice model's training sample rate and stress labels are unverified.
