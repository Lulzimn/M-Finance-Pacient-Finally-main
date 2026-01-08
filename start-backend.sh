#!/bin/bash

# Kill existing processes
pkill -f "uvicorn server:app" 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null
sleep 2

# Change to backend directory
cd /Users/lulzimmacbook/Desktop/Project/M-Finance-Pacient-Finally-main/backend

# Activate virtual environment and start server
export PYTHONPATH=/Users/lulzimmacbook/Desktop/Project/M-Finance-Pacient-Finally-main/backend
/Users/lulzimmacbook/Desktop/Project/M-Finance-Pacient-Finally-main/.venv/bin/python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload

