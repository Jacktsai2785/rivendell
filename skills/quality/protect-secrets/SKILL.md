---
name: protect-secrets
description: PreToolUse hook that blocks Read/Edit/Write/Bash access to .env files (with real secrets), private keys, credentials.json, and other sensitive files. Prevents accidental secret exposure.
tags: [quality, security, hook]
version: 1
source: harvest-hooks-research
user_invocable: false
---

# protect-secrets

Pure shell PreToolUse hook that blocks access to sensitive files before Claude can read, edit, or write them.

## What It Blocks

| Pattern | Examples |
|---------|---------|
| `.env` (not `.env.example`) | `.env`, `.env.local`, `.env.production` |
| Private keys | `id_rsa`, `id_ed25519`, `*.pem`, `*.key` |
| Credentials | `credentials.json`, `service-account-*.json`, `token.json` |
| Config with secrets | `.aws/credentials`, `.kube/config`, `.netrc`, `.npmrc` |
| Exfiltration | `cat .env \| curl ...` |

## What It Allows

- `.env.example`, `.env.template` (no real secrets)
- Docker/compose references to `.env` (env_file directive)
- `cp .env.example .env` (creating from template)
- `grep`/`diff` on `.env` (checking keys, not reading values)

## Installation

Add to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read|Edit|Write|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/skills/protect-secrets/scripts/protect-secrets-hook.sh"
          }
        ]
      }
    ]
  }
}
```

## How It Works

- Reads JSON from stdin (Claude's tool call payload)
- Extracts `file_path` or `command` field
- Matches against sensitive patterns
- Exit 0 = allow, Exit 2 = block (with reason in stdout JSON)
