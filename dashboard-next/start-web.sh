#!/usr/bin/env bash
# start-web.sh — Build (if needed) and start the Next.js frontend.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Install deps if node_modules missing
if [ ! -d "node_modules" ]; then
    npm install
fi

# Rebuild if the build sentinel is missing or any source/config is newer.
# The sentinel is touched only after `npm run build` exits 0, so a build that
# was interrupted (SIGKILL, OOM, Ctrl-C, disk full) leaves no sentinel and we
# rebuild on next launch. `BUILD_ID` alone is not enough — Next can write it
# before all chunks are flushed, leading to "Cannot find module" 500s.
SENTINEL=".next/.build-complete"
if [ ! -f "$SENTINEL" ] || [ -n "$(find src next.config.ts package.json -newer "$SENTINEL" 2>/dev/null)" ]; then
    rm -rf .next
    npm run build
    touch "$SENTINEL"
fi

exec npx next start -p 3000
