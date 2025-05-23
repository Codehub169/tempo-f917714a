#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Project Root --- 
PROJECT_ROOT=$(pwd)

# Initialize PIDs to empty strings for robust checking later
BACKEND_PID=""
# FRONTEND_PID="" # Removed frontend PID as Flask will serve the built frontend

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

# --- Frontend Setup ---
if [ -d "frontend" ]; then
    echo "INFO: Setting up frontend..."
    cd "${PROJECT_ROOT}/frontend"

    # Check for package.json
    if [ ! -f "package.json" ]; then
        echo "ERROR: frontend/package.json not found! Cannot proceed with frontend setup and build."
        cd "${PROJECT_ROOT}"
        # No backend to kill yet, as it hasn't been started.
        exit 1
    fi

    # Install Node.js dependencies
    echo "INFO: Installing Node.js dependencies (npm install)..."
    npm install

    # Attempt to fix vulnerabilities
    echo "INFO: Attempting to fix security vulnerabilities (npm audit fix)..."
    npm audit fix --force || echo "WARN: 'npm audit fix --force' completed with errors or found vulnerabilities that could not be fixed automatically. Check 'npm audit' for details."

    # Build the React application for production
    echo "INFO: Building frontend application (npm run build)..."
    npm run build
    echo "INFO: Frontend application built successfully."

    cd "${PROJECT_ROOT}" # Return to project root
else
    echo "ERROR: frontend directory not found. Cannot build frontend. Backend will run without frontend."
    # Depending on requirements, one might choose to exit here if frontend is mandatory.
    # For now, we allow backend to start alone if frontend dir is missing.
fi

# Start backend server in the background
echo "INFO: Starting backend server on port 5000 (will also serve frontend)..."
# Gunicorn's --chdir makes paths relative to backend/ for the app itself
# Log to stdout/stderr for easier capture by process managers/containers
gunicorn --workers 2 --bind 0.0.0.0:5000 "app:app" --chdir "${PROJECT_ROOT}/backend" --log-level info --access-logfile "-" --error-logfile "-" &
BACKEND_PID=$!
echo "INFO: Backend PID: $BACKEND_PID"

echo ""
echo "Cyberpunk Arcade Dashboard is launching."
if [ ! -z "$BACKEND_PID" ]; then
    echo "Application (Backend API & Frontend) will be available at: http://localhost:5000"
fi
# No separate frontend server message needed as Flask serves it

# Function to clean up background processes on script exit
cleanup() {
    echo ""
    echo "INFO: Shutting down server..."
    # No FRONTEND_PID to manage
    if [ ! -z "$BACKEND_PID" ]; then
        echo "INFO: Stopping backend server (PID: $BACKEND_PID)..."
        # Attempt to kill the process group if it's a leader, otherwise just the process
        # This is a more robust way to kill gunicorn and its workers
        kill -- "-$BACKEND_PID" 2>/dev/null || kill "$BACKEND_PID" > /dev/null 2>&1 || echo "INFO: Backend server (PID: $BACKEND_PID) was already stopped or could not be killed."
    fi
    echo "INFO: Cleanup complete."
}

# Trap SIGINT (Ctrl+C) and SIGTERM to run cleanup
trap cleanup SIGINT SIGTERM

# Wait for background processes to finish
if [ ! -z "$BACKEND_PID" ]; then
    echo "INFO: Backend server running. Waiting for PID: $BACKEND_PID. Press Ctrl+C to exit."
    wait "$BACKEND_PID"
else
    echo "WARN: No primary server processes were started. Exiting."
fi

echo "INFO: All processes terminated. Exiting startup script."
