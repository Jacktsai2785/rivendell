---
name: LaunchD Agent
description: >
  Create, configure, debug, and manage macOS launchd agents (LaunchAgents plist files).
  Covers plist generation, scheduling with StartCalendarInterval, launchctl lifecycle
  (load/unload/start/list), log configuration, and troubleshooting common issues.
  TRIGGER when: user asks to create a scheduled task on macOS, mentions plist/launchctl/LaunchAgent,
  wants to set up cron-like automation on Mac, asks about launchd scheduling, or is debugging
  why a scheduled agent isn't running. Also trigger when user says "排程", "定時執行", or "自動化任務".
  DO NOT TRIGGER when: user is working on Linux (use cron/systemd), building CI pipelines
  (use ci-pipeline), or deploying to cloud (use deploy).
when_to_use: >
  When creating or managing scheduled tasks on macOS via launchd.
version: 1.0.0
tags: [workflow, macos, launchd, scheduling, automation]
languages: [bash, python]
---

# LaunchD Agent Management

Guide for creating and managing macOS LaunchAgents — the macOS equivalent of cron jobs, but with richer scheduling, logging, and lifecycle control.

## Quick Reference

| Task | Command |
|------|---------|
| Load agent | `launchctl load ~/Library/LaunchAgents/<label>.plist` |
| Unload agent | `launchctl unload ~/Library/LaunchAgents/<label>.plist` |
| Run immediately | `launchctl start <label>` |
| Check status | `launchctl list <label>` |
| See all agents | `launchctl list \| grep <prefix>` |

## Plist Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.example.my-agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>/path/to/script.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>WorkingDirectory</key>
    <string>/path/to/working/dir</string>
    <key>StandardOutPath</key>
    <string>/path/to/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/path/to/stderr.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
```

## Scheduling Patterns

### Single schedule (daily at 9:00)
```xml
<key>StartCalendarInterval</key>
<dict>
    <key>Hour</key><integer>9</integer>
    <key>Minute</key><integer>0</integer>
</dict>
```

### Multiple schedules (9:00 and 18:00)
Use an **array** of dicts — this is a common gotcha:
```xml
<key>StartCalendarInterval</key>
<array>
    <dict>
        <key>Hour</key><integer>9</integer>
        <key>Minute</key><integer>0</integer>
    </dict>
    <dict>
        <key>Hour</key><integer>18</integer>
        <key>Minute</key><integer>0</integer>
    </dict>
</array>
```

### Weekly (every Monday at 9:00)
Weekday: 0=Sunday, 1=Monday, ..., 6=Saturday
```xml
<key>StartCalendarInterval</key>
<dict>
    <key>Weekday</key><integer>1</integer>
    <key>Hour</key><integer>9</integer>
    <key>Minute</key><integer>0</integer>
</dict>
```

### Interval-based (every 5 minutes)
```xml
<key>StartInterval</key>
<integer>300</integer>
```

### Run at load
Add `RunAtLoad` to also run when the agent is first loaded:
```xml
<key>RunAtLoad</key>
<true/>
```

## Available Calendar Keys

| Key | Type | Range | Notes |
|-----|------|-------|-------|
| Month | integer | 1-12 | |
| Day | integer | 1-31 | Day of month |
| Weekday | integer | 0-6 | 0=Sunday |
| Hour | integer | 0-23 | |
| Minute | integer | 0-59 | |

Omitted keys mean "any" — a dict with only `Minute: 0` runs every hour at :00.

## Installation Flow

The correct sequence for installing/updating an agent:

```bash
# 1. If already loaded, unload first (avoids error 5)
launchctl unload ~/Library/LaunchAgents/com.example.plist 2>/dev/null

# 2. Copy/generate the plist (replace template vars if needed)
sed "s|REPO_PATH|$PWD|g" template.plist > ~/Library/LaunchAgents/com.example.plist

# 3. Load the agent
launchctl load ~/Library/LaunchAgents/com.example.plist

# 4. Verify it's loaded
launchctl list com.example
```

The unload-before-load pattern is important because `launchctl load` on an already-loaded agent returns error 5 ("Input/output error").

## Reading Plist in Python

```python
import plistlib
from pathlib import Path

plist_path = Path.home() / "Library/LaunchAgents/com.example.plist"
with open(plist_path, "rb") as f:
    data = plistlib.load(f)

# Schedule can be dict (single) or list (multiple)
schedule = data.get("StartCalendarInterval", {})
if isinstance(schedule, dict):
    schedule = [schedule]
# Now schedule is always a list of dicts
```

## Modifying Schedule Programmatically

```python
import plistlib

with open(plist_path, "rb") as f:
    data = plistlib.load(f)

# Set multiple schedules
data["StartCalendarInterval"] = [
    {"Hour": 9, "Minute": 0},
    {"Hour": 18, "Minute": 0, "Weekday": 1},
]

with open(plist_path, "wb") as f:
    plistlib.dump(data, f)

# Must unload + load to apply changes
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `load` returns error 5 | Agent already loaded | Unload first, then load |
| Agent doesn't run | PATH not set in plist | Add `EnvironmentVariables` with PATH |
| Agent runs but script fails | Working directory wrong | Set `WorkingDirectory` in plist |
| `launchctl list` shows exit code 78 | Configuration error | Check plist syntax with `plutil -lint` |
| Agent not in `launchctl list` | Not loaded or wrong path | Ensure plist is in `~/Library/LaunchAgents/` |
| Agent runs at wrong time | Schedule timezone | launchd uses system timezone |

## Common Gotchas

1. **PATH is minimal** — launchd agents run with a very limited PATH (`/usr/bin:/bin:/usr/sbin:/sbin`). Always set PATH explicitly or use absolute paths in scripts.

2. **Single vs array schedule** — A single `StartCalendarInterval` dict vs an array of dicts. Python's `plistlib` handles both, but your code must check `isinstance(schedule, dict)`.

3. **Changes need reload** — Editing a plist file does nothing until you `unload` + `load` the agent.

4. **User agents only** — `~/Library/LaunchAgents/` runs as the current user and only while logged in. For system-wide agents that run at boot, use `/Library/LaunchDaemons/` (requires root).

5. **Log rotation** — launchd doesn't rotate logs. Use dated log paths (e.g., `agent-$(date +%F).log`) or set up a separate rotation mechanism.
