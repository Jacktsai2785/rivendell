# User Flow: sk-dashboard

## Flow 1: Overview（US-1）

```mermaid
flowchart TD
    A[streamlit run app.py] --> B[Sidebar 載入]
    B --> C[Overview 頁面]
    C --> D[讀取 agent 狀態<br>launchctl list]
    C --> E[讀取 hook 狀態<br>settings.json]
    C --> F[讀取 token 今日花費<br>SQLite]
    C --> G[讀取 skill 總數<br>TSV + SKILL.md]
    D & E & F & G --> H[渲染 metrics 卡片]
    H --> I[渲染 agent 狀態表]
    H --> J[渲染 hook 狀態表]
    I --> K{exit code ≠ 0?}
    K -->|是| L[卡片標紅 + 警示圖示]
    K -->|否| M[卡片標綠]
    L & M & J --> N[頁面完成]
    N --> O{使用者動作}
    O -->|點擊 agent 名稱| P[跳轉 Agents 頁]
    O -->|點擊 hook 名稱| Q[跳轉 Hooks 頁]
    O -->|點擊 Run Audit| R[觸發 sk audit]
    R --> S{成功?}
    S -->|是| T[顯示完成訊息 + 刷新]
    S -->|否| U[顯示錯誤訊息]
```

## Flow 2: Agent 管理（US-2, US-3）

```mermaid
flowchart TD
    A[Sidebar: 點擊 Agents] --> B[Agents 頁面]
    B --> C[掃描 ~/Library/LaunchAgents/<br>+ sk agent list]
    C --> D[每個 agent 渲染卡片]
    D --> E{使用者動作}

    E -->|Start| F[launchctl load plist]
    F --> G{成功?}
    G -->|是| H[刷新狀態：loaded]
    G -->|否| I[顯示錯誤<br>plist 不存在/格式錯]

    E -->|Stop| J[launchctl unload plist]
    J --> K{成功?}
    K -->|是| L[刷新狀態：unloaded]
    K -->|否| M[顯示錯誤]

    E -->|Run Now| N[launchctl start label]
    N --> O[顯示 已觸發 toast]
    O --> P[等待幾秒後刷新]

    E -->|展開 Logs| Q[讀取最近 3 筆 agent_runs<br>from SQLite]
    Q --> R[顯示 log viewer]
    R --> S{有報告檔?}
    S -->|是| T[顯示報告預覽/連結]
    S -->|否| U[顯示 尚無執行紀錄]
```

## Flow 3: Hook 管理（US-4）

```mermaid
flowchart TD
    A[Sidebar: 點擊 Hooks] --> B[Hooks 頁面]
    B --> C[讀取 ~/.claude/settings.json<br>hooks 區塊]
    C --> D[每個 hook 渲染列]
    D --> E[顯示: event, matcher,<br>script path, toggle]
    E --> F{使用者動作}

    F -->|Toggle OFF| G[備份 settings.json]
    G --> H[從 hooks 移除該項]
    H --> I[寫入 settings.json]
    I --> J[刷新 + 顯示 已停用]

    F -->|Toggle ON| K[備份 settings.json]
    K --> L[加回該 hook 項目]
    L --> M[寫入 settings.json]
    M --> N[刷新 + 顯示 已啟用]

    F -->|查看 script| O[讀取 script 檔案]
    O --> P[code block 顯示內容]
```

## Flow 4: Skill 總覽（US-5）

```mermaid
flowchart TD
    A[Sidebar: 點擊 Skills] --> B[Skills 頁面]
    B --> C[讀取 skill-summaries-zh.tsv]
    B --> D[掃描 ~/.claude/skills/*/SKILL.md]
    C & D --> E[合併資料：名稱, 分類,<br>功能, 行數, invocable, lifecycle]
    E --> F[渲染可搜尋/可篩選表格]
    F --> G{使用者動作}
    G -->|搜尋| H[即時過濾表格]
    G -->|選分類| I[按分類篩選]
    G -->|點擊 skill 名稱| J[展開詳情:<br>完整 description, tags, 檔案路徑]
```

## Flow 5: Token 趨勢（US-6）

```mermaid
flowchart TD
    A[Sidebar: 點擊 Token Usage] --> B[Token Usage 頁面]
    B --> C[從 SQLite 讀取 token_usage]
    C --> D{有歷史資料?}
    D -->|否| E[顯示 無資料<br>請先跑 sk audit]
    D -->|是| F[渲染時間範圍選擇器<br>7天/30天/全部]
    F --> G[折線圖：每日花費 USD]
    F --> H[堆疊長條圖：各專案佔比]
    F --> I[明細表：date, sessions,<br>api_calls, tokens, cost]
    G & H & I --> J[頁面完成]
```

## Flow 6: Settings（US-8）

```mermaid
flowchart TD
    A[Sidebar: 點擊 Settings] --> B[Settings 頁面]
    B --> C[從 SQLite 讀取 settings]
    C --> D[顯示 Telegram 設定區塊]
    D --> E{已設定?}
    E -->|是| F[顯示已設定 + Test 按鈕 + 開關]
    E -->|否| G[顯示輸入表單:<br>bot token + chat ID]
    G --> H[使用者填入 + 儲存]
    H --> I[寫入 SQLite]
    I --> J[發送測試訊息]
    J --> K{收到?}
    K -->|是| L[顯示 設定成功]
    K -->|否| M[顯示 token/chat ID 錯誤]
    F -->|Test| J
    F -->|Toggle 通知| N[更新 SQLite 開關]
```

---

## Screen Inventory

| # | Screen | Route | Purpose | Key Elements |
|---|--------|-------|---------|-------------|
| 1 | Overview | `Overview` (default) | 全局狀態一覽 | metrics 卡片 x4, agent 狀態表, hook 狀態表, Run Audit 按鈕 |
| 2 | Agents | `Agents` | Agent 管理 + log | agent 卡片（Start/Stop/Run Now）, log viewer, 報告預覽 |
| 3 | Hooks | `Hooks` | Hook 開關管理 | hook 列表 + toggle, script 預覽 |
| 4 | Skills | `Skills` | Skill 瀏覽 | 可搜尋/篩選表格, 分類 filter, 詳情展開 |
| 5 | Token Usage | `Token Usage` | 花費趨勢分析 | 折線圖, 堆疊長條圖, 明細表, 時間範圍選擇 |
| 6 | Settings | `Settings` | 通知設定 | Telegram bot token/chat ID 輸入, test 按鈕, 通知開關 |

### Reusable Components

| Component | Used In |
|-----------|---------|
| Sidebar（頁面導覽 + Run Audit） | 全部頁面 |
| Status Badge（loaded/unloaded/error） | Overview, Agents |
| Metric Card（數字 + 標籤 + 顏色） | Overview, Token Usage |
| Expandable Log Viewer | Agents |
| Searchable DataTable | Skills, Token Usage |
