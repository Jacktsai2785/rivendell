# Skills Library

Personal Claude Code skills library — manage, version control, and deploy custom skills.

## Structure

```
skills/
├── meta/       # Claude Code 自身管理工具 (13)
├── workflow/   # 工作流程與規劃 (24)
├── quality/    # 程式品質、審查、除錯、測試 (11)
├── git/        # Git/GitHub 操作 (3)
├── frontend/   # 前端設計、iOS、測試 (5)
├── backend/    # 後端服務 (11)
└── docs/       # 文件處理與 MCP 建置 (6)
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
| `./bin/sk deploy` | Symlink all skills → `~/.claude/skills/` + install plist templates → `~/Library/LaunchAgents/` |
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

## Skills Catalog (73 skills)

### meta/ — Claude Code 管理

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **audit-fix** | 自動 | 分析 `sk audit` 報告，自動清理各專案 permission 白名單（刪 one-off、統一格式、移除全域重複） |
| **ci-pipeline** | 自動 | 偵測專案 stack，自動產生 GitHub Actions CI workflow（lint、test、build）+ pre-commit config |
| **deploy** | 自動 | 推薦部署平台，產生部署配置（Dockerfile、fly.toml、vercel.json）+ CD workflow |
| **dev-process-gate** | 自動 | 開發守門：確保 requirement → flow → wireframe → mockup → dev → QA testing 流程不跳步 |
| **init-project** | 自動 | 專案缺少 CLAUDE.md / AGENTS.md 時自動初始化，偵測框架自動填入 |
| **knowledge-graph** | `/knowledge-graph` | 三層記憶系統：追蹤人物、公司、專案的持久事實，寫入 JSONL + 摘要 |
| **plan-check-style** | 自動 | 進入 plan mode 做前端任務時，自動掃描並套用 style skills |
| **self-improving-agent** | 自動 + hook | 捕捉學習與錯誤修正，記錄至 .learnings/，提升有價值見解到 CLAUDE.md |
| **session-harvest** | `/session-harvest` | 工作告一段落時，自動審查 session 內容，找出可重複使用的模式並建議建立新 skill |
| **setup-permissions** | 自動 | 偵測專案工具鏈，自動設定 permission allowlists，減少手動核准 |
| **skill-creator** | 自動 | 建立、修改、評測 skills，含 eval 和 benchmark 工具 |
| **skill-scout** | `/skill-scout` | 從 GitHub 與社群資源發現、評估、移植 Claude Code skills |
| **sync-readme** | 自動 + hook | Keep README.md sections in sync with code structure across repos |

### workflow/ — 工作流程與規劃

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **agent-observability** | 自動 | 讓 script-based agent 在 sk-dashboard 可見：exec-lib 執行歷史、progress logging、log discovery 三層整合指南 |
| **autoresearch** | `/autoresearch` 或自動 | Autonomous goal-directed iteration loop for Claude Code agents. |
| **candidate-analysis** | `/candidate-analysis` 或自動 | 面試候選人管理：PDF 履歷解析、GitHub repo 程式品質分析、候選人 profile markdown 產出 |
| **claude-to-telegram** | `/claude-to-im setup` | 設定 Telegram 橋接器遠端控制 Claude Code，支援兩種實作方式 |
| **context-recovery** | 自動 + hook | Session 壓縮後自動復原工作上下文，使用 Git 狀態與專案 metadata |
| **crm-projection** | `/crm-projection` | Project nx_client + nx_deal data to local markdown files at materials/clients/. |
| **customer-intel** | `/customer-intel` 或自動 | B2B 客戶情蒐：公司名 → WebSearch + Playwright → 結構化報告（概覽、管理層、財務、競爭、痛點、策略建議） |
| **dispatching-parallel-agents** | 自動 | 3+ 個獨立問題時，派 subagent 並行處理 |
| **executing-plans** | 自動 | 分批執行計畫，每批有 review checkpoint |
| **gdrive-to-skills** | `/gdrive-to-skills` | 讀取 Google Drive 文件，分類並自動建立 knowledge skills |
| **headless-agent** | 自動 | 將 Claude Code 作為非互動式 agent 執行，含排程、結構化日誌、auto-commit/push、QA gate、branch workflow、multi-role agents |
| **investment-research** | `/investment-research` 或自動 | 投資研究流程：總經掃描 → 選股池 → Alpha 發現 → 風險評估 → 回測 → 四大報表 → 報告 |
| **keyword-discovery** | 自動 | 自動分析爬蟲未匹配項目，發現新關鍵字候選詞，高信心詞自動升級至 active 列表 |
| **launchd-agent** | 自動 | 建立、設定、除錯 macOS launchd agents（plist 產生、排程、launchctl 生命週期管理） |
| **material-health** | `/material-health` | Health check for the sales materials library — detects missing frontmatter |
| **mockup** | `/mockup` 或自動 | 三階段 UI mockup（ASCII → 靜態 HTML → 互動 HTML），讀取 design system，支援 Figma 匯出 |
| **planning-with-files** | `/planning-with-files` | Manus 風格的檔案式規劃，用 task_plan.md 追蹤進度，支援 session 恢復 |
| **requirement** | `/requirement` 或自動 | 定義需求：user story、acceptance criteria、scope boundary |
| **sales-material** | `/sales-material` | Assemble client-specific sales presentations by matching customer intelligence |
| **settings-audit** | 自動 | 審查清理 .claude/settings.local.json — 移除無效 permissions、修正 JSON 語法、偵測一次性指令誤存為永久權限 |
| **subsidy-scraper** | `/subsidy-scraper` | Automated government subsidy scraper — fetches grant listings from Taiwan |
| **tender-scraper** | `/tender-scraper` 或自動 | 自動爬取政府標案（g0v API）、data-driven 關鍵字篩選（keywords.yml + 自動發現）、網路韌性（retry/backoff）、歸檔過期、生成索引、dashboard 可觀測性 |
| **user-flow** | `/user-flow` 或自動 | 用 Mermaid 繪製使用者流程圖，含 happy path 與 error branch |
| **writing-plans** | 自動 | 產出 bite-sized 實作計畫，假設工程師零 codebase context |

### quality/ — 程式品質

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **code-reviewer** | `/code-reviewer` | Code review 專注 performance、correctness、maintainability |
| **de-slopify** | 自動 | 移除 AI 生成「廢文」痕跡，讓文本讀起來像人寫的 |
| **destructive-command-guard** | Hook (PreToolUse) | 在執行前攔截危險指令（rm -rf、git reset --hard、force push） |
| **large-file-refactor** | 自動 | Systematically split large single-file components (500+ lines) into modular |
| **post-change-qa** | 自動 | 程式碼修改後自動重啟前後端、跑測試、Playwright 截圖驗證 |
| **protect-secrets** | Hook (PreToolUse) | 攔截讀取/修改 .env、private keys、credentials 等敏感檔案 |
| **qa-auto** | `/qa-auto` | 從 QA 計畫或 diff 自動產生測試程式碼、執行測試、報告覆蓋率缺口 |
| **qa-planner** | `/qa-planner` | 分析程式碼變更產生結構化 QA 計畫：影響分析、測試案例、風險評估 |
| **qa-testing** | 自動 | 跨框架測試指導：pytest / Vitest / Swift Testing 的策略、mock 模式、模板 |
| **security-review** | 自動 | 深度安全審查：OWASP Top 10、input validation、auth、CSRF、XSS |
| **systematic-debugging** | 自動 | 四階段除錯框架：根因調查 → 模式分析 → 假設測試 → 實作修復 |

### git/ — Git/GitHub

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **auto-stage** | Hook (PostToolUse) | 檔案編輯/建立後自動 git add，跳過 .env 和 node_modules |
| **repo-rename** | `/repo-rename` | Repo 改名時全系統審計引用（plist、Claude 設定、腳本、兄弟 repo），產出遷移清單並執行 |
| **review-pr** | `/review-pr` | 用 `gh` CLI 分析 PR diff，結構化 feedback + approve/reject 建議 |

### frontend/ — 前端設計、iOS、測試

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **frontend-design** | 自動 | 設計哲學 — 產出獨特、避免 AI 感的 production-grade UI |
| **ios-integration** | 自動 | iOS 系統整合：App Extensions、Deep Links、Universal Links、App Groups、權限、地圖 |
| **swiftui-patterns** | 自動 | SwiftUI iOS 17+ 架構模式：@Observable、MVVM、strict concurrency、NavigationStack |
| **ui-ux-pro-max** | `/ui-ux-pro-max` 或自動 | UI/UX 資料庫搜尋 — 97 色票、57 字體配對、50+ 風格、25 圖表類型，含 Python CLI |
| **webapp-testing** | 自動 | Playwright 驅動的 web app 測試、截圖、browser log 檢查 |

### backend/ — 後端服務

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **db-migration** | 自動 | 偵測 DB stack，設定 migration 工具（Alembic/Prisma/Drizzle），指導安全 schema 變更 |
| **doc-to-structured-data** | 自動 | 非結構化技術文件（.doc/.pdf 測試計畫、規格書、datasheet）→ 結構化 CSV/JSON，含格式偵測、欄位對映、驗證 |
| **firebase-backend** | 自動 | Firebase 後端設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |
| **imap-smtp-integration** | 自動 | IMAP/SMTP Integration - Integrate email reading and sending via IMAP/SMTP into |
| **markdown-file-ssot** | 自動 | Markdown File SSOT - Use Markdown files with YAML frontmatter as a data SSOT. |
| **oauth-token-vault** | 自動 | OAuth Token Vault - Implement OAuth 2. |
| **sqlite-to-postgres** | 自動 | SQLite → PostgreSQL/Supabase 遷移指南：語法差異、schema 轉換、資料遷移、驗證 |
| **tunnel-proxy-deploy** | 自動 | Deploy FastAPI + Next.js behind Cloudflare Tunnel. |
| **tw-company-lookup** | `/tw-company-lookup` 或自動 | 用 Playwright 查詢經濟部 findbiz.nat.gov.tw：公司基本資料、董監事、工廠、歷史變更 |
| **vector-search-setup** | 自動 | Set up a vector search knowledge base in a FastAPI project from scratch. |
| **web-scraper** | 自動 | Playwright headless 爬蟲 fallback：WebFetch 被擋時用，支援截圖、表單互動、tab 導覽 |

### docs/ — 文件處理與 MCP 建置

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **mcp-builder** | 自動 | 建立 MCP server 的指南（Python FastMCP / Node MCP SDK） |
| **office-docx** | 自動 | Word (.docx) 建立、編輯、分析，支援追蹤修訂與註解 |
| **office-pdf** | 自動 | PDF 操作：文字/表格擷取、建立、合併/分割、表單填寫 |
| **office-pptx** | 自動 | PowerPoint (.pptx) 建立、編輯、分析，支援版面配置與講者備註 |
| **office-xlsx** | 自動 | 試算表 (.xlsx/.csv) 建立、編輯、分析，支援公式與資料視覺化 |
| **telegram-bot** | 自動 | grammY / python-telegram-bot 機器人開發指南：架構、Bot API、部署模式 |


## How Deploy Works

Each skill directory gets symlinked individually into `~/.claude/skills/`. Edits to skill files take effect immediately — re-deploy only when adding new skills.

Deploy also installs `com.*.plist` templates into `~/Library/LaunchAgents/`, replacing `REPO_PATH` with the actual repo path.

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
