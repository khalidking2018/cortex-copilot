# Stage 1: Build the React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup the Python Backend and Serve
FROM python:3.11-slim AS backend-runner
WORKDIR /app/backend

# Install system dependencies for sqlite
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and filter out local machine developer links (like -e paths)
COPY backend/requirements.txt ./
RUN grep -v "\-e " requirements.txt > clean_requirements.txt && \
    pip install --no-cache-dir -r clean_requirements.txt

# Copy backend source code and SQLite database
COPY backend/ ./

# Copy built frontend assets to the relative path expected by main.py
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose port 8000 for serving both API and static site
EXPOSE 8000

ENV PORT=8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
