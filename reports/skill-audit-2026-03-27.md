# Skills 稽核報告 — 2026-03-27

## 摘要

## 結構健康度

- Symlinks: OK
- 部署: OK (全部 70 個已部署)
- Frontmatter: **2 missing tags**
- Frontmatter: **3 missing version**
- 檔案完整性: OK — 所有引用檔案皆存在。

## Skill 生命週期

| 階段 | 數量 | 說明 |
|-------|-------|---------|
| 🆕 新建 | 0 | 已建立但尚未 commit |
| 🔧 開發中 | 8 | 14 天內有多次修訂 |
| ✅ 穩定 | 62 | 正常運作，近期無需修改 |
| ❓ 可能棄用 | 0 | 超過 90 天未更動 |

### 🔧 開發中

**backend/**
- tw-company-lookup — 2 次修訂, 11天前
- web-scraper — 2 次修訂, 3天前

**workflow/**
- customer-intel — 4 次修訂, 11天前
- headless-agent — 6 次修訂, 3天前
- investment-research — 3 次修訂, 12天前
- launchd-agent — 3 次修訂, 3天前
- planning-with-files — 4 次修訂, 13天前
- tender-scraper — 3 次修訂, 3天前

<details><summary>✅ 穩定 (62)</summary>

**backend/**
- db-migration — 1 次, 15天前
- doc-to-structured-data — 1 次, 1天前
- firebase-backend — 1 次, 19天前
- imap-smtp-integration — 1 次, 3天前
- markdown-file-ssot — 1 次, 3天前
- oauth-token-vault — 1 次, 3天前
- sqlite-to-postgres — 1 次, 12天前
- tunnel-proxy-deploy — 1 次, 12天前

**docs/**
- mcp-builder — 3 次, 17天前
- office-docx — 3 次, 17天前
- office-pdf — 3 次, 17天前
- office-pptx — 3 次, 17天前
- office-xlsx — 3 次, 17天前
- telegram-bot — 1 次, 12天前

**frontend/**
- frontend-design — 2 次, 18天前
- ios-integration — 1 次, 19天前
- swiftui-patterns — 1 次, 19天前
- ui-ux-pro-max — 3 次, 17天前
- webapp-testing — 3 次, 17天前

**git/**
- auto-stage — 1 次, 1天前
- repo-rename — 1 次, 1天前
- review-pr — 3 次, 17天前

**meta/**
- audit-fix — 1 次, 15天前
- ci-pipeline — 1 次, 15天前
- deploy — 1 次, 15天前
- dev-process-gate — 3 次, 15天前
- init-project — 2 次, 18天前
- knowledge-graph — 1 次, 12天前
- plan-check-style — 3 次, 15天前
- self-improving-agent — 1 次, 12天前
- session-harvest — 1 次, 12天前
- setup-permissions — 3 次, 15天前
- skill-creator — 2 次, 18天前
- skill-scout — 1 次, 12天前

**quality/**
- code-reviewer — 3 次, 17天前
- de-slopify — 1 次, 12天前
- destructive-command-guard — 1 次, 12天前
- post-change-qa — 1 次, 15天前
- protect-secrets — 1 次, 1天前
- qa-auto — 1 次, 12天前
- qa-planner — 1 次, 12天前
- qa-testing — 1 次, 17天前
- security-review — 3 次, 17天前
- systematic-debugging — 2 次, 18天前

**workflow/**
- agent-observability — 1 次, 2天前
- autoresearch — 1 次, 3天前
- candidate-analysis — 1 次, 1天前
- claude-to-telegram — 1 次, 12天前
- context-recovery — 1 次, 12天前
- crm-projection — 1 次, 11天前
- dispatching-parallel-agents — 3 次, 17天前
- executing-plans — 3 次, 17天前
- gdrive-to-skills — 2 次, 18天前
- keyword-discovery — 1 次, 3天前
- material-health — 1 次, 11天前
- mockup — 1 次, 19天前
- requirement — 1 次, 19天前
- sales-material — 1 次, 11天前
- settings-audit — 1 次, 2天前
- subsidy-scraper — 1 次, 11天前
- user-flow — 1 次, 19天前
- writing-plans — 3 次, 17天前

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

