---
name: 1-service-watchdog-launchd
description: >
  為 Linux / WSL2 上的 HTTP 服務（FastAPI / Next.js / dashboard）建立「HTTP probe + 自動重啟」
  watchdog，當服務卡住（process 還在、port 還開，但 HTTP 不回應）時自動 restart。用 systemd
  user timer 每 60 秒探測；標準重啟用 systemctl --user restart，連續多次無效時觸發 deep recovery。
  TRIGGER when: 使用者說「服務又掛了」「自動重啟」「watchdog」「HTTP healthcheck」「服務卡住」
  「dashboard 卡住」「process 活著但 HTTP 不回」。
when_to_use: >
  當一個長跑的 web 服務會「process 活著但 HTTP 卡死」時——systemd 的 Restart=always 只抓得到
  process 死亡，抓不到 hung-but-alive。這個 watchdog 補上 HTTP 層的健康檢查。
version: 2.0.0
tags: [workflow, linux, wsl2, systemd, watchdog, healthcheck, reliability]
languages: [bash]
---

# Service Watchdog — HTTP probe + auto-restart (systemd)

systemd's `Restart=always` only catches **process death**. It does NOT catch the
other common failure mode: the process is alive, the port is listening, but the
service is **hung** (deadlocked event loop, frozen worker, poisoned build cache)
so HTTP requests time out. This watchdog probes the HTTP endpoint and restarts
the unit when it's stuck-but-alive.

> Platform note: this machine is WSL2 + systemd. Restarts go through
> `systemctl --user restart <unit>`, NOT `launchctl kickstart`. The live
> implementation is `bin/sk-watchdog`, scheduled from `agents/agents.conf`.

## Architecture

```
systemd timer (every 60s)
   └─ sk-watchdog
        ├─ for each service: curl --max-time 5 http://127.0.0.1:PORT/health
        ├─ healthy → reset failure counter, write nothing (silent on healthy)
        ├─ failing → increment counter in reports/.watchdog-state
        ├─ counter ≥ THRESHOLD (3) → systemctl --user restart <unit>  (standard)
        └─ restarts_today ≥ ESCALATE (5) → deep recovery, then restart
```

Two-tier recovery, because a plain restart sometimes can't fix the root cause:

1. **Standard restart** — after `THRESHOLD` consecutive failures (~3 min red),
   `systemctl --user restart com.sk.dashboard.web.service`.
2. **Deep recovery** — when the same service has been restarted `ESCALATE_THRESHOLD`
   times in one calendar day without staying healthy, the restart isn't fixing
   it. Run a service-specific deep fix first (rebuild `.next` for web; reinstall
   venv for api), then restart. This catches the poisoned-build-cache failure
   mode where 27 futile restarts ran over 80 minutes against a bad `.next`.

## Probe loop (core pattern)

```bash
#!/usr/bin/env bash
# sk-watchdog — HTTP health check + auto-restart for hung-but-alive services.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STATE_DIR="$REPO_DIR/reports"
STATE_FILE="$STATE_DIR/.watchdog-state"   # gitignored; survives across runs
LOG_FILE="$STATE_DIR/watchdog.log"        # silent on healthy
THRESHOLD=3
ESCALATE_THRESHOLD=5
mkdir -p "$STATE_DIR"; touch "$STATE_FILE"

log() { echo "[$(date '+%F %T')] $*" >> "$LOG_FILE"; }

# State per service: <key>:<consecutive_failures>:<last_restart_ts>:<restarts_today>:<date>
get_state() { { grep "^$1:" "$STATE_FILE" 2>/dev/null | head -1 | cut -d: -f2-; } || true; }

probe() {  # probe <unit> <url>
  local unit="$1" url="$2"
  if curl -fsS --max-time 5 "$url" >/dev/null 2>&1; then
    return 0    # healthy
  fi
  return 1      # stuck or down
}

restart_unit() {  # standard recovery
  local unit="$1"
  log "  RESTART $unit (systemctl --user restart)"
  systemctl --user restart "$unit"
}
```

The full implementation (`bin/sk-watchdog`) adds the per-service failure
counters, the escalate-to-deep-recovery logic, and the `deep_recovery_web` /
`deep_recovery_api` handlers. Read it for the complete version.

### `systemctl --user restart` vs `launchctl kickstart`

| Action | macOS (old) | Linux / WSL2 (this machine) |
|--------|-------------|-----------------------------|
| Force restart a service | `launchctl kickstart -k gui/$UID/<label>` | `systemctl --user restart <label>.service` |
| Check it's running | `launchctl list <label>` | `systemctl --user is-active <label>.service` |
| Read recent logs | tail the plist's `StandardOutPath` | `journalctl --user -u <label>.service -n 50` |

If you are porting an older watchdog that calls `launchctl kickstart`, replace
each call with `systemctl --user restart`.

## Scheduling the watchdog (every 60s)

Declare it in `agents/agents.conf` as an `interval` agent and let
`bin/sk-setup-systemd` generate the timer:

```
com.sk.dashboard.watchdog | rivendell | bin/sk-watchdog | interval | 60 | reports
```

> **Known gap (fix me):** `bin/sk-setup-systemd` currently *skips* any label
> ending in `watchdog`/`doctor` (it was tagged "launchd-specific"). On this WSL
> machine that means the watchdog is **not actually scheduled**. To deploy it,
> either (a) remove the `*watchdog` skip case in `sk-setup-systemd` once
> `sk-watchdog` uses `systemctl --user restart` instead of `launchctl`, or (b)
> hand-install a one-off timer:
> ```bash
> # ~/.config/systemd/user/com.sk.dashboard.watchdog.timer
> [Timer]
> OnBootSec=60
> OnUnitActiveSec=60
> ```

## Conventions

This script follows the rivendell cron-script conventions (see the **launchd-agent**
skill → "Cron-Script Conventions"): silent on healthy, state in
`reports/.watchdog-state`, pipefail-safe state reads, idempotent, `exit 0` unless
the script itself broke. The watchdog writes to `watchdog.log` only on
`FAIL` / `RESTART` / `RECOVER` / `DEEP` — a healthy fleet produces an empty log.

## Verify

```bash
./bin/sk-watchdog                              # run one probe cycle by hand
cat reports/.watchdog-state                    # inspect counters
journalctl --user -u com.sk.dashboard.watchdog.service -n 20   # if scheduled
# Simulate a hang: pause the web service, confirm watchdog restarts it
systemctl --user kill -s STOP com.sk.dashboard.web.service     # freeze
./bin/sk-watchdog; ./bin/sk-watchdog; ./bin/sk-watchdog        # 3 fails → restart
```
