# Session Harvest — 2026-06-03 (batch 2)

## Session Summary

- **日期**：2026-06-03
- **專案**：`-home-jacktsai-taiwan-company`（單一專案）
- **session 數**：30
- **訊息總數**：~329（平均 ~11 msgs/session）
- **主要工具**：WebSearch ×183、WebFetch ×92、ToolSearch ×22、Skill ×1
- **核心活動**：台灣早期/中小型未上市公司 PE 盡職調查（DD memo 產出）

### 樣態分佈

| 樣態 | 數量 | 特徵 |
|---|---|---|
| 1-msg silent-fail | 7 | msgs=1、tools=0，prompt 收到後沒有任何 tool call |
| 完整 DD 跑完 | 21 | 6–25 msgs、WebSearch 6–15 次、WebFetch 2–9 次、ToolSearch 1 次 |
| Skill 實際觸發 | 1 | 僅 session [22]（成真文創）顯式 invoke `tw-company-pe-memo` |
| 新聞分類 | 2 | sessions [11][28]，1 msg、無工具呼叫 |

### 重複目標公司

- **共宅一生股份有限公司**（統編 52419147）出現 6 次（sessions 1, 4, 14, 16, 21, 24）→ 全部 1 msg silent-fail，唯獨 [18] 17 msgs 跑完。與 2026-06-01 harvest 觀察到的「玩艸植造 ×6、律果科技 ×6」同樣態，疑似 `pe-memo-silent-fail-recovery` 的自動 retry loop 在重跑同一目標。

### 工具使用觀察

- 每個成功 session 都呼叫 ToolSearch ×1（典型在 Skill 觸發前載入 schema）。30 session 累積 22 次 ToolSearch，但只觸發 1 次 Skill — schema 載入後沒有實際 invoke，浪費明顯。
- WebSearch:WebFetch 比例約 **2:1**（183:92），代表搜尋結果有近半沒進入 fetch — 可能是相關性過濾，也可能是搜尋 query 不夠精準。

---

## Skill Candidates

| 強度 | 名稱 | 目的 |
|---|---|---|
| Weak | `pe-memo-toolsearch-warm-cache` | ToolSearch 被呼叫 22 次但只 invoke 1 次 Skill，schema cache 沒被利用 |
| Weak | `pe-memo-websearch-query-tuner` | WebSearch:WebFetch ~2:1 暗示 query 精準度有改善空間 |
| Skip | （其他） | 本批次 PE DD 領域已被現有 18+ 個 `tw-company-*` / `pe-*` skill 覆蓋 |

### Weak 1 — `pe-memo-toolsearch-warm-cache`

- **purpose**：在 headless agent 啟動時預先載入 `Skill` + 常用 PE DD 工具 schema，避免每個 session 都跑一次 ToolSearch
- **trigger**：headless agent boot；或偵測「最近 N 個 session 都呼叫同一組 ToolSearch query」
- **category**：`workflow/`
- **rationale**：30 sessions × 1 ToolSearch = 30 次 schema 載入，但只有 1 次真的進到 Skill invoke。如果 schema 可以在 agent 層常駐，能消除 22 次冗餘呼叫
- **限制**：屬於 harness/runtime 層優化，可能不適合做成 skill；更像是 `headless-agent` 的設定改動

### Weak 2 — `pe-memo-websearch-query-tuner`

- **purpose**：為 PE DD 場景設計更精準的 WebSearch query 模板（含公司全名+統編、限定 `site:` domain、排除新聞稿樣板字）
- **trigger**：當一個 PE DD session 中 WebSearch 呼叫數 > 10 時，提示切換到 query tuner
- **category**：`workflow/`
- **rationale**：搜尋多但 fetch 少代表「搜得到、抓不到關鍵頁」。可能值得做但樣本不足以斷定 query 樣式問題還是領域本身就是低訊號
- **限制**：可能已在 `tw-company-news-evidence-search` 範疇內，建議併入而非獨立

---

## 反向 takeaway

1. **PE DD 領域過度 skill 化**：現有 18+ 個 `tw-company-*` / `pe-*` skill 已涵蓋 identify → lookup → news → DD → batch orchestrator → silent-fail-recovery 的完整 pipeline。本批次沒有新的 Strong 候選。
2. **真正的瓶頸是 silent-fail 比例**：本批次 7/30 ≈ 23%（昨日 10/30 ≈ 33%）。與其再加 skill，不如用 `investigate` 追為什麼 `tw-company-pe-memo` 在收到完整 prompt 後沒被 Skill tool 觸發。
3. **共宅一生 retry 現象重現**：同一目標公司被 retry 6 次的樣態與 2026-06-01 一致，已有 `pe-memo-already-generated-guard` 候選追蹤，本批次再確認其優先級。
