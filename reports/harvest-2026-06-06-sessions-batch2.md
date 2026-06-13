# Session Harvest — 2026-06-06（sessions digest batch2）

## Session 概要

- **彙整日期**：2026-06-06
- **涵蓋專案**：`TWstock-invest`（7 場）、`mops-databases`/`mops-dbs`（3 場）、`rivendell`（1 場）、`taiwan-company`（4 場）
- **Session 數**：15 | **訊息數**：約 1,161 | **成本**：$0.00（digest 未含計費）
- **主要工具**：Bash(336)、Read(67)、Edit(67)、WebSearch(31)、WebFetch(26)、TodoWrite(23)、Write(13)、ToolSearch(11)、AskUserQuestion(7)、Skill(6)
- **已調用 skill**：`user-flow`(s1,s3)、`repo-rename`(s8)、`workflow-retro`(s11)

### 各 session 活動

| # | 專案 | 訊息 | 活動 | 對應現有 skill |
|---|---|---|---|---|
| 1 | TWstock-invest | 39 | 設計「資料不足時依缺漏科目呼叫對應 mops_db 重撈」機制 + 三類缺值的 retry/提醒 toolkit | 部分（見候選 1） |
| 2 | TWstock-invest | 52 | 個股名稱裁切到「股份有限公司」前、顯示上市別、產業＋6 指標加篩選 | 部分（候選 2，UI） |
| 3 | TWstock-invest | 57 | 月營收個股 → 一鍵跳到 6 大指標對應個股＋返回；規劃階段先輸出流程圖確認 | `user-flow`（已調用）+ 候選 2 |
| 4 | TWstock-invest | 101 | mops_db 已抓好 8086 資料，前端卻仍「資料不足」→ 全鏈路追查（85 Bash） | **未覆蓋（候選 1）** |
| 5 | TWstock-invest | 82 | 分析多檔公司為何「資料不足」：真的沒資料 vs 其他原因（寫 `_diag2.py`） | **未覆蓋（候選 1）** |
| 6 | TWstock-invest | 24 | （無文字）純 Bash 操作 | — |
| 7 | TWstock-invest | 35 | 切模型 + GDrive 檔案搜尋/下載 | —（瑣碎） |
| 8 | mops-databases | 31 | 把 `mops_databases` 改名為 `mops_dbs` | ✅ `repo-rename`（已調用） |
| 9 | mops-dbs | 651 | 一次檢查全部 DB，理解各 DB 抓取資料的方式（Agent×4 fan-out） | 部分（候選 3） |
| 10 | mops-dbs | 6 | commit + push | —（瑣碎） |
| 11 | rivendell | 18 | 跑 weekly workflow-retro | ✅ `workflow-retro`（已調用） |
| 12–15 | taiwan-company | 14–18 | 對張量科技 / 德睿生醫做 PE 初步 DD（同公司重跑多次） | ✅ `tw-company-pe-memo` 系列 + `pe-memo-silent-fail-recovery` |

## 結論

15 場中，PE DD（s12–15）、repo 改名（s8）、workflow-retro（s11）已被現有 skill 完整覆蓋；s6/s7/s10 為瑣碎操作不成案。**真正浮現的新訊號集中在 TWstock-invest 的「資料不足」診斷與修復鏈路**，跨 s1/s4/s5 共 3 場、合計 222 訊息、Bash 密集——這是本批最強訊號。

---

## Skill 候選

### 🟢 Strong：`stock-data-gap-diagnose` —「資料不足」全鏈路診斷與選擇性重撈

- **用途**：當選股前端某檔個股顯示「資料不足」時，系統化判定根因並對症處理，而非盲目整批重撈。流程：
  1. **定位缺漏**：找出 6 大指標中哪一項是 N/A（如缺 FCF / 稅後淨利 / 存貨）。
  2. **科目 → DB 對照**：把缺漏指標映射到負責的 mops_db（缺 FCF → `mops_cf`、缺損益項 → `mops_is`、缺資產項 → `mops_bs`…），查該 DB 是否真有原始資料。
  3. **根因三分類**：
     - (a) **mops_db 有、但 webapp 沒吃進來/沒重算** → 重跑 `batch`/`compute`（loaders → indicators）。
     - (b) **mops_db 也沒有** → 觸發對應 DB 針對該科目重新爬取。
     - (c) **公司太新 / 法定申報期未到** → 非錯誤，輸出「資料未到位」提示，避免無限 retry。
  4. **選擇性重撈**：只補缺漏的科目，不整批重抓。
- **觸發時機**：使用者說「為什麼這檔顯示資料不足」「mops_db 明明有資料前端卻沒有」「缺 FCF 請重撈」「retry 機制」「真的沒資料還是發生什麼事」。
- **涵蓋步驟**：指標 N/A 偵測 → 科目-DB 對照表 → 查 webapp DB（loaders/compute）vs 查 mops_db 原始層 → 三類根因判定 → 對症（重算 / 重爬 / 標記未到位）。
- **分類建議**：`backend`
- **來源**：s1（設計重撈機制與三類缺值 toolkit）、s4（8086 mops_db 有資料但前端不足，85 次 Bash 追查 `mops_facts_client`→`loaders`→`batch`→`compute`→`indicators`）、s5（多檔公司缺值根因分析，寫 `_diag2.py`）。
- **現有相似**：`2-financial-indicators-from-statements`、`stock-fundamentals-grading` 只講「怎麼算指標」，`mops-*` scrapers 只講「怎麼爬單一 DB」；**沒有任何 skill 把「跨 webapp↔mops 叢集的資料缺口診斷 + 科目級選擇性重撈」這條 debug 鏈路編碼**。這正是缺口，且跨 3 場重複出現。

### 🟡 Moderate：`react-deeplink-crossview-nav` — 跨頁深連結＋返回堆疊

- **用途**：在多頁/多頁籤的 React dashboard，從 A 視圖某實體（如月營收的 2454）一鍵跳到 B 視圖同實體位置（6 大指標的 2454），並提供「返回」回到原 A 視圖捲動位置，避免來回切換迷失。涵蓋：透過 query param / route state 帶 ticker、目標頁掛 scroll-into-view + highlight、返回時還原來源頁狀態（back stack）。
- **觸發時機**：「點某檔跳到另一頁的同一檔」「加返回按鈕避免切來切去」「跨頁籤深連結」「scroll to + highlight」。
- **分類建議**：`frontend`
- **來源**：s3（月營收 → 6 大指標個股跳轉＋返回）；s2 的篩選/裁切較瑣碎，併入此候選的次要部分。
- **現有相似**：`react-fab-search-pattern` 是搜尋 FAB、`user-flow` 只畫流程圖；皆不涵蓋「跨視圖深連結 + 返回堆疊」的實作範式。屬 Moderate（偏 UI、可泛化性中等）。

### 🟡 Moderate：`sibling-db-ingestion-audit` — 同叢集多 DB 抓取策略比較稽核

- **用途**：對一組 sibling 資料庫（如 `~/mops_dbs/` 下 7 個 DB）一次性盤點「每個 DB 各自怎麼抓資料」——爬蟲入口、排程、欄位對照、共用 lib 用法差異，產出比較表並回寫 `CLAUDE.md`/`MEMORY.md`。用 Agent fan-out 平行讀各 DB。
- **觸發時機**：「把全部 DB 檢查一次」「不同 DB 怎麼抓資料」「比較各子專案的爬取方式」。
- **分類建議**：`backend` 或 `meta`
- **來源**：s9（651 訊息、Agent×4 平行盤點全部 DB、編輯 `company_sync.py`/`cli.py`/`feedback_backfill_monitor.md`）。
- **現有相似**：`github-repo-audit`/`github-repo-onboard` 針對單一 repo；此候選聚焦「同叢集多 DB 的抓取策略橫向比較」。單場出現、且偏 mops 叢集特化，列 Moderate 偏弱。

### 🔴 Weak（不建議）

- **`model-switch-gdrive-fetch`**（s7）：切模型 + GDrive 抓檔，Claude 已能直接處理，太瑣碎。
- **`commit-and-push`**（s10）：單步 git 操作，不成案。
- **PE DD 相關**（s12–15）：`tw-company-pe-memo`、`pe-dd-structured-source-first`、`pe-memo-deep-research`、`pe-memo-silent-fail-recovery` 已完整覆蓋；同公司重跑多次反映的是 silent-fail 重試，已有對應 skill。

---

## 下一步

針對最強候選：

> **要建立 `stock-data-gap-diagnose` 嗎？** 我可以用 `skill-creator` 產出完整 SKILL.md（含 6 指標→mops_db 科目對照表、三類根因判定樹、選擇性重撈指令範本）。
> 或先記錄到 `.learnings/FEATURE_REQUESTS.md` 之後再處理。

兩個 Moderate（`react-deeplink-crossview-nav`、`sibling-db-ingestion-audit`）建議先進 FEATURE_REQUESTS 佇列，待再出現第 2 次訊號再建。
