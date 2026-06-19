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

# Bind to loopback only. WSL is in mirrored networking mode, so Windows
# reaches this as localhost:8001 just fine — no need to expose on 0.0.0.0.
exec "$VENV_DIR/bin/uvicorn" server:app \
    --host 127.0.0.1 \
    --port 8001 \
    --app-dir "$DIR/api"
