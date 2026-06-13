# Session Harvest — 2026-06-08（7-session digest）

## Session 摘要

- **彙整日期**：2026-06-08
- **涵蓋專案**：`TWstock-invest`（4 場）、`mops-dbs`（1 場）、`rivendell`（1 場）、`taiwan-company`（1 場）
- **Session 數**：7 | **訊息數**：約 211 | **成本**：$0.00（digest 未含計費）
- **主要工具**：Bash(124)、Read(28)、Write(13)、Edit(7)、AskUserQuestion(4)、Agent(4)、Skill(3)
- **已調用 skill**：`code-review`（built-in，session 2）、`workflow-retro`（session 6）；另 session 7 屬 `taiwan-news-classifier` 範疇

### 各 session 活動

| # | 專案 | 訊息 | 活動 | 對應的現有 skill |
|---|---|---|---|---|
| 1 | TWstock-invest | 64 | mops_db 補資料後重新檢查資料完整度 → 寫 `probe_datafill.py`/`recheck_buckets.py`/`refresh_indicators_incremental.py` 做**增量重算快照** | 部分對應：`stock-data-gap-diagnose`、`stock-fundamentals-grading`（見候選 1） |
| 2 | TWstock-invest | 19 | `/code-review xhigh`（recall-biased）於 `absolute.py`/`peers.py`/`relative.py` | ✅ built-in `code-review`（已調用） |
| 3 | TWstock-invest | 73 | 除錯「切到全市場 universe=all → 前端空白、清快取仍無資料」，動 `IndicatorsPage.tsx`/`config.py`/`indicators.py`/`main.py`/`mops_master_client.py` | 部分對應：`stock-data-gap-diagnose`（不同軸，見候選 2） |
| 4 | TWstock-invest | 15 | 同上問題的延續：「只要切全市場就顯示不出來」 | 見候選 2 |
| 5 | mops-dbs | 14 | 確認各 DB 排程時間（最近一期/下一期 update），寫 `project_q1_rerun_guard.md` | 部分對應：`mops-cluster-master-alignment-audit`（見候選 3） |
| 6 | rivendell | 25 | 跑 `workflow-retro` 週度回顧（W23/W24）＋寫 MEMORY | ✅ `workflow-retro`（已調用） |
| 7 | taiwan-company | 1 | 台灣「綠色永續」產業新聞分類 | ✅ `taiwan-news-classifier` |

## 結論

7 場中 **3 場已被現有 skill 完整覆蓋**（code-review、workflow-retro、taiwan-news-classifier）。`TWstock-invest` 四場貢獻兩個正交的新訊號（增量重算 vs 全市場除錯），`mops-dbs` 一場為弱訊號。依強度排序如下。

---

## Skill 候選

### 1. `post-backfill-indicator-recompute` — **Strong**

- **Purpose**：在 mops_db 批次補進一批先前缺漏的 XBRL 財報後，對選股指標快照做**「資料完整度校正」式的增量重算**，而非整批重跑。固化 session 1 已沉澱的演算法：(1) 取 `universe=all` 最新快照（`IndicatorRun` + 全部 `IndicatorScore`）；(2) recompute set = `valid_count < 6` 的公司，平行 `score_company` 重算；(3) 已滿格（`valid==6`）公司直接沿用舊列（補資料不改評級）；(4) 寫成一份全新、funnel 一致的快照供前端自動取 latest；(5) 因屬完整度校正非月對月比較，重算列 `regressed` 一律 `False`。並含前置 probe（`probe_datafill.py` 找仍缺格公司）與 `recheck_buckets.py` 事後分桶驗證。
- **Trigger**：使用者說「補完資料後重新檢查/重算指標」「mops_db 補了 XBRL 要更新評級」「增量刷新快照」「只重算資料不足的公司」「valid<6 重算」「資料完整度校正」。
- **Category**：`backend`（或 `workflow`）
- **Rationale**：雖只出現 **1 場**，但這是一份**已寫好、帶完整 docstring 的可重用 reference 腳本**（`rev_webui/backend/scripts/refresh_indicators_incremental.py`），不是臨時除錯。與既有兩個 skill **正交**：`stock-fundamentals-grading` 是「怎麼算六大指標與評等」、`stock-data-gap-diagnose` 是「單股顯示資料不足的根因判定」，本候選是**「批次補資料後，如何只重算受影響子集並產生 funnel 一致的新快照」**這層 orchestration——尤其「滿格沿用、缺格重算、regressed 強制 False」三條規則是反覆會踩的決策點，值得固化。建議獨立成案。

### 2. `all-market-universe-empty-diagnose` — **Moderate**

- **Purpose**：系統化除錯「前端切到全市場（`universe=all`）後畫面空白／載入失敗，且清快取仍無資料」。對照 `universe.py` 的 `all_listed_filers()`（`list_filers(limit=10000)` 後濾 `market in (tse,otc) and industry_code`）與 electronics 版的差異，沿 filer 取數 → 快照查詢（最新 `IndicatorRun`）→ API 回傳 → 前端 render 這條鏈逐段定位是哪一環在 universe=all 時斷掉（常見：快照只有 electronics universe、limit 截斷、cache key 未含 universe 維度、前端漏斗統計與資料不一致）。
- **Trigger**：使用者說「切到全市場就顯示不出來」「universe=all 空白」「全市場載入失敗」「清快取還是沒資料」「電子業正常但全市場壞掉」。
- **Category**：`workflow`
- **Rationale**：跨 **2 場**（session 3、4，合計 88 則訊息、Bash 45）反覆出現，是本批最重的除錯主題。與 `stock-data-gap-diagnose` **同類但不同軸**——後者針對「單一個股顯示資料不足」，本候選針對「整個 universe 維度切換後全空」，根因集中在「快照是否含該 universe／cache key 是否帶 universe 維度」這類聚合層問題，現有 skill 未覆蓋。只是其產出較偏一次性 bug fix（非可複用演算法），故評 Moderate；**次選**是把這條 universe 軸的 checklist 增補進 `stock-data-gap-diagnose` 的「整批/維度層」一節，避免兩個鄰近 skill 疊床架屋。

### 3. `mops-cluster-schedule-status` — **Weak**

- **Purpose**：唯讀地回報 mops 叢集各 DB 的排程狀態——最近一期實際 update 時間、下一期預定時間、是否如期（如 session 5 的「最近一期應是 6/10 的 mops_rev？其他 db 何時更新？」），必要時產出像 `project_q1_rerun_guard.md` 的 rerun 護欄筆記。
- **Trigger**：使用者說「確認 schedule 時間」「最近一期 update 是哪天」「各 db 何時更新」「下一期排程」。
- **Category**：`backend`
- **Rationale**：僅 **1 場、14 則訊息**，且資訊多可由 `~/.claude/databases/REGISTRY.md`／`ARCHITECTURE.md` 與既有 `mops-cluster-master-alignment-audit`（已含排程依賴順序稽核）查得，屬輕量唯讀查詢。**不建議獨立成案**；若要補強，把「最近/下一期 update 時間查詢」併入 `mops-cluster-master-alignment-audit` 的狀態回報一節即可。記錄於此供後續若反覆出現時再評估升格。

---

## 未成案項目（已被現有 skill 覆蓋，僅記錄不新增）

- **Session 2** `/code-review xhigh` → 已由 built-in `code-review` 覆蓋。
- **Session 6** `workflow-retro` 週度回顧 → 已直接調用 `workflow-retro`。
- **Session 7** 綠色永續產業新聞分類 → 已由 `taiwan-news-classifier`（＋ `taiwan-industry-classifier`）覆蓋。
