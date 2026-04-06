#!/usr/bin/env bash
# start-api.sh — Start the FastAPI backend for rivendell.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$DIR/api/.venv"

# Ensure venv exists
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
fi

# Install deps
"$VENV_DIR/bin/pip" install -q -r "$DIR/api/requirements.txt"

exec "$VENV_DIR/bin/uvicorn" server:app \
    --host 127.0.0.1 \
    --port 8000 \
    --app-dir "$DIR/api"
