#!/bin/bash

# Kill existing processes
lsof -ti:3006 | xargs kill -9 2>/dev/null
sleep 1

# Change to frontend directory and start
cd /Users/lulzimmacbook/Desktop/Project/M-Finance-Pacient-Finally-main/frontend
PORT=3006 npm start
