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

Use these versions to match the verified workspace. The frontend uses Next.js 15.2.4, React/React DOM 19.0.0, and Tailwind CSS 3.4.17. Its full direct and transitive dependency tree is resolved in `Client/pnpm-lock.yaml`; install with `--frozen-lockfile` so those exact lockfile versions are used instead of newer range matches. The backend's complete Python dependency set is version-pinned in [Server/requirements.txt](Server/requirements.txt), including TensorFlow 2.13.0; Python 3.13 is not compatible.

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

## Checks run

- `npm run build` in `Client/` completed successfully with the locked frontend dependencies.
- Backend imports and model loading succeeded in the Python 3.11 virtual environment.
- A multipart `POST /predict` using the synthetic sensor CSV returned HTTP 200 with prediction results.
