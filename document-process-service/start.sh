#!/bin/bash

# Trap SIGINT (Ctrl+C) and SIGTERM to clean up processes
trap 'cleanup' SIGINT SIGTERM EXIT

cleanup() {
    echo "Cleaning up processes..."
    if [[ -n $CONSUMER_PID ]] && ps -p $CONSUMER_PID > /dev/null; then
        echo "Stopping Kafka consumer (PID: $CONSUMER_PID)"
        kill $CONSUMER_PID
    fi
    
    if [[ -n $SERVER_PID ]] && ps -p $SERVER_PID > /dev/null; then
        echo "Stopping FastAPI server (PID: $SERVER_PID)"
        kill $SERVER_PID
    fi
    
    exit 0
}

# Start the FastAPI server in background
echo "Starting FastAPI server..."
python -m uvicorn server:app --host 0.0.0.0 --port 8000 &
SERVER_PID=$!

# Wait for server to be ready (5 seconds should be enough)
echo "Waiting for FastAPI server to be ready..."
sleep 5

# Check if server is running
if ! ps -p $SERVER_PID > /dev/null; then
    echo "Error: FastAPI server failed to start"
    exit 1
fi

# Start the Kafka consumer
echo "Starting Kafka consumer..."
python kafka_consumer.py &
CONSUMER_PID=$!

# Print PIDs for debugging
echo "FastAPI server started with PID: $SERVER_PID"
echo "Kafka consumer started with PID: $CONSUMER_PID"

# Keep the script running
wait $SERVER_PID
