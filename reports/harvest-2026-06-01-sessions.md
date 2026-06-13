# Session Harvest Report — 2026-06-01

## Session Summary

- **時間範圍**：近 30 個 session（單一專案）
- **專案**：`-home-jacktsai-taiwan-company`
- **訊息總數**：約 325 則
- **主要工具使用**：WebSearch (181) / WebFetch (65) / ToolSearch (17) / Bash (12) / Read (6) / Edit (4) / Skill (3) / Agent (2) / Write (1)
- **顯式 Skill 觸發**：3 次（其中可見的有 `tw-company-pe-memo`，session [6][14][30]）

### 活動分布

| 類型 | 數量 | 備註 |
|---|---|---|
| PE DD 初步盡職調查 | 22 | 全部使用同一模板 prompt（資深 PE 視角 + 基本資料區塊） |
| Silent-fail（msgs=1, tools=0） | 10 | 包含 [8][10][11][13][15][22][24][25][27][29]；這正是 `pe-memo-silent-fail-recovery` 設計要捕捉的訊號 |
| 新聞分類/摘要 | 4 | sessions [11][13][22][27]，AI / 前瞻科技 / 綠色永續 / 一般 |
| 多日彙整摘要產出後使用 | 2 | sessions [11][13]，多日 digest 樣板 |
| 上傳簡報/附檔 DD | 2 | [7] PDF 讀檔；[15] 簡報 + 訪談備忘錄 only-mode |
| 單一事實抽取（URL only） | 1 | [21] 「只輸出官網 URL」 |
| 功能設計工作 | 1 | [28] 「深度生成已存在時提醒使用者」UX 設計 |
| 重複目標（同統編） | 多 | 玩艸植造 ×6（statuses 1–5, 9, 17, 19, 23）、律果科技 ×6、豐漁水產養殖 ×3 |

### 關鍵發現

1. **Silent-fail 比例約 33%**（30 個 session 中 10 個只有 msg=1, tools=0）——確認 `pe-memo-silent-fail-recovery` 命中率高，是現存 skill 中最具價值的「保險裝置」。但比例這麼高，值得反向追究 dispatcher 觸發的 silent-fail 根因。
2. **同一公司被多次 dispatch**（玩艸植造 ×6、律果科技 ×6）——多數重試應由 `pe-memo-silent-fail-recovery` 自動產生；但 session [28] 同時在做「重複生成警告」UX，顯示使用者也察覺此問題。
3. **既有 skill 對此 workflow 已高度覆蓋**：`tw-company-pe-memo`、`tw-company-pe-memo-refine`、`pe-memo-deep-research`、`pe-memo-silent-fail-recovery`、`pe-dd-structured-source-first`、`tw-company-dd-pipeline`、`tw-company-batch-dd-orchestrator`、`batch-dd-dedup-guard`、`tw-company-news-evidence-search`、`tw-company-website-finder`、`taiwan-news-classifier`、`1-taiwan-news-multiday-digest`、`5-taiwan-news-weekly-digest`、`company-deck-ingestion`、`tw-company-pe-memo-trigger-fix` ——本 batch 的所有主要 workflow 都已落地。

---

## Skill Candidates

### 1. `pe-memo-silent-fail-rate-alert`【Strong】

- **Purpose**：把「silent-fail 比例」做成可觀測指標——當每日 dispatcher 派送 PE memo 任務時，若 silent-fail 比例 > 20% 即發告警（Telegram 或 dashboard badge）。本次 batch 直接顯示 33% silent-fail，但既有 `pe-memo-silent-fail-recovery` 只做 retry，沒有把「為什麼這麼多 silent-fail」這個結構性訊號浮上水面。
- **Trigger when**：dispatcher 每次跑完 batch 後、或 `headless-agent-monitor` 收尾時。
- **Category**：`meta/` 或 `workflow/`
- **Rationale**：本次 batch 中沒有任何 skill 在追蹤「silent-fail 比例」這個健康度指標，僅有 `pe-memo-silent-fail-recovery` 在做事後補救。把訊號分層（recovery + alert + root-cause memo）會讓系統更穩。
- **Differs from existing**：`pe-memo-silent-fail-recovery` 只做 retry；`agent-observability`、`headless-agent-monitor` 偏 generic agent 監控、不知道 PE memo 的領域語義。

---

### 2. `pe-memo-already-generated-guard`【Moderate】

- **Purpose**：在啟動 PE memo workflow 前，先檢查目標公司是否已有 memo 檔案（`reports/pe-memo/<ubn>.md` 或 DB 紀錄），若有則回報 path + 上次生成時間，並詢問「是否要重新生成？」session [28] 正在做的就是這個 feature 的 UX 端，但目前是寫死在 app code，沒有變成可重用 skill。
- **Trigger when**：使用者或 dispatcher 對單一公司觸發 `tw-company-pe-memo` 之前；或使用者說「重做 PE DD」「再跑一次 XX 的 memo」。
- **Category**：`workflow/`
- **Rationale**：本次 batch 顯示玩艸植造、律果科技各被 dispatch 6 次（部分為 silent-fail retry，但部分疑似有效 memo 仍被覆蓋）。`batch-dd-dedup-guard` 只防「最近 N 小時內失敗」的去重，沒有防「已有完整 memo」。session [28] 的功能上線後，應該把這段邏輯抽出成 skill。
- **Differs from existing**：`batch-dd-dedup-guard` 是看 retry queue；本 candidate 是看 output artifact 是否已存在。

---

### 3. `single-fact-extractor-prompt`【Weak】

- **Purpose**：把 session [21] 的 prompt 樣式（「只輸出 URL、禁止任何說明、找不到則輸出空字串、附範例輸出」）做成可套用模板。任何「我只要一個短字串答案」的場景都能用。
- **Trigger when**：使用者需要把 LLM 當作 single-field extractor（URL / 統編 / 電話 / boolean），且下游是程式而非人讀。
- **Category**：`meta/` 或 `docs/`
- **Rationale**：太薄、太通用，價值有限。但目前 `tw-company-website-finder` 等專用 finder 都重複實作這個 prompt 樣式，抽出成共用元件可省事。建議**不獨立成 skill**，改為在 `skill-creator` 文件中加一段「single-field extractor template」即可。
- **Action**：建議併入文件、不建立獨立 skill。

---

### 4. `pe-memo-materials-only-mode`【Weak】

- **Purpose**：session [15] 是一個特殊變體——「請根據已提供的補充資料（簡報 + 訪談備忘錄）+ 基本資料，**僅**根據這些回答」。和標準 `tw-company-pe-memo`（積極 WebSearch）的差別是「禁網路、只看附檔」。
- **Trigger when**：使用者明確指示「僅根據以下資料回答」「不要上網查」。
- **Category**：`workflow/`
- **Rationale**：`company-deck-ingestion` 已涵蓋讀檔，但「materials-only 約束」沒有單獨封裝。樣本太少（30 個 session 中只 1 例），不足以證明高頻復用。
- **Action**：先觀察，若再出現 2–3 例再升 Moderate。

---

## Recommended Actions

1. **建立 `pe-memo-silent-fail-rate-alert`**（最有價值），把 30 session 33% silent-fail 比例這條訊號正式變成觀測指標，避免持續燒 token。建議路徑 `meta/pe-memo-silent-fail-rate-alert/`。
2. **session [28] 的 UX feature 完成後**，把「memo 存在性檢查」邏輯抽成 `pe-memo-already-generated-guard` skill，補齊 `batch-dd-dedup-guard` 看不到的 case。
3. **不再新增**其他 PE DD 相關 skill ——既有 15 個相關 skill 已過多，繼續細分會增加 routing 混亂。
4. **反向追究**：為什麼 silent-fail 達 33%？是 dispatcher prompt 過長被截斷？是 model rate-limit？是 ToolSearch 反覆 retry？這個 root cause analysis 比再加 skill 更有 leverage。建議啟動 `investigate` skill 處理。

---

## Skills Already Covering This Batch（無需重建）

| Pattern in batch | 已存在 skill |
|---|---|
| 標準 PE DD memo | `tw-company-pe-memo` |
| Silent-fail 補救 | `pe-memo-silent-fail-recovery` |
| Refine 既有 memo | `tw-company-pe-memo-refine` |
| Trigger 修復 | `tw-company-pe-memo-trigger-fix` |
| Deep research 模式 | `pe-memo-deep-research` |
| 結構化來源優先 | `pe-dd-structured-source-first` |
| Batch DD orchestrator | `tw-company-batch-dd-orchestrator` |
| Batch DD dedup（retry queue） | `batch-dd-dedup-guard` |
| Batch DD pipeline | `tw-company-batch-dd-pipeline` |
| 官網 finder | `tw-company-website-finder` |
| 新聞證據檢索 | `tw-company-news-evidence-search` |
| 上傳簡報吸收 | `company-deck-ingestion` |
| 新聞分類 | `taiwan-news-classifier` |
| 多日新聞摘要 | `1-taiwan-news-multiday-digest` / `5-taiwan-news-weekly-digest` |
| 公司名稱抽取 | `tw-company-name-extractor` |
| Findbiz 深度查詢 | `tw-company-lookup` |

本 batch 沒有出現任何全新領域 workflow。
