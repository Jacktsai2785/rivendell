---
name: auto-stage
description: >
  PostToolUse hook that automatically git-stages files after Claude edits or
  writes them. Skips .env, node_modules, and other non-stageables.
  TRIGGER: Fires automatically as a PostToolUse hook after every Edit, Write,
  or MultiEdit. There is no slash command — installation is via the hooks
  system, and this skill exists for catalog visibility.
  DO NOT TRIGGER manually — the hook is the only invocation path. To disable
  for a session, remove the PostToolUse entry from .claude/settings.json or
  rename auto-stage.sh; do not invoke this skill from a prompt.
tags: [git, hook, automation]
version: 1.0.0
source: harvest-hooks-research
user_invocable: false
---

# auto-stage

PostToolUse hook that runs after every Edit/Write tool call. Automatically stages the modified file so it's ready for commit.

## What It Does

- After Claude edits or creates a file → `git add <file>`
- Finds the correct git root for the file
- Silently skips files outside git repos

## What It Skips

| Pattern | Reason |
|---------|--------|
| `.env`, `.env.local` | Contains secrets |
| `node_modules/` | Dependencies |
| `__pycache__/`, `*.pyc` | Build artifacts |
| `.git/` | Git internals |
| `.DS_Store` | macOS metadata |

## Installation

Add to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/skills/auto-stage/scripts/auto-stage-hook.sh"
          }
        ]
      }
    ]
  }
}
```

## Notes

- Non-blocking: always exits 0, never interrupts Claude's workflow
- Works across multiple repos (finds git root per-file)
- Does NOT auto-commit — just stages for your review
