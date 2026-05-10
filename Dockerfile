FROM node:20-bookworm-slim AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    GHOSTBEAM_DEPLOYMENT=render \
    GHOSTBEAM_FRONTEND_DIST=/app/frontend/dist \
    GHOSTBEAM_ARTIFACT_DIR=/tmp/ghostbeam-artifacts \
    GHOSTBEAM_REAL_HARDWARE_WRITES=false

WORKDIR /app

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/backend/
COPY --from=frontend-build /app/frontend/dist/ /app/frontend/dist/

WORKDIR /app/backend

EXPOSE 10000

CMD ["sh", "-c", "python -m uvicorn ghostbeam.api.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
