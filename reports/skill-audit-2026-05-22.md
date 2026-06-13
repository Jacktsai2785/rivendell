# Skill Scout 報告 — 2026-05-22

## 本週 Session 概要

| # | 專案 | 訊息數 | 主要意圖 | 主要工具 |
|---|------|--------|----------|----------|
| 1 | jk-nb | 19 | consume 工作流：把 raw/ 新內容編進 wiki（5 篇新聞頁面） | Read, Bash |
| 2 | mops-databases | 170 | 跨 DB 資料完整性確認（notes vs PL/BS/CF）、IntegrityError 排除、systemd 自動化、workflow 架構梳理 | Bash, Read, Edit, Write, TodoWrite |
| 3 | mops-databases | 60 | mops_investee → mops_notes 遷移前安全確認、執行遷移 | Bash, TodoWrite, Read |
| 4 | mops-databases | 105 | 後台 background task 監控、ScheduleWakeup 輪詢任務輸出檔 | Bash, Read, ScheduleWakeup×12 |
| 5 | taiwan-company | 5 | WebSearch 搜尋台灣公司官方網站（創智先進科技） | WebSearch |
| 6 | taiwan-company | 15 | git commit+push、跨裝置資料同步方案討論 | Bash |
| 7 | taiwan-company | 4 | WebSearch 搜尋台灣公司官方網站（華城電能科技） | WebSearch |
| 8 | taiwan-company | 11 | PE 初步盡職調查備忘錄（華城電能科技） | WebSearch, WebFetch, Skill |
| 9 | taiwan-company | 12 | PE 初步盡職調查備忘錄（創智先進科技） | WebSearch, WebFetch |
| 10 | taiwan-company | 121 | mops_investee 整合後前端查詢失敗 → 重建 API client 連結鏈、修復董監事查詢 | Bash, Read, Edit |
| 11 | -home-jacktsai | 9 | 新 web app 起步（串接 mops_databases）、讀 PORTS.md / REGISTRY.md | Read, AskUserQuestion, Bash |

**總計：** 11 sessions，~531 訊息  
**主力工具：** Bash(298), Read(84), Edit(22), ScheduleWakeup(12)  
**Skills 命中：** 2 次（均在 taiwan-company 專案）

---

## 已覆蓋模式（無需建立新 skill）

- Session 1：`2-jk-nb-consume` ✓ 已存在
- Session 5, 7：`tw-company-website-finder` ✓ 已存在
- Session 8, 9：`tw-company-pe-memo` ✓ 已存在
- Session 2 systemd 部分：`systemd-user-service` ✓ 已存在
- Session 6 跨裝置：`cross-device-deploy` ✓ 已存在（資料同步面向有部分差異，但不足以獨立成 skill）

---

## Skill 候選清單

### ⭐⭐⭐ Strong — `mops-financial-db-integrity`

**目的：** 驗證同一批公司在多個 MOPS 財務資料庫（mops_notes、mops_pl、mops_bs、mops_cf）之間資料的一致性，找出缺漏的公司代碼並修復 IntegrityError。

**觸發時機：**
- 使用者說「確認 mops_notes/mops_pl/mops_bs/mops_cf 有沒有缺漏」
- 遇到 `IntegrityError` 或 `UNIQUE constraint failed` 於 MOPS 財務 DB
- 新增或合併 mops 模組後需要做跨 DB 一致性驗證

**分類：** `workflow`（或 `backend`）

**理由：**
Session 2 耗費 170 訊息中有大量時間在這個流程上：先確認各 DB schema、查詢哪些 `stock_code` 存在 notes 但缺在 PL/BS/CF、再補回或修復。這個「多 DB 對齊 + IntegrityError 修復」的流程在 mops_databases 專案極高頻，且現有 skills 中：
- `mops-investee-cross-ref` 只針對被投資揭露，不涉及財務四表
- `db-migration` 是 schema 遷移，不是資料完整性驗證
- `mops-investee-holdings-debug` 針對持股，不是財務數據缺漏

完全沒有現有 skill 能覆蓋此場景。

---

### ⭐⭐⭐ Strong — `background-task-poll-loop`

**目的：** 當長時間執行的 headless agent 或 background bash 任務啟動後，用 `ScheduleWakeup` 定時喚醒、讀取任務輸出檔（`{task-id}.output`）、判斷是否完成，直到任務結束後再繼續後續工作。

**觸發時機：**
- 使用者啟動後台 task 後說「先讓它跑，等完成再繼續」
- 看到 `<task-notification>` 或 `<task-id>` XML 訊息需要追蹤
- 需要輪詢 `.output` 檔來確認多個平行任務的完成狀態

**分類：** `workflow`

**理由：**
Session 4 中 `ScheduleWakeup` 被呼叫 12 次，這是本週所有 sessions 裡最高頻的單一工具使用。核心流程是：啟動 task → 等待 → 讀 `{id}.output` → 判斷是否完成 → 決定繼續或再等。現有 `headless-agent-monitor` 是從 agent 設計角度出發，而非「使用者對話中如何追蹤後台 task」的操作指南。兩者觀點不同，此 skill 填補了「session 內 polling 實作範式」的缺口。

---

### ⭐⭐ Moderate — `api-client-schema-migration`

**目的：** 後端 DB schema 變更（如模組整合、資料表搬移）後，系統性地找出所有前端 / client 程式碼中的舊查詢引用，更新為新的 API endpoint 或 schema 路徑，並驗證每條查詢鏈結可正常運作。

**觸發時機：**
- 使用者說「後端 schema 改了，前端查詢壞掉了」
- 看到 mops 或其他後端模組整合、重命名後 client 報錯
- 需要 grep 舊 table/column 名稱、逐一替換成新路徑

**分類：** `backend`

**理由：**
Session 10 花了 121 訊息重建 mops_investee 整合後的前端查詢鏈結，包含搜尋舊的 `mops_investee_client.py` 引用、更新 `app.js` 查詢路徑、修復董監事查詢等。這是 DB 整合後必然發生的第二階段工作，但目前 `db-migration` skill 只覆蓋遷移本身，不覆蓋「遷移後 client 端的受損修復」流程。這個模式在 mops_databases 演進中會持續出現。

---

### ⭐⭐ Moderate — `mops-app-bootstrap`

**目的：** 從零開始建立一個連接 `mops_databases` 生態系的 web app：讀取 `PORTS.md` 確認 port 分配、讀取 `REGISTRY.md` 決定使用哪個 DB + API、讀取 `.env` 配置、建立第一支 API client、啟動 dev server。

**觸發時機：**
- 使用者說「我想開始建一個 web app，要串接 mops_databases」
- 新建前端或後端服務需要整合 mops 財務資料
- 需要在 mops cluster（8080–8089）或 app backend（8000–8009）選 port 並登記

**分類：** `workflow`

**理由：**
Session 11 展示了一個完整的起始流程：先讀 PORTS.md、CLAUDE.md、REGISTRY.md，再規劃 app 架構。這個「mops 生態 onboarding 清單」目前沒有 skill 涵蓋（`init-project` 是通用的，不含 mops 特定知識；`personal-workspace` 是環境設定）。由於 mops_databases 是本機核心基礎設施，新 app 串接的需求會反覆出現。

---

### ⭐ Weak — `pre-operation-session-check`

**目的：** 在執行破壞性操作（資料庫遷移、大規模刪除、schema 重組）之前，先確認是否有其他 Claude Code session 正在跑相關後台任務，避免競爭衝突。

**觸發時機：**
- 使用者要做遷移或重組，但不確定是否有 session 仍在執行中
- 說「先確認有沒有其他 session 在跑」

**分類：** `meta`

**理由：**
Session 3 的開頭流程是「先確認 2022 年 PDF 抓取 session 是否完成 → 確認完成 → 才執行遷移」。這是合理的安全習慣，但場景較窄且大多可以由 `careful` skill 或 `pre-migration-session-check` 作為步驟處理，不一定需要獨立 skill。評為 Weak，但可作為 `api-client-schema-migration` skill 的前置步驟加入。

---

## 優先建議

| 優先順序 | Skill 名稱 | 強度 | 建議行動 |
|----------|-----------|------|---------|
| 1 | `mops-financial-db-integrity` | Strong | 立即建立，填補 mops 財務 DB 最高頻痛點 |
| 2 | `background-task-poll-loop` | Strong | 立即建立，ScheduleWakeup polling 範式目前無任何 skill 描述 |
| 3 | `api-client-schema-migration` | Moderate | 下次 mops 整合前建立 |
| 4 | `mops-app-bootstrap` | Moderate | 下次新 app 啟動前建立 |
| 5 | `pre-operation-session-check` | Weak | 可合併進 #3 作為前置步驟，不需獨立 skill |
