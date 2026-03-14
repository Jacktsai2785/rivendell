#!/usr/bin/env bash
# Destructive Command Guard (DCG) - Pure shell implementation
# Claude Code PreToolUse hook that blocks dangerous commands before execution.
# Adapted from Dicklesworthstone's DCG (Rust binary) to a portable shell script.
#
# Input:  JSON on stdin: {"tool_name":"Bash","tool_input":{"command":"..."}}
# Output: JSON on stdout if blocked: {"decision":"block","reason":"..."}
# Exit:   0 = allow, 2 = block

set -euo pipefail

# Read all stdin
INPUT="$(cat)"

# ── Step 1: Extract tool_name ──────────────────────────────────────────────
if command -v jq &>/dev/null; then
  TOOL_NAME="$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null || true)"
  COMMAND="$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
else
  # Fallback: extract with sed (handles simple single-line JSON)
  TOOL_NAME="$(echo "$INPUT" | sed -n 's/.*"tool_name"\s*:\s*"\([^"]*\)".*/\1/p' | head -1)"
  COMMAND="$(echo "$INPUT" | sed -n 's/.*"command"\s*:\s*"\([^"]*\)".*/\1/p' | head -1)"
fi

# ── Step 2: Skip non-Bash tools ───────────────────────────────────────────
if [[ "$TOOL_NAME" != "Bash" ]]; then
  exit 0
fi

# ── Step 3: Empty command guard ────────────────────────────────────────────
if [[ -z "$COMMAND" ]]; then
  exit 0
fi

# ── Step 4: Normalize command ──────────────────────────────────────────────
# Strip absolute paths to binaries: /usr/bin/git -> git, /bin/rm -> rm
NORMALIZED="$(echo "$COMMAND" | sed 's|/[^ ]*/\(git\b\)|\1|g; s|/[^ ]*/\(rm\b\)|\1|g')"

# ── Helper: block with reason ─────────────────────────────────────────────
block() {
  local reason="$1"
  printf '{"decision":"block","reason":"%s"}\n' "$reason"
  exit 2
}

# ── Step 5: Quick reject ──────────────────────────────────────────────────
# If command contains neither "git" nor "rm", it cannot match any pattern.
if [[ "$NORMALIZED" != *git* && "$NORMALIZED" != *rm* ]]; then
  exit 0
fi

# ── Step 6: SAFE patterns (whitelist) ─────────────────────────────────────
# These are checked FIRST. If a safe pattern matches, allow immediately.

# git checkout -b / --orphan (creating branches)
if [[ "$NORMALIZED" =~ git[[:space:]]+checkout[[:space:]]+-b[[:space:]] ]] ||
   [[ "$NORMALIZED" =~ git[[:space:]]+checkout[[:space:]]+--orphan[[:space:]] ]]; then
  exit 0
fi

# git restore --staged / -S (unstaging only, no working tree change)
# But NOT if -W or --worktree is also present
if [[ "$NORMALIZED" =~ git[[:space:]]+restore[[:space:]] ]]; then
  if [[ "$NORMALIZED" =~ (--staged|-S) ]] && \
     [[ ! "$NORMALIZED" =~ (-W|--worktree) ]]; then
    exit 0
  fi
fi

# git clean -n / --dry-run (preview mode)
if [[ "$NORMALIZED" =~ git[[:space:]]+clean[[:space:]] ]] && \
   [[ "$NORMALIZED" =~ (-n|--dry-run) ]]; then
  exit 0
fi

# git push --force-with-lease (safe force push)
if [[ "$NORMALIZED" =~ git[[:space:]]+push[[:space:]] ]] && \
   [[ "$NORMALIZED" =~ --force-with-lease ]]; then
  exit 0
fi

# git branch -d (lowercase, safe merge-checked delete)
# Must NOT be -D (uppercase)
if [[ "$NORMALIZED" =~ git[[:space:]]+branch[[:space:]]+-d[[:space:]] ]]; then
  exit 0
fi

# rm -rf targeting temp directories
if [[ "$NORMALIZED" =~ rm[[:space:]] ]] && [[ "$NORMALIZED" =~ (-rf|-fr|-r[[:space:]]+-f|-f[[:space:]]+-r|--recursive) ]]; then
  # Allow if all paths are under /tmp, /var/tmp, or $TMPDIR
  if [[ "$NORMALIZED" =~ rm[[:space:]]+(-[^ ]+[[:space:]]+)*/tmp(/|[[:space:]]|$) ]] ||
     [[ "$NORMALIZED" =~ rm[[:space:]]+(-[^ ]+[[:space:]]+)*/var/tmp(/|[[:space:]]|$) ]] ||
     [[ "$NORMALIZED" =~ rm[[:space:]]+(-[^ ]+[[:space:]]+)*\$TMPDIR ]] ||
     [[ "$NORMALIZED" =~ rm[[:space:]]+(-[^ ]+[[:space:]]+)*\$\{TMPDIR ]] ||
     [[ "$NORMALIZED" =~ rm[[:space:]]+(-[^ ]+[[:space:]]+)*\"\$TMPDIR ]] ||
     [[ "$NORMALIZED" =~ rm[[:space:]]+(-[^ ]+[[:space:]]+)*\"\$\{TMPDIR ]]; then
    exit 0
  fi
fi

# ── Step 7: DESTRUCTIVE patterns ──────────────────────────────────────────

# git reset --hard
if [[ "$NORMALIZED" =~ git[[:space:]]+reset[[:space:]] ]] && \
   [[ "$NORMALIZED" =~ --hard ]]; then
  block "git reset --hard destroys uncommitted changes. Use 'git stash' first."
fi

# git reset --merge
if [[ "$NORMALIZED" =~ git[[:space:]]+reset[[:space:]] ]] && \
   [[ "$NORMALIZED" =~ --merge ]]; then
  block "git reset --merge destroys uncommitted changes. Use 'git stash' first."
fi

# git checkout -- (discard file changes)
if [[ "$NORMALIZED" =~ git[[:space:]]+checkout[[:space:]]+-- ]]; then
  block "git checkout -- discards file modifications. Use 'git stash' first."
fi

# git restore without --staged (discards working tree changes)
if [[ "$NORMALIZED" =~ git[[:space:]]+restore[[:space:]] ]]; then
  if [[ ! "$NORMALIZED" =~ (--staged|-S) ]] || [[ "$NORMALIZED" =~ (-W|--worktree) ]]; then
    block "git restore without --staged discards uncommitted changes. Use 'git stash' first."
  fi
fi

# git clean -f (without -n/--dry-run, already checked above)
if [[ "$NORMALIZED" =~ git[[:space:]]+clean[[:space:]] ]] && \
   [[ "$NORMALIZED" =~ (-f|--force) ]] && \
   [[ ! "$NORMALIZED" =~ (-n|--dry-run) ]]; then
  block "git clean -f permanently deletes untracked files. Use 'git clean -n' first to preview."
fi

# git push --force / -f (but not --force-with-lease, already allowed above)
if [[ "$NORMALIZED" =~ git[[:space:]]+push[[:space:]] ]]; then
  if [[ "$NORMALIZED" =~ --force($|[[:space:]]) ]] || \
     [[ "$NORMALIZED" =~ [[:space:]]-f($|[[:space:]]) ]] || \
     [[ "$NORMALIZED" =~ [[:space:]]-[a-eg-z]*f ]]; then
    block "git push --force overwrites remote commits. Use '--force-with-lease' instead."
  fi
fi

# git branch -D (force delete)
if [[ "$NORMALIZED" =~ git[[:space:]]+branch[[:space:]]+-D[[:space:]] ]] || \
   [[ "$NORMALIZED" =~ git[[:space:]]+branch[[:space:]]+-D$ ]]; then
  block "git branch -D force-deletes branch without merge check. Use 'git branch -d' for safe delete."
fi

# git stash drop
if [[ "$NORMALIZED" =~ git[[:space:]]+stash[[:space:]]+drop ]]; then
  block "git stash drop permanently deletes a stash. Verify you don't need it first."
fi

# git stash clear
if [[ "$NORMALIZED" =~ git[[:space:]]+stash[[:space:]]+clear ]]; then
  block "git stash clear permanently deletes ALL stashes. Verify you don't need them first."
fi

# rm -rf outside temp directories (safe temp paths already allowed above)
if [[ "$NORMALIZED" =~ rm[[:space:]] ]] && \
   [[ "$NORMALIZED" =~ (-rf|-fr|-r[[:space:]]+-f|-f[[:space:]]+-r|--recursive[[:space:]]+--force|--force[[:space:]]+--recursive) ]]; then
  block "rm -rf is dangerous outside temp directories. Verify the path carefully before running manually."
fi

# ── Step 8: Default allow ─────────────────────────────────────────────────
exit 0
