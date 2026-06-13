# Session Harvest — 2026-06-06（news + stock digest）

## Session 摘要

- **彙整日期**：2026-06-06
- **涵蓋專案**：`-home-jacktsai-taiwan-company`（10 場）、`-home-jacktsai-TWstock-invest`（1 場）
- **Session 數**：11 | **訊息數**：約 30 | **成本**：$0.00（digest 未含計費）
- **主要工具**：Bash(9)、Skill(3)、Agent(1)、Read(1)
- **已調用 skill**：`taiwan-news-classifier`（sessions 4、5）

### 各 session 活動

| # | 專案 | 訊息 | 活動 | 對應的現有 skill |
|---|---|---|---|---|
| 1 | TWstock-invest | 11 | 查股票代號 1590：UI 顯示「傳產工具機」，但點進去找不到該公司（industry 標籤 ↔ 公司明細記錄對不上）。Bash(7)+Agent(1)，過程出現多次 malformed tool call | 部分對應（見候選 1）：`tw-company-identify`、`taiwan-industry-classifier` |
| 2 | taiwan-company | 1 | 「前瞻科技」單日新聞清單分類 | ✅ `taiwan-news-classifier` |
| 3 | taiwan-company | 1 | 過去 28 天「前瞻科技」多日摘要 + 高頻標題 | ✅ `1-taiwan-news-multiday-digest` |
| 4 | taiwan-company | 6 | 「AI」單日新聞分類（已調用 `taiwan-news-classifier`，讀 SKILL.md） | ✅ `taiwan-news-classifier`（已調用） |
| 5 | taiwan-company | 5 | 「消費生活」單日新聞分類（已調用 skill + Bash×2） | ✅ `taiwan-news-classifier`（已調用） |
| 6 | taiwan-company | 1 | 過去 26 天「綠色永續」多日摘要 | ✅ `1-taiwan-news-multiday-digest` |
| 7 | taiwan-company | 1 | 「fintech」單日新聞分類 | ✅ `taiwan-news-classifier` |
| 8 | taiwan-company | 1 | 過去 25 天「AI」多日摘要 | ✅ `1-taiwan-news-multiday-digest` |
| 9 | taiwan-company | 1 | 過去 2 天「fintech」多日摘要 | ✅ `1-taiwan-news-multiday-digest` |
| 10 | taiwan-company | 1 | 過去 24 天「消費生活」多日摘要 | ✅ `1-taiwan-news-multiday-digest` |
| 11 | taiwan-company | 1 | 「綠色永續」單日新聞分類 | ✅ `taiwan-news-classifier` |

## 結論

11 場 session 中 **10 場（sessions 2–11）為台灣產業新聞分類 / 多日彙整，已被現有 skill 完整覆蓋**：

- 單日清單分類（sessions 2、4、5、7、11）→ `taiwan-news-classifier`（sessions 4、5 已實際調用）。
- 過去 N 天摘要 + 高頻標題（sessions 3、6、8、9、10）→ `1-taiwan-news-multiday-digest`（亦有 `5-taiwan-news-weekly-digest` 與 `multi-industry-news-pipeline-orchestrator` 涵蓋同一流程）。

這些 session 涵蓋多個產業垂直（AI、前瞻科技、消費生活、綠色永續、fintech），但**全部是同一條既有 pipeline 的不同產業實例，無新範式浮現**。它們反而是「skill 已穩定被例行使用」的正向訊號，不需新增 skill。

唯一非新聞的 **session 1** 浮現一條新訊號（見下），但本批僅出現 1 次、且過程多為 malformed tool call，屬弱訊號。

---

## Skill 候選

### 1. `stock-app-industry-record-mismatch-debug` — **Weak**

- **Purpose**：除錯「選股 / 個股 UI 上某代號被標成某產業（如 1590 → 傳產工具機），但點進明細卻查無該公司」這類 **industry 標籤 ↔ 公司明細記錄對不上** 的資料完整性問題。標準步驟：① 確認該代號在「產業分類表」與「公司主檔 / 明細表」兩邊的 key（股票代號 vs 統編）是否一致 → ② 比對 join 條件（是否上市櫃狀態、是否 KY 股、是否新舊代號）→ ③ 用 `tw-company-identify` 拉 API 結構化資料對照 → ④ 定位是分類表多列、主檔缺列，還是 join 鍵型別/格式不符。
- **Trigger**：使用者說「X 代號顯示是 OO 產業但點進去查無此公司」「分類有這檔但明細找不到」「industry 標到了但 detail 是空的」「選股表跟公司明細對不上」。
- **Category**：`backend`（資料完整性 / debug）
- **Rationale**：本批僅 session 1 出現 1 次，且過程出現多次 malformed tool call、未見清楚收斂的解法，**證據強度不足以單獨立案**。核心查證動作（拉公司結構化資料、判斷產業歸屬）已分別由 `tw-company-identify` 與 `taiwan-industry-classifier` 覆蓋；目前缺的只是「兩表對不上時的對帳 checklist」這層薄殼。**建議：先觀察是否再出現 1–2 次相同除錯情境**；若重複出現，再以一段「資料對帳 checklist」併入 `tw-company-identify` 的 reference，而非另立獨立 skill。

---

## 行動建議

- **不新增 skill**。本批新聞類 session 全數被現有 pipeline 覆蓋，stock 類僅 1 次弱訊號。
- 將 `stock-app-industry-record-mismatch-debug` 列入觀察名單；若 TWstock-invest 後續再現「分類有、明細無」的對帳除錯，再以 reference 段落併入 `tw-company-identify`。
