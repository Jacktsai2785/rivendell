# Skills Library

Personal Claude Code skills library — manage, version control, and deploy custom skills.

## Structure

```
skills/
├── meta/       # Claude Code 自身管理工具 (5)
├── workflow/   # 工作流程與規劃 (8)
├── quality/    # 程式品質、審查、除錯 (3)
├── git/        # Git/GitHub 操作 (1)
├── frontend/   # 前端設計、iOS、測試 (5)
├── backend/    # 後端服務 (1)
└── docs/       # 文件處理與 MCP 建置 (5)
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
| `./bin/sk undeploy` | Remove repo symlinks from `~/.claude/skills/` |
| `./bin/sk create <cat/name>` | Scaffold new skill (e.g. `quality/my-linter`) |
| `./bin/sk import <name>` | Import from SkillsMP via `agent-skills-cli` |
| `./bin/sk import-gh <url>` | Clone skill from GitHub URL |
| `./bin/sk list` | Show all skills grouped by category |
| `./bin/sk check [--verbose]` | Health check: symlinks, reviews, gdrive, frontmatter |
| `./bin/sk audit` | Generate audit report → `reports/skill-audit-YYYY-MM-DD.md` |
| `./bin/sk sync` | Show Google Drive import status for re-import |

## Skills Catalog (28 skills)

### meta/ — Claude Code 管理

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **init-project** | 自動 | 專案缺少 CLAUDE.md / AGENTS.md 時自動初始化，偵測框架自動填入 |
| **setup-permissions** | 自動 | 偵測專案工具鏈，自動設定 permission allowlists，減少手動核准 |
| **plan-check-style** | 自動 | 進入 plan mode 做前端任務時，自動掃描並套用 style skills |
| **skill-creator** | 自動 | 建立、修改、評測 skills，含 eval 和 benchmark 工具 |
| **dev-process-gate** | 自動 | 開發守門：確保 requirement → flow → wireframe → mockup → dev 流程不跳步 |

### workflow/ — 工作流程與規劃

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **planning-with-files** | `/planning-with-files` | Manus 風格的檔案式規劃，用 task_plan.md 追蹤進度，支援 session 恢復 |
| **writing-plans** | 自動 | 產出 bite-sized 實作計畫，假設工程師零 codebase context |
| **executing-plans** | 自動 | 分批執行計畫，每批有 review checkpoint |
| **dispatching-parallel-agents** | 自動 | 3+ 個獨立問題時，派 subagent 並行處理 |
| **requirement** | `/requirement` 或自動 | 定義需求：user story、acceptance criteria、scope boundary |
| **user-flow** | `/user-flow` 或自動 | 用 Mermaid 繪製使用者流程圖，含 happy path 與 error branch |
| **mockup** | `/mockup` 或自動 | 三階段 UI mockup（ASCII → 靜態 HTML → 互動 HTML），讀取 design system，支援 Figma 匯出 |
| **gdrive-to-skills** | `/gdrive-to-skills` | 讀取 Google Drive 文件，分類並自動建立 knowledge skills |

### quality/ — 程式品質

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **systematic-debugging** | 自動 | 四階段除錯框架：根因調查 → 模式分析 → 假設測試 → 實作修復 |
| **code-reviewer** | `/code-reviewer` | Code review 專注 performance、correctness、maintainability |
| **security-review** | 自動 | 深度安全審查：OWASP Top 10、input validation、auth、CSRF、XSS |

### git/ — Git/GitHub

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **review-pr** | `/review-pr` | 用 `gh` CLI 分析 PR diff，結構化 feedback + approve/reject 建議 |

### frontend/ — 前端設計、iOS、測試

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **frontend-design** | 自動 | 設計哲學 — 產出獨特、避免 AI 感的 production-grade UI |
| **ui-ux-pro-max** | `/ui-ux-pro-max` 或自動 | UI/UX 資料庫搜尋 — 97 色票、57 字體配對、50+ 風格、25 圖表類型，含 Python CLI |
| **swiftui-patterns** | 自動 | SwiftUI iOS 17+ 架構模式：@Observable、MVVM、strict concurrency、NavigationStack |
| **ios-integration** | 自動 | iOS 系統整合：App Extensions、Deep Links、Universal Links、App Groups、權限、地圖 |
| **webapp-testing** | 自動 | Playwright 驅動的 web app 測試、截圖、browser log 檢查 |

### backend/ — 後端服務

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **firebase-backend** | 自動 | Firebase 後端設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |

### docs/ — 文件處理與 MCP 建置

| Skill | 觸發方式 | 說明 |
|-------|---------|------|
| **mcp-builder** | 自動 | 建立 MCP server 的指南（Python FastMCP / Node MCP SDK） |
| **office-docx** | 自動 | Word (.docx) 建立、編輯、分析，支援追蹤修訂與註解 |
| **office-pdf** | 自動 | PDF 操作：文字/表格擷取、建立、合併/分割、表單填寫 |
| **office-pptx** | 自動 | PowerPoint (.pptx) 建立、編輯、分析，支援版面配置與講者備註 |
| **office-xlsx** | 自動 | 試算表 (.xlsx/.csv) 建立、編輯、分析，支援公式與資料視覺化 |

## How Deploy Works

Each skill directory gets symlinked individually into `~/.claude/skills/`. Edits to skill files take effect immediately — re-deploy only when adding new skills.

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
