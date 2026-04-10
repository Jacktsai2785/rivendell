# Task Plan: Workflow Map Dashboard Page

## Goal
把 `mockups/workflow-map.html` 的靜態 mockup 轉成 rivendell dashboard 的真實功能頁（`/workflow`），讀取 live skill data 而非 hardcode。

## Constraints
- 沿用現有 dashboard-next 技術棧（Next.js + FastAPI + Recharts + Tailwind）
- 現有 `/skills` page 已有 skills list + usage chart，新頁面不重複這些
- 資料來源：API 動態讀 `~/.claude/skills/` + 讀 mockup 的 workflow config
- 不用重建 mockup 的所有 JS — 用 React 重寫核心功能

## Source Analysis
- **Mockup**: `mockups/workflow-map.html` — 單一 HTML，全部 JS inline
- **資料結構**: `DEFAULT_DATA` 有 4 區塊：
  1. `skillMeta` — skill 名稱 + source + 描述
  2. `coreFlows` — 開發 core workflow（requirement → ship）+ maintenance 觸發表
  3. `domainFlows` — 9 個領域工作流（廠務、銷售、研究、顧問…），每個有 steps + skills
  4. `situational` — 17 個情境觸發
  5. `orphaned` — 孤兒 skills
- **互動**: 搜尋 highlight、flow 展開收合、新增/刪除 flow（localStorage persist）

## Approach
Mockup 的 workflow config 是 **靜態宣告式資料**（不會每秒變），沒必要放 DB。
最適合的方案：**workflow config 存為 JSON 檔** (`data/workflow-map.json`)，
API endpoint 讀它 + merge live skill list → 前端渲染。

## Phases

### Phase 1: API Endpoint `[not_started]`
- [ ] 從 mockup 的 `DEFAULT_DATA` 抽出 JSON → `data/workflow-map.json`
- [ ] FastAPI: `GET /api/workflow` — 讀 JSON config + merge live skill list
  - 標記每個 skill 的 installed 狀態 (是否存在 `~/.claude/skills/{name}/`)
  - 計算 orphaned (installed but not in any flow/trigger)
- [ ] FastAPI: `PUT /api/workflow` — 更新 JSON config (新增/刪除 flow)
- 測試: `curl localhost:8000/api/workflow | python3 -m json.tool`

### Phase 2: Frontend Page `[not_started]`
- [ ] `dashboard-next/src/app/workflow/page.tsx`
- [ ] Sidebar 加 /workflow 入口
- [ ] 四區塊 UI（core / domain / situational / orphaned）
- [ ] 搜尋 highlight
- [ ] Flow 展開/收合
- [ ] Skill chip 顏色 (local vs gstack, mandatory vs optional)

### Phase 3: CRUD + Persist `[not_started]`
- [ ] 新增/刪除 domain flow（PUT /api/workflow 寫回 JSON）
- [ ] 新增/刪除 flow step
- [ ] 新增/移除 step 裡的 skill

### Phase 4: Verify `[not_started]`
- [ ] 手動 QA（開瀏覽器確認所有 flow 正確顯示）
- [ ] 確認搜尋 + CRUD 正常

## Files to Create/Modify
| File | Action |
|------|--------|
| `data/workflow-map.json` | CREATE — workflow config 從 mockup 抽出 |
| `dashboard-next/api/server.py` | MODIFY — 加 /api/workflow endpoint |
| `dashboard-next/src/app/workflow/page.tsx` | CREATE — 新頁面 |
| `dashboard-next/src/components/Sidebar.tsx` | MODIFY — 加 /workflow nav |

## Decisions
- JSON file > DB — workflow config 是宣告式資料，不需要 ACID/query
- PUT endpoint > localStorage — 跨 device 可同步，且 git-trackable
