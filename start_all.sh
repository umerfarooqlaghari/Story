#!/bin/bash

# Function to clean up background processes on exit
cleanup() {
    echo "Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID $MOBILE_PID 2>/dev/null
    exit
}

trap cleanup INT TERM

echo "Starting Backend..."
(cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000) &
BACKEND_PID=$!

echo "Starting Frontend..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Starting Mobile..."
(cd mobile && npm start) &
MOBILE_PID=$!

echo "All services started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Mobile: Expo server started"
echo "Press Ctrl+C to stop all services."

# Wait for all background processes to finish (or until interrupted)
wait $BACKEND_PID $FRONTEND_PID $MOBILE_PID
