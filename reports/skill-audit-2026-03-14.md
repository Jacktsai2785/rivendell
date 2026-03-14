# Skills 稽核報告 — 2026-03-14

## 摘要

## 結構健康度

- Symlinks: OK
- 部署: OK (全部 35 個已部署)
- Frontmatter: OK
- 檔案完整性: OK — 所有引用檔案皆存在。

## Skill 生命週期

| 階段 | 數量 | 說明 |
|-------|-------|---------|
| 🆕 新建 | 0 | 已建立但尚未 commit |
| 🔧 開發中 | 23 | 14 天內有多次修訂 |
| ✅ 穩定 | 12 | 正常運作，近期無需修改 |
| ❓ 可能棄用 | 0 | 超過 90 天未更動 |

### 🔧 開發中

**docs/**
- mcp-builder — 3 次修訂, 4天前
- office-docx — 3 次修訂, 4天前
- office-pdf — 3 次修訂, 4天前
- office-pptx — 3 次修訂, 4天前
- office-xlsx — 3 次修訂, 4天前

**frontend/**
- frontend-design — 2 次修訂, 5天前
- ui-ux-pro-max — 3 次修訂, 4天前
- webapp-testing — 3 次修訂, 4天前

**git/**
- review-pr — 3 次修訂, 4天前

**meta/**
- dev-process-gate — 3 次修訂, 2天前
- init-project — 2 次修訂, 5天前
- plan-check-style — 3 次修訂, 2天前
- setup-permissions — 3 次修訂, 2天前
- skill-creator — 2 次修訂, 5天前

**quality/**
- code-reviewer — 3 次修訂, 4天前
- security-review — 3 次修訂, 4天前
- systematic-debugging — 2 次修訂, 5天前

**workflow/**
- dispatching-parallel-agents — 3 次修訂, 4天前
- executing-plans — 3 次修訂, 4天前
- gdrive-to-skills — 2 次修訂, 5天前
- investment-research — 2 次修訂, 4天前
- planning-with-files — 3 次修訂, 4天前
- writing-plans — 3 次修訂, 4天前

<details><summary>✅ 穩定 (12)</summary>

**backend/**
- db-migration — 1 次, 2天前
- firebase-backend — 1 次, 6天前

**frontend/**
- ios-integration — 1 次, 6天前
- swiftui-patterns — 1 次, 6天前

**meta/**
- audit-fix — 1 次, 2天前
- ci-pipeline — 1 次, 2天前
- deploy — 1 次, 2天前

**quality/**
- post-change-qa — 1 次, 2天前
- qa-testing — 1 次, 4天前

**workflow/**
- mockup — 1 次, 6天前
- requirement — 1 次, 6天前
- user-flow — 1 次, 6天前

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

## 描述品質

所有描述皆正常。
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
| **Config** | OK | **權限** | OK (3 rules) |

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
| **狀態** | ✅ 近期有動 — 1 個 commit（本週）, 44 個（本月） |
| **技術棧** |  Python |
| **分支** | `main` (1 total) |
| **Git** | clean |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | OK | **權限** | OK (2 rules) |

<details><summary>近期 commits</summary>

```
caac18e feat: add camping groceries list, wednesday meals, and projects data
a2765e1 refactor: switch email monitor from MS Graph to Gmail API
59f8aaf feat: add email monitor — auto-fetch M365 inbox, classify, and notify
a07a319 feat: add Projects page with persistent conversations and context
32ac944 fix: split context — raw text for classification, history for drafting
```
</details>

### news_stock

| | |
|---|---|
| **狀態** | ✅ 近期有動 — 2 個 commit（本週）, 56 個（本月） |
| **技術棧** |  Node.js Python |
| **分支** | `main` (1 total) |
| **Git** | 20 dirty, 1 unpushed |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | OK | **權限** | OK (14 rules) |

<details><summary>近期 commits</summary>

```
cd686b2 docs: daily portfolio health report 2026-03-12
6d0eb00 feat: add backtest, strategy, sentiment, pool, and news modules
1efcbd7 feat: add usage tracking system and git-based dev analysis report
b6ab487 feat: set backtest default start date to 2021-01-01
105ab3f feat: add AI stock role descriptions (zh-TW) and fix MACOM/NOVA tickers
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

### RTK

| | |
|---|---|
| **狀態** | ✅ 近期有動 — 1 個 commit（本週）, 57 個（本月） |
| **技術棧** |  Node.js |
| **分支** | `main` (1 total) |
| **Git** | clean |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | OK | **權限** | OK (1 rules) |

<details><summary>近期 commits</summary>

```
4d1cbb4 fix: update StrategicMap component
c709193 balance: raise capturedCityLoyalty and lower foreignDecayPerTick
687b4c0 fix: add capturedAtTick.clear() to reset()
3579114 feat: monthly calendar system (1 tick = 1 month) and loyalty decay fix
47da1f8 feat: add rebellion cooldown and raise capturedCityLoyalty
```
</details>

### sales-assistant

| | |
|---|---|
| **狀態** | 🔥 活躍 — 20 個 commit（本週）, 30 個（本月） |
| **技術棧** |  Node.js Python |
| **分支** | `main` (1 total) |
| **Git** | 8 dirty |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ✅ |
| **Config** | OK | **權限** | OK (16 rules) |

<details><summary>近期 commits</summary>

```
262d4b7 feat: intel summary, chat history, MEDDIC auto-fill, capture UX improvements
26d161b fix: deal-intel unlink 404 and Gantt intel id/date mismatch
e3c1512 fix: handle list-type contact_name in materialize
b992241 feat: auto-enrich intel chat with existing DB entities
4b424e1 feat: conversational intel capture on web — chat-style Q&A
```
</details>

