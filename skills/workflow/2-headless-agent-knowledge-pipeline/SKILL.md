---
name: 2-headless-agent-knowledge-pipeline
description: 使用 systemd user timer 定期執行 Claude Code headless 任務，搭配知識庫消化動詞（digest/lint/consume）。TRIGGER when: 使用者說「定期跑 Claude」「headless Claude」「systemd timer claude」「每晚自動整理筆記」「cron Claude Code」「unattended agent」。
version: 1.0.0
tags:
  - headless
  - systemd
  - knowledge-base
  - automation
  - timer
languages: all
when_to_use: |
  當使用者需要每晚自動 digest inbox.md、每週 lint 知識庫、或定期 consume 新進檔案時。
---

## Overview

`headless-agent-knowledge-pipeline` 將 Claude Code 包裝成無人值守的定時任務，結合 systemd user timer 與知識庫消化動詞，實現自動化的筆記/知識庫維護。

相比通用的 `headless-agent`、`systemd-user-service`、`launchd-agent`，本技能專注於「Claude Code + 知識庫動詞組合」——提供即插即用的 unit file 範本、loginctl 設定、log rotation、及手動觸發 fallback。

## 何時使用

- **每晚自動 digest**：每晚 21:00 執行 `claude --print` 消化 `inbox.md`，生成摘要
- **週間 lint**：每週一 07:00 執行 `claude --print` 檢查整個 vault 的一致性
- **定期 consume**：每小時執行一次處理新進的 raw 檔案
- **無人值守場景**：WSL2/Linux 伺服器背景任務，無需登入 terminal

## 執行步驟

### 1. 先備條件檢查

```bash
# 檢查 Claude Code CLI 已安裝
which claude

# 檢查 systemd user 環境
loginctl user-status
```

### 2. 建立知識庫相關目錄

```bash
mkdir -p ~/knowledge-vault/{inbox,archive,raw,logs}
mkdir -p ~/.config/systemd/user
```

### 3. 建立 systemd service file

在 `~/.config/systemd/user/kb-digest.service` 寫入：

```
[Unit]
Description=Knowledge Base Digest Agent (Claude)
Documentation=man:claude(1)
After=network-online.target

[Service]
Type=oneshot
ExecStart=/home/jacktsai/.local/bin/kb-digest.sh
StandardOutput=journal
StandardError=journal
SyslogIdentifier=kb-digest
Environment="KB_PATH=%h/knowledge-vault"
Environment="INBOX_PATH=%h/knowledge-vault/inbox.md"
```

### 4. 建立 systemd timer file

在 `~/.config/systemd/user/kb-digest.timer` 寫入：

```
[Unit]
Description=Knowledge Base Digest Timer (Claude)
Requires=kb-digest.service

[Timer]
OnCalendar=daily
OnCalendar=*-*-* 21:00:00
Persistent=true
AccuracySec=1s

[Install]
WantedBy=timers.target
```

### 5. 建立 shell wrapper script

在 `~/.local/bin/kb-digest.sh` 寫入：

```bash
#!/bin/bash
set -euo pipefail

KB_PATH="${KB_PATH:-$HOME/knowledge-vault}"
INBOX_PATH="${INBOX_PATH:-$KB_PATH/inbox.md}"
LOG_DIR="${KB_PATH}/logs"
LOG_FILE="${LOG_DIR}/digest-$(date +%Y%m%d-%H%M%S).log"

mkdir -p "$LOG_DIR"

{
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting KB digest..."
  
  # 執行 Claude headless 任務
  claude --print << 'EOF'
整理以下知識庫 inbox，產生分類摘要，移動已消化項目到 archive。
EOF
  
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] KB digest completed."
} | tee -a "$LOG_FILE"

# log rotation - 刪除 30 天前的日誌
find "$LOG_DIR" -name "digest-*.log" -mtime +30 -delete
```

給予執行權限：

```bash
chmod +x ~/.local/bin/kb-digest.sh
```

### 6. 啟用 systemd user linger

確保 user service 在使用者 logout 時仍繼續執行：

```bash
loginctl enable-linger $USER
# 驗證
loginctl show-user $USER | grep Linger
```

### 7. 重新載入 systemd 並啟動 timer

```bash
systemctl --user daemon-reload
systemctl --user enable kb-digest.timer
systemctl --user start kb-digest.timer
```

### 8. 驗證設定

```bash
# 查看 timer 狀態與下次執行時間
systemctl --user list-timers kb-digest.timer

# 查看最近執行的 log
journalctl --user-unit kb-digest -n 50 -f

# 手動觸發一次（測試）
systemctl --user start kb-digest.service
```

## 進階設定

### 多個動詞 pipeline

若需要同時執行 digest/lint/consume，分別建立對應的 service + timer 組合：

- `kb-digest.service` / `kb-digest.timer` → 每晚 21:00
- `kb-lint.service` / `kb-lint.timer` → 每週一 07:00
- `kb-consume.service` / `kb-consume.timer` → 每小時整點

每個 service 對應各自的 shell script 和動詞邏輯、timer 排程、log 檔案分開管理。

### 環境變數與 secrets

若 Claude API key 需外部管理，在 systemd service 中使用 `EnvironmentFile=`：

```
[Service]
EnvironmentFile=%h/.config/claude/env.secret
```

在 `~/.config/claude/env.secret` 寫入（須 `chmod 600`）：

```
ANTHROPIC_API_KEY=sk-...
```

### 排程與衝突避免

- **daily digest**：`OnCalendar=*-*-* 21:00:00`
- **weekly lint**：`OnCalendar=Mon *-*-* 07:00:00`
- **hourly consume**：`OnCalendar=*-*-* *:00:00`

若擔心週任務與日常任務衝突，可在 timer 中加入隨機延遲：

```
[Timer]
RandomizedDelaySec=5m
```

### Log rotation 進階配置

若執行頻率高（如每小時），使用 logrotate 管理。在 `~/.config/logrotate.conf`：

```
/home/jacktsai/knowledge-vault/logs/digest-*.log {
  daily
  rotate 7
  compress
  delaycompress
  notifempty
}
```

或由使用者 cron 定期執行 `logrotate -f ~/.config/logrotate.conf`。

## 注意事項

### 1. Headless 環境下的 auth

若 Claude CLI 未自動偵測 API key，需確保：
- 認證檔案位於 `~/.config/anthropic/credentials.json`
- 或設定 `ANTHROPIC_API_KEY` 環境變數在 systemd service

### 2. 路徑與相對位置

Script 中所有路徑應使用絕對路徑或 `$HOME`，避免 systemd service 運行時的相對路徑陷阱。TimerService 運行時的工作目錄無法預測。

### 3. 日誌洪泛

若執行頻率高（如每小時），確保 log 輪轉機制正常，否則可能佔滿磁碟。script 中已預設 30 天自動刪除。

### 4. WSL2 / systemd 注意

- 確認 WSL2 distribution 已啟用 systemd：檢查 `/etc/wsl.conf` 包含 `[boot] systemd=true`
- WSL2 shutdown 時會中斷 timer 執行，需在 host 端設定排程器備份
- `loginctl enable-linger` 為必要步驟，否則使用者登出後 timer 停止

### 5. 與既有 skill 的區別

- **headless-agent**：通用 headless 框架，不限於知識庫
- **systemd-user-service**：generic systemd user service 設定，無知識庫邏輯
- **launchd-agent**：macOS 專用，此技能在 Linux/WSL2 環境

### 6. 手動觸發 fallback

若定時 timer 未執行，手動觸發測試：

```bash
systemctl --user start kb-digest.service

# 檢查狀態
systemctl --user status kb-digest.service
```

## 完整 3-動詞 pipeline 範例

若需同時運行 digest（每晚 21:00）+ lint（每週一 07:00）+ consume（每小時），建立三組 service/timer：

**檔案清單：**

- `~/.config/systemd/user/kb-digest.service` & `.timer` → digest
- `~/.config/systemd/user/kb-lint.service` & `.timer` → lint
- `~/.config/systemd/user/kb-consume.service` & `.timer` → consume
- `~/.local/bin/kb-digest.sh`、`kb-lint.sh`、`kb-consume.sh` → 各自的執行腳本

**啟用所有 timer：**

```bash
systemctl --user daemon-reload
systemctl --user enable kb-{digest,lint,consume}.timer
systemctl --user start kb-{digest,lint,consume}.timer

# 驗證全部運行狀態
systemctl --user list-timers
```

**Log 分開存放：**

```
~/knowledge-vault/logs/
├── digest-20260613-210000.log
├── lint-20260610-070000.log
└── consume-20260613-100000.log