# Findings

## Mockup Structure
- `mockups/workflow-map.html` — single file, ~800 lines, all JS inline
- DEFAULT_DATA has: skillMeta (80+ skills), coreFlows (7 dev steps + 11 maintenance triggers), domainFlows (9 flows), situational (17 triggers), orphaned (4)
- Uses localStorage for custom flows — will migrate to JSON file

## Existing Dashboard Stack
- Next.js 14+ (`dashboard-next/src/app/`)
- FastAPI (`dashboard-next/api/server.py`, ~1300 lines)
- Recharts for charts (Treemap, PieChart, BarChart on /skills page)
- Tailwind CSS (dark mode support)
- Sidebar component at `dashboard-next/src/components/Sidebar.tsx`

## Existing Skills API
- `GET /api/skills` — returns list of all skills with name, description, category, lifecycle, tags
- `GET /api/skills/usage` — usage tracking data
- `GET /api/skills/{name}` — individual skill content

## Existing Pages
- `/` — overview (metrics, pending issues)
- `/skills` — treemap + donut + cards + usage chart (410 lines)
- `/agents` — agent lifecycle management
- `/harvest` — harvest candidate board
- `/tokens` — token usage analytics
- `/projects` — project list
- `/ports` — port map

## Key Insight: Skill Discovery
`api_skills()` in server.py already walks `~/.claude/skills/` to find all installed skills.
We can reuse this for the workflow page's "installed" status check.
