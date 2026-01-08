#!/bin/bash
# Kill any existing process on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null

# Wait a moment
sleep 1

# Start the server
cd "$(dirname "$0")"
python3 -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
