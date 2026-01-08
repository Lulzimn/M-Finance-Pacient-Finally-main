# Backend Dockerfile për M-Dental
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Start application (bind to platform PORT if provided)
CMD ["sh", "-lc", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]
