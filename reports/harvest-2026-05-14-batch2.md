---
date: 2026-05-14
type: session-harvest
sessions: 23
batch: 2
---

# Session Harvest — 2026-05-14（第二批）

## Session 摘要

- **日期**：2026-05-14
- **涵蓋範圍**：23 個 session，約 65 則訊息
- **主要專案**：
  - `-home-jacktsai-jk-nb`（2 個 session，44 則訊息——wiki `consume` 編譯流程）
  - `-home-jacktsai-taiwan-company`（21 個 session，各 1 則訊息——產業新聞分類 + 多日摘要的 headless agent 輸入）
- **工具使用**：Read(19)、Bash(14)、Write(6)、Edit(3)
- **關鍵活動**：
  1. 兩次跑 `consume` 動詞：依 `jk_nb/CLAUDE.md` 工作流程把 `raw/` 內容（含 `raw/_dropbox/_processed/` watcher 已處理檔）編譯進 `wiki/`，路由 `industry-digest` → `wiki/news/<industry>.md`、`company-profile` → `wiki/companies/<slug>.md`
  2. 21 次重複的 taiwan-company headless 輸出：
     - **單日新聞清單**（10 次）：5 個產業 × 2 輪（AI、消費生活、綠色永續、前瞻科技、循環經濟），格式為「【產業相關報導】（請分類）」+ 編號清單 → 對應既有 `taiwan-news-classifier`
     - **多日摘要**（11 次）：5 個產業 × 不同時間區間（過去 5/6/7/8 天），格式為「【每日摘要與主題】」+ 高頻標題彙整 → **沒有對應的既有 skill**

---

## Skill 候選

### 1. **taiwan-news-multiday-digest** —— Strong ⭐

- **Purpose**：把過去 N 天（5–8 天）的單日新聞分類結果，彙整成「多日摘要 + 高頻標題」格式。每天一段，列出當日主題（5–8 個關鍵詞），最後附跨日高頻標題排行。輸出格式固定：`【每日摘要與主題】` + `YYYY-MM-DD | 主題：A、B、C | 一句話總結`，後接 `【高頻標題】` 區塊。可選輸入：N 天的單日分類結果（即 `taiwan-news-classifier` 的輸出累積）。
- **Trigger**：使用者說「過去 N 天台灣產業新聞摘要」「週度新聞摘要」「多日 digest」「高頻標題」「news-{industry}.md 累積」「digest 5 days」「跨日彙整」。
- **Category**：`workflow/`
- **Rationale**：本批 23 個 session 中有 **11 個**是這種多日摘要格式（涵蓋 5 個產業 × 各自 5–8 天區間），是出現頻率最高的單一輸出形態。既有 `taiwan-news-classifier` 只處理**單日**清單，沒有覆蓋「跨多日彙整 + 高頻標題抽取」。也是 `jk_nb/wiki/news/<industry>.md` 累積頁面的天然上游（每天的 `## YYYY-MM-DD` 節需要這種格式）。

---

### 2. **jk-nb-consume** —— Strong ⭐

- **Purpose**：執行 jk_nb vault 的 `consume` 動詞——掃 `raw/` 與 `raw/_dropbox/_processed/`，依 frontmatter `type` 路由到對應 `wiki/` 子目錄（`company-profile` → `wiki/companies/<slug>.md`、`industry-digest` → `wiki/news/<industry>.md`、其他 → `wiki/<topic>.md`），更新 `last_compiled`、補 entity wikilinks（`[[wiki/...]]` 絕對路徑，避免 `[[../X]]`）、regen `wiki/_index.md`、append `logs/agent-actions.md`。一次最多 5 頁。
- **Trigger**：使用者說「跑 consume」「編譯 raw」「整理筆記到 wiki」「jk-nb consume」「vault 編譯」「處理 dropbox」。或者 working directory 是 `jk_nb` / `jk-nb` 時自動建議。
- **Category**：`workflow/`
- **Rationale**：本批兩個 jk-nb session 共 44 則訊息都在跑這個動詞，工作流程已在 `CLAUDE.md` 寫死、有明確的「不要做的事」清單、特殊的 wikilink 規則（絕對禁 `[[../X]]`）、entity 第一次出現才 link 的規則、5 頁上限。所有規則都是非顯然且容易出錯的（特別是 `..` 會被 Obsidian 當字面資料夾名 mkdir）。包成 skill 可在每次 consume 時自動載入規則，避免漏 regen index 或忘 append log。**與既有 `markdown-file-ssot` 不同**：後者是查詢用，前者是寫入用，且綁定 Karpathy LLM Wiki 的四動詞 schema。

---

### 3. **obsidian-vault-link-rules** —— Moderate

- **Purpose**：codify Obsidian vault 內的 wikilink 寫法規則——絕對路徑 `[[wiki/...]]`、basename 同目錄 `[[sibling]]`、外部 docs `[[_external/<proj>/<page>]]`、禁 `[[../X]]`（會被 Obsidian 解讀為字面資料夾名）、entity 類型分類（公司去後綴、政策用全名、技術主題用市場簡稱）、不 link 的詞（政府機關、展會、泛用詞、人名）、unresolved link 不預建頁面。
- **Trigger**：使用者說「Obsidian wikilink」「vault 連結規則」「wiki link 寫法」「[[]]」「Obsidian graph」「entity linking」。
- **Category**：`docs/` 或 `workflow/`
- **Rationale**：這組規則是 `jk_nb/CLAUDE.md` 內密度最高的「容易踩坑」段落（Obsidian `..` 行為、entity 第一次出現才 link 等）。如果未來有第二個 Obsidian vault 專案（或別的使用者要建類似 vault），這份規則可直接複用。**單獨成 skill 的價值在於可被 `jk-nb-consume` 或其他 Obsidian-aware skill 引用**。降級為 Moderate 是因為目前只用於 jk-nb 一個 vault，泛用性待驗證。

---

### 4. **headless-agent-batch-output-parser** —— Weak

- **Purpose**：處理 headless agent 跑出來的「重複格式輸入」——當同一個分類/摘要任務被 cron 跑 N 次（不同產業、不同時間區間），每次的輸出都是 1-msg session 且只有 user prompt 沒有 tool 用量。提供統一格式驗證、去重、批次落地 markdown 的 workflow。
- **Trigger**：使用者說「headless 輸出整理」「批次 agent 結果」「跨 session 去重」。
- **Category**：`meta/`
- **Rationale**：本批 21 個 1-msg session 暴露了一個 pattern——headless agent 輸出進到 Claude Code 時，session 結構是退化的（無 tool use、單訊息）。要從這些 session 提取價值需要特殊處理。但這比較像 `session-harvest` 自己的內部優化，而不是使用者面向的 skill。**先不做，等下次 retro 再評估是否真的有重複需求**。

---

## 建議行動

1. **優先建立 `taiwan-news-multiday-digest`**：本批最高頻 pattern，且補上既有 `taiwan-news-classifier` 的盲點（單日 vs 多日）。可參考 sessions 9/11/12/13/14/15/16/18/22 的輸出格式作為範本。
2. **建立 `jk-nb-consume`**：把 `jk_nb/CLAUDE.md` 內 `consume` 動詞的規則包成 skill，特別是 wikilink 絕對路徑、5 頁上限、必跑 index regen + log append 三個容易漏的步驟。
3. **`obsidian-vault-link-rules` 暫緩**：等第二個 Obsidian vault 專案出現再 promote 為 Strong。目前先在 `jk-nb-consume` 內 inline 即可。
4. **`headless-agent-batch-output-parser` 不做**：本批的 1-msg session 是 session-harvest 工具自身的觀察盲點，不是使用者需求。
