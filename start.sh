#!/bin/bash
set -e

echo "Starting SWARMs Debate Primitive..."

# Start backend API on port 8000
echo "Starting backend on port 8000..."
python -m uvicorn server.api:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in {1..30}; do
  if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "Backend is ready!"
    break
  fi
  echo "Waiting for backend... ($i/30)"
  sleep 2
done

# Start frontend on Railway's assigned PORT
echo "Starting frontend on port $PORT..."
cd frontend
npm start

# If frontend exits, kill backend
kill $BACKEND_PID
