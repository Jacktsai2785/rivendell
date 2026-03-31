# Skills 稽核報告 — 2026-03-30

## 摘要

- **總計:** 72 skills
- **待處理:** 21 issue(s)


## 結構健康度

- Symlinks: OK
- 部署: OK (全部 72 個已部署)
- Frontmatter: **2 missing tags**
- Frontmatter: **3 missing version**
- 檔案完整性: OK — 所有引用檔案皆存在。

## Skill 生命週期

| 階段 | 數量 | 說明 |
|-------|-------|---------|
| 🆕 新建 | 0 | 已建立但尚未 commit |
| 🔧 開發中 | 8 | 14 天內有多次修訂 |
| ✅ 穩定 | 64 | 正常運作，近期無需修改 |
| ❓ 可能棄用 | 0 | 超過 90 天未更動 |

### 🔧 開發中

**backend/**
- tw-company-lookup — 2 次修訂, 14天前
- web-scraper — 2 次修訂, 6天前

**meta/**
- self-improving-agent — 2 次修訂, 0天前

**quality/**
- post-change-qa — 2 次修訂, 0天前

**workflow/**
- customer-intel — 4 次修訂, 14天前
- headless-agent — 6 次修訂, 6天前
- launchd-agent — 3 次修訂, 6天前
- tender-scraper — 3 次修訂, 6天前

<details><summary>✅ 穩定 (64)</summary>

**backend/**
- db-migration — 1 次, 18天前
- doc-to-structured-data — 1 次, 4天前
- firebase-backend — 1 次, 22天前
- imap-smtp-integration — 1 次, 6天前
- markdown-file-ssot — 1 次, 6天前
- oauth-token-vault — 1 次, 6天前
- sqlite-to-postgres — 1 次, 15天前
- tunnel-proxy-deploy — 1 次, 15天前
- vector-search-setup — 1 次, 0天前

**docs/**
- mcp-builder — 3 次, 20天前
- office-docx — 3 次, 20天前
- office-pdf — 3 次, 20天前
- office-pptx — 3 次, 20天前
- office-xlsx — 3 次, 20天前
- telegram-bot — 1 次, 15天前

**frontend/**
- frontend-design — 2 次, 21天前
- ios-integration — 1 次, 22天前
- swiftui-patterns — 1 次, 22天前
- ui-ux-pro-max — 3 次, 20天前
- webapp-testing — 3 次, 20天前

**git/**
- auto-stage — 1 次, 4天前
- repo-rename — 1 次, 4天前
- review-pr — 3 次, 20天前

**meta/**
- audit-fix — 1 次, 18天前
- ci-pipeline — 1 次, 18天前
- deploy — 1 次, 18天前
- dev-process-gate — 3 次, 18天前
- init-project — 2 次, 21天前
- knowledge-graph — 1 次, 15天前
- plan-check-style — 3 次, 18天前
- session-harvest — 1 次, 15天前
- setup-permissions — 3 次, 18天前
- skill-creator — 2 次, 21天前
- skill-scout — 1 次, 15天前

**quality/**
- code-reviewer — 3 次, 20天前
- de-slopify — 1 次, 15天前
- destructive-command-guard — 1 次, 15天前
- large-file-refactor — 1 次, 0天前
- protect-secrets — 1 次, 4天前
- qa-auto — 1 次, 15天前
- qa-planner — 1 次, 15天前
- qa-testing — 1 次, 20天前
- security-review — 3 次, 20天前
- systematic-debugging — 2 次, 21天前

**workflow/**
- agent-observability — 1 次, 5天前
- autoresearch — 1 次, 6天前
- candidate-analysis — 1 次, 4天前
- claude-to-telegram — 1 次, 15天前
- context-recovery — 1 次, 15天前
- crm-projection — 1 次, 14天前
- dispatching-parallel-agents — 3 次, 20天前
- executing-plans — 3 次, 20天前
- gdrive-to-skills — 2 次, 21天前
- investment-research — 3 次, 15天前
- keyword-discovery — 1 次, 6天前
- material-health — 1 次, 14天前
- mockup — 1 次, 22天前
- planning-with-files — 4 次, 16天前
- requirement — 1 次, 22天前
- sales-material — 1 次, 14天前
- settings-audit — 1 次, 5天前
- subsidy-scraper — 1 次, 14天前
- user-flow — 1 次, 22天前
- writing-plans — 3 次, 20天前

</details>

## 全部 Skills 功能一覽

### 基礎建設

| Skill | 功能 |
|-------|------|
| agent-observability | Agent 可觀測性：exec-lib 整合、執行歷史、即時 log 串流、timeline 事件 |
| audit-fix | 分析 sk audit 報告，自動修復專案權限問題 |
| ci-pipeline | 偵測專案技術棧，自動產生 GitHub Actions CI 工作流 |
| deploy | 推薦部署平台，產生 Dockerfile / fly.toml / vercel.json 等配置 |
| dev-process-gate | 攔截跳過設計直接寫 code 的行為，引導走完整開發流程 |
| headless-agent | Headless agent 模式範本：排程、structured logging、output 管理 |
| init-project | 初始化 AGENTS.md + .claude/CLAUDE.md 專案配置 |
| launchd-agent | macOS launchd 排程管理：plist 產生、StartCalendarInterval、launchctl 生命週期 |
| plan-check-style | Plan mode 進入 UI 任務時，掃描並載入對應的設計風格 |
| repo-rename | Git repo 改名：系統性掃描所有跨位置引用，產生遷移 checklist |
| self-improving-agent | 記錄錯誤/修正/最佳實踐到 .learnings/，持續學習改進 |
| session-harvest | Session 結束時回顧工作，萃取可復用的 skill 候選 |
| settings-audit | 審計 settings.local.json：移除無效權限、修正 JSON 語法、驗證格式 |
| setup-permissions | 偵測專案工具鏈，自動配置 settings.local.json 權限白名單 |
| skill-creator | Skill 全生命週期：建立、測試、benchmark、優化觸發描述 |
| skill-scout | 從 Clawdbot/OpenClaw 生態系搜尋、評估、移植 skills |
| tunnel-proxy-deploy | FastAPI + Next.js 經 Cloudflare Tunnel 部署：反向代理、CORS、port mapping |

### 工作流

| Skill | 功能 |
|-------|------|
| autoresearch | 自主迭代迴圈：定義目標 + 指標 + 驗證指令，agent 自動 modify → verify → keep/discard |
| context-recovery | Session compaction 後自動恢復上下文（git/檔案/memory） |
| dispatching-parallel-agents | 派遣多個 agent 平行處理 3+ 個獨立問題 |
| executing-plans | 分批執行實作計畫，每批完成後 review checkpoint |
| keyword-discovery | 自動關鍵字探索：分析未匹配項目、寫入候選 YAML、高信心自動晉升 |
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
| doc-to-structured-data | 非結構化文件轉結構化 CSV/JSON：格式偵測、欄位辨識、多表輸出 |
| post-change-qa | 改完 code 後自動重啟 server、跑測試、Playwright 截圖驗證 |
| protect-secrets | PreToolUse hook，阻擋讀寫 .env、私鑰、credentials 等機密檔案 |
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
| imap-smtp-integration | IMAP/SMTP 郵件整合：FastAPI 收發信、Gmail 備援方案 |
| markdown-file-ssot | Markdown + YAML frontmatter 作為半結構化資料 SSOT |
| oauth-token-vault | OAuth 2.0 flow + Fernet 加密 token 儲存（FastAPI + PostgreSQL） |
| sqlite-to-postgres | SQLite → PostgreSQL 遷移指南：語法差異、schema 轉換、連線層更新 |

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
| auto-stage | PostToolUse hook，Claude 編輯/寫入檔案後自動 git stage |
| review-pr | 分析 PR 變更：正確性、安全性、效能、最佳實踐 |

### 整合

| Skill | 功能 |
|-------|------|
| claude-to-telegram | 設定 Telegram bridge 遠端控制 Claude Code（兩種方案比較） |
| gdrive-to-skills | 讀取 Google Drive 文件（MCP），分類後建立 knowledge skills |
| investment-research | 持續投資組合管理：alpha 發掘、風險管理、回測、財報分析 |
| knowledge-graph | 三層記憶系統：Entity JSONL + Auto Memory + MEMORY.md |
| telegram-bot | Telegram bot 開發指南：grammY (TS) / python-telegram-bot (Python) |
| tw-company-lookup | 台灣公司登記查詢：findbiz.nat.gov.tw 基本資料、董監事、變更紀錄 |
| web-scraper | Playwright 網頁爬蟲：反爬繞過、JS 渲染頁面、表單互動 |

### backend

| Skill | 功能 |
|-------|------|
| vector-search-setup | 台灣公司登記查詢：findbiz.nat.gov.tw 基本資料、董監事、變更紀錄 |

### quality

| Skill | 功能 |
|-------|------|
| large-file-refactor | PreToolUse hook，攔截 git reset --hard、rm -rf 等危險指令 |

### 人資

| Skill | 功能 |
|-------|------|
| candidate-analysis | 面試候選人管理：PDF 履歷結構化、GitHub 程式碼品質分析、候選人檔案產生 |

### 商業

| Skill | 功能 |
|-------|------|
| crm-projection | CRM 客戶索引：nx_client + nx_deal 投射至本地 markdown |
| customer-intel | B2B 客戶情蒐：公司概覽、領導層、財務、競爭者、痛點、銷售策略 |
| material-health | 銷售素材庫健康檢查：frontmatter 缺漏、過期補助、陳舊資訊偵測 |
| sales-material | 客製化銷售簡報：匹配情蒐、案例、方案、補助，產生 PPTX |
| subsidy-scraper | 政府補助爬蟲：自動擷取補助公告、去重、歸檔、產生 INDEX.md |
| tender-scraper | 政府標案爬蟲：g0v API 擷取、關鍵字過濾、自動探索、dashboard 可觀測 |

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

### Family-Fiscal

| | |
|---|---|
| **狀態** | 🔥 活躍 — 17 個 commit（本週）, 17 個（本月） |
| **技術棧** |  Node.js |
| **分支** | `main` (1 total) |
| **Git** | 5 dirty |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | no CLAUDE.md | **權限** | **missing** |

<details><summary>近期 commits</summary>

```
9334b33 docs(agents): add mandatory development workflow gate to AGENTS.md
b4ccc52 docs: add README
6fab1a6 Fix 401 redirect to use correct basePath in production
d332398 Add bank account filter to transaction list
8303ef5 Add mobile bottom nav and admin link to nav; normalize account labels in DB
```
</details>

### Marketing-Pal

| | |
|---|---|
| **狀態** | 💤 沉寂 — 0 個 commit（本週）, 6 個（本月） |
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
| **狀態** | 💤 沉寂 — 0 個 commit（本週）, 13 個（本月） |
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
| **狀態** | 💤 沉寂 — 0 個 commit（本週）, 15 個（本月） |
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

### curia

| | |
|---|---|
| **狀態** | ✅ 近期有動 — 4 個 commit（本週）, 4 個（本月） |
| **技術棧** |  Node.js |
| **分支** | `main` (1 total) |
| **Git** | 1 dirty |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | OK | **權限** | OK (8 rules) |

<details><summary>近期 commits</summary>

```
7529255 feat: Phase 3 — company research, editable proposals, clients API
d98b744 feat: Phase 2 — Azure OpenAI scoring + proposal generation
dbd5915 chore: add learnings log for Upwork RSS deprecation
1807900 feat: Curia project skeleton + RSS fetch pipeline + dashboard UI
```
</details>

### news_stock

| | |
|---|---|
| **狀態** | 🔥 活躍 — 14 個 commit（本週）, 48 個（本月） |
| **技術棧** |  Docker Node.js Python |
| **分支** | `main` (1 total) |
| **Git** | 12 dirty |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | OK | **權限** | OK (25 rules) |

<details><summary>近期 commits</summary>

```
7246400 chore(agent): research-agent-daily run 2026-03-30
b60a58b fix: market report differentiates US vs TW content
2d51cee feat: switch narrative service to Azure OpenAI (GPT-4)
b422976 chore(agent): research-agent-daily run 2026-03-27
e9e4fa9 feat: Claude API integration for narrative market reports
```
</details>

### nexus-ai-company

| | |
|---|---|
| **狀態** | ⏸️ 暫停 — 0 個 commit（本週）, 0 個（本月） |
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
| **狀態** | 🔥 活躍 — 32 個 commit（本週）, 105 個（本月） |
| **技術棧** |  Docker Node.js Python |
| **分支** | `main` (2 total) |
| **Git** | 718 dirty |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ✅ |
| **Config** | OK | **權限** | OK (32 rules) |

<details><summary>近期 commits</summary>

```
10daeee Add official links and contact info to smart machinery subsidy (115年度)
48f51fb kickoff: S40 Graph Agentic — knowledge graph + embedding + agent
2b109d3 refactor: modularize deal pages + add client market field & heatmap
4a7d027 feat: industry reclassification, pin/sort, partner delete, intel prompt fix
8136aaf feat: subsidy archive/multi-client + tender tabs + batch client rename & deal import
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

**2 個專案問題待處理。**
## Agent 健康狀態

| 專案 | Agent | 排程 | 狀態 | 最近 Exit |
|---------|-------|----------|--------|-----------|
| news_stock | research-agent | daily 7:30 | ● loaded | 0 |
| news_stock | research-agent-weekly | weekly 10:00 | ● loaded | 1 |
| news_stock | maintainer | daily 4:00 | ○ unloaded | — |
| news_stock | tester | daily 5:00 | ○ unloaded | — |
| news_stock | developer | weekly 3:00 | ○ unloaded | — |
| rivendell | maintain | daily 22:00 | ● loaded | 128 |
| rivendell | harvest | interval :00 | ● loaded | 1 |
| rivendell | tester | daily 6:00 | ● loaded | 0 |
| sales-assistant | crm-projection | daily 7:00 | ○ unloaded | — |
| sales-assistant | subsidy-scraper | calendar 8:00 | ○ unloaded | — |
| sales-assistant | material-health | weekly 9:00 | ○ unloaded | — |
| sales-assistant | tender-scraper | daily 8:30 | ○ unloaded | — |

**10 個 agent 問題待處理。**

## Token 用量

### 7 日趨勢

~~~mermaid
xychart-beta
    title "每日花費（USD）"
    x-axis ["03-24", "03-25", "03-26", "03-27", "03-28", "03-29", "03-30"]
    y-axis "USD" 0 --> 650
    bar [456, 277, 591, 228, 31, 12, 532]
~~~

| 日期 | Sessions | API 呼叫 | Tokens | 預估花費 |
|------|----------|-----------|--------|-----------|
| 2026-03-24 (Tue) | 28 | 1,750 | 211.2M | $455.70 |
| 2026-03-25 (Wed) | 19 | 979 | 95.6M | $276.51 |
| 2026-03-26 (Thu) | 19 | 1,885 | 244.1M | $591.15 |
| 2026-03-27 (Fri) | 14 | 768 | 80.4M | $228.48 |
| 2026-03-28 (Sat) | 7 | 78 | 5.9M | $31.49 |
| 2026-03-29 (Sun) | 7 | 70 | 3.1M | $11.97 |
| 2026-03-30 (Mon) | 16 | 2,292 | 211.3M | $532.29 |
| **Total** | | | **851.7M** | **$2127.59** |

### 各專案花費（7 日）

| 專案 | API 呼叫 | Tokens | 預估花費 |
|---------|-----------|--------|-----------|
| -Users-manibari-Documents-Projects | 2,047 | 233.0M | $567.82 |
| sales-assistant | 1,979 | 190.6M | $488.10 |
| news-stock | 1,185 | 126.5M | $339.27 |
| rivendell | 924 | 148.9M | $322.45 |
| Family-Fiscal | 1,207 | 113.4M | $272.41 |
| curia | 334 | 30.7M | $100.34 |
| resume-pool | 112 | 7.5M | $30.74 |
| news_stock | 18 | 427K | $28.53 |
| -Users-manibari-Documents-Chimes-AI-josun | 33 | 1.2M | $6.28 |
| rivendell-dashboard-next-api | 1 | 20K | $0.19 |

_計價: Opus input $15/M, output $75/M, cache create $18.75/M, cache read $1.50/M_


---

*由以下工具產生 `./bin/sk audit` — 2026-03-30 — 72 skills, 21 issue(s)*
