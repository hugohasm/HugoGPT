FROM node:22-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt && useradd --uid 10001 --create-home agent
COPY backend/cv_app.py ./
COPY backend/data/cv.md ./data/cv.md
COPY --from=frontend-builder /frontend/dist ./static
USER agent
EXPOSE 8000
CMD ["sh", "-c", "exec uvicorn cv_app:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
