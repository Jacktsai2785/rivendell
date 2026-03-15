#!/usr/bin/env bash
# start-web.sh — Build (if needed) and start the Next.js frontend.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Install deps if node_modules missing
if [ ! -d "node_modules" ]; then
    npm install
fi

# Build if .next missing or package.json newer than .next
if [ ! -d ".next" ] || [ "package.json" -nt ".next/BUILD_ID" ]; then
    npm run build
fi

exec npx next start -p 3000
