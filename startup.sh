#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Project Root --- 
PROJECT_ROOT=$(pwd)

# Initialize PIDs to empty strings for robust checking later
BACKEND_PID=""
FRONTEND_PID=""

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
    echo "ERROR: requirements.txt not found in ${PROJECT_ROOT}!"
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
# Log to stdout/stderr for easier capture by process managers/containers
gunicorn --workers 2 --bind 0.0.0.0:5000 "app:app" --chdir "${PROJECT_ROOT}/backend" --log-level info --access-logfile "-" --error-logfile "-" &
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
        if [ ! -z "$BACKEND_PID" ]; then
            echo "INFO: Shutting down backend server due to critical frontend setup failure..."
            kill "$BACKEND_PID" || echo "WARN: Backend server (PID: $BACKEND_PID) might have already stopped or could not be killed."
        fi
        exit 1
    fi

    # Install Node.js dependencies
    echo "INFO: Installing Node.js dependencies (npm install)..."
    npm install

    # Attempt to fix vulnerabilities
    echo "INFO: Attempting to fix security vulnerabilities (npm audit fix)..."
    # npm audit fix can exit non-zero if vulnerabilities cannot be fixed. We want to warn but continue.
    npm audit fix || echo "WARN: 'npm audit fix' completed with errors or found vulnerabilities that could not be fixed automatically. Check 'npm audit' for details."

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
if [ ! -z "$BACKEND_PID" ]; then
    echo "Backend API will be available at: http://localhost:5000"
fi
if [ ! -z "$FRONTEND_PID" ]; then
    echo "Frontend will be available at: http://localhost:9000"
fi

# Function to clean up background processes on script exit
cleanup() {
    echo ""
    echo "INFO: Shutting down servers..."
    if [ ! -z "$FRONTEND_PID" ]; then # Shut down frontend first if it exists
        echo "INFO: Stopping frontend server (PID: $FRONTEND_PID)..."
        kill "$FRONTEND_PID" > /dev/null 2>&1 || echo "INFO: Frontend server (PID: $FRONTEND_PID) was already stopped or could not be killed."
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        echo "INFO: Stopping backend server (PID: $BACKEND_PID)..."
        kill "$BACKEND_PID" > /dev/null 2>&1 || echo "INFO: Backend server (PID: $BACKEND_PID) was already stopped or could not be killed."
    fi
    echo "INFO: Cleanup complete."
}

# Trap SIGINT (Ctrl+C) and SIGTERM to run cleanup
trap cleanup SIGINT SIGTERM

# Wait for background processes to finish
# This keeps the script alive and allows cleanup to run when Ctrl+C is pressed.
# If only backend is running (e.g. frontend dir missing), wait only for backend.
if [ ! -z "$BACKEND_PID" ] && [ ! -z "$FRONTEND_PID" ]; then
    echo "INFO: Both servers running. Waiting for PIDs: $BACKEND_PID (backend), $FRONTEND_PID (frontend). Press Ctrl+C to exit."
    wait "$BACKEND_PID" "$FRONTEND_PID"
elif [ ! -z "$BACKEND_PID" ]; then
    echo "INFO: Backend server running. Waiting for PID: $BACKEND_PID (backend). Press Ctrl+C to exit."
    wait "$BACKEND_PID"
else
    echo "WARN: No primary server processes were started. Exiting."
fi

echo "INFO: All processes terminated. Exiting startup script."
