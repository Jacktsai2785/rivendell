#!/usr/bin/env bash
# Protect Secrets Hook — PreToolUse hook for Read, Edit, Write, Bash
# Blocks access to sensitive files: .env, private keys, credentials.
#
# Input:  JSON on stdin
# Output: JSON on stdout if blocked
# Exit:   0 = allow, 2 = block

INPUT="$(cat 2>/dev/null)" || true
[ -z "$INPUT" ] && exit 0

# Extract tool name and file path
TOOL_NAME=""
FILE_PATH=""
if command -v jq &>/dev/null; then
  TOOL_NAME="$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)" || true
  FILE_PATH="$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)" || true
  # For Bash, get command (truncated to avoid regex issues with huge strings)
  if [ "$TOOL_NAME" = "Bash" ]; then
    FILE_PATH="$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null | head -c 500)" || true
  fi
fi

[ -z "$FILE_PATH" ] && exit 0

block() {
  printf '{"decision":"block","reason":"%s"}\n' "$1" >&2
  exit 2
}

# ── .env files (not .env.example) ────────────────────────────────────

case "$TOOL_NAME" in
  Read|Edit|Write)
    case "$FILE_PATH" in
      */.env|*/.env.local|*/.env.production)
        block "Direct access to .env blocked — contains secrets. Use .env.example as reference."
        ;;
    esac
    ;;
  Bash)
    # Block: cat .env | curl (exfiltration pattern)
    if echo "$FILE_PATH" | grep -qE 'cat.*\.env.*\|.*curl'; then
      block "Potential secret exfiltration detected."
    fi
    ;;
esac

# ── Private keys and credentials (Read/Edit/Write only) ─────────────

if [ "$TOOL_NAME" = "Read" ] || [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "Write" ]; then
  case "$FILE_PATH" in
    */id_rsa|*/id_ed25519|*/id_ecdsa)
      block "Access to SSH private key blocked." ;;
    *.pem|*.key)
      block "Access to private key file blocked." ;;
    */credentials.json|*/service-account*.json|*/token.json)
      block "Access to credentials file blocked." ;;
    */.kube/config|*/.aws/credentials|*/.ssh/config)
      block "Access to sensitive config blocked." ;;
    */.netrc|*/.npmrc)
      block "Access to auth token file blocked." ;;
  esac
fi

exit 0
