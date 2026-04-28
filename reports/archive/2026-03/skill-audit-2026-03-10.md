# Skills 稽核報告 — 2026-03-10

## 摘要

- **總計:** 35 skills
- **待處理:** 0 issue(s)


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
- mcp-builder — 3 次修訂, 0天前
- office-docx — 3 次修訂, 0天前
- office-pdf — 3 次修訂, 0天前
- office-pptx — 3 次修訂, 0天前
- office-xlsx — 3 次修訂, 0天前

**frontend/**
- frontend-design — 2 次修訂, 1天前
- ui-ux-pro-max — 3 次修訂, 0天前
- webapp-testing — 3 次修訂, 0天前

**git/**
- review-pr — 3 次修訂, 0天前

**meta/**
- dev-process-gate — 2 次修訂, 0天前
- init-project — 2 次修訂, 1天前
- plan-check-style — 2 次修訂, 1天前
- setup-permissions — 2 次修訂, 0天前
- skill-creator — 2 次修訂, 1天前

**quality/**
- code-reviewer — 3 次修訂, 0天前
- security-review — 3 次修訂, 0天前
- systematic-debugging — 2 次修訂, 1天前

**workflow/**
- dispatching-parallel-agents — 3 次修訂, 0天前
- executing-plans — 3 次修訂, 0天前
- gdrive-to-skills — 2 次修訂, 1天前
- investment-research — 2 次修訂, 0天前
- planning-with-files — 3 次修訂, 0天前
- writing-plans — 3 次修訂, 0天前

<details><summary>✅ 穩定 (7)</summary>

**backend/**
- firebase-backend — 1 次, 2天前

**frontend/**
- ios-integration — 1 次, 2天前
- swiftui-patterns — 1 次, 2天前

**quality/**
- qa-testing — 1 次, 0天前

**workflow/**
- mockup — 1 次, 2天前
- requirement — 1 次, 2天前
- user-flow — 1 次, 2天前

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
| **狀態** | ✅ 近期有動 — 2 個 commit（本週）, 64 個（本月） |
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
| **Git** | 7 dirty |
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
| **狀態** | 💤 沉寂 — 0 個 commit（本週）, 6 個（本月） |
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
| **狀態** | ✅ 近期有動 — 3 個 commit（本週）, 57 個（本月） |
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
| **狀態** | 🔥 活躍 — 12 個 commit（本週）, 40 個（本月） |
| **技術棧** |  Node.js Python |
| **分支** | `main` (1 total) |
| **Git** | 48 dirty |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ✅ |
| **Config** | OK | **權限** | OK (4 rules) |

<details><summary>近期 commits</summary>

```
5e09192 feat: responsive desktop layout — 2-col grids and wider containers
9df7150 feat(S39): push dashboard, global search, navigation update
6e2c482 feat(S38): file upload modal + deal detail integration
e7df855 feat(S37): Calendar UI — month view, day events, meeting creation, prep pack
4c8eab5 feat(S36): Deal CRUD UI — detail, create, MEDDIC, close
```
</details>

### TailTrack

| | |
|---|---|
| **狀態** | 🔥 活躍 — 9 個 commit（本週）, 28 個（本月） |
| **技術棧** |  Node.js Xcode |
| **分支** | `main` (1 total) |
| **Git** | 9 dirty, 5 unpushed |
| **CI/CD** | CI ❌ · 部署 ❌ · Hooks ❌ |
| **Config** | OK | **權限** | OK (2 rules) |

<details><summary>近期 commits</summary>

```
fa6d1dc fix: use text-based matching for onboarding UI tests
126bea3 test: update UI tests for 2-tab MVP and single-screen onboarding
d452c9f refactor: simplify onboarding, remove ProfileView, drop scheduledDate
28efff4 refactor: strip to 2-tab MVP (Map + Settings)
39b0f03 docs: add MVP requirement, user flows, wireframes, and implementation plan
```
</details>

所有專案健康。
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
    x-axis ["03-04", "03-05", "03-06", "03-07", "03-08", "03-09", "03-10"]
    y-axis "USD" 0 --> 450
    bar [91, 354, 41, 0, 306, 362, 176]
~~~

| 日期 | Sessions | API 呼叫 | Tokens | 預估花費 |
|------|----------|-----------|--------|-----------|
| 2026-03-04 (Wed) | 9 | 450 | 34.8M | $90.80 |
| 2026-03-05 (Thu) | 15 | 2,104 | 155.1M | $354.07 |
| 2026-03-06 (Fri) | 4 | 230 | 14.6M | $40.55 |
| 2026-03-07 (Sat) | 0 | 0 | 0 | $0.00 |
| 2026-03-08 (Sun) | 6 | 1,240 | 117.8M | $306.28 |
| 2026-03-09 (Mon) | 12 | 1,649 | 143.1M | $362.21 |
| 2026-03-10 (Tue) | 15 | 937 | 62.7M | $176.31 |
| **Total** | | | **528.2M** | **$1330.22** |

### 各專案花費（7 日）

| 專案 | API 呼叫 | Tokens | 預估花費 |
|---------|-----------|--------|-----------|
| sales-assistant | 2,012 | 168.7M | $424.98 |
| skills-test | 1,906 | 132.0M | $331.02 |
| news-stock | 1,345 | 106.2M | $282.49 |
| TailTrack | 1,268 | 112.2M | $269.02 |
| RTK | 46 | 6.3M | $15.82 |
| Marketing-Pal | 21 | 2.4M | $5.53 |
| -Users-manibari-Documents-Projects | 12 | 245K | $1.37 |

_計價: Opus input $15/M, output $75/M, cache create $18.75/M, cache read $1.50/M_


---

*由以下工具產生 `./bin/sk audit` — 2026-03-10 — 35 skills, 0 issue(s)*
