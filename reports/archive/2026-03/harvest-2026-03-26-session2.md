# Session Harvest Report — 2026-03-26 (Session 2)

## Session 概要
- **日期**: 2026-03-26
- **主要工作**: Rivendell 部署系統 + Dashboard 三項新功能
- **涉及技術**: Bash, Docker Compose, FastAPI, Next.js 16, React 19, TypeScript, launchd
- **Commits**: 7 (d9f08d0..299f17e)
- **變更量**: 22 files, +1,926 lines

## 完成項目

| # | 功能 | Commits | 行數 |
|---|------|---------|------|
| 1 | One-click deploy system (profiles + Docker Compose + sk bootstrap) | d9f08d0 | ~800 |
| 2 | Dashboard: Pending Issues panel | dec4552 | ~260 |
| 3 | Dashboard: Live agent feedback + auto-refresh | 6cb3a73, 6fd671e | ~110 |
| 4 | Dashboard: Skill Harvest board | 299f17e | ~560 |
| 5 | Skills analysis (200+ line skills audit) | research only | — |
| 6 | Deployment solutions research (Dokploy/Coolify/Tilt/Podman) | research only | — |

## 工具使用模式分析

### 重複出現的多步驟工作流

#### 1. Dashboard Feature Pipeline（出現 3 次）
每次加 dashboard 功能都遵循相同 pipeline：
1. **Read existing code** — server.py endpoints + api.ts types + existing pages
2. **Add API endpoint** — FastAPI handler in `server.py`
3. **Add TypeScript types** — interface in `api.ts`
4. **Create component** — React component in `components/`
5. **Create/modify page** — page.tsx in `app/`
6. **Update navigation** — Sidebar.tsx
7. **Build verify** — `npm run build`
8. **Restart API + test** — `pkill uvicorn && start && curl`

本次 session 對 Pending Issues、Agent Feedback、Harvest Board 三個功能完全重複此流程。

#### 2. Markdown Report Parser（出現 2 次）
- `.learnings/ERRORS.md` parsing（Issues API）
- `harvest-*.md` parsing（Harvest API）

兩者都需要：regex-based section splitting → heading classification → field extraction → structured output。

#### 3. Shell Script Pipeline（出現 1 次，但 sk 既有模式）
deploy system 的 `sk bootstrap` 遵循固定流程：
pre-flight → clone → env setup → docker up → skills deploy → agents setup → summary

## Skill 候選清單

### 結論：本批次無 Strong 候選

本 session 的主要工作是 **dashboard feature 開發** 和 **deploy infrastructure 建構**，兩者都是高度專案特定的：
- Dashboard pipeline 緊密耦合 rivendell 的 FastAPI + Next.js 架構
- Deploy system 是 rivendell 自身的功能

### 🟡 Moderate：`markdown-report-parser`

- **用途**: 解析結構化 markdown 報告（`##`/`###` heading 分區、YAML frontmatter、pipe-delimited tables），產出 JSON API
- **觸發時機**: 需要從 markdown 報告中提取結構化資料時（如 harvest reports、audit reports、daily reports）
- **涵蓋步驟**:
  1. Glob 找到報告檔案
  2. Regex split by heading hierarchy
  3. Field extraction（`**Key**: value` patterns、markdown tables）
  4. Edge case handling（多種 heading 格式、中英混雜、emoji markers）
- **分類建議**: `backend`
- **來源**: 本 session 寫了兩個獨立的 markdown parser（Issues 和 Harvest），邏輯高度相似
- **現有相似**: `markdown-file-ssot` 處理的是 YAML frontmatter 的 CRUD，不涵蓋自由格式 markdown parsing
- **風險**: 每種報告格式差異大，泛化可能比針對性 parser 更複雜

### 🔴 Weak：`dashboard-feature-scaffold`

- **用途**: 在 rivendell dashboard 中快速建立新功能（API + types + component + page + nav）
- **原因不建議**: 高度耦合 rivendell 專案架構，且 Claude 已經能從現有 code pattern 中推斷出正確的步驟。做成 skill 的 ROI 低於直接在 CLAUDE.md 中記錄 feature 開發 checklist。

### 🔴 Weak：`docker-compose-profiles`

- **用途**: 設計多專案 Docker Compose 使用 profiles feature
- **原因不建議**: Docker Compose profiles 是標準功能，Claude 本身就有足夠知識。本 session 的實作更多是架構設計決策而非可重複的技術流程。

## 已有 Skills 的表現觀察

| Skill | 使用 | 備註 |
|-------|------|------|
| session-harvest | 1 | 本次執行。報告格式穩定 |
| self-improving-agent | hook | .learnings/LEARNINGS.md 有自動記錄 |

## 建議

1. **無需新增 skill** — 本次主要工作是專案特定的 infrastructure 和 UI 開發
2. **可觀察的模式**：markdown report parser 如果未來再出現第三次，值得提升為 skill
3. **Dashboard 開發 checklist** 可考慮記錄到 `rivendell/.claude/CLAUDE.md` 而非做成 skill
