# Session Harvest Report — 2026-06-09

> 分析期間：近 30 場 sessions｜訊息總量：~428｜總費用：$0.00

---

## Session 總覽

| # | 專案 | 訊息數 | 主題摘要 |
|---|------|--------|----------|
| 1 | jk-nb | 18 | jk-nb-consume：raw/ 新內容編入 wiki（skill 正常觸發） |
| 2 | jk-nb | 6 | jk-nb-digest：inbox.md promote 到 wiki（skill 正常觸發） |
| 3–16 | mops-dbs-mops-notes | 1×14 | 財報附註結構化抽取（自動 headless 呼叫，各 1 msg，無互動） |
| 17 | mops-dbs | 38 | 承接另一 session 的 SCHEDULE_REDESIGN 工作（context recovery） |
| 18 | mops-dbs | 124 | mops_notes 205 家附註回填監控（Bash×58, Monitor×4, ScheduleWakeup×5） |
| 19 | mops-dbs | 126 | 修正各 DB universe 超出 master 範圍（Bash×57, Edit×24, Read×22） |
| 20 | mops-dbs | 47 | 排程器評估：APScheduler vs systemd timer；SCHEDULE_REDESIGN |
| 21 | mops-dbs | 4 | 理解 master 本地副本與 upsert-only 架構問題 |
| 22 | rivendell | 24 | workflow-retro（skill 正常觸發） |
| 23 | taiwan-company | 14 | 天賦人工智慧 PE DD（WebFetch×6, WebSearch×6） |
| 24, 26 | taiwan-company | 1×2 | Legaltech 產業地圖設計（單次 prompt，無互動） |
| 25 | taiwan-company | 1 | Fintech 新聞分類（單次 prompt） |
| 27, 29 | taiwan-company | 1×2 | 公司-產業別分類（單次 prompt） |
| 28, 30 | taiwan-company | 3+5 | 公司官網搜尋（WebSearch） |

**活躍專案**：mops-dbs（最複雜，佔 339 msg）、taiwan-company（多 headless 呼叫）、jk-nb（skill 正常運作）

---

## Skill 候選名單

### 🔴 Strong

---

#### 1. `mops-notes-backfill-monitor`

| 欄位 | 內容 |
|------|------|
| **目的** | 監控與管理 mops_notes 大型批次附註抽取回填作業 |
| **觸發語** | "跑 notes 回填"、"mops_notes backfill 進度"、"205 家附註抽取卡住了"、"notes 有幾家失敗"、"開 terminal 給我監督" |
| **分類** | workflow |
| **不重複的 skill** | `post-backfill-indicator-recompute`（回填後重算指標）、`mops-financial-scraper`（抓資料）都不含進度監控與卡關處理 |

**理由**：Session 18 是 124 msg、工具密集（Bash×58, Monitor×4, ScheduleWakeup×5）的複雜監控流程。核心模式是：

1. **啟動** `pdf_notes_refresh.py` 批次抽取腳本（Bash）
2. **開 terminal 即時監督**：用 Monitor 串流 stdout，讓使用者即時看進度
3. **ScheduleWakeup** 每隔固定時間回來確認進度不卡住
4. **封鎖偵測**：判斷哪些公司因 PDF 格式問題、OCR 失敗而跳過
5. **補跑失敗 subset**，再次驗證完整度

這個「啟動 → 即時監督 → 週期 check → 補跑失敗」模式在任何大型回填作業中都會重複出現（mops_pl, mops_bs, mops_cf 未來同樣需要）。

---

#### 2. `mops-universe-remediation`

| 欄位 | 內容 |
|------|------|
| **目的** | 修正各 MOPS 下游 DB（rev/notes/pl 等）universe 超出 master 範圍的問題，執行刪除或限制式調整 |
| **觸發語** | "mops_rev/notes 的 universe 比 master 廣"、"刪除不是 master 的 companies"、"upsert 不應自行新增"、"為什麼下游 db 多了這些公司" |
| **分類** | workflow |
| **不重複的 skill** | `mops-cluster-master-alignment-audit`（稽核並輸出對帳表），本 skill 是**稽核後的修正執行流程** |

**理由**：Session 19 是 126 msg（Bash×57, Edit×24, Read×22）的深度修正流程。核心步驟是：

1. **診斷根因**：檢查各 DB 的 `upsert_companies()` 邏輯，找出為什麼 non-master 公司會進來
2. **決策架構**：評估「刪除 upsert_companies」vs「加 WHERE master_id IN」vs「改 FDW」的取捨
3. **執行刪除**：對各 DB 批次刪除不在 master 的 company records（不僅是標記）
4. **驗證一致性**：用 COUNT 交叉比對確認 universe 已收斂
5. **修正前端**：連帶更新 dashboard DataQualityPage、DelistingBadge 等 UI 元件

與 audit skill 的邊界：audit → 輸出「哪些公司不對齊」的報告；本 skill → 實際執行修正，從架構決策到刪除驗證一條龍。

---

### 🟡 Moderate

---

#### 3. `taiwan-industry-landscape`

| 欄位 | 內容 |
|------|------|
| **目的** | 為指定台灣產業設計分層公司地圖（Industry Landscape Map），處理「一家只放一處」的分群約束 |
| **觸發語** | "幫我設計 X 產業的產業地圖"、"把這些公司歸到 Legaltech 地圖"、"產業地圖分群" |
| **分類** | workflow |
| **不重複的 skill** | `taiwan-industry-classifier`（對每家公司選一個產業別標籤）；本 skill 是**同產業內部的分層/分群地圖設計** |

**理由**：Sessions 24、26 出現兩次相同結構的請求：給定產業名（Legaltech）+ 已知公司清單 → 設計多層次分群結構 → 每家只放一個格子。這個模式的難點是：

- 需要對台灣產業生態有足夠理解才能設計合理的分層（如：法規科技 → 法律資料庫 / 合約管理 / 法院相關）
- 有嚴格的「一家只放一處」約束
- 輸出需要是結構化 markdown 或表格（可用於 deck 或 wiki）

Moderate 評級原因：sessions 都是單輪 prompt（1 msg），工具數為 0，說明這是 headless 自動呼叫；互動深度低，但模式的重複性明確（2 次以上），且與現有 skill 正交。

---

### 🔵 Weak

---

#### 4. `mops-scheduler-migration`

| 欄位 | 內容 |
|------|------|
| **目的** | 評估並遷移 MOPS 資料庫排程器（APScheduler ↔ systemd timer），包含架構取捨與 service 檔案撰寫 |
| **觸發語** | "APScheduler 和 systemd 有什麼差異"、"SCHEDULE_REDESIGN"、"改用 systemd timer" |
| **分類** | backend |
| **不重複的 skill** | `systemd-user-service`（設定 systemd 服務），但不含排程器選型評估與遷移計畫 |

**理由**：Sessions 17、20 都圍繞相同的排程器架構重新設計問題（同一個長任務跨 session），涉及 `SCHEDULE_REDESIGN.md` 與多個 `.service`/`.timer` 檔。但評為 Weak 原因：

- 這次任務尚未完成（session 17 被使用者中斷），說明模式未沉澱
- 決策性質高於工具性質，codify 後 reuse 價值有限
- 現有 `systemd-user-service` skill 可以覆蓋大部分實作層

---

## 模式觀察（不建議建 skill，但值得記錄）

### Headless API 呼叫密集化

Sessions 3–16（14 場 × 1 msg）是 mops_notes 管線自動呼叫 Claude API 做附註抽取。這不是 Claude Code skill，而是程式碼內嵌 prompt 的批次 LLM 呼叫。Prompt 結構固定：「你是台灣財報附註抽取器 → 輸出 JSON 陣列（section / line_item / period / amount / unit）」。若未來需要改 prompt，直接修改 `mops_notes` 專案的 `pdf_notes_refresh.py`，不需要建 skill。

### Context Recovery 跨 Session

Session 17 的 intent 是「這是你剛剛在另一個 session 講的，所以我開新的 session 讓你繼續跑」。這說明 `SCHEDULE_REDESIGN.md` 被當作 context handoff 文件使用——session 結束前寫入進度，下一個 session 讀取繼續。這是一個有效的工作模式，`session-wrap`/`context-save` skill 已在設計中涵蓋。

---

## 建議優先順序

1. **mops-notes-backfill-monitor**（Strong）：下次 mops_pl / mops_bs 回填時必用，提早建立
2. **mops-universe-remediation**（Strong）：每次新增下游 DB 後都可能需要，且與現有 audit skill 互補
3. **taiwan-industry-landscape**（Moderate）：有需求，但可先確認是否只在 tw-company 專案用

---

*自動生成於 2026-06-09 by session-harvest workflow*
