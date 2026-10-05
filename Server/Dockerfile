FROM python:3.11-slim

WORKDIR /app

# ffmpeg decodes browser recordings (WebM/Opus), M4A and MP3; libsndfile reads WAV/FLAC/OGG.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py latefusion_final.py ./
COPY safespace ./safespace
COPY models ./models

# The frontend calls http://localhost:8000/predict.
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
