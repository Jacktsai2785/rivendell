# Skills 稽核報告 — 2026-03-12

## 摘要

- **總計:** 44 skills（35 repo + 9 local-only）
- **待處理:** 2 issue(s)
- **今日新增:** 9 skills（5 ported from Clawdbot + 2 original + 2 Telegram）
- **Active Hooks:** 3（DCG + self-improving-agent x2）


## 結構健康度

- Symlinks: OK
- 部署: OK (全部 35 個已部署)
- Frontmatter: OK

## Skill 生命週期

| 階段 | 數量 | 說明 |
|-------|-------|---------|
| 🆕 新建 | 5 | 已建立但尚未 commit |
| 🔧 開發中 | 23 | 14 天內有多次修訂 |
| ✅ 穩定 | 7 | 正常運作，近期無需修改 |
| ❓ 可能棄用 | 0 | 超過 90 天未更動 |

### 🆕 新建

**backend/**
- db-migration — 尚未 commit

**meta/**
- audit-fix — 尚未 commit
- ci-pipeline — 尚未 commit
- deploy — 尚未 commit

**quality/**
- post-change-qa — 尚未 commit

### 🔧 開發中

**docs/**
- mcp-builder — 3 次修訂, 2天前
- office-docx — 3 次修訂, 2天前
- office-pdf — 3 次修訂, 2天前
- office-pptx — 3 次修訂, 2天前
- office-xlsx — 3 次修訂, 2天前

**frontend/**
- frontend-design — 2 次修訂, 3天前
- ui-ux-pro-max — 3 次修訂, 2天前
- webapp-testing — 3 次修訂, 2天前

**git/**
- review-pr — 3 次修訂, 2天前

**meta/**
- dev-process-gate — 2 次修訂, 2天前
- init-project — 2 次修訂, 3天前
- plan-check-style — 2 次修訂, 3天前
- setup-permissions — 2 次修訂, 2天前
- skill-creator — 2 次修訂, 3天前

**quality/**
- code-reviewer — 3 次修訂, 2天前
- security-review — 3 次修訂, 2天前
- systematic-debugging — 2 次修訂, 3天前

**workflow/**
- dispatching-parallel-agents — 3 次修訂, 2天前
- executing-plans — 3 次修訂, 2天前
- gdrive-to-skills — 2 次修訂, 3天前
- investment-research — 2 次修訂, 2天前
- planning-with-files — 3 次修訂, 2天前
- writing-plans — 3 次修訂, 2天前

<details><summary>✅ 穩定 (7)</summary>

**backend/**
- firebase-backend — 1 次, 4天前

**frontend/**
- ios-integration — 1 次, 4天前
- swiftui-patterns — 1 次, 4天前

**quality/**
- qa-testing — 1 次, 2天前

**workflow/**
- mockup — 1 次, 4天前
- requirement — 1 次, 4天前
- user-flow — 1 次, 4天前

</details>

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
| **狀態** | ✅ 近期有動 — 4 個 commit（本週）, 55 個（本月） |
| **技術棧** |  Node.js Python |
| **分支** | `main` (1 total) |
| **Git** | 11 dirty |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | OK | **權限** | OK (14 rules) |

<details><summary>近期 commits</summary>

```
6d0eb00 feat: add backtest, strategy, sentiment, pool, and news modules
1efcbd7 feat: add usage tracking system and git-based dev analysis report
b6ab487 feat: set backtest default start date to 2021-01-01
105ab3f feat: add AI stock role descriptions (zh-TW) and fix MACOM/NOVA tickers
c14a1b3 feat: add sector query, geopolitical page, and adaptive momentum strategy
```
</details>

### nexus-ai-company

| | |
|---|---|
| **狀態** | 💤 沉寂 — 0 個 commit（本週）, 5 個（本月） |
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
| **狀態** | 🔥 活躍 — 14 個 commit（本週）, 42 個（本月） |
| **技術棧** |  Node.js Python |
| **分支** | `main` (1 total) |
| **Git** | 2 dirty |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ✅ |
| **Config** | OK | **權限** | OK (10 rules) |

<details><summary>近期 commits</summary>

```
f1ebc98 fix: business card OCR fields lost during followup + materialize role awareness
1970e7b feat(S40): Telegram vision, deal automation, relationship network enhancements
5e09192 feat: responsive desktop layout — 2-col grids and wider containers
9df7150 feat(S39): push dashboard, global search, navigation update
6e2c482 feat(S38): file upload modal + deal detail integration
```
</details>

### TailTrack

| | |
|---|---|
| **狀態** | 🔥 活躍 — 9 個 commit（本週）, 29 個（本月） |
| **技術棧** |  Node.js Xcode |
| **分支** | `main` (1 total) |
| **Git** | 22 dirty, 6 unpushed |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | OK | **權限** | OK (2 rules) |

<details><summary>近期 commits</summary>

```
c7d2f76 feat: add Smart Search with Google Places + business hours check
fa6d1dc fix: use text-based matching for onboarding UI tests
126bea3 test: update UI tests for 2-tab MVP and single-screen onboarding
d452c9f refactor: simplify onboarding, remove ProfileView, drop scheduledDate
28efff4 refactor: strip to 2-tab MVP (Map + Settings)
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
| **Config** | **missing** | **權限** | **missing** |

**2 個專案問題待處理。**
## Agent 健康狀態

| 專案 | Agent | 排程 | 狀態 | 最近 Exit |
|---------|-------|----------|--------|-----------|
| news_stock | research-agent | weekdays 7:30 | ● loaded | 0 |
| news_stock | research-agent-weekly | weekly 10:00 | ● loaded | 0 |

所有 agent 健康。

## Token 用量

### 7 日趨勢

~~~mermaid
xychart-beta
    title "每日花費（USD）"
    x-axis ["03-06", "03-07", "03-08", "03-09", "03-10", "03-11", "03-12"]
    y-axis "USD" 0 --> 700
    bar [41, 0, 306, 362, 195, 622, 0]
~~~

| 日期 | Sessions | API 呼叫 | Tokens | 預估花費 |
|------|----------|-----------|--------|-----------|
| 2026-03-06 (Fri) | 4 | 230 | 14.6M | $40.55 |
| 2026-03-07 (Sat) | 0 | 0 | 0 | $0.00 |
| 2026-03-08 (Sun) | 6 | 1,240 | 117.8M | $306.28 |
| 2026-03-09 (Mon) | 12 | 1,649 | 143.1M | $362.21 |
| 2026-03-10 (Tue) | 15 | 1,019 | 68.8M | $194.65 |
| 2026-03-11 (Wed) | 19 | 2,952 | 260.1M | $621.60 |
| 2026-03-12 (Thu) | 0 | 0 | 0 | $0.00 |
| **Total** | | | **604.5M** | **$1525.30** |

### 各專案花費（7 日）

| 專案 | API 呼叫 | Tokens | 預估花費 |
|---------|-----------|--------|-----------|
| sales-assistant | 3,256 | 277.2M | $668.98 |
| TailTrack | 1,561 | 142.2M | $349.54 |
| skills-test | 1,368 | 114.1M | $281.46 |
| -Users-manibari-Documents-Chimes-AI-richwave | 349 | 27.9M | $85.36 |
| news-stock | 300 | 24.6M | $79.96 |
| -Users-manibari-Documents-Projects | 256 | 18.5M | $60.00 |

_計價: Opus input $15/M, output $75/M, cache create $18.75/M, cache read $1.50/M_


---

## 附錄：Local-Only Skills（未納入 skills-test repo）

今日從 Clawdbot 生態系移植及原創的 9 個 skills，目前僅存在於 `~/.claude/skills/`，尚未納入 skills-test repo 管理。

### Active Hooks

| Event | Matcher | Script | Skill |
|-------|---------|--------|-------|
| PreToolUse | Bash | `~/.claude/skills/destructive-command-guard/scripts/dcg-hook.sh` | destructive-command-guard |
| UserPromptSubmit | * | `~/.claude/skills/self-improving-agent/scripts/activator.sh` | self-improving-agent |
| PostToolUse | Bash | `~/.claude/skills/self-improving-agent/scripts/error-detector.sh` | self-improving-agent |

### 新增 Skills 清單

| Skill | Lines | Tags | 來源 | 說明 |
|-------|-------|------|------|------|
| self-improving-agent | 437 | meta, quality, learning | jdrhyne/agent-skills | 持續學習 + hooks，記錄錯誤/修正/最佳實踐到 .learnings/ |
| context-recovery | 252 | workflow, session-management | jdrhyne/agent-skills | Session compaction 後自動恢復上下文 |
| de-slopify | 201 | writing, quality | Dicklesworthstone | 移除 AI 生成的「slop」痕跡（含繁中模式） |
| destructive-command-guard | 199 | safety, hooks | Dicklesworthstone | PreToolUse hook，攔截危險指令（git reset --hard 等） |
| knowledge-graph | 214 | memory, knowledge | jdrhyne/agent-skills | 三層記憶：Entity JSONL + Auto Memory + MEMORY.md |
| skill-scout | 299 | meta, skills, discovery | 原創 | 從 Clawdbot/OpenClaw 生態系搜尋、評估、移植 skills |
| headless-agent | 304 | automation, scheduling | 原創 | Headless agent 模式：排程、structured logging、output 管理 |
| claude-to-telegram | 229 | integration, telegram | 原創 | Telegram bridge 遠端控制 Claude Code |
| telegram-bot | 378 | telegram, bot | 原創 | Telegram bot 開發指南（grammY / python-telegram-bot） |

### 移植紀錄

| Skill | 來源 | 難度 | 主要改動 |
|-------|------|------|----------|
| self-improving-agent | jdrhyne/agent-skills | Medium | 移除 cron，改用 Claude Code hooks |
| context-recovery | jdrhyne/agent-skills | Light | 移除 Discord/Slack/Telegram 平台引用 |
| de-slopify | Dicklesworthstone | Light | 新增繁體中文 slop 模式清單 |
| destructive-command-guard | Dicklesworthstone | Medium | 純 shell 實作（不需 Rust binary），PreToolUse hook |
| knowledge-graph | jdrhyne/agent-skills | Medium | JSONL 檔案系統取代 cron，inline extraction |

### 標籤重疊更新

原有分析加上 local-only skills 後的新增重疊：

- **[meta]** +3: self-improving-agent, skill-scout, headless-agent（skill-scout 與 skill-creator 邊界需注意：scout=搜尋移植，creator=從零建立）
- **[quality]** +1: de-slopify
- **[workflow]** +1: context-recovery
- **[telegram]** 新群組: claude-to-telegram, telegram-bot（邊界清楚：bridge vs 開發指南）

### 待辦

- [ ] 決定是否將 9 個 local-only skills 納入 skills-test repo（`sk import` 或手動搬移）
- [ ] skills-test maintain agent plist 未載入（`com.skills.maintain` 存在但未安裝到 `~/Library/LaunchAgents/`）
- [ ] 監控 3 個 hooks 的 token overhead（activator.sh 每次 prompt 約 +50-100 tokens）

---

*由以下工具產生 `./bin/sk audit` + 手動補充 — 2026-03-12 — 44 skills, 2 issue(s)*
