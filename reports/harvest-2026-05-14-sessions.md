---
date: 2026-05-14
type: session-harvest
scope: 6 sessions across -home-jacktsai / -home-jacktsai-jk-nb / -home-jacktsai-taiwan-company
---

# Session Harvest — 2026-05-14

## Session 摘要

| # | Project | Msgs | 主要活動 | 關鍵檔案/工具 |
|---|---------|------|----------|----------------|
| 1 | jk-nb | 6 | 跑 `digest`：把 `inbox.md` 條目 promote 到 `wiki/*.md`，用 `~~刪除線~~` 標記已處理，提示刪除 30 天以上條目 | inbox.md, append-and-review.md, llm-wiki-method.md |
| 2 | jk-nb | 26 | 用 `_template.md` 建立新 wiki 頁、更新 `KNOWLEDGE_REGISTRY.md`，使用 TaskCreate / TaskUpdate 編排處理 | _template.md, KNOWLEDGE_REGISTRY.md, 多個 2026-05-13 raw 檔 |
| 3 | taiwan-company | 1 | 問 “為什麼跳出 96 個 skill dropped？”（skill loader troubleshooting） | — |
| 4 | taiwan-company | 238 | 探討 MOPS 資料下載方式、「爬蟲要繞著爬，不能直接爬後台」的技巧；大量 Bash + Edit + TodoWrite | audit_log.py, cli.py, dry_run_enum.py, REGISTRY.md |
| 5 | taiwan-company | 1 | 空 session | — |
| 6 | jacktsai | 1 | `cd taiwan-company`（context switch） | — |

**總計**：~273 訊息、Bash 99、Read 25、Edit 20、TodoWrite 11、Write 6。

---

## Skill 候選

### Strong

#### 1. `personal-knowledge-wiki`（meta / workflow）

- **用途**：把 jk-nb 那套「raw → inbox → wiki」的個人知識庫工作流變成可移植 skill。提供 `consume` / `link` / `lint` / `digest` 四個動作的 prompt 模板、frontmatter schema、命名規則、不可變區（raw/）與可變區（wiki/）的分界規則，以及刪除線而非刪行的 inbox 流程。
- **Trigger when**：使用者說「建一個個人知識庫」「Zettelkasten」「inbox digest」「raw to wiki」「digital garden」「個人 wiki」「append-and-review」；或專案根目錄出現 `raw/` + `wiki/` + `inbox.md` 三件套。
- **DO NOT TRIGGER when**：使用者要寫**專案內部文件**（README/ARCHITECTURE — 走 `doc-coauthoring`、`document-release`），或要做**跨 repo 文件同步**（不同需求）。
- **Category**：meta（或 workflow）
- **Rationale**：Session [1][2] 都在跑同一套 jk_nb 工作流。流程本身在 `~/jk_nb/CLAUDE.md` 已寫得很完整，但目前只綁在那一個 vault；如果使用者要在新環境（如客戶筆電、新筆記專案）重建這個系統，需要把流程從一個 200 行 CLAUDE.md 抽成可重用 skill。**現有 skills 沒有對應**（`markdown-file-ssot` 是 project SSOT 概念，`knowledge-graph` 是圖譜記憶，`doc-coauthoring` 是合作寫單一文件）。

---

### Moderate

#### 2. `cross-project-docs-symlink-bridge`（workflow）

- **用途**：在主知識庫用 `wiki/_external/<short-name>/` symlink 各個 Claude Code 子專案的 `docs/`，做成「主知識庫聚合多 repo 的權威文件」。Skill 內容：symlink 建立腳本、`KNOWLEDGE_REGISTRY.md` 範本、dead-link lint 規則、agent「只讀不寫」護欄。
- **Trigger when**：使用者擁有多個 Claude Code 專案、想要從一個中央位置查詢/連結各專案 docs；說「跨專案知識」「docs aggregation」「knowledge registry」「symlink docs」。
- **DO NOT TRIGGER when**：只是想 import 別人 repo 的 markdown（git submodule 比較合適）。
- **Category**：workflow
- **Rationale**：Session [1] 的 CLAUDE.md 揭示了 jk_nb 用 symlink 把 mops_databases、taiwan-company 等子 repo docs 接進來——這是一個獨立可複用 pattern，但牽涉的 case 比 candidate #1 窄。

#### 3. `scraping-frontdoor-vs-backdoor`（backend）

- **用途**：把「爬蟲要繞著爬，不能直接爬後台」這個技巧整理成決策樹：何時改打前端公開 JSON endpoint / 靜態檔案 / OData feed / RSS / iframe 內嵌 URL；何時要降速度、加 user-agent、用 session cookie；如何用 `audit_log.py` + `dry_run` 模式測試而不被封 IP。可用 MOPS 為主要案例。
- **Trigger when**：使用者爬 government / 上市公司 portal 被 rate-limit、被擋、補資料太慢；說「mops 爬太久」「被擋」「rate limit」「爬蟲繞路」。
- **DO NOT TRIGGER when**：對方有官方 API（直接用）、或只是要爬 1-2 個靜態頁（用 curl 即可）。
- **Category**：backend
- **Rationale**：Session [4] 是 238 訊息的大 session，圍繞 MOPS 爬蟲節流與「繞後台」技巧。**現有的 `mops-rev-scraper`、`mops-financial-scraper` 都只講「怎麼爬 MOPS 這個特定站」，沒有抽象出 portal-scraping 的通用啟發式**。但這個 skill 的價值仰賴是否能寫出夠扎實的決策框架，否則容易淪為散落 tip。

---

### Weak

#### 4. `claude-code-skill-loader-debug`（meta）

- **用途**：當 Claude Code 啟動時跳出 `N skill dropped` 訊息，協助找出是哪些 SKILL.md frontmatter 壞掉、description 過長、或 trigger 衝突。
- **Trigger when**：使用者看到「skill dropped」訊息問為什麼。
- **Category**：meta
- **Rationale**：Session [3] 只有一句問句，沒有後續上下文。問題雖然真實，但**單一觸發樣本不足以證明值得做 skill**——更適合先寫進 `settings-audit` 或 `skill-scout-output-fixer` 的 troubleshooting 章節，看下次再出現是否值得拆獨立 skill。

#### 5. `inbox-strikethrough-digest`（workflow）

- **用途**：把 `digest` 動作獨立為 skill（用刪除線而非刪行標記已處理、不 rescue 舊條目、30 天提示）。
- **Rationale**：Session [1] 直接觸發此 workflow，但**這個粒度太細，會被 candidate #1 完整涵蓋**。獨立成 skill 反而碎片化，不建議。

---

## 建議行動

1. **優先做 #1 `personal-knowledge-wiki`** — 兩個 session 直接命中、現有 skills 無覆蓋、可從 `~/jk_nb/CLAUDE.md` 直接抽出大半內容。
2. **#3 `scraping-frontdoor-vs-backdoor`** 等下次再出現類似 portal 爬蟲問題時再決定，避免抽象過早。
3. **#2 `cross-project-docs-symlink-bridge`** 可作為 #1 的補充章節先寫進去，未來若多人想複用 symlink 模式再獨立。
4. **#4 #5 暫不做**。
