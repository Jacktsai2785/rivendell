#!/usr/bin/env bash
# Auto-Stage Hook — PostToolUse hook for Edit and Write
# Automatically stages files after Claude modifies them.
#
# Input:  JSON on stdin: {"tool_name":"Edit","tool_input":{"file_path":"..."},"tool_result":...}
# Exit:   0 always (non-blocking)
set -euo pipefail

INPUT="$(cat)"

# Extract tool name and file path
if command -v jq &>/dev/null; then
  TOOL_NAME="$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null || true)"
  FILE_PATH="$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"
else
  TOOL_NAME="$(echo "$INPUT" | sed -n 's/.*"tool_name"\s*:\s*"\([^"]*\)".*/\1/p' | head -1)"
  FILE_PATH="$(echo "$INPUT" | sed -n 's/.*"file_path"\s*:\s*"\([^"]*\)".*/\1/p' | head -1)"
fi

# Only handle Edit and Write
if [[ "$TOOL_NAME" != "Edit" && "$TOOL_NAME" != "Write" ]]; then
  exit 0
fi

[ -z "$FILE_PATH" ] && exit 0

# Skip files that shouldn't be staged
SKIP_PATTERNS=(
  "\.env$"
  "\.env\.local$"
  "node_modules/"
  "__pycache__/"
  "\.pyc$"
  "/\.git/"
  "\.DS_Store"
)

for pattern in "${SKIP_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" =~ $pattern ]]; then
    exit 0
  fi
done

# Find the git root for this file
FILE_DIR="$(dirname "$FILE_PATH")"
GIT_ROOT="$(cd "$FILE_DIR" 2>/dev/null && git rev-parse --show-toplevel 2>/dev/null || true)"

[ -z "$GIT_ROOT" ] && exit 0

# Stage the file
git -C "$GIT_ROOT" add "$FILE_PATH" 2>/dev/null || true

exit 0
