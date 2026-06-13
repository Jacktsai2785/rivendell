---
name: 3-raw-watcher-file-ingestion
description: |
  建立 systemd path unit + service 監控 raw/ 投擲區，自動觸發 Claude 檔案攝取流程。包含 inotify watcher script、debounce 去重、failure retry 機制。
  TRIGGER when: 需要「自動觸發」檔案處理、「監控資料夾」變更、「raw watcher」設定、「file drop trigger」、「inotify Claude 整合」等場景
when_to_use: |
  - 建立持續監控的 raw/ 檔案落地 → 自動攝取流程
  - 整合 systemd path unit 實現 inotify 觸發（無需定期輪詢）
  - 需要 debounce 機制避免單一檔案多次觸發
  - 需要 failure retry 與詳細日誌追蹤
version: 1.0.0
tags: ["backend", "automation", "systemd", "file-watcher", "inotify", "linux"]
languages: all
---

## Overview

本 skill 提供完整的 systemd path unit + service 方案，監控 raw/ 投擲區目錄，當新檔案落地時自動觸發 Claude consume 流程。

**價值主張：**
- 無定期輪詢開銷，依賴 kernel inotify 事件（比 cron 或 sleep 迴圈高效）
- systemd path unit 原生支援 debounce（PathExistsGlob + lock 機制）
- 整合 failure retry 與 exponential backoff（systemd Restart 機制）
- 日誌集中在 journalctl 便於除錯與監控
- 與 systemd 生態整合，無外部依賴（純 bash + systemd）

## 何時使用

**具體觸發場景：**
1. 需要監控 raw/ 資料夾，當新的 CSV / JSON / 原始資料檔案被投擲進來時，自動觸發 consume 流程
2. 需要去重機制：同一批多個檔案到達，不要每個檔案都獨立觸發一次（debounce）
3. 需要容錯機制：consume 失敗時自動重試，並記錄失敗狀態，避免無限重試堆積
4. 需要在 Linux / WSL2 環境統一路由檔案落地事件（inotify 非 FSEvents）
5. 整合到現有 systemd 管理的服務體系，與其他 service 協調啟停

## 執行步驟或模式

### 第一步：編寫 watcher script

在 `/usr/local/bin/` 下建立可執行 script `raw-watcher-consume`：

    #!/usr/bin/env bash
    set -euo pipefail

    RAW_DIR="${RAW_DIR:-${HOME}/mops_dbs/raw}"
    LOG_DIR="${LOG_DIR:-${HOME}/.local/share/raw-watcher}"
    LOCK_FILE="${LOG_DIR}/consume.lock"
    DEBOUNCE_WAIT=2

    mkdir -p "$LOG_DIR"

    log_msg() {
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "${LOG_DIR}/watcher.log"
    }

    acquire_lock() {
      local timeout=30
      local elapsed=0
      while [ $elapsed -lt $timeout ]; do
        if mkdir "$LOCK_FILE" 2>/dev/null; then
          return 0
        fi
        sleep 0.1
        elapsed=$((elapsed + 1))
      done
      return 1
    }

    release_lock() {
      rm -rf "$LOCK_FILE" 2>/dev/null || true
    }

    trap release_lock EXIT

    log_msg "watcher triggered: raw/ directory updated"

    if ! ls "$RAW_DIR"/*.* >/dev/null 2>&1; then
      log_msg "no files in $RAW_DIR, exiting"
      exit 0
    fi

    log_msg "acquiring lock for consume operation..."
    if ! acquire_lock; then
      log_msg "failed to acquire lock after 30s, another consume in progress"
      exit 1
    fi

    sleep "$DEBOUNCE_WAIT"

    log_msg "lock acquired, starting consume operation"

    if command -v sk-consume &>/dev/null; then
      if sk-consume run --source raw --batch-id "watcher-$(date +%s)" >> "${LOG_DIR}/consume.log" 2>&1; then
        log_msg "consume completed successfully"
      else
        log_msg "consume failed with exit code $?"
        exit 1
      fi
    else
      log_msg "ERROR: sk-consume command not found"
      exit 127
    fi

設置執行權限：

    chmod +x /usr/local/bin/raw-watcher-consume

### 第二步：編寫 systemd path unit

在 `~/.config/systemd/user/` 下建立 `raw-watcher.path`（若為全系統服務，改為 `/etc/systemd/system/`）：

    [Unit]
    Description=Watch raw/ directory for file changes
    Documentation=man:systemd.path(5)

    [Path]
    PathExistsGlob=%h/mops_dbs/raw/*
    Unit=raw-watcher.service
    MakeDirectory=yes

    [Install]
    WantedBy=default.target

PathExistsGlob 會監控 raw/ 中的任何檔案，當檔案被新增或修改時觸發對應的 service unit。

### 第三步：編寫 systemd service unit

在 `~/.config/systemd/user/` 下建立 `raw-watcher.service`：

    [Unit]
    Description=Consume files from raw/ directory
    After=network-online.target
    Wants=network-online.target

    [Service]
    Type=oneshot
    ExecStart=/usr/local/bin/raw-watcher-consume
    StandardOutput=journal
    StandardError=journal
    SyslogIdentifier=raw-watcher

    Restart=on-failure
    RestartSec=5s
    StartLimitBurst=3
    StartLimitIntervalSec=60

    Environment="RAW_DIR=%h/mops_dbs/raw"
    Environment="LOG_DIR=%h/.local/share/raw-watcher"

    [Install]
    WantedBy=multi-user.target

**參數說明：**
- `Type=oneshot`：service 執行完畢即視為完成（無長時間執行）
- `Restart=on-failure`：失敗時重啟，成功後不重啟
- `RestartSec=5s`：重啟前等待 5 秒（給 debounce 時間）
- `StartLimitBurst=3`：60 秒內最多重啟 3 次（防止無限重試堆積）

### 第四步：安裝並啟動

使用者級別服務（推薦，無需 sudo，適用於開發環境）：

    mkdir -p ~/.config/systemd/user
    systemctl --user daemon-reload
    systemctl --user enable raw-watcher.path
    systemctl --user start raw-watcher.path

驗證狀態：

    systemctl --user status raw-watcher.path
    systemctl --user status raw-watcher.service
    journalctl --user -u raw-watcher -f

若需全系統服務（生產環境或需跨用戶訪問）：

    sudo cp raw-watcher.{path,service} /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable raw-watcher.{path,service}
    sudo systemctl start raw-watcher.path

### 第五步：測試觸發

**測試 1：直接啟動 service**

    systemctl --user start raw-watcher.service
    journalctl --user -u raw-watcher -n 5

**測試 2：模擬檔案落地（驗證 path unit 觸發）**

    touch ~/mops_dbs/raw/test-$(date +%s).csv
    sleep 3
    journalctl --user -u raw-watcher -n 10

**測試 3：檢查日誌詳情**

    cat ~/.local/share/raw-watcher/watcher.log
    cat ~/.local/share/raw-watcher/consume.log

### 第六步：故障排查

**Path unit 不觸發：**
- 驗證 raw/ 目錄存在且可讀：`ls -la ~/mops_dbs/raw/`
- 檢查 path unit 是否啟用：`systemctl --user list-unit-files | grep raw-watcher`
- 驗證 systemd 監控狀態：`systemctl --user status raw-watcher.path`（Active: active 表示正常）
- 檢查 inotify watch 數量（若有「No space left on device」錯誤）：
  
      cat /proc/sys/fs/inotify/max_user_watches
      sudo sysctl fs.inotify.max_user_watches=524288

**Service 重複觸發或卡住：**
- 檢查 lock 檔案是否清理：`ls -la ~/.local/share/raw-watcher/`
- 若 lock 一直存在，手動清理：`rm -rf ~/.local/share/raw-watcher/consume.lock`
- 增加 debounce 延遲：編輯 watcher script 中 `DEBOUNCE_WAIT=5`（改為 5 秒）

**Consume 流程失敗：**
- 查看完整日誌：`journalctl --user -u raw-watcher --all -S -2h`
- 驗證 sk-consume 可用：`which sk-consume; sk-consume --version`
- 檢查環境變數（API 令牌等）：`systemctl --user show-environment | grep -i api`
- 手動執行 script 測試：`bash -x /usr/local/bin/raw-watcher-consume 2>&1 | tee /tmp/debug.log`

## 注意事項

### 已知限制與折衷

1. **檔案複製完成時序問題：** 檔案在複製過程中可能被 PathExistsGlob 檢測到，但尚未完全寫入。透過 debounce delay（延遲 2–5 秒）+ lock mechanism 可降低但無法完全消除。建議結合上層應用邏輯（如原子性 rename、`.tmp` → `.done` 模式，或檔案大小穩定檢查）。

2. **大量檔案同時到達時：** 第一個檔案觸發 consume，後續檔案可能需要等待 consume 完成或等待下一個 inotify 事件。若需立即並行處理多批，考慮隊列系統（如 Redis queue、MQ）而非 watcher。

3. **inotify 配額限制：** WSL2、容器或共享主機環境可能有 inotify watch 數量限制（預設 8192）。若監控多個目錄或系統其他部分也使用 inotify，可能耗盡配額。解決：增加 `/proc/sys/fs/inotify/max_user_watches`。

4. **用戶級 systemd service 的持久性：** 某些環境（ssh 登入後立即登出、systemd --user session 未持續）可能導致 service 無法自動啟動。若需確保持久運行，改用 `systemd-user-sessions.service` 或全系統 service。

5. **Debounce 延遲的折衷：** 延遲越短，反應越快，但多個檔案到達時無法批量處理。延遲越長，批量處理效率越高，但觀測延遲增加。根據用例調整 `DEBOUNCE_WAIT`（通常 1–5 秒合理；超過 10 秒使用者會感受到延遲）。

### 與其他候選的關係

- **候選 #2 (mops-file-ingestion-pipeline)：** raw-watcher 可作為自動觸發層。當 #2 提供完整的 validate → transform → load 管線時，本 skill 負責「新檔案到達 → 呼叫 #2 的 consume API」。
- **HOWTO_WATCHER.md：** 本 skill 是該文件的 systemd / inotify 實踐形式。若檔案不存在，可將本 skill 的內容提取為獨立文件。

### 權限與安全性

- watcher script 需要 raw/ 目錄的讀取權限，consume 子流程需適當的寫入權限
- 若跨用戶執行（全系統 service），確保 RAW_DIR 與 LOG_DIR 的權限正確（`chmod 755 raw/`，`chown _mops_watcher log/`）
- 建議為 watcher 服務單獨建立低權限用戶（如 `_raw_watcher`），避免以系統管理員身份運行

### 維護與監控

定期檢查日誌，監控以下指標：
- 成功觸發次數與失敗重試次數
- Debounce / lock 競爭（多個 watcher 同時喚醒情況）
- 處理延遲（檔案到達 → consume 完成的時間）
- journalctl 中是否有 `StartLimitBurst` 超限警告

設置 log rotation（避免日誌檔案無限增長）：

    # /etc/logrotate.d/raw-watcher
    ~/.local/share/raw-watcher/*.log {
      weekly
      rotate 4
      compress
      delaycompress
      missingok
      notifempty
    }

或使用 systemd journal 內建的 TTL：

    journalctl --user --vacuum-time=30d  # 保留最近 30 天