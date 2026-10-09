#!/bin/bash

# Function to clean up background processes on exit
cleanup() {
    echo "Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID $MOBILE_PID 2>/dev/null
    exit
}

trap cleanup INT TERM

# Kill stale processes on ports 8000, 3002, and 8082 to prevent [Errno 48]
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null
lsof -ti:8082 | xargs kill -9 2>/dev/null

echo "Starting Backend..."
(cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000) &
BACKEND_PID=$!

echo "Starting Frontend (on port 3002)..."
(cd frontend && npm run dev -- --port 3002) &
FRONTEND_PID=$!

echo "Starting Mobile (on iOS Simulator, port 8082)..."
(cd mobile && npm run ios -- --port 8082 --clear) &
MOBILE_PID=$!

echo "All services started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3002"
echo "Mobile: Expo server started on port 8082"
echo "Press Ctrl+C to stop all services."

# Wait for all background processes to finish (or until interrupted)
wait $BACKEND_PID $FRONTEND_PID $MOBILE_PID
