# Skills 稽核報告 — 2026-03-26

## 摘要

- **總計:** 70 skills
- **待處理:** 17 issue(s)


## 結構健康度

- Symlinks: OK
- 部署: OK (全部 70 個已部署)
- Frontmatter: **2 missing tags**
- Frontmatter: **3 missing version**
- 檔案完整性: OK — 所有引用檔案皆存在。

## Skill 生命週期

| 階段 | 數量 | 說明 |
|-------|-------|---------|
| 🆕 新建 | 2 | 已建立但尚未 commit |
| 🔧 開發中 | 11 | 14 天內有多次修訂 |
| ✅ 穩定 | 57 | 正常運作，近期無需修改 |
| ❓ 可能棄用 | 0 | 超過 90 天未更動 |

### 🆕 新建

**git/**
- auto-stage — 尚未 commit

**quality/**
- protect-secrets — 尚未 commit

### 🔧 開發中

**backend/**
- tw-company-lookup — 2 次修訂, 10天前
- web-scraper — 2 次修訂, 2天前

**meta/**
- dev-process-gate — 3 次修訂, 14天前
- plan-check-style — 3 次修訂, 14天前
- setup-permissions — 3 次修訂, 14天前

**workflow/**
- customer-intel — 4 次修訂, 10天前
- headless-agent — 6 次修訂, 2天前
- investment-research — 3 次修訂, 11天前
- launchd-agent — 3 次修訂, 2天前
- planning-with-files — 4 次修訂, 12天前
- tender-scraper — 3 次修訂, 2天前

<details><summary>✅ 穩定 (57)</summary>

**backend/**
- db-migration — 1 次, 14天前
- doc-to-structured-data — 1 次, 0天前
- firebase-backend — 1 次, 18天前
- imap-smtp-integration — 1 次, 2天前
- markdown-file-ssot — 1 次, 2天前
- oauth-token-vault — 1 次, 2天前
- sqlite-to-postgres — 1 次, 11天前
- tunnel-proxy-deploy — 1 次, 11天前

**docs/**
- mcp-builder — 3 次, 16天前
- office-docx — 3 次, 16天前
- office-pdf — 3 次, 16天前
- office-pptx — 3 次, 16天前
- office-xlsx — 3 次, 16天前
- telegram-bot — 1 次, 11天前

**frontend/**
- frontend-design — 2 次, 17天前
- ios-integration — 1 次, 18天前
- swiftui-patterns — 1 次, 18天前
- ui-ux-pro-max — 3 次, 16天前
- webapp-testing — 3 次, 16天前

**git/**
- repo-rename — 1 次, 0天前
- review-pr — 3 次, 16天前

**meta/**
- audit-fix — 1 次, 14天前
- ci-pipeline — 1 次, 14天前
- deploy — 1 次, 14天前
- init-project — 2 次, 17天前
- knowledge-graph — 1 次, 11天前
- self-improving-agent — 1 次, 11天前
- session-harvest — 1 次, 11天前
- skill-creator — 2 次, 17天前
- skill-scout — 1 次, 11天前

**quality/**
- code-reviewer — 3 次, 16天前
- de-slopify — 1 次, 11天前
- destructive-command-guard — 1 次, 11天前
- post-change-qa — 1 次, 14天前
- qa-auto — 1 次, 11天前
- qa-planner — 1 次, 11天前
- qa-testing — 1 次, 16天前
- security-review — 3 次, 16天前
- systematic-debugging — 2 次, 17天前

**workflow/**
- agent-observability — 1 次, 1天前
- autoresearch — 1 次, 2天前
- candidate-analysis — 1 次, 0天前
- claude-to-telegram — 1 次, 11天前
- context-recovery — 1 次, 11天前
- crm-projection — 1 次, 10天前
- dispatching-parallel-agents — 3 次, 16天前
- executing-plans — 3 次, 16天前
- gdrive-to-skills — 2 次, 17天前
- keyword-discovery — 1 次, 2天前
- material-health — 1 次, 10天前
- mockup — 1 次, 18天前
- requirement — 1 次, 18天前
- sales-material — 1 次, 10天前
- settings-audit — 1 次, 1天前
- subsidy-scraper — 1 次, 10天前
- user-flow — 1 次, 18天前
- writing-plans — 3 次, 16天前

</details>

## 全部 Skills 功能一覽

### 基礎建設

| Skill | 功能 |
|-------|------|
| audit-fix | 分析 sk audit 報告，自動修復專案權限問題 |
| ci-pipeline | 偵測專案技術棧，自動產生 GitHub Actions CI 工作流 |
| deploy | 推薦部署平台，產生 Dockerfile / fly.toml / vercel.json 等配置 |
| dev-process-gate | 攔截跳過設計直接寫 code 的行為，引導走完整開發流程 |
| headless-agent | Headless agent 模式範本：排程、structured logging、output 管理 |
| init-project | 初始化 AGENTS.md + .claude/CLAUDE.md 專案配置 |
| plan-check-style | Plan mode 進入 UI 任務時，掃描並載入對應的設計風格 |
| self-improving-agent | 記錄錯誤/修正/最佳實踐到 .learnings/，持續學習改進 |
| setup-permissions | 偵測專案工具鏈，自動配置 settings.local.json 權限白名單 |
| skill-creator | Skill 全生命週期：建立、測試、benchmark、優化觸發描述 |
| skill-scout | 從 Clawdbot/OpenClaw 生態系搜尋、評估、移植 skills |

### 工作流

| Skill | 功能 |
|-------|------|
| context-recovery | Session compaction 後自動恢復上下文（git/檔案/memory） |
| dispatching-parallel-agents | 派遣多個 agent 平行處理 3+ 個獨立問題 |
| executing-plans | 分批執行實作計畫，每批完成後 review checkpoint |
| planning-with-files | Manus 風格檔案式規劃（task_plan.md / findings.md / progress.md） |
| requirement | 定義結構化需求：user story + acceptance criteria + scope |
| user-flow | 設計使用者流程 Mermaid 流程圖（happy path + error branch） |
| writing-plans | 撰寫詳細實作計畫（TDD、2-5 分鐘 task、零背景工程師可執行） |

### 品質

| Skill | 功能 |
|-------|------|
| code-reviewer | 程式碼審查：效能、正確性、可維護性 |
| de-slopify | 移除 AI 生成的 slop 痕跡（含繁中模式：值得注意的是…） |
| destructive-command-guard | PreToolUse hook，攔截 git reset --hard、rm -rf 等危險指令 |
| post-change-qa | 改完 code 後自動重啟 server、跑測試、Playwright 截圖驗證 |
| qa-auto | 根據 QA 計畫自動產生測試程式碼、執行測試、回報覆蓋率缺口 |
| qa-planner | 分析 code diff 產出 QA 計畫：影響範圍、測試案例、風險評估 |
| qa-testing | 跨框架測試撰寫指南：pytest / Vitest / Swift Testing |
| security-review | 全面安全檢查清單：auth、input validation、secrets、API |
| systematic-debugging | 四階段除錯框架：觀察 → 假設 → 驗證 → 修復，禁止跳到答案 |

### 前端

| Skill | 功能 |
|-------|------|
| frontend-design | 產生高品質、有設計感的前端 UI，避免 AI 罐頭風格 |
| ios-integration | iOS 系統整合：Share Extension、Deep Link、App Groups、權限、地圖 |
| mockup | 三階段 UI mockup：ASCII → 靜態 HTML → 互動 HTML，可匯出 Figma |
| swiftui-patterns | SwiftUI 架構模式：@Observable、Navigation、iOS 17+ 最佳實踐 |
| ui-ux-pro-max | UI/UX 設計資料庫：50+ 風格、97 色盤、57 字型配對、25 圖表類型 |
| webapp-testing | Playwright 瀏覽器測試：截圖、console log、前端功能驗證 |

### 後端

| Skill | 功能 |
|-------|------|
| db-migration | 設定資料庫 migration 工具，產生 schema 變更的 migration 檔 |
| firebase-backend | Firebase 架構設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |

### 文件

| Skill | 功能 |
|-------|------|
| mcp-builder | MCP Server 開發指南：FastMCP、工具設計、外部 API 整合 |
| office-docx | Word 文件處理：建立（docx-js）、編輯（redlining）、追蹤修訂、批註 |
| office-pdf | PDF 處理：擷取文字/表格、合併拆分、建立、表單填寫、OCR |
| office-pptx | PowerPoint 處理：建立（html2pptx）、投影片設計、講者備註、縮圖 |
| office-xlsx | 試算表處理：公式計算（openpyxl）、財務模型色彩規範、pandas 分析 |

### Git

| Skill | 功能 |
|-------|------|
| review-pr | 分析 PR 變更：正確性、安全性、效能、最佳實踐 |

### 整合

| Skill | 功能 |
|-------|------|
| claude-to-telegram | 設定 Telegram bridge 遠端控制 Claude Code（兩種方案比較） |
| gdrive-to-skills | 讀取 Google Drive 文件（MCP），分類後建立 knowledge skills |
| investment-research | 持續投資組合管理：alpha 發掘、風險管理、回測、財報分析 |
| knowledge-graph | 三層記憶系統：Entity JSONL + Auto Memory + MEMORY.md |
| telegram-bot | Telegram bot 開發指南：grammY (TS) / python-telegram-bot (Python) |

### backend

| Skill | 功能 |
|-------|------|
| doc-to-structured-data | 設定資料庫 migration 工具，產生 schema 變更的 migration 檔 |
| imap-smtp-integration | Firebase 架構設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |
| markdown-file-ssot | Firebase 架構設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |
| oauth-token-vault | Firebase 架構設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |
| sqlite-to-postgres | Firebase 架構設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |
| tunnel-proxy-deploy | Firebase 架構設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |
| tw-company-lookup | Firebase 架構設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |
| web-scraper | Firebase 架構設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |

### git

| Skill | 功能 |
|-------|------|
| auto-stage | Playwright 瀏覽器測試：截圖、console log、前端功能驗證 |
| repo-rename | Playwright 瀏覽器測試：截圖、console log、前端功能驗證 |

### meta

| Skill | 功能 |
|-------|------|
| session-harvest | 記錄錯誤/修正/最佳實踐到 .learnings/，持續學習改進 |

### quality

| Skill | 功能 |
|-------|------|
| protect-secrets | 改完 code 後自動重啟 server、跑測試、Playwright 截圖驗證 |

### workflow

| Skill | 功能 |
|-------|------|
| agent-observability | 四階段除錯框架：觀察 → 假設 → 驗證 → 修復，禁止跳到答案 |
| autoresearch | 四階段除錯框架：觀察 → 假設 → 驗證 → 修復，禁止跳到答案 |
| candidate-analysis | 四階段除錯框架：觀察 → 假設 → 驗證 → 修復，禁止跳到答案 |
| crm-projection | Session compaction 後自動恢復上下文（git/檔案/memory） |
| customer-intel | Session compaction 後自動恢復上下文（git/檔案/memory） |
| keyword-discovery | 持續投資組合管理：alpha 發掘、風險管理、回測、財報分析 |
| launchd-agent | 持續投資組合管理：alpha 發掘、風險管理、回測、財報分析 |
| material-health | 持續投資組合管理：alpha 發掘、風險管理、回測、財報分析 |
| sales-material | 定義結構化需求：user story + acceptance criteria + scope |
| settings-audit | 定義結構化需求：user story + acceptance criteria + scope |
| subsidy-scraper | 定義結構化需求：user story + acceptance criteria + scope |
| tender-scraper | 定義結構化需求：user story + acceptance criteria + scope |

## 描述品質

### 缺少 TRIGGER / DO NOT TRIGGER (4)

- auto-stage
- de-slopify
- destructive-command-guard
- protect-secrets

## 標籤重疊分析

- **[docs]**: office-docx office-pdf office-pptx office-xlsx — 建議檢查邊界是否清楚
- **[meta]**: audit-fix ci-pipeline deploy dev-process-gate init-project plan-check-style setup-permissions skill-creator — 建議檢查邊界是否清楚
- **[quality,testing]**: post-change-qa qa-testing — 建議檢查邊界是否清楚
- **[workflow]**: dispatching-parallel-agents executing-plans planning-with-files requirement user-flow writing-plans — 建議檢查邊界是否清楚

## 專案儀表板

### Marketing-Pal

| | |
|---|---|
| **狀態** | 💤 沉寂 — 0 個 commit（本週）, 19 個（本月） |
| **技術棧** |  Node.js Xcode |
| **分支** | `main` (1 total) |
| **Git** | clean |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | OK | **權限** | OK (12 rules) |

<details><summary>近期 commits</summary>

```
d38d2bb Merge pull request #9 from manibari/feature/v3-line-share-order-link
25807c1 Add Next.js web app MVP: content creation, shop, style management
ab67bef Implement v3: LINE share, order link integration, direct reach optimization
4fdaf1e Merge pull request #8 from manibari/chore/update-claude-md
c0845bc Update CLAUDE.md with v2 P0+P1 feature docs
```
</details>

### MingOS

| | |
|---|---|
| **狀態** | 💤 沉寂 — 0 個 commit（本週）, 1 個（本月） |
| **技術棧** |  Python |
| **分支** | `main` (1 total) |
| **Git** | clean |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | OK | **權限** | OK (10 rules) |

<details><summary>近期 commits</summary>

```
caac18e feat: add camping groceries list, wednesday meals, and projects data
a2765e1 refactor: switch email monitor from MS Graph to Gmail API
59f8aaf feat: add email monitor — auto-fetch M365 inbox, classify, and notify
a07a319 feat: add Projects page with persistent conversations and context
32ac944 fix: split context — raw text for classification, history for drafting
```
</details>

### RTK

| | |
|---|---|
| **狀態** | 💤 沉寂 — 0 個 commit（本週）, 15 個（本月） |
| **技術棧** |  Node.js |
| **分支** | `main` (1 total) |
| **Git** | clean |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | OK | **權限** | OK (8 rules) |

<details><summary>近期 commits</summary>

```
4d1cbb4 fix: update StrategicMap component
c709193 balance: raise capturedCityLoyalty and lower foreignDecayPerTick
687b4c0 fix: add capturedAtTick.clear() to reset()
3579114 feat: monthly calendar system (1 tick = 1 month) and loyalty decay fix
47da1f8 feat: add rebellion cooldown and raise capturedCityLoyalty
```
</details>

### TailTrack

| | |
|---|---|
| **狀態** | 💤 沉寂 — 0 個 commit（本週）, 22 個（本月） |
| **技術棧** |  Node.js Xcode |
| **分支** | `main` (1 total) |
| **Git** | clean |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | OK | **權限** | OK (11 rules) |

<details><summary>近期 commits</summary>

```
4e50252 feat: tutorial system, expanded preview data, fullscreen map mockup
c7d2f76 feat: add Smart Search with Google Places + business hours check
fa6d1dc fix: use text-based matching for onboarding UI tests
126bea3 test: update UI tests for 2-tab MVP and single-screen onboarding
d452c9f refactor: simplify onboarding, remove ProfileView, drop scheduledDate
```
</details>

### news_stock

| | |
|---|---|
| **狀態** | 🔥 活躍 — 10 個 commit（本週）, 55 個（本月） |
| **技術棧** |  Docker Node.js Python |
| **分支** | `main` (1 total) |
| **Git** | 4 dirty, 8 unpushed |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | OK | **權限** | OK (25 rules) |

<details><summary>近期 commits</summary>

```
e9e4fa9 feat: Claude API integration for narrative market reports
a707bbe feat: narrative market report with traffic-light tables
07eb8cb feat: MarketPulse auto-switches pre/post/open market report
0cee8eb feat: enhance MarketPulse with today's key info
65a3c94 feat: card click expands inline chart + M2 historical from DGBAS
```
</details>

### nexus-ai-company

| | |
|---|---|
| **狀態** | 💤 沉寂 — 0 個 commit（本週）, 1 個（本月） |
| **技術棧** |  Node.js |
| **分支** | `main` (1 total) |
| **Git** | 1 dirty |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | no AGENTS.md | **權限** | OK (1 rules) |

<details><summary>近期 commits</summary>

```
7ea2083 feat(intake): Wire up LLM calls for intent, entity extraction, and summary
c5c9b55 feat(governance): Output Governance — Draft 治理 + Agent 結果回收 (#16)
dd7e6ed feat(orchestrator): Execution Plan 生成 + Routing Governance (#15)
8fd1b65 feat(task): Task Lifecycle 狀態機 + DB Model + API 端點 (#14)
3c9772a feat(ws): WebSocket 即時推播 Agent 狀態 + Activity Log (#12)
```
</details>

### sales-assistant

| | |
|---|---|
| **狀態** | 🔥 活躍 — 28 個 commit（本週）, 101 個（本月） |
| **技術棧** |  Docker Node.js Python |
| **分支** | `main` (2 total) |
| **Git** | 363 dirty |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ✅ |
| **Config** | OK | **權限** | OK (32 rules) |

<details><summary>近期 commits</summary>

```
8136aaf feat: subsidy archive/multi-client + tender tabs + batch client rename & deal import
84efa2c fix: slash commands now take priority over active session followup
2e28f27 feat: proactive data collection — always ask for the next missing field
2414d2b feat: add conversation memory for cross-turn context and pronoun resolution
77a7166 fix: improve router prompt disambiguation for visit vs meeting and query vs capture
```
</details>

### workspace

| | |
|---|---|
| **狀態** | ⏸️ 暫停 — 0 個 commit（本週）, 0 個（本月） |
| **技術棧** |  Node.js |
| **分支** | `` (0 total) |
| **Git** | no git |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | **missing** | **權限** | OK (5 rules) |

**1 個專案問題待處理。**
## Agent 健康狀態

| 專案 | Agent | 排程 | 狀態 | 最近 Exit |
|---------|-------|----------|--------|-----------|
| news_stock | research-agent | daily 7:30 | ● loaded | 0 |
| news_stock | research-agent-weekly | weekly 10:00 | ● loaded | 0 |
| news_stock | maintainer | daily 4:00 | ○ unloaded | — |
| news_stock | tester | daily 5:00 | ○ unloaded | — |
| news_stock | developer | weekly 3:00 | ○ unloaded | — |
| rivendell | maintain | daily 22:00 | ● loaded | 0 |
| rivendell | harvest | interval :00 | ● loaded | 0 |
| rivendell | tester | daily 6:00 | ● loaded | 0 |
| sales-assistant | crm-projection | daily 7:00 | ○ unloaded | — |
| sales-assistant | subsidy-scraper | calendar 8:00 | ○ unloaded | — |
| sales-assistant | material-health | weekly 9:00 | ○ unloaded | — |
| sales-assistant | tender-scraper | daily 8:30 | ○ unloaded | — |

**7 個 agent 問題待處理。**

## Token 用量

### 7 日趨勢

~~~mermaid
xychart-beta
    title "每日花費（USD）"
    x-axis ["03-20", "03-21", "03-22", "03-23", "03-24", "03-25", "03-26"]
    y-axis "USD" 0 --> 550
    bar [0, 0, 0, 0, 456, 277, 483]
~~~

| 日期 | Sessions | API 呼叫 | Tokens | 預估花費 |
|------|----------|-----------|--------|-----------|
| 2026-03-20 (Fri) | 4 | 2 | 0 | $0.00 |
| 2026-03-21 (Sat) | 4 | 2 | 0 | $0.00 |
| 2026-03-22 (Sun) | 6 | 4 | 0 | $0.00 |
| 2026-03-23 (Mon) | 5 | 3 | 0 | $0.00 |
| 2026-03-24 (Tue) | 28 | 1,750 | 211.2M | $455.70 |
| 2026-03-25 (Wed) | 19 | 979 | 95.6M | $276.51 |
| 2026-03-26 (Thu) | 15 | 1,509 | 203.2M | $482.84 |
| **Total** | | | **510.1M** | **$1215.05** |

### 各專案花費（7 日）

| 專案 | API 呼叫 | Tokens | 預估花費 |
|---------|-----------|--------|-----------|
| sales-assistant | 1,443 | 132.3M | $327.28 |
| -Users-manibari-Documents-Projects | 1,090 | 135.1M | $316.80 |
| rivendell | 748 | 140.2M | $291.08 |
| news-stock | 719 | 88.6M | $222.93 |
| resume-pool | 112 | 7.5M | $30.74 |
| news_stock | 15 | 357K | $24.15 |
| curia | 84 | 4.6M | $17.54 |
| -Users-manibari-Documents-Chimes-AI-josun | 33 | 1.2M | $6.28 |
| Family-Fiscal | 20 | 596K | $2.41 |

_計價: Opus input $15/M, output $75/M, cache create $18.75/M, cache read $1.50/M_


---

*由以下工具產生 `./bin/sk audit` — 2026-03-26 — 70 skills, 17 issue(s)*
