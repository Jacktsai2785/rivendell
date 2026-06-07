---
name: repo-rename
description: Systematically audit all cross-location references when renaming a git repo, generate a migration checklist, and execute the rename safely. Covers systemd user units, Claude Code configs, shell scripts, sibling repos, and package manifests.
tags: [git, refactoring, migration]
version: 1
source: harvest-2026-03-18
user_invocable: true
---

# repo-rename

TRIGGER when: user says "rename repo", "把 repo 改名", "rename project", or `/repo-rename`.
DO NOT TRIGGER when: renaming files within a repo, or renaming git branches.

## Workflow

### Step 1: Gather Names

```
OLD_NAME = current directory name
NEW_NAME = user-specified target
OLD_PATH = ~/Documents/Projects/OLD_NAME
NEW_PATH = ~/Documents/Projects/NEW_NAME
```

Confirm both with user before proceeding.

### Step 2: Audit References

Scan **before** renaming (grep needs old path to exist):

| Location | Scan |
|----------|------|
| systemd user units | `grep -rl OLD_NAME ~/.config/systemd/user/*.service ~/.config/systemd/user/*.timer` |
| Claude projects | `~/.claude/projects.json` path-based keys |
| Claude settings | `~/.claude/settings.json`, `.claude/settings.local.json` hook paths |
| Project settings | `.claude/settings.local.json` in sibling projects |
| Shell scripts | `grep -r OLD_NAME bin/ scripts/` |
| Package manifests | `package.json` name/repository, `pyproject.toml` |
| Git remote | `git remote -v` — GitHub URL |
| Sibling repos | `grep -r OLD_NAME ~/*/` (project tree; exclude .git, node_modules) |
| agents.conf | `rivendell/agents/agents.conf` project paths |
| profiles.conf | `rivendell/profiles/profiles.conf` git URLs, local dirs |
| docker-compose | `rivendell/docker-compose.yml` build context paths |
| Auto-memory | `~/.claude/projects/*/memory/` |

### Step 3: Output Migration Checklist

```markdown
| # | File | Current Reference | Change To | Auto-fixable |
|---|------|-------------------|-----------|-------------|
```

### Step 4: Execute (user confirms each step)

Order matters:

1. `./bin/sk-setup-systemd --stop` (stop + disable all managed units referencing old path)
2. `mv OLD_PATH NEW_PATH`
3. `sed -i` for unit files, scripts, config (auto-fixable items)
4. `git remote set-url origin` (if GitHub name also changes — use `gh repo rename`)
5. `systemctl --user daemon-reload`
6. `./bin/sk-setup-systemd` (regenerate .service/.timer units from agents.conf)
7. `./bin/sk deploy` (fix skill symlinks)

### Step 5: Verify

- `systemctl --user list-units 'com.sk.*'` — agents loaded
- `./bin/sk check` — no broken symlinks
- `git status` — repo clean
- Claude Code projects index updated
