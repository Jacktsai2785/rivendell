---
name: cron-script 範式段落 (systemd 排程腳本骨架)
description: >
  rivendell 所有 cron-style 維護腳本（bin/sk-*-cron，由 systemd user timer 觸發）共用的「shape」。
  codify 成可貼上的骨架：從 script 位置（非 $PWD）解析 repo root、state 放 reports/.<name>-state、
  pipefail 防護、idempotent re-run、healthy 時靜默、維護腳本一律 exit 0。
  TRIGGER when: 使用者要新增一支定時維護腳本、問「cron 腳本要怎麼寫」「sk-*-cron 範式」「排程腳本骨架」，
  或在 agents.conf 新增 agent 後要寫對應 script。
when_to_use: 寫一支會被 systemd timer / cron 定時呼叫的維護腳本時，照這個骨架開頭。
version: 2.0.0
tags: [workflow, linux, systemd, cron, conventions]
languages: [bash]
---

# cron-script 範式段落（systemd 排程腳本骨架）

rivendell 的定時維護腳本由 systemd user timer 觸發（見 **launchd-agent** skill 的
systemd Scheduled-Agent 指南與 `bin/sk-setup-systemd`）。每一支都照同一個骨架開頭，
讓整個 fleet 行為可預測——異常自然浮現、重跑安全。

## 可貼上的骨架

```bash
#!/usr/bin/env bash
# sk-<name> — <一句話用途>
#
# <2-3 行：做什麼、解決哪種失敗模式>
set -euo pipefail

# 從 script 位置解析 repo root，不要用 $PWD（systemd unit 的 cwd 不可靠）
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STATE_DIR="$REPO_DIR/reports"
STATE_FILE="$STATE_DIR/.<name>-state"   # gitignored runtime state
LOG_FILE="$STATE_DIR/<name>.log"
mkdir -p "$STATE_DIR"

# 可選：接上 dashboard observability
set +e; source "$REPO_DIR/bin/sk-exec-lib" 2>/dev/null || true; set -e

# ... 做事 ...

# 維護腳本一律 exit 0；失敗寫進 log，不寫進 unit exit code。
exit 0
```

## 五條 load-bearing 慣例

1. **healthy 時靜默。** 只有真的改了東西（`FIXED` / `RESTART` / `ARCHIVED`）才寫
   `LOG_FILE`。健康的 fleet 產生空 log，異常才顯眼。

2. **state 放 `reports/.<name>-state`。** 隱藏檔、gitignored、純文字（`grep`/`cut`
   可解析）。範例：`.watchdog-state`、`.harvest-state`、`.harvest-done`。

3. **pipefail 防護。** `set -euo pipefail` 下，找不到的 `grep` 回傳 1 會殺掉整支腳本。
   包起來：
   ```bash
   { grep "^$key:" "$STATE_FILE" 2>/dev/null | cut -d: -f2-; } || true
   ```

4. **idempotent re-run。** 連跑兩次、第二次必須是 no-op：
   ```bash
   ./bin/sk-<name>; echo "first: $?"
   ./bin/sk-<name>; echo "second: $?"   # 都 0，兩次間 log 無變化
   ```
   這讓 timer 重複觸發安全。

5. **維護腳本一律 `exit 0`。** 維護腳本不是 health check。若「沒東西要修」時 exit 非 0，
   systemd 會把 unit 標成 `failed`，`list-units` 出現一堆毫無意義的 failure。非 0 只保留給
   「腳本自己壞了」（缺 config、缺前置）。

## 排程它

在 `agents/agents.conf` 加一行，再跑 `./bin/sk-setup-systemd` 產生 unit：

```
com.sk.agent.rivendell.<name> | rivendell | bin/sk-<name>-cron | calendar | 3:00 | reports
```

完整 fleet 模式、`OnCalendar` 寫法、`loginctl enable-linger` 等見 **launchd-agent**
skill。實際範例：`bin/sk-watchdog`、`bin/sk-deploy-symlink-fix`、`bin/sk-reports-janitor`、
`bin/sk-workflow-retro-cron`。
