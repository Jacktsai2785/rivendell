# Skills 稽核報告 — 2026-03-18

## 摘要

- **總計:** 61 skills
- **待處理:** 15 issue(s)


## 結構健康度

- Symlinks: OK
- 部署: OK (全部 61 個已部署)
- Frontmatter: **2 missing tags**
- Frontmatter: **3 missing version**
- 檔案完整性: OK — 所有引用檔案皆存在。

## Skill 生命週期

| 階段 | 數量 | 說明 |
|-------|-------|---------|
| 🆕 新建 | 3 | 已建立但尚未 commit |
| 🔧 開發中 | 27 | 14 天內有多次修訂 |
| ✅ 穩定 | 31 | 正常運作，近期無需修改 |
| ❓ 可能棄用 | 0 | 超過 90 天未更動 |

### 🆕 新建

**backend/**
- imap-smtp-integration — 尚未 commit
- markdown-file-ssot — 尚未 commit
- oauth-token-vault — 尚未 commit

### 🔧 開發中

**backend/**
- tw-company-lookup — 2 次修訂, 2天前

**docs/**
- mcp-builder — 3 次修訂, 8天前
- office-docx — 3 次修訂, 8天前
- office-pdf — 3 次修訂, 8天前
- office-pptx — 3 次修訂, 8天前
- office-xlsx — 3 次修訂, 8天前

**frontend/**
- frontend-design — 2 次修訂, 9天前
- ui-ux-pro-max — 3 次修訂, 8天前
- webapp-testing — 3 次修訂, 8天前

**git/**
- review-pr — 3 次修訂, 8天前

**meta/**
- dev-process-gate — 3 次修訂, 6天前
- init-project — 2 次修訂, 9天前
- plan-check-style — 3 次修訂, 6天前
- setup-permissions — 3 次修訂, 6天前
- skill-creator — 2 次修訂, 9天前

**quality/**
- code-reviewer — 3 次修訂, 8天前
- security-review — 3 次修訂, 8天前
- systematic-debugging — 2 次修訂, 9天前

**workflow/**
- customer-intel — 4 次修訂, 2天前
- dispatching-parallel-agents — 3 次修訂, 8天前
- executing-plans — 3 次修訂, 8天前
- gdrive-to-skills — 2 次修訂, 9天前
- headless-agent — 3 次修訂, 0天前
- investment-research — 3 次修訂, 3天前
- planning-with-files — 4 次修訂, 4天前
- tender-scraper — 2 次修訂, 0天前
- writing-plans — 3 次修訂, 8天前

<details><summary>✅ 穩定 (31)</summary>

**backend/**
- db-migration — 1 次, 6天前
- firebase-backend — 1 次, 10天前
- sqlite-to-postgres — 1 次, 3天前
- tunnel-proxy-deploy — 1 次, 3天前
- web-scraper — 1 次, 2天前

**docs/**
- telegram-bot — 1 次, 3天前

**frontend/**
- ios-integration — 1 次, 10天前
- swiftui-patterns — 1 次, 10天前

**meta/**
- audit-fix — 1 次, 6天前
- ci-pipeline — 1 次, 6天前
- deploy — 1 次, 6天前
- knowledge-graph — 1 次, 3天前
- self-improving-agent — 1 次, 3天前
- session-harvest — 1 次, 3天前
- skill-scout — 1 次, 3天前

**quality/**
- de-slopify — 1 次, 3天前
- destructive-command-guard — 1 次, 3天前
- post-change-qa — 1 次, 6天前
- qa-auto — 1 次, 3天前
- qa-planner — 1 次, 3天前
- qa-testing — 1 次, 8天前

**workflow/**
- claude-to-telegram — 1 次, 3天前
- context-recovery — 1 次, 3天前
- crm-projection — 1 次, 2天前
- launchd-agent — 1 次, 3天前
- material-health — 1 次, 2天前
- mockup — 1 次, 10天前
- requirement — 1 次, 10天前
- sales-material — 1 次, 2天前
- subsidy-scraper — 1 次, 2天前
- user-flow — 1 次, 10天前

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
| imap-smtp-integration | Firebase 架構設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |
| markdown-file-ssot | Firebase 架構設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |
| oauth-token-vault | Firebase 架構設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |
| sqlite-to-postgres | Firebase 架構設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |
| tunnel-proxy-deploy | Firebase 架構設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |
| tw-company-lookup | Firebase 架構設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |
| web-scraper | Firebase 架構設計：Firestore schema、Security Rules、Cloud Functions v2、FCM 推播 |

### meta

| Skill | 功能 |
|-------|------|
| session-harvest | 記錄錯誤/修正/最佳實踐到 .learnings/，持續學習改進 |

### workflow

| Skill | 功能 |
|-------|------|
| crm-projection | Session compaction 後自動恢復上下文（git/檔案/memory） |
| customer-intel | Session compaction 後自動恢復上下文（git/檔案/memory） |
| launchd-agent | 持續投資組合管理：alpha 發掘、風險管理、回測、財報分析 |
| material-health | 持續投資組合管理：alpha 發掘、風險管理、回測、財報分析 |
| sales-material | 定義結構化需求：user story + acceptance criteria + scope |
| subsidy-scraper | 定義結構化需求：user story + acceptance criteria + scope |
| tender-scraper | 定義結構化需求：user story + acceptance criteria + scope |

## 描述品質

### 缺少 TRIGGER / DO NOT TRIGGER (2)

- de-slopify
- destructive-command-guard

## 標籤重疊分析

- **[docs]**: office-docx office-pdf office-pptx office-xlsx — 建議檢查邊界是否清楚
- **[meta]**: audit-fix ci-pipeline deploy dev-process-gate init-project plan-check-style setup-permissions skill-creator — 建議檢查邊界是否清楚
- **[quality,testing]**: post-change-qa qa-testing — 建議檢查邊界是否清楚
- **[workflow]**: dispatching-parallel-agents executing-plans planning-with-files requirement user-flow writing-plans — 建議檢查邊界是否清楚

## 專案儀表板

### Marketing-Pal

| | |
|---|---|
| **狀態** | 💤 沉寂 — 0 個 commit（本週）, 64 個（本月） |
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
| **狀態** | 💤 沉寂 — 0 個 commit（本週）, 21 個（本月） |
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
| **狀態** | 💤 沉寂 — 0 個 commit（本週）, 57 個（本月） |
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
| **狀態** | ✅ 近期有動 — 1 個 commit（本週）, 30 個（本月） |
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
| **狀態** | 🔥 活躍 — 25 個 commit（本週）, 80 個（本月） |
| **技術棧** |  Docker Node.js Python |
| **分支** | `main` (1 total) |
| **Git** | 13 dirty |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | OK | **權限** | OK (24 rules) |

<details><summary>近期 commits</summary>

```
e69d0d5 fix: update SK_BIN path from skills-test to rivendell
aa4f52e chore(agent): research-agent-daily run 2026-03-18
ed6e328 chore(agent): research-agent-daily run 2026-03-18
7a7e78d feat: add /research page + MCP server for investment research agent
0e45608 chore(agent): research-agent-daily run 2026-03-17
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
| **狀態** | 🔥 活躍 — 61 個 commit（本週）, 79 個（本月） |
| **技術棧** |  Docker Node.js Python |
| **分支** | `main` (1 total) |
| **Git** | 115 dirty |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ✅ |
| **Config** | OK | **權限** | OK (32 rules) |

<details><summary>近期 commits</summary>

```
e7f13c6 fix(skills): update post-change-qa ports and deploy-info command for sales-assistant
f8b8e9e chore: commit leftover changes from knowledge + sidebar + subsidy work
e2628e7 feat(tenders): full-content scraper, detail page, pcc URL import
4e82f6b feat(knowledge): redesign knowledge management with inbox/library workflow
d102990 fix(tenders): use g0v frontend URL instead of API JSON endpoint
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
    x-axis ["03-12", "03-13", "03-14", "03-15", "03-16", "03-17", "03-18"]
    y-axis "USD" 0 --> 750
    bar [125, 92, 471, 688, 5, 554, 302]
~~~

| 日期 | Sessions | API 呼叫 | Tokens | 預估花費 |
|------|----------|-----------|--------|-----------|
| 2026-03-12 (Thu) | 5 | 483 | 50.9M | $124.57 |
| 2026-03-13 (Fri) | 5 | 377 | 34.8M | $91.71 |
| 2026-03-14 (Sat) | 21 | 2,397 | 192.4M | $471.26 |
| 2026-03-15 (Sun) | 29 | 3,490 | 321.6M | $687.66 |
| 2026-03-16 (Mon) | 2 | 32 | 1.1M | $4.68 |
| 2026-03-17 (Tue) | 25 | 1,847 | 208.4M | $553.98 |
| 2026-03-18 (Wed) | 18 | 1,402 | 103.0M | $302.37 |
| **Total** | | | **912.1M** | **$2236.24** |

### 各專案花費（7 日）

| 專案 | API 呼叫 | Tokens | 預估花費 |
|---------|-----------|--------|-----------|
| sales-assistant | 3,535 | 352.4M | $770.99 |
| -Users-manibari-Documents-Projects | 1,849 | 236.2M | $562.19 |
| skills-test | 2,768 | 191.0M | $479.94 |
| news-stock | 1,063 | 65.9M | $232.87 |
| scraper | 386 | 31.5M | $79.50 |
| -Users-manibari-Documents-Chimes-AI-josun | 264 | 23.9M | $58.87 |
| TailTrack | 42 | 6.3M | $30.12 |
| news_stock | 12 | 288K | $19.57 |
| -Users-manibari-Documents-Chimes-AI-richwave | 43 | 2.6M | $15.13 |
| rivendell | 63 | 1.9M | $4.83 |
| -Users-manibari | 13 | 290K | $1.51 |
| skills-test-dashboard-next-api | 2 | 44K | $0.30 |

_計價: Opus input $15/M, output $75/M, cache create $18.75/M, cache read $1.50/M_


---

*由以下工具產生 `./bin/sk audit` — 2026-03-18 — 61 skills, 15 issue(s)*
