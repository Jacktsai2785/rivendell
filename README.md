# Skills Library

Personal Claude Code skills library — manage, version control, and deploy custom skills.

## Structure

```
skills/
├── meta/       # Claude Code 自身管理工具 (18)
├── workflow/   # 工作流程與規劃 (23)
├── quality/    # 程式品質、審查、除錯、測試 (7)
├── git/        # Git/GitHub 操作 (2)
├── frontend/   # 前端設計、iOS、測試 (4)
├── backend/    # 後端服務 (19)
└── docs/       # 文件處理與 MCP 建置 (18)
```

## Quick Start

```bash
# Deploy all skills globally
./bin/sk deploy

# Use in any project
cd ~/any-project && claude
/init-project          # Set up project config
/setup-permissions     # Configure permission allowlists
```

## Commands

| Command | Description |
|---------|-------------|
| `./bin/sk deploy` | Symlink all skills → `~/.claude/skills/` |
| `./bin/sk-setup-systemd` | Generate + load systemd user units (`.service`/`.timer`) from `agents/agents.conf` (Linux/WSL2) |
| `./bin/sk undeploy` | Remove repo symlinks from `~/.claude/skills/` |
| `./bin/sk create <cat/name>` | Scaffold new skill (e.g. `quality/my-linter`) |
| `./bin/sk import <name>` | Import from SkillsMP via `agent-skills-cli` |
| `./bin/sk import-gh <url>` | Clone skill from GitHub URL |
| `./bin/sk list` | Show all skills grouped by category |
| `./bin/sk check [--verbose]` | Health check: symlinks, reviews, gdrive, frontmatter |
| `./bin/sk run <task>` | Run a task via `sk_exec()` — structured logging + cost tracking (`--resume`, `--context`) |
| `./bin/sk audit` | Generate audit report → `reports/skill-audit-YYYY-MM-DD.md` |
| `./bin/sk permissions [dir]` | Scan project tooling → update `.claude/settings.local.json` |
| `./bin/sk maintain` | Nightly: deploy check + permissions sync + agent health + audit |
| `./bin/sk agent <cmd>` | Manage automated agents: `list`, `start`, `stop`, `status`, `log`, `create` |
| `./bin/sk readme` | Regenerate Skills Catalog in README.md from SKILL.md frontmatter |
| `./bin/sk sync` | Show Google Drive import status for re-import |

## Skills Catalog (139 skills)

### meta/ — Claude Code 管理

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **agent-persona** | 自動 | Generate structured role prompts for headless Claude Code agents (tester |
| **audit-fix** | 自動 | 分析 `sk audit` 報告，自動清理各專案 permission 白名單（刪 one-off、統一格式、移除全域重複） |
| **ci-pipeline** | 自動 | 偵測專案 stack，自動產生 GitHub Actions CI workflow（lint、test、build）+ pre-commit config |
| **cross-device-deploy** | 自動 | 以 rivendell 為核心，設計其他裝置 pull 後一鍵部署多個 projects 的機制 |
| **deploy** | 自動 | 推薦部署平台，產生部署配置（Dockerfile、fly.toml、vercel.json）+ CD workflow |
| **dev-process-gate** | 自動 | 開發守門：確保 requirement → flow → wireframe → mockup → dev → QA testing 流程不跳步 |
| **init-project** | 自動 | 專案缺少 CLAUDE.md / AGENTS.md 時自動初始化，偵測框架自動填入 |
| **knowledge-graph** | `/knowledge-graph` | 三層記憶系統：追蹤人物、公司、專案的持久事實，寫入 JSONL + 摘要 |
| **plan-check-style** | 自動 | 進入 plan mode 做前端任務時，自動掃描並套用 style skills |
| **self-improving-agent** | 自動 + hook | 捕捉學習與錯誤修正，記錄至 .learnings/，提升有價值見解到 CLAUDE.md |
| **session-harvest** | `/session-harvest` | 工作告一段落時，自動審查 session 內容，找出可重複使用的模式並建議建立新 skill |
| **session-wrap** | 自動 | End-of-session cleanup: auto-commit uncommitted changes, archive learnings |
| **setup-permissions** | 自動 | 偵測專案工具鏈，自動設定 permission allowlists，減少手動核准 |
| **skill-creator** | 自動 | 建立、修改、評測 skills，含 eval 和 benchmark 工具 |
| **skill-scout** | `/skill-scout` | 從 GitHub 與社群資源發現、評估、移植 Claude Code skills |
| **sync-readme** | 自動 + hook | Keep README.md sections in sync with code structure across repos |
| **workflow-retro** | 自動 | Weekly observability retrospective for the rivendell skills + agents system. |

### workflow/ — 工作流程與規劃

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **1-llm-wiki-knowledge-base** | 自動 | 依 Karpathy 的 LLM Wiki / Append-and-Review 模式，從零建立個人知識庫。包含資料夾結構（`raw/` |
| **1-repo-cold-start** | 自動 | 拿到一個沒看過的 GitHub repo，要在本地把它跑起來「看到畫面」。流程：clone → 偵測 stack（package. |
| **1-service-watchdog-launchd** | 自動 | 為 Linux / WSL2 上的 HTTP 服務（FastAPI / Next. |
| **1-taiwan-news-multiday-digest** | 自動 | 把過去 N 天（5–8 天）的單日新聞分類結果，彙整成「多日摘要 + 高頻標題」格式。每天一段，列出當日主題（5–8 |
| **2-dev-server-restart-verify** | 手動 | 重啟 rivendell monorepo 的 frontend + backend dev server，並驗證 port 真的在 listening。避免「啟動完成但其實 crash」的假陽性。 |
| **2-headless-agent-knowledge-pipeline** | 自動 | 使用 systemd user timer 定期執行 Claude Code headless |
| **2-jk-nb-consume** | 自動 | 執行 jk_nb vault 的 consume 動詞——掃 raw/ 依 frontmatter type 路由至 wiki/ 子目錄、補 entity |
| **3-claude-sdk-oauth-telegram-bridge** | 自動 | 把「Claude Agent SDK（OAuth 模式）」+ 「Telegram bot」+ 「地端 web app」三者組合起來：使用者透過 |
| **3-jk-nb-lint** | 自動 | 執行 jk-nb wiki 的 lint 動詞，掃描整個 wiki/ 目錄，找出內容品質問題（重複定義、孤立頁面、broken links、title |
| **3-obsidian-vault-link-rules** | 自動 | | |
| **3-raw-watcher-file-ingestion** | 自動 | | |
| **3-tender-lead-router** | 自動 | 政府標案 → 銷售線索的轉換工作流：搜尋符合特定客戶能力的標案 → 取得原始公告網址 → 在 `nx_deal` / 客戶資料夾新增 deal/saleing |
| **4-github-pages-corporate-site** | 自動 | 用 CNAME + DESIGN.md + STATE.md 模式建立企業官網（靜態 + 自訂域名 + GitHub Pages）。 |
| **4-windows-clipper-to-wsl** | 自動 | 在 Windows 端建立瀏覽器書籤、PowerShell handler、URL |
| **5-local-first-pdf-excel-company-extractor** | 自動 | | |
| **agent-observability** | 自動 | 讓 script-based agent 在 rivendell 可見：exec-lib 執行歷史、progress logging、log discovery 三層整合指南 |
| **autoresearch** | `/autoresearch` 或自動 | Autonomous goal-directed iteration loop for Claude Code agents. |
| **candidate-analysis** | `/candidate-analysis` 或自動 | 面試候選人管理：PDF 履歷解析、GitHub repo 程式品質分析、候選人 profile markdown 產出 |
| **claude-to-telegram** | `/claude-to-im setup` | 設定 Telegram 橋接器遠端控制 Claude Code，支援兩種實作方式 |
| **context-recovery** | 自動 + hook | Session 壓縮後自動復原工作上下文，使用 Git 狀態與專案 metadata |
| **crm-projection** | `/crm-projection` | Project nx_client + nx_deal data to local markdown files at materials/clients/. |
| **cron-script-範式段落-加進-headless-agent-或-launchd-agent** | 自動 | rivendell 所有 cron-style 維護腳本（bin/sk-*-cron，由 systemd user timer 觸發）共用的「shape」。 |
| **customer-intel** | `/customer-intel` 或自動 | B2B 客戶情蒐：公司名 → WebSearch + Playwright → 結構化報告（概覽、管理層、財務、競爭、痛點、策略建議） |
| **dispatching-parallel-agents** | 自動 | 3+ 個獨立問題時，派 subagent 並行處理 |
| **executing-plans** | 自動 | 分批執行計畫，每批有 review checkpoint |
| **gdrive-to-skills** | `/gdrive-to-skills` | 讀取 Google Drive 文件，分類並自動建立 knowledge skills |
| **headless-agent** | 自動 | 將 Claude Code 作為非互動式 agent 執行，含排程、結構化日誌、auto-commit/push、QA gate、branch workflow、multi-role agents |
| **ic-report-multimodal-ingest** | 自動 | | |
| **investment-research** | `/investment-research` 或自動 | 投資研究流程：總經掃描 → 選股池 → Alpha 發現 → 風險評估 → 回測 → 四大報表 → 報告 |
| **jd-writer** | 自動 | Generate structured Job Descriptions (JD / 職缺描述) from organizational context. |
| **jk-nb-digest** | 自動 | | |
| **jk-nb-inbox-digest** | 自動 | | |
| **keyword-discovery** | 自動 | 自動分析爬蟲未匹配項目，發現新關鍵字候選詞，高信心詞自動升級至 active 列表 |
| **launchd-agent** | 自動 | 建立、設定、除錯 Linux/WSL2 systemd user 排程 agents（`.service`/`.timer` 產生、OnCalendar 排程、systemctl --user 生命週期、agents.conf fleet 模式） |
| **llm-field-regenerate-ux** | 自動 | 整合 LLM 重新生成既有 DB 欄位（公司簡介、職缺描述、案件摘要等）的端對端 UX flow——按鈕觸發 → 動畫 loading → preview + |
| **material-health** | `/material-health` | Health check for the sales materials library — detects missing frontmatter |
| **mockup** | `/mockup` 或自動 | 三階段 UI mockup（ASCII → 靜態 HTML → 互動 HTML），讀取 design system，支援 Figma 匯出 |
| **mops-business-description-scraper** | 自動 | 從 MOPS 網站 `t05st03` 頁面爬取台灣上市/櫃/興櫃公司的「主要業務」（主營業務描述），支援單公司查詢與批次查詢，結果存入本機資料庫或回傳 |
| **mops-cluster-master-alignment-audit** | 自動 | 稽核 mops 叢集下游 DB（mops_rev/pl/bs/cf/notes/price）與上游 mops_master 的公司名單對齊狀態及排程拓樸。 |
| **mops-filer-list-reconcile** | 自動 | 把本地 `mops_master.filers` 名單與權威來源（TWSE 上市 / OTC 上櫃 / ROTC 興櫃 / 公發 四份 opendata |
| **mops-individual-financial-report** | 自動 | 為現有 MOPS 財務爬蟲增加個體財報（非合併）抓取支援 |
| **mops-investee-holdings-debug** | 自動 | | |
| **mops-notes-backfill-monitor** | 手動 | 監控與管理 mops_notes 大型批次附註抽取回填作業：啟動後台抽取 → 即時監督進度 → 週期檢查 → 失敗隔離 → 補跑驗證 |
| **multi-industry-news-pipeline-orchestrator** | 自動 | 把「4 個固定產業（AI / 前瞻科技 / 綠色永續 / 消費生活）× 兩種輸出（單日分類 / 多日 digest）」串成一次性編排，避免使用者手動逐產業觸發 |
| **pe-dd-structured-source-first** | 自動 | pe-dd-structured-source-first skill |
| **pe-memo-already-generated-guard** | 自動 | 在啟動 PE memo workflow 前檢查目標公司是否已有完整的 memo 文件，防止無謂覆蓋。 |
| **pe-memo-deep-research** | 自動 | 在初步 PE 備忘錄產出後，針對特定疑點或待驗證聲明進行深度網路研究（WebSearch + |
| **pe-memo-silent-fail-rate-alert** | 自動 | 監測每日 PE memo 派送的 silent-fail 比例，超過 20% 閾值時發送 Telegram 告警。TRIGGER: 每日 dispatcher |
| **planning-with-files** | `/planning-with-files` | Manus 風格的檔案式規劃，用 task_plan.md 追蹤進度，支援 session 恢復 |
| **post-backfill-indicator-recompute** | 自動 | 在 mops_db 補完 XBRL 財報資料後，對選股指標快照做資料完整度校正式的增量重算。觸發：補完資料後重新檢查指標、mops_db 補了 XBRL |
| **product-index** | 自動 | | |
| **proposal-opportunity-scan** | 自動 | 快速研究目标公司背景，评估 ML/AI/自动化切入点，产出简要机会评估报告。 |
| **rbac-setup** | 自動 | 在全端 App 中加入角色型存取控制（admin/user、內帳/外帳可見性） |
| **requirement** | `/requirement` 或自動 | 定義需求：user story、acceptance criteria、scope boundary |
| **sales-material** | `/sales-material` | Assemble client-specific sales presentations by matching customer intelligence |
| **settings-audit** | 自動 | 審查清理 .claude/settings.local.json — 移除無效 permissions、修正 JSON 語法、偵測一次性指令誤存為永久權限 |
| **stock-data-gap-diagnose** | 自動 | Diagnose and resolve 'data insufficient' messages for individual stocks on the |
| **stock-fundamentals-grading** | 自動 | 將 MOPS 月營收、季財報原始資料計算成六大指標（營收成長性、營業利益率、稅後淨利年增率、累積 EPS、存貨周轉率、FCF），並依 rubric 給出 |
| **subsidy-scraper** | `/subsidy-scraper` | Automated government subsidy scraper — fetches grant listings from Taiwan |
| **taiwan-financial-category-display** | 自動 | 將 MOPS/XBRL 財務資產類別代碼正規化為台灣 GAAP/IFRS 標準名稱，並處理持股比例 → 數量的 fallback 邏輯。 |
| **taiwan-news-weekly-digest** | 自動 | | |
| **tech-evaluation-doc** | 自動 | 客戶提出模糊需求時（例如「補習班進出紀錄」），產出三件套決策文件：`tech-stack.md`（2-3 個技術路徑比較）、`cost-estimate. |
| **tej-sub-code-classifier** | 自動 | 給定台灣上市櫃公司代號、公司名稱與業務描述，從 TEJ 子產業代碼清單中選出最合適的代碼。 |
| **tender-scraper** | `/tender-scraper` 或自動 | 自動爬取政府標案（g0v API）、data-driven 關鍵字篩選（keywords.yml + 自動發現）、網路韌性（retry/backoff）、歸檔過期、生成索引、dashboard 可觀測性 |
| **tw-company-batch-dd-orchestrator** | 自動 | | |
| **tw-company-batch-dd-pipeline** | 自動 | TRIGGER when: 使用者提供一份台灣公司名單（PDF、文字、試算表），需要批次產出多份完整 DD 備忘錄。協調名稱擷取 → 網站搜尋 → PE |
| **tw-company-dd-orchestrator-guard** | 自動 | | |
| **tw-company-name-extractor** | 自動 | | |
| **tw-company-news-evidence-search** | 自動 | 給定公司名稱，搜尋並彙整媒體曝光（報導、入選、獲獎、創辦人專訪），輸出結構化證據清單。 |
| **tw-company-pe-memo-refine** | 自動 | 對 `tw-company-pe-memo` 產出的初版備忘錄，執行第二輪「補充搜尋 → 證據抓取 → |
| **tw-company-pe-memo-trigger-fix** | 自動 | tw-company-pe-memo-trigger-fix skill |
| **tw-company-website-finder** | 自動 | 給定台灣公司名稱與統一編號，用 WebSearch 找出最可能的官方網站 URL。 寧缺勿錯：找不到就回 null，絕不因「同名異公司」或「舊名」誤判統編不符。 |
| **user-flow** | `/user-flow` 或自動 | 用 Mermaid 繪製使用者流程圖，含 happy path 與 error branch |
| **writing-plans** | 自動 | 產出 bite-sized 實作計畫，假設工程師零 codebase context |

### quality/ — 程式品質

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **de-slopify** | 自動 | 移除 AI 生成「廢文」痕跡，讓文本讀起來像人寫的 |
| **github-repo-audit** | 自動 | Audit a GitHub repository for structure quality, documentation coverage |
| **large-file-refactor** | 自動 | Systematically split large single-file components (500+ lines) into modular |
| **protect-secrets** | Hook (PreToolUse) | 攔截讀取/修改 .env、private keys、credentials 等敏感檔案 |
| **qa-auto** | `/qa-auto` | 從 QA 計畫或 diff 自動產生測試程式碼、執行測試、報告覆蓋率缺口 |
| **qa-planner** | `/qa-planner` | 分析程式碼變更產生結構化 QA 計畫：影響分析、測試案例、風險評估 |
| **qa-testing** | 自動 | 跨框架測試指導：pytest / Vitest / Swift Testing 的策略、mock 模式、模板 |

### git/ — Git/GitHub

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **auto-stage** | Hook (PostToolUse) | 檔案編輯/建立後自動 git add，跳過 .env 和 node_modules |
| **repo-rename** | `/repo-rename` | Repo 改名時全系統審計引用（systemd user units、Claude 設定、腳本、兄弟 repo），產出遷移清單並執行 |

### frontend/ — 前端設計、iOS、測試

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **frontend-design** | 自動 | 設計哲學 — 產出獨特、避免 AI 感的 production-grade UI |
| **ios-integration** | 自動 | iOS 系統整合：App Extensions、Deep Links、Universal Links、App Groups、權限、地圖 |
| **swiftui-patterns** | 自動 | SwiftUI iOS 17+ 架構模式：@Observable、MVVM、strict concurrency、NavigationStack |
| **ui-ux-pro-max** | `/ui-ux-pro-max` 或自動 | UI/UX 資料庫搜尋 — 97 色票、57 字體配對、50+ 風格、25 圖表類型，含 Python CLI |

### backend/ — 後端服務

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **ai-data-layer** | 手動 | 重構 LLM-based 後端：分離 AI/Agent 邏輯與純資料層，解決 ai_provider.py / agent.py 耦合問題，改善可測試性與可維護性 |
| **audio-transcription** | 自動 | 在 Web App 中加入音訊上傳 → 語音辨識 → 逐字稿顯示。支援 faster-whisper / OpenAI Whisper / OpenAI API 三種後端。 |
| **audio-transcription-flow** | 自動 | Implement a complete audio upload → speech-to-text → transcript display |
| **company-deck-ingestion** | 自動 | TRIGGER when: user uploads company presentation files (PDF/PPT/images) and |
| **db-migration** | 自動 | 偵測 DB stack，設定 migration 工具（Alembic/Prisma/Drizzle），指導安全 schema 變更 |
| **doc-to-structured-data** | 自動 | 非結構化技術文件（.doc/.pdf 測試計畫、規格書、datasheet）→ 結構化 CSV/JSON，含格式偵測、欄位對映、驗證 |
| **docker-compose-setup** | 自動 | Set up Docker Compose for multi-service projects (Next. |
| **financial-indicators-from-statements** | 自動 | | |
| **firebase-backend** | 自動 | Firebase 全方位開發：Firestore CRUD/queries、Cloud Functions (1st/2nd gen, TS+Python)、CLI、emulator、Security Rules、Auth、Hosting、GCP 整合 |
| **imap-smtp-integration** | 自動 | IMAP/SMTP Integration - Integrate email reading and sending via IMAP/SMTP into |
| **markdown-file-ssot** | 自動 | Markdown File SSOT - Use Markdown files with YAML frontmatter as a data SSOT. |
| **oauth-token-vault** | 自動 | OAuth Token Vault - Implement OAuth 2. |
| **rbac-permissions** | 自動 | Design and implement Role-Based Access Control (RBAC) for full-stack apps. |
| **sqlite-to-postgres** | 自動 | SQLite → PostgreSQL/Supabase 遷移指南：語法差異、schema 轉換、資料遷移、驗證 |
| **tunnel-proxy-deploy** | 自動 | Deploy FastAPI + Next.js behind Cloudflare Tunnel. |
| **tw-company-lookup** | `/tw-company-lookup` 或自動 | 用 Playwright 查詢經濟部 findbiz.nat.gov.tw：公司基本資料、董監事、工廠、歷史變更 |
| **vector-search-setup** | 自動 | Set up a vector search knowledge base in a FastAPI project from scratch. |

### docs/ — 文件處理與 MCP 建置

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **discovery-interview** | 自動 | Run a structured Discovery interview with a potential consulting client to find |
| **doc-coauthoring** | `/doc-coauthoring` 或自動 | Structured workflow for collaboratively co-authoring documentation through |
| **gantt-slide** | 自動 | 根據里程碑清單或專案時間表，在簡報中產出 Gantt 圖 slide（HTML canvas 或 SVG，可嵌入 PPTX） |
| **gdoc-report-builder** | 自動 | Build structured reports in Google Docs/Slides via MCP tools — batch table |
| **internal-comms** | `/internal-comms` 或自動 | Templates and formats for ongoing organizational communications during and |
| **iot-factory-report** | 自動 | Analyze factory IoT/SCADA time-series data (CSV/Excel) and produce visual |
| **mcp-builder** | 自動 | 建立 MCP server 的指南（Python FastMCP / Node MCP SDK） |
| **metadata-workshop** | 自動 | Run a structured Metadata Workshop with a consulting client to convert their |
| **office-docx** | 自動 | Word (.docx) 建立、編輯、分析，支援追蹤修訂與註解 |
| **office-pdf** | 自動 | PDF 操作：文字/表格擷取、建立、合併/分割、表單填寫 |
| **office-pptx** | 自動 | PowerPoint (.pptx) 建立、編輯、分析，支援版面配置與講者備註 |
| **office-xlsx** | 自動 | 試算表 (.xlsx/.csv) 建立、編輯、分析，支援公式與資料視覺化 |
| **pitch-deck** | 自動 | Create professional business pitch decks and investor presentations with |
| **rfq-writer** | 自動 | Generate Request for Quotation (RFQ / 報價單) for consulting projects. |
| **slide-template-extractor** | 自動 | Extract design system from an existing PPTX or Google Slides deck and produce a |
| **slide-workflow** | 自動 | Step-by-step presentation creation workflow with confirmation gates. |
| **sow-writer** | 自動 | Generate professional Taiwan-format Statement of Work (工作說明書 / SOW) for |
| **telegram-bot** | 自動 | grammY / python-telegram-bot 機器人開發指南：架構、Bot API、部署模式 |


## How Deploy Works

Each skill directory gets symlinked individually into `~/.claude/skills/`. Edits to skill files take effect immediately — re-deploy only when adding new skills.

Scheduling is separate: run `./bin/sk-setup-systemd` to (re)generate systemd user units from `agents/agents.conf`.

## System Architecture

rivendell runs three classes of long-lived processes on **Linux / WSL2**, all managed by **systemd user units** (`systemctl --user`):

```
┌─ Dashboard (always-on, keepalive) ──────────────┐
│  com.sk.dashboard.api     FastAPI :8001         │
│  com.sk.dashboard.web     Next.js :3001         │
│  com.sk.dashboard.watchdog  HTTP health probe   │  ← restarts hung API/web
└─────────────────────────────────────────────────┘
┌─ Scheduled agents (timers) ─────────────────────┐
│  rivendell.harvest    every 8h  → reports/      │
│  rivendell.maintain   daily 22:00               │
│  rivendell.tester     daily 6:00                │
│  rivendell.doctor     daily 7:00                │
│  news_stock.*, sales.*  (per-project schedules) │
└─────────────────────────────────────────────────┘
```

**Single source of truth:** `agents/agents.conf` — pipe-delimited list of every agent.
`bin/sk-setup-systemd` reads it, generates one `.service` (+ `.timer` for scheduled
ones) per row in `~/.config/systemd/user/`, runs `loginctl enable-linger` (so units
survive logout — critical on WSL2), then `systemctl --user enable --now`s them. Re-run
after editing the conf.

**WSL2 prerequisite:** systemd must be enabled — `[boot]\nsystemd=true` in
`/etc/wsl.conf`, then `wsl --shutdown` once. On Linux a normal user can read its own
`$HOME` freely, so no custom runner / Full-Disk-Access dance is needed (that was a
macOS launchd/TCC concern). Logs go to each unit's `StandardOutput=append:` path
under the project's `logs/` or `reports/`, and to `journalctl --user -u <label>`.

**Schedule types** (column 4 of `agents.conf`, mapped to systemd by `sk-setup-systemd`):
| Type | Value | Meaning |
|------|-------|---------|
| `interval` | seconds | Run every N seconds (e.g. `60`, `28800`) |
| `calendar` | `H:MM` or `W:H:MM` | Daily at time, or weekly on weekday W (0=Sun) |
| `calendar_multi` | `W1:H:MM,W2:H:MM` | Multiple weekly slots |
| `keepalive` | `-` | Run forever, restart if process exits |

### Operating the dashboard

```bash
# Status
systemctl --user list-units 'com.sk.dashboard.*'

# Manual restart
systemctl --user restart com.sk.dashboard.api.service
systemctl --user restart com.sk.dashboard.web.service

# Logs
journalctl --user -u com.sk.dashboard.api.service -f
tail -f reports/api-stderr.log    # also captured here
tail -f reports/watchdog.log       # only written when health checks fail
```

The dashboard URLs are http://localhost:8001 (API) and http://localhost:3001 (web).
`start-api.sh` / `start-web.sh` handle venv + deps; you do not invoke them directly.

### How the watchdog works

`bin/sk-watchdog` runs every 60s (via `com.sk.dashboard.watchdog`) and HTTP-probes
both services. systemd's `Restart=always` only catches process death — it cannot detect
a hung process whose port is still listening. The watchdog covers that gap:

- Failure threshold: **3 consecutive failures** (~3 min) before restart
- After restart: **60s grace period** before re-checking that service
- State: `reports/.watchdog-state` (consecutive-failure counter, last-restart timestamp)
- Log: `reports/watchdog.log` — written only on FAIL / RESTART / RECOVER events

Tune by editing `THRESHOLD` / `GRACE_SECONDS` at the top of `bin/sk-watchdog`.

### Adding or changing an agent

1. Edit `agents/agents.conf` (add a row, comment out, or change schedule)
2. Run `./bin/sk-setup-systemd` — regenerates `.service`/`.timer` units and re-enables them all
3. Verify: `systemctl --user list-timers --all | grep <your-label>` (or `list-units`)

To temporarily disable an agent, comment its row in `agents.conf`, then
`systemctl --user disable --now <label>.timer` (or `.service`) and remove its unit
files from `~/.config/systemd/user/` (the generator does not clean up rows that no
longer exist). `./bin/sk-setup-systemd --stop` disables the whole managed fleet.

### Troubleshooting

| Symptom | Where to look |
|---------|---------------|
| Dashboard returns nothing | `tail -f reports/api-stderr.log` and `journalctl --user -u com.sk.dashboard.api.service` |
| Watchdog restarting every 3 min | `cat reports/watchdog.log` — find the failing endpoint, then read the API stderr log |
| Agent didn't run on schedule | `systemctl --user list-timers --all \| grep <label>` (next/last fire); `systemctl --user status <label>.service` for exit code |
| Units gone after reboot | systemd not enabled in WSL — set `[boot] systemd=true` in `/etc/wsl.conf`, `wsl --shutdown`; ensure `loginctl enable-linger "$USER"` |
| Audit / health questions | `./bin/sk audit` (writes `reports/skill-audit-YYYY-MM-DD.md`) |

## Using Skills in Other Projects

Skills deploy 後是**全域生效**的，不需要在每個專案裡做任何設定。

```bash
# Deploy once
./bin/sk deploy

# Use anywhere — restart Claude Code to pick up new skills
cd ~/any-project && claude
```

| 情境 | 做法 |
|------|------|
| 新增 skill 後看不到 | `./bin/sk deploy` 然後重啟 Claude Code |
| 修改現有 skill | 直接編輯 SKILL.md，symlink 立即生效 |
| 確認部署狀態 | `./bin/sk list` |
| 移除所有 skills | `./bin/sk undeploy` |

## Prerequisites

- Python 3 — for ui-ux-pro-max search CLI
- `agent-skills-cli` — for importing from SkillsMP: `npm install -g agent-skills-cli`
