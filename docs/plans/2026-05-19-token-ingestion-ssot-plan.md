# rivendell Pragmatic Plan: Token Ingestion + SSOT

## Goal
用最小破壞的方式，先解掉 rivendell dashboard 目前最實際的兩個問題：

1. token 頁面仍在 request path parse `~/.claude/projects/**/*.jsonl`
2. agent / project identity 同時存在兩個 authoritative source

這份文件刻意不處理大型結構重整。目標是先改善效能與資料一致性，不動既有 launchd、reports、hook 工作流。

## Current State

### Token path
- `bin/sk-token-snapshot` 已存在，且由 `agents/agents.conf` 在每天 `02:30` 排程執行
- 目前 snapshot 只會把「每日總量」寫入 SQLite `token_usage`
- `dashboard/lib/tokens.py` 的 `get_filtered_usage()` 仍會掃描 `~/.claude/projects/*.jsonl`
- `dashboard-next/src/app/tokens/page.tsx` 預設直接打 `/api/tokens/filtered`
- `dashboard-next/api/server.py` 的 `/api/tokens/filtered` 每次都會直接走 `get_filtered_usage(date_start, date_end)`

結果：repo 已經有 ingest 雛形，但 dashboard 常用查詢路徑仍依賴 full JSONL parse。

### SSOT path
- README 宣告 `agents/agents.conf` 是 agent 的 single source of truth
- `dashboard/lib/agents.py` 目前又把 `~/.claude/projects.json` 當成 project / working directory 的 authoritative source 之一
- `dashboard/lib/projects.py` 直接讀寫 `~/.claude/projects.json`

結果：文件和程式碼對「誰才是 authoritative source」的定義不一致。

### Runtime constraints
- `dashboard-next` 由 launchd 管理，restart 不能假設用 `kill`
- `reports/` 已經是 agent commit / hook / janitor 的既有契約
- 目前有舊 `dashboard/` Streamlit 與新 `dashboard-next/` 並存，不能假設可以立即移除任何一邊

## Problems Confirmed
- `JSONL on request path` 會隨資料量成長而持續變慢
- `dual authoritative source` 會讓 UI、cron、README、程式碼各自說不同版本的真相
- `server.py` 很大，但目前不是首要風險；真正的風險是其中幾個 route 還綁著重 IO 掃描

## Decisions

### Decision 1: Phase 1 只做高 ROI、低破壞改動
本階段只做：

- token ingestion 補完
- SSOT 定義收斂
- 必要時小幅抽出 `server.py` 的 hot path

本階段不做：

- repo 結構改成 `apps/` / `packages/`
- OpenAPI codegen
- 移動 `reports/` 到新目錄
- 移除 Streamlit legacy dashboard
- launchd/plist label 重新命名

### Decision 2: `agents/agents.conf` 應作為 agent identity 的 SSOT
建議把 `agents/agents.conf` 定義為下列資訊的 authoritative source：

- agent label
- project binding
- script path
- schedule
- log directory

`projects.json` 保留，但角色降級為 project metadata / dashboard enrichment：

- repo path
- description
- mission brief
- 非排程型 UI metadata

換句話說：
- agent 是 `agents.conf` 為主
- project metadata 是 `projects.json` 為主
- 不再讓兩者同時聲稱自己是同一種資料的 authority

### Decision 3: `server.py` 不因為行數而拆，只有在 hot path 需要時才抽
目前不做全面 route/module 重組。

只有兩種情況才拆：
- token ingestion 落地時，順手把 tokens 相關 helper 抽出
- 某個 domain 的 route / helper 已經造成實際修改風險

## Phase Plan

### Phase 0: Quick Wins
先做兩個幾乎不動結構的改善：

1. `tokens` 頁面初始載入改走 `/api/tokens`
2. 只有在使用者真的輸入 `date_start` 或 `date_end` 時，才打 `/api/tokens/filtered`

理由：
- `/api/tokens` 已有 cache / history merge
- 這能立刻降低預設頁面的 full JSONL parse 次數

### Phase 1: Complete Token Ingestion
目標：讓「歷史查詢」優先走 SQLite，而不是 request 時重掃 JSONL。

建議新增或補完的 SQLite tables：

- `token_usage`（保留現有）
  - 每日總量
- `token_usage_daily` ← 新增，cross-cut 統一 source
  - `date`, `project`, `model`, `sessions`, `messages`, `tool_calls`,
    `input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_create_tokens`, `cost_usd`
  - PRIMARY KEY (`date`, `project`, `model`)
  - 任何 cut（by project / by model / by project+model / by date range）都 `GROUP BY` 出來
  - 預估行數：~ days × projects × models ≈ 60 × 15 × 6 = 5,400 / year — SQLite trivial

**不採用**「`token_usage_by_project` + `token_usage_by_model` 兩張表」的拆法。理由：
filter `project=X AND model=Y` 兩張表都答不出（一張按 project 加總所有 model、
另一張按 model 加總所有 project）。單一 normalized 表 + `GROUP BY` 才能 cover 所有 cut。

建議作法：

1. 延伸 `bin/sk-token-snapshot`
   - 保留現有 daily snapshot 行為
   - 同步寫入 per-project / per-model daily breakdown
2. 讓 ingest 只處理「今天以前」的 completed days
   - **TZ convention**: `today` 定義為 user local date (Asia/Taipei, UTC+8)
   - JSONL timestamp 是 UTC，ingest 時轉成 Taipei date 再 `GROUP BY`
   - SQLite `date` 欄位儲存 Taipei date (`YYYY-MM-DD`)
   - 「completed days」= 嚴格小於今天 Taipei date 的所有 dates
   - 02:30 Taipei 跑 snapshot 那一輪會 ingest 昨天 (Taipei) 的完整資料
3. `/api/tokens/filtered` 改成：
   - 查詢範圍若完全落在 completed days：只查 SQLite
   - 查詢範圍包含今天：SQLite + live JSONL merge
4. 保留 JSONL parser 作為：
   - 今天資料的 live source
   - backfill / repair path
5. `tokens.py` 的 in-process TTL cache 保留，但範圍縮為 today-only
   - completed days 從 SQLite query，不過 cache（query 本身就夠快）
   - today 從 JSONL parse + TTL cache（避免每 request re-parse 大檔案）

這樣做的好處：
- 不破壞目前「JSONL 是 live source、SQLite 是 persisted history」的設計
- 先把最常見、最昂貴的歷史查詢搬離 request path

### Phase 2: SSOT Cleanup
這一階段不做大搬遷，只做規則收斂與 drift 防護。

要做的事：

1. README 明確改寫 SSOT 定義
2. `dashboard/lib/agents.py` 不再註解 `projects.json` 是 project authority
3. 增加 drift check（三個整合點）：
   - **CLI**: `bin/sk check ssot` 一次性檢查
     - `agents.conf` 裡有 agent，但 `projects.json` 缺 metadata
     - `projects.json` 裡宣告 agent，但 `agents.conf` 沒有對應 label
     - schedule / log path 兩邊宣告不一致
   - **API**: `/api/health` 增加 `ssot_drift` 欄位，dashboard status page 顯示
   - **Cron**: 每天 03:00（snapshot 之後 30 分鐘）跑 `sk check ssot --quiet`，
     drift 寫進 `reports/ssot-drift-YYYY-MM-DD.md`（沿用 reports/ 的 agent-commit 契約）
4. UI 若需要 project enrichment，仍可讀 `projects.json`，但不覆蓋 schedule / identity

### Phase 3: Optional Extraction
如果 Phase 1 改 tokens 時發現 `server.py` 的 tokens 區塊已經影響維護效率，再抽成：

- `dashboard-next/api/tokens_api.py`
- 或 shared query helper module

這是 implementation detail，不是當前目標。

## Non-Goals
- 不重做 monorepo 結構
- 不引入 API type codegen
- 不移除 `dashboard/` Streamlit
- 不搬 `reports/` 到 `artifacts/`
- 不改 launchd labels
- 不一次性重寫所有 JSONL scanning feature

## Risks

### Risk 1: Today data semantics
如果 `/api/tokens/filtered` 完全改查 SQLite，今天的資料會不完整。

Mitigation:
- SQLite 只負責 completed days
- 今天維持 live JSONL merge

### Risk 2: Backfill mismatch
如果新 schema 上線前已存在大量舊 snapshot，只寫 `token_usage` 沒寫 breakdown tables，查詢可能出現歷史缺口。

Mitigation:
- 提供一次性 backfill command
- query 層在 breakdown 缺失時明確標示或 fallback

### Risk 3: SSOT decision half-done
如果 README 改了，但 code 仍然雙 authority，會比現在更混亂。

Mitigation:
- 文件、註解、drift check 要同一批完成

## Success Criteria
- `/tokens` 頁面初次打開時，不再觸發 full JSONL parse
- 歷史日期篩選主要走 SQLite
- 保留 today live data
- `agents.conf` / `projects.json` 的責任分界在 README 和 code 中一致
- launchd labels、reports workflow、auto-stage 契約都不需要改

## Recommended Next Step

**拆三個 ship**，先 de-risk 大的：

### Ship 1: Phase 0 only（半天 ~ 1 天）
1. tokens 頁初始載入改走 `/api/tokens`
2. 只有 user 真的輸入 `date_start` / `date_end` 才打 `/api/tokens/filtered`
3. **驗收**: 開 dashboard tokens 頁、看 dashboard-next/api server log，初次載入沒有 `/filtered` call
4. **觀察一週**：如果 90% use case 是 no-filter，Phase 1 規模可縮小

失敗成本：1 個 frontend revert（低）。

### Ship 2: Phase 1（觀察後評估）
依 Ship 1 觀察的實際 cache miss 頻率決定要不要做完整 ingestion。如果做：

1. SQLite `token_usage_daily` schema + 一次性 backfill command
2. 延伸 `bin/sk-token-snapshot` 寫 per-project / per-model breakdown
3. `/api/tokens/filtered` 改 SQLite + live JSONL merge
4. `tokens.py` TTL cache 縮為 today-only

失敗成本：SQLite schema migration + 雙寫驗證（高）— 所以才要靠 Ship 1 先量痛點。

### Ship 3: Phase 2（SSOT cleanup）
不依賴 Ship 1 / 2，獨立可做：

1. README SSOT 定義改寫
2. `dashboard/lib/agents.py` 註解修正
3. `bin/sk check ssot` + `/api/health.ssot_drift` + 03:00 cron drift report

失敗成本：低（文件 + drift check 不改認證路徑）。
