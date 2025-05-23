#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Project Root --- 
PROJECT_ROOT=$(pwd)

# --- Backend Setup ---
echo "INFO: Setting up backend..."

# Create instance folder if it doesn't exist (Flask convention for DB)
# This folder will be relative to the backend directory after chdir for gunicorn
# but init-db needs it from project root perspective if FLASK_APP is backend.app
mkdir -p "${PROJECT_ROOT}/backend/instance"

# Install Python dependencies
if [ -f "requirements.txt" ]; then
    echo "INFO: Installing Python dependencies from requirements.txt..."
    pip install --no-cache-dir -r requirements.txt
else
    echo "ERROR: requirements.txt not found!"
    exit 1
fi

# Initialize database
# FLASK_APP needs to point to the app relative to the current directory
# when running flask commands.
export FLASK_APP=backend.app
if flask --help > /dev/null 2>&1; then
    echo "INFO: Initializing backend database..."
    flask init-db
    echo "INFO: Backend database initialized."
else
    echo "ERROR: Flask command not found. Make sure Flask is installed and in PATH."
    exit 1
fi

# Start backend server in the background
echo "INFO: Starting backend server on port 5000..."
# Gunicorn's --chdir makes paths relative to backend/ for the app itself
gunicorn --workers 2 --bind 0.0.0.0:5000 "app:app" --chdir "${PROJECT_ROOT}/backend" --log-level info &
BACKEND_PID=$!
echo "INFO: Backend PID: $BACKEND_PID"

# --- Frontend Setup ---
if [ -d "frontend" ]; then
    echo "INFO: Setting up frontend..."
    cd "${PROJECT_ROOT}/frontend"

    # Check for package.json
    if [ ! -f "package.json" ]; then
        echo "ERROR: frontend/package.json not found! Cannot proceed with frontend setup."
        cd "${PROJECT_ROOT}"
        # Optionally, kill backend if frontend setup fails critically
        # kill $BACKEND_PID
        exit 1
    fi

    # Install Node.js dependencies
    echo "INFO: Installing Node.js dependencies (npm install)..."
    npm install

    # Build the React application
    echo "INFO: Building the React application (npm run build)..."
    npm run build
    echo "INFO: Frontend build complete."

    # Serve the frontend on port 9000
    echo "INFO: Starting frontend server on port 9000..."
    # npx will download serve if not present
    # Serve from the 'build' directory inside 'frontend'
    npx serve -s build -l 9000 &
    FRONTEND_PID=$!
    echo "INFO: Frontend PID: $FRONTEND_PID"
    cd "${PROJECT_ROOT}" # Return to project root
else
    echo "WARNING: frontend directory not found. Skipping frontend setup."
fi

echo ""
echo "Cyberpunk Arcade Dashboard is launching."
echo "Backend API will be available at: http://localhost:5000"
echo "Frontend will be available at: http://localhost:9000"

# Function to clean up background processes on script exit
cleanup() {
    echo ""
    echo "INFO: Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID > /dev/null 2>&1 || echo "INFO: Backend server was already stopped."
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID > /dev/null 2>&1 || echo "INFO: Frontend server was already stopped."
    fi
    echo "INFO: Cleanup complete."
}

# Trap SIGINT (Ctrl+C) and SIGTERM to run cleanup
trap cleanup SIGINT SIGTERM

# Wait for background processes to finish
# This keeps the script alive and allows cleanup to run when Ctrl+C is pressed.
# If only backend is running (e.g. frontend dir missing), wait only for backend.
if [ ! -z "$BACKEND_PID" ] && [ ! -z "$FRONTEND_PID" ]; then
    wait $BACKEND_PID $FRONTEND_PID
elif [ ! -z "$BACKEND_PID" ]; then
    wait $BACKEND_PID
fi

echo "INFO: All processes terminated. Exiting startup script."
