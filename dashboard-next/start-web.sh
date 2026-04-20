#!/usr/bin/env bash
# start-web.sh — Build (if needed) and start the Next.js frontend.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Install deps if node_modules missing
if [ ! -d "node_modules" ]; then
    npm install
fi

# Rebuild if .next missing or any source/config newer than last build.
# Clean .next first to avoid partial-build state (e.g. a previously-interrupted
# build leaving BUILD_ID but missing route dirs like .next/server/app/skills/[name]).
if [ ! -d ".next" ] || [ -n "$(find src next.config.ts package.json -newer .next/BUILD_ID 2>/dev/null)" ]; then
    rm -rf .next
    npm run build
fi

exec npx next start -p 3000
