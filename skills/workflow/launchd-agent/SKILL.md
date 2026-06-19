---
name: launchd-agent
description: >
  Create, configure, debug, and manage scheduled / always-on agents on Linux & WSL2
  using systemd user units (.service + .timer). Covers OnCalendar/OnUnitActiveSec
  scheduling, systemctl --user lifecycle (enable/start/status/list), journald + file
  logging, troubleshooting, and the declarative multi-agent fleet pattern
  (agents.conf + sk-setup-systemd bootstrap) used in this repo.
  TRIGGER when: user asks to create a scheduled / cron-like task on Linux or WSL2,
  mentions systemd / systemctl / OnCalendar / user timer / .service / .timer, wants
  cron-like automation that survives logout, is debugging why a scheduled agent isn't
  running, or wants to make a fleet of agents portable across machines.
  Also trigger when user says "排程", "定時執行", "自動化任務", "開機自啟", or "引繼".
  DO NOT TRIGGER when: building CI pipelines (use ci-pipeline), deploying to cloud
  (use deploy), or setting up a long-running web service with health checks where
  systemd-user-service already fits better.
when_to_use: >
  When creating or managing scheduled / keep-alive tasks on Linux or WSL2 via systemd
  user units. This is the cron/launchd replacement for this machine (WSL2 + systemd).
version: 3.0.0
tags: [workflow, linux, wsl2, systemd, scheduling, automation, portability]
languages: [bash, python]
---

# Scheduled Agent Management (systemd user units)

Guide for creating and managing scheduled and always-on agents on **Linux / WSL2**
using **systemd user units** — the replacement for cron and (on this machine,
formerly) macOS launchd. systemd gives richer scheduling, journald logging,
crash-restart, and per-unit lifecycle control.

> **Platform note.** This machine is WSL2 + systemd. All scheduling goes through
> `systemctl --user`. If you find yourself writing a `.plist` or calling
> `launchctl`, you are on the wrong platform — stop and use the patterns below.
> The actual deployed fleet lives in `agents/agents.conf` and is installed by
> `bin/sk-setup-systemd`.

## Quick Reference

| Task | Command |
|------|---------|
| Install/refresh whole fleet | `./bin/sk-setup-systemd` |
| Preview units (no install) | `./bin/sk-setup-systemd --dry-run` |
| Stop + disable fleet | `./bin/sk-setup-systemd --stop` |
| Reload after editing a unit | `systemctl --user daemon-reload` |
| Enable + start a timer | `systemctl --user enable --now <label>.timer` |
| Run a unit immediately | `systemctl --user start <label>.service` |
| Check status | `systemctl --user status <label>.timer` |
| List all timers | `systemctl --user list-timers --all` |
| List managed units | `systemctl --user list-units 'com.sk.*'` |
| Tail a unit's log | `journalctl --user -u <label>.service -f` |

## Service + Timer Templates

systemd splits "what to run" (`.service`) from "when to run it" (`.timer`).
Both live in `~/.config/systemd/user/`.

### Service unit (`<label>.service`)

```ini
[Unit]
Description=rivendell: com.sk.agent.example

[Service]
Type=simple
WorkingDirectory=/home/jacktsai/rivendell
Environment=PATH=/home/jacktsai/.nvm/versions/node/current/bin:/home/jacktsai/.local/bin:/usr/local/bin:/usr/bin:/bin
Environment=REPO_DIR=/home/jacktsai/rivendell
ExecStart=/bin/bash /home/jacktsai/rivendell/scripts/task.sh
StandardOutput=append:/home/jacktsai/rivendell/logs/example.log
StandardError=append:/home/jacktsai/rivendell/logs/example-error.log
Restart=no

[Install]
WantedBy=default.target
```

### Timer unit (`<label>.timer`)

```ini
[Unit]
Description=Timer for com.sk.agent.example
Requires=com.sk.agent.example.service

[Timer]
OnCalendar=*-*-* 09:00:00
Persistent=true
Unit=com.sk.agent.example.service

[Install]
WantedBy=timers.target
```

`Persistent=true` makes a missed run (machine asleep / WSL shut down) fire on
next boot — the systemd equivalent of launchd's catch-up behavior.

## Scheduling Patterns (`OnCalendar`)

| Goal | `OnCalendar=` |
|------|---------------|
| Daily at 09:00 | `*-*-* 09:00:00` |
| Twice daily (09:00 & 18:00) | two `OnCalendar=` lines in one `[Timer]` |
| Every Monday 09:00 | `Mon *-*-* 09:00:00` |
| Mon **and** Thu 08:00 | `Mon,Thu *-*-* 08:00:00` |
| 1st of month 03:00 | `*-*-01 03:00:00` |
| Every 5 minutes (interval) | use `OnUnitActiveSec=300` instead of `OnCalendar` |

Multiple schedules = repeat the line:

```ini
[Timer]
OnCalendar=*-*-* 09:00:00
OnCalendar=Mon *-*-* 18:00:00
Persistent=true
```

Interval-based (every N seconds after boot, then after each run):

```ini
[Timer]
OnBootSec=60
OnUnitActiveSec=28800   # every 8h
Unit=com.sk.agent.example.service
```

Always-on service (no timer — restart on crash), the keep-alive pattern:

```ini
[Service]
...
Restart=always
RestartSec=5
[Install]
WantedBy=default.target
```

Validate any `OnCalendar` expression before deploying:

```bash
systemd-analyze calendar 'Mon,Thu *-*-* 08:00:00'   # prints next elapse times
```

## Installation Flow

The correct sequence for installing/updating a unit by hand:

```bash
# 1. Write/replace the unit files in ~/.config/systemd/user/
cp example.service example.timer ~/.config/systemd/user/

# 2. Reload systemd's view of unit files (REQUIRED after any edit)
systemctl --user daemon-reload

# 3. Enable + start (timer for scheduled, service for keep-alive)
systemctl --user enable --now com.sk.agent.example.timer

# 4. Verify
systemctl --user list-timers --all | grep example
```

Unlike launchd, re-running `enable --now` on an already-active unit is
**idempotent** — no unload-first dance. But you MUST `daemon-reload` after
editing a unit file on disk, or systemd keeps running the old version.

## WSL2 essentials

1. **Enable systemd in WSL.** `/etc/wsl.conf` must contain:
   ```ini
   [boot]
   systemd=true
   ```
   then `wsl --shutdown` from Windows and reopen. Check with `systemctl --user`.

2. **Linger — survive logout.** User units stop when you log out unless linger
   is on. `sk-setup-systemd` runs this for you; manually it's:
   ```bash
   loginctl enable-linger "$USER"
   ```
   Critical on WSL2, where closing the terminal counts as a logout.

3. **PATH is minimal.** Like cron/launchd, systemd units get a bare PATH. Set it
   explicitly with `Environment=PATH=...` (include the nvm node bin, `~/.local/bin`).

## Reading / Writing Units in Python

systemd units are plain INI text — no `plistlib`. Parse with `configparser`
(note: systemd allows duplicate keys like multiple `OnCalendar=`, so for those
read the file as text):

```python
from pathlib import Path
unit = Path.home() / ".config/systemd/user/com.sk.agent.example.timer"
text = unit.read_text()
on_calendar = [l.split("=", 1)[1].strip()
               for l in text.splitlines() if l.startswith("OnCalendar=")]
```

After writing a unit file from Python, shell out to apply:

```python
import subprocess
subprocess.run(["systemctl", "--user", "daemon-reload"], check=True)
subprocess.run(["systemctl", "--user", "restart", "com.sk.agent.example.timer"], check=True)
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Unit not found | Never installed / wrong name | `systemctl --user daemon-reload`; check `~/.config/systemd/user/` |
| Edits have no effect | Forgot to reload | `systemctl --user daemon-reload` then restart |
| Runs but script fails | Wrong working dir / PATH | Set `WorkingDirectory=` and `Environment=PATH=` |
| `status` shows `code=exited, status=127` | command not found | Fix PATH in the `[Service]` section |
| Timer never fires | Timer not enabled, only service | `systemctl --user enable --now <label>.timer` |
| Stops on logout | Linger off | `loginctl enable-linger "$USER"` |
| Whole thing missing after reboot | systemd not enabled in WSL | Set `[boot] systemd=true` in `/etc/wsl.conf`, `wsl --shutdown` |
| Wrong run time | Timezone | systemd uses system tz; check `timedatectl` |

Diagnostics:

```bash
systemctl --user status <label>.service   # last result, recent log lines
journalctl --user -u <label>.service -n 50 --no-pager
systemctl --user list-timers --all        # next/last elapse for every timer
```

## Common Gotchas

1. **`daemon-reload` after every edit** — editing a `.service`/`.timer` on disk
   does nothing until you reload. The most common "why didn't my change take"
   bug.

2. **Timer enables the schedule, service does the work** — for scheduled jobs
   enable the **`.timer`**, not the `.service`. Enabling only the service makes
   it run once at boot, never again.

3. **Linger or it dies** — without `enable-linger`, user units die on logout.
   Non-negotiable on WSL2.

4. **PATH is minimal** — always set `Environment=PATH=` covering node (nvm),
   python3, and `~/.local/bin`, or use absolute paths in scripts.

5. **No log rotation by default** — `StandardOutput=append:` files grow forever.
   Use dated paths or rely on `journalctl` (which rotates) instead of file
   append.

6. **`%` must be escaped** — in unit files a literal `%` is written `%%`
   (systemd uses `%` for specifiers like `%h` = home dir).

---

## Portable Multi-Agent Fleet Pattern

When managing multiple scheduled agents across machines, hand-writing unit files
is unmaintainable. This repo solves it with a declarative config + a bootstrap
generator. **This is the real, deployed system — read these files for live
examples.**

### Architecture

```
rivendell/
├── agents/
│   └── agents.conf          # Declarative agent definitions (one line each)
└── bin/
    └── sk-setup-systemd     # Bootstrap: read agents.conf → generate .service/.timer → enable
```

New machine setup: ensure `[boot] systemd=true` in `/etc/wsl.conf`, then
`./bin/sk-setup-systemd` → done. No FDA / TCC dance (that was a macOS concern);
on Linux a normal user can read its own `$HOME` freely.

### 1. Declarative Config (`agents/agents.conf`)

All agents defined in one file — no unit editing needed:

```
# LABEL | PROJECT_REL | SCRIPT | SCHEDULE_TYPE | SCHEDULE_VALUE | LOG_DIR | EXTRA_ARGS
#
# SCHEDULE_TYPE: interval | calendar | calendar_multi | keepalive
# SCHEDULE_VALUE:
#   interval       → seconds (28800 = 8h)          → OnUnitActiveSec
#   calendar       → H:MM or W:H:MM (W=weekday 0-6) → OnCalendar
#   calendar_multi → W1:H:MM,W2:H:MM                → multiple OnCalendar lines
#   keepalive      → -  (always running, Restart=always)

com.sk.agent.rivendell.harvest  | rivendell | bin/sk-harvest-cron  | interval       | 28800         | reports
com.sk.agent.rivendell.maintain | rivendell | bin/sk-maintain-cron | calendar       | 22:00         | reports
com.sk.agent.sales.subsidy      | sales     | scripts/subsidy.sh   | calendar_multi | 1:8:00,4:8:00 | materials
com.sk.dashboard.api            | rivendell | dashboard-next/start-api.sh | keepalive | -          | logs
```

`PROJECT_REL` is resolved relative to rivendell's parent dir, so the same config
works on any machine where the project tree lives side by side.

### 2. Bootstrap Generator (`bin/sk-setup-systemd`)

Key responsibilities (see the script for the full implementation):

1. **Detect PATH** — locates node (nvm) + `~/.local/bin` + system bins.
2. **Enable linger** — `loginctl enable-linger "$USER"` so units survive logout.
3. **Generate units** — reads `agents.conf`, maps each SCHEDULE_TYPE to the
   right `[Timer]`/`[Service]` stanza, writes to `~/.config/systemd/user/`.
4. **Reload + enable** — `daemon-reload`, then `enable --now` each timer/service.

```bash
./bin/sk-setup-systemd            # install + start everything
./bin/sk-setup-systemd --dry-run  # print generated units without installing
./bin/sk-setup-systemd --stop     # stop + disable all managed units
```

### 3. Auto-Heal Script (`bin/sk-agent-doctor`)

Diagnoses failing agents by reading their logs / journald and applies known
fixes:

| Pattern | Auto-Fix |
|---------|----------|
| `command not found` / status 127 | Re-run `sk-setup-systemd` (regenerate PATH) |
| `No module named 'X'` | `pip3 install X` (with name mapping) |
| `address already in use` (EADDRINUSE) | Kill stale process, restart unit |
| `ENOTEMPTY .next` | Remove stale build cache |
| `Permission denied` | Report (check file ownership) |
| `OAuth token has expired` | Report: `claude login` (manual) |
| `Push failed` | Report: check git remote (manual) |
| API unreachable | Report: check network (manual) |

```bash
./bin/sk-agent-doctor            # diagnose + auto-fix
./bin/sk-agent-doctor --check    # diagnose only (dry run)
```

Integrates with `sk-tester-cron` — tester auto-triggers doctor when an agent
health check fails.

### Cron-Script Conventions (rivendell flavor)

Every cron-style script under `bin/sk-*-cron` (or any `bin/sk-*` invoked by a
systemd unit) follows the same shape. Following these conventions means the
fleet behaves predictably — anomalies surface naturally and re-runs are safe.

```bash
#!/usr/bin/env bash
# sk-<name> — <one-line purpose>
#
# <2-3 line explanation of what it does and what failure mode it solves>
set -euo pipefail

# Resolve repo root from script location, NOT from $PWD — a unit's cwd is unreliable
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STATE_DIR="$REPO_DIR/reports"
STATE_FILE="$STATE_DIR/.<name>-state"   # gitignored runtime state
LOG_FILE="$STATE_DIR/<name>.log"

mkdir -p "$STATE_DIR"

# Optional: hook into dashboard observability
set +e; source "$REPO_DIR/bin/sk-exec-lib" 2>/dev/null || true; set -e

# ... do the work ...

# Always exit 0 for maintenance scripts; failures live in the log, not the
# unit exit code. Use exit 1 only when the script itself broke (config
# missing, prerequisite absent), not when "nothing was wrong to fix".
exit 0
```

**Five conventions worth treating as load-bearing:**

1. **Silent on healthy.** Only write to `LOG_FILE` when something actually
   changed (`FIXED`, `RESTART`, `ARCHIVED`). A healthy fleet produces empty
   logs, which makes anomalies obvious. A noisy log buries the signal.

2. **State in `reports/.<name>-state`.** Hidden file, gitignored. Plain text,
   parseable by `grep`/`cut`. Anything stateful (last-run timestamp, counters)
   goes here. Examples in this repo: `.watchdog-state`, `.harvest-state`,
   `.harvest-done`.

3. **Pipefail trap defense.** With `set -euo pipefail`, a `grep` that finds no
   match returns 1 and kills the whole script. Wrap risky pipelines:
   ```bash
   { grep "^$key:" "$STATE_FILE" 2>/dev/null | cut -d: -f2-; } || true
   ```

4. **Idempotent re-run.** Running the script twice in a row on already-clean
   state must be a no-op. Validate before deploying the unit:
   ```bash
   ./bin/sk-<name>; echo "first: $?"
   ./bin/sk-<name>; echo "second: $?"   # both 0, no log change between them
   ```
   This is what makes `systemctl --user start` / timer re-fires safe.

5. **`exit 0` always for maintenance.** Maintenance scripts are not health
   checks. If you exit non-zero when "nothing needed fixing", systemd marks the
   unit `failed` and `list-units` shows alarming failures that mean nothing.
   Reserve non-zero exit codes for "the script itself broke."

**See live examples:** `bin/sk-watchdog`, `bin/sk-deploy-symlink-fix`,
`bin/sk-reports-janitor`, `bin/sk-workflow-retro-cron`. All follow this shape.

### Debugging the Fleet

```bash
# All managed units at a glance
systemctl --user list-units 'com.sk.*' --no-pager

# Next/last fire time for every timer
systemctl --user list-timers --all --no-pager

# One unit's recent result + log
systemctl --user status com.sk.agent.rivendell.harvest.service
journalctl --user -u com.sk.agent.rivendell.harvest.service -n 50 --no-pager

# Common exit statuses (systemctl status → "status=N")
#   0   = success
#   1   = script error (check the log)
#   127 = command not found (fix PATH in the unit)
#   203 = ExecStart not found / not executable

# Reload all after editing agents.conf
./bin/sk-setup-systemd

# Stop + disable all
./bin/sk-setup-systemd --stop
```
