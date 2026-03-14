---
name: Destructive Command Guard
description: Pure shell PreToolUse hook that blocks dangerous commands (git reset --hard, rm -rf, force push, etc.) before execution. Whitelist-first, default-allow architecture adapted from Dicklesworthstone's DCG.
when_to_use: always active as a PreToolUse hook - no manual invocation needed
version: 1.0.0
tags: [safety, hooks, git, filesystem]
languages: all
---

# Destructive Command Guard (DCG)

## Overview

A pure shell Claude Code hook that intercepts and blocks destructive commands before they execute. No compiled binary or Rust toolchain required.

AI coding agents are powerful but fallible. They can accidentally run destructive commands:

- **"Let me clean up"** -> `rm -rf ./src` (typo)
- **"I'll reset to the last commit"** -> `git reset --hard` (destroys uncommitted changes)
- **"Let me fix the merge conflict"** -> `git checkout -- .` (discards all modifications)
- **"I'll clean up untracked files"** -> `git clean -fd` (permanently deletes untracked files)

DCG catches these before execution and blocks them with a clear reason.

## Critical Design Principles

### 1. Whitelist-First Architecture

Safe patterns are checked *before* destructive patterns. Explicitly safe commands are never accidentally blocked:

```
git checkout -b feature    ->  Matches SAFE pattern  ->  ALLOW
git checkout -- file.txt   ->  No safe match, matches DESTRUCTIVE  ->  BLOCK
```

### 2. Default-Allow

Unrecognized commands are allowed. Only *known* dangerous patterns are blocked. The hook never breaks legitimate workflows.

### 3. Zero False Negatives

Prioritizes never allowing dangerous commands over avoiding false positives. A blocked safe command is inconvenient; lost work is unrecoverable.

## What It Blocks

### Git Commands That Destroy Uncommitted Work

| Command | Reason |
|---------|--------|
| `git reset --hard` | Destroys uncommitted changes |
| `git reset --merge` | Destroys uncommitted changes |
| `git checkout -- <file>` | Discards file modifications |
| `git restore <file>` (without `--staged`) | Discards uncommitted changes |
| `git restore -W` / `--worktree` | Explicitly discards working tree changes |
| `git clean -f` | Permanently deletes untracked files |

### Git Commands That Destroy Remote History

| Command | Reason |
|---------|--------|
| `git push --force` / `-f` | Overwrites remote commits |
| `git branch -D` | Force-deletes branch without merge check |

### Git Commands That Destroy Stashed Work

| Command | Reason |
|---------|--------|
| `git stash drop` | Permanently deletes a stash |
| `git stash clear` | Permanently deletes all stashes |

### Filesystem Commands

| Command | Reason |
|---------|--------|
| `rm -rf` (outside `/tmp`, `/var/tmp`, `$TMPDIR`) | Recursive forced deletion is dangerous |

## What It Allows

Safe operations pass through silently:

### Always Safe Git Operations

`git status`, `git log`, `git diff`, `git add`, `git commit`, `git push` (without --force), `git pull`, `git fetch`, `git branch -d` (safe delete with merge check), `git stash`, `git stash pop`, `git stash list`

### Explicitly Safe Patterns (Whitelist)

| Pattern | Why Safe |
|---------|----------|
| `git checkout -b <branch>` | Creating new branches |
| `git checkout --orphan <branch>` | Creating orphan branches |
| `git restore --staged <file>` | Unstaging only, does not touch working tree |
| `git restore -S <file>` | Short flag for --staged |
| `git clean -n` / `--dry-run` | Preview mode, no actual deletion |
| `git push --force-with-lease` | Refuses if remote has unseen commits |
| `git branch -d` | Only deletes fully merged branches |
| `rm -rf /tmp/*` | Temp directories are ephemeral |
| `rm -rf $TMPDIR/*` | Shell variable temp paths |

## Installation

### 1. Make the hook script executable

```bash
chmod +x ~/.claude/skills/destructive-command-guard/scripts/dcg-hook.sh
```

### 2. Add to `~/.claude/settings.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/skills/destructive-command-guard/scripts/dcg-hook.sh"
          }
        ]
      }
    ]
  }
}
```

**Important:** Restart Claude Code after adding the hook.

### 3. Verify it works

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"git reset --hard"}}' | ~/.claude/skills/destructive-command-guard/scripts/dcg-hook.sh
echo $?  # Should print 2
```

## How It Works

```
Claude Code agent executes a command
        |
        v  PreToolUse hook (stdin: JSON)
+-----------------------------------------------+
|              dcg-hook.sh                       |
|                                                |
|  1. Parse JSON from stdin                      |
|  2. Skip non-Bash tools (exit 0)               |
|  3. Extract command string                     |
|  4. Normalize (strip absolute paths)           |
|  5. Check SAFE patterns -> allow if match      |
|  6. Check DESTRUCTIVE patterns -> block        |
|  7. No match -> allow (default-allow)          |
+-----------------------------------------------+
        |
        v  stdout: JSON (block) or nothing (allow)
```

## Output Format

When a command is blocked, the script outputs JSON to stdout and exits with code 2:

```json
{"decision":"block","reason":"git reset --hard destroys uncommitted changes. Use 'git stash' first."}
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Command is safe, proceed |
| `2` | Command is blocked, do not execute |

## Bypass

If you genuinely need to run a blocked command:

1. Run the command manually in a separate terminal
2. Consider safer alternatives first (e.g., `git stash` before `git reset --hard`)

## Contextual Suggestions

| Command Type | Suggestion |
|-------------|------------|
| `git reset --hard`, `git checkout --` | Use `git stash` first to save changes |
| `git clean -f` | Use `git clean -n` first to preview |
| `git push --force` | Use `--force-with-lease` instead |
| `rm -rf` | Verify the path carefully before running manually |
| `git branch -D` | Use `git branch -d` for safe merge-checked delete |
| `git stash drop/clear` | Verify you do not need the stashed work |

## Dependencies

- `jq` (preferred) or `sed` (fallback) for JSON parsing
- POSIX-compatible shell (bash, zsh, sh)

## Limitations

- Does not inspect commands inside scripts (`./deploy.sh` contents not checked)
- Does not block non-Bash tool calls (Python file writes, API calls)
- Can be bypassed by running commands manually (this is by design)
