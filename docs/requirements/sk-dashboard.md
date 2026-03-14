# Requirement: sk-dashboard

**Target User:** 個人（manibari）
**Problem:** 46 skills + 3 agents + 3 hooks 散落各處，缺乏統一管理介面
**Trigger:** agent/skill 數量增長到手動管理不實際

**Tech Stack:** Streamlit (Python)
**Data Store:** SQLite（持久化歷史數據）
**Notification:** Telegram Bot
**Deployment:** 本機 `streamlit run`，手動開

---

## User Stories

### US-1: 總覽儀表板

**As a** skill/agent 管理者
**I want to** 開啟一頁看到所有 agent、hook、skill 的即時狀態
**So that** 我不需要跑多個指令才能了解全局

**Acceptance Criteria:**
- [ ] 頂部顯示摘要 metrics：skill 總數、active agents、active hooks、今日 token 花費
- [ ] Agent 狀態卡片：名稱、排程、loaded/unloaded、最近 exit code、最後執行時間
- [ ] Hook 狀態卡片：event type、matcher、script path、enabled/disabled
- [ ] 若有 agent exit code ≠ 0，卡片顯示紅色警示

### US-2: Agent 管理

**As a** agent 管理者
**I want to** 從 dashboard 啟動/停止/手動執行 agent
**So that** 我不需要記 launchctl 指令

**Acceptance Criteria:**
- [ ] 每個 agent 有 Start / Stop / Run Now 按鈕
- [ ] Start = `launchctl load <plist>`，Stop = `launchctl unload <plist>`
- [ ] Run Now = `launchctl start <label>`（立即觸發一次）
- [ ] 操作後即時刷新狀態
- [ ] 若 plist 不存在或格式錯誤，顯示錯誤訊息而非 crash

### US-3: Agent Log 檢視

**As a** agent 管理者
**I want to** 在 dashboard 直接看 agent 最近的 log
**So that** 我不需要 `cat` 或 `tail` 各個 log 檔案

**Acceptance Criteria:**
- [ ] 每個 agent 可展開 log viewer
- [ ] 顯示最近 3 次執行的 log（structured JSONL 解析為可讀格式）
- [ ] 顯示產出的報告檔（如 daily-2026-03-13.md）的連結或預覽
- [ ] 若 log 不存在，顯示「尚無執行紀錄」

### US-4: Hook 管理

**As a** hook 管理者
**I want to** 從 dashboard 啟用/停用個別 hook
**So that** 我可以快速切換而不用手動編輯 settings.json

**Acceptance Criteria:**
- [ ] 每個 hook 有 toggle switch（enabled/disabled）
- [ ] Toggle 實際修改 `~/.claude/settings.json` 的 hooks 區塊
- [ ] 修改前備份原始 settings.json
- [ ] 顯示 hook script 的最後修改時間和檔案大小

### US-5: Skill 總覽

**As a** skill 管理者
**I want to** 看到所有 skill 的分類、狀態、功能說明
**So that** 我掌握目前的 skill 組合

**Acceptance Criteria:**
- [ ] 表格顯示：名稱、分類（中文）、功能說明（中文）、行數、invocable、lifecycle 狀態
- [ ] 可按分類篩選
- [ ] 可搜尋 skill 名稱或功能說明
- [ ] 資料來源：`data/skill-summaries-zh.tsv` + SKILL.md frontmatter

### US-6: Token 用量趨勢

**As a** 成本管理者
**I want to** 看到每日/每週/每專案的 token 用量趨勢圖
**So that** 我可以觀察花費模式並控制成本

**Acceptance Criteria:**
- [ ] 折線圖：每日花費（USD），可選 7 天 / 30 天 / 全部
- [ ] 堆疊長條圖：各專案花費佔比
- [ ] 表格：每日明細（sessions、API calls、tokens、cost）
- [ ] 資料持久存入 SQLite，每次跑 audit 時自動寫入
- [ ] 歷史資料不因 stats-cache 過期而遺失

### US-7: 手動觸發 Audit

**As a** 管理者
**I want to** 從 dashboard 一鍵跑 `sk audit`
**So that** 我可以隨時更新報告而不用切到終端機

**Acceptance Criteria:**
- [ ] 「Run Audit」按鈕，點擊後執行 `./bin/sk audit`
- [ ] 執行中顯示 spinner
- [ ] 完成後刷新所有 dashboard 數據
- [ ] 顯示最後 audit 時間

### US-8: Telegram 通知

**As a** 管理者
**I want to** agent 失敗時收到 Telegram 通知
**So that** 我不在電腦前也能知道出問題

**Acceptance Criteria:**
- [ ] 設定頁可輸入 Telegram bot token + chat ID
- [ ] 認證資訊存入 SQLite（加密或至少不 commit）
- [ ] Agent exit code ≠ 0 時，發送 Telegram 訊息：agent 名稱、exit code、時間、最後 log 摘要
- [ ] Agent 排程未執行（missed schedule）時通知
- [ ] 通知可在設定頁開關

---

## Scope

| In Scope | Out of Scope |
|----------|-------------|
| Agent CRUD（start/stop/run/view logs） | 建立新 agent（用 `sk agent create`） |
| Hook toggle（enable/disable） | 編輯 hook script 內容 |
| Skill 唯讀總覽（搜尋/篩選） | Skill 建立/編輯（用 skill-creator） |
| Token 趨勢圖 + 持久化 | 即時 token 計量（只看歷史） |
| 手動觸發 audit | 自動排程 audit（用 launchd） |
| Telegram 失敗通知 | Telegram 雙向控制（用 claude-to-telegram） |
| SQLite 持久化 | 多用戶 / 認證 |
| 本機 streamlit run | 雲端部署 |

---

## Data Model (SQLite)

```sql
-- Token 用量歷史
CREATE TABLE token_usage (
    date TEXT PRIMARY KEY,       -- YYYY-MM-DD
    sessions INTEGER,
    api_calls INTEGER,
    tokens_total INTEGER,        -- raw token count
    cost_usd REAL,
    details_json TEXT             -- per-project breakdown
);

-- Agent 執行紀錄
CREATE TABLE agent_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT NOT NULL,
    project TEXT NOT NULL,
    started_at TEXT,              -- ISO timestamp
    finished_at TEXT,
    exit_code INTEGER,
    log_path TEXT,
    report_path TEXT,
    tokens_used INTEGER,
    cost_usd REAL
);

-- 設定
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
```

---

## Page Structure

```
📊 sk-dashboard
├── 🏠 Overview          ← US-1: metrics + agent/hook 狀態卡片
├── 🤖 Agents            ← US-2, US-3: agent 管理 + log viewer
├── 🔗 Hooks             ← US-4: hook toggle
├── 🧩 Skills            ← US-5: skill 表格（搜尋/篩選）
├── 📈 Token Usage       ← US-6: 趨勢圖 + 明細表
└── ⚙️ Settings          ← US-8: Telegram 設定、通知開關
```

「Run Audit」按鈕放在 sidebar 底部，全頁可用（US-7）。
