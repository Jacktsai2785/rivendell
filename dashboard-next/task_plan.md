# Task Plan — dashboard-next redesign

**Goal:** Apply v4 design system (logo-first / light / forest green / Geist) to 8 pages of dashboard-next. Workflow map page becomes flagship — React Flow + workflow.json SSOT.

**Source-of-truth references** (read these before any decision):
- `dashboard-next/DESIGN.md` — design system spec
- `docs/requirements/dashboard-redesign.md` — 4 user stories + scope boundary
- `dashboard-next/mockups/workflow-map-v4.html` — v4 mockup (visual target)
- `dashboard-next/CLAUDE.md` — project rules (read DESIGN.md before any UI change)

**Stages:**
- **Stage 1** (foundation + workflow page): land DESIGN.md as code, refactor workflow map. Highest user-facing payoff.
- **Stage 2** (other 7 pages): apply tokens to landing / agents / harvest / ports / projects / skills / tokens. Lower-risk, mostly mechanical.

Each task should be 2–5 min when prerequisites are met. If a task balloons, split it.

---

## Stage 1 — Foundation + Workflow Map

### A. Font self-hosting

| # | Task | Status | Notes |
|---|------|--------|-------|
| A1 | Download `Geist-Variable.woff2` → `dashboard-next/public/fonts/` | pending | https://github.com/vercel/geist-font/releases |
| A2 | Download `GeistMono-Variable.woff2` → `dashboard-next/public/fonts/` | pending | Same release |
| A3 | Add `@font-face` declarations for both to `src/app/globals.css` | pending | `font-display: swap`, variable weight ranges per DESIGN.md |
| A4 | `pnpm dev` → DevTools Network tab → confirm fonts load from local | pending | No more `fonts.googleapis.com` requests |

### B. Design tokens as CSS variables

| # | Task | Status | Notes |
|---|------|--------|-------|
| B1 | Add `:root { --bg, --surface, --surface-2, --border, --border-strong, --text, --text-muted, --text-subtle, --accent, --accent-soft, --accent-bg, --status-ok, --status-warn, --status-err, --space-1..8, --radius-sm/md/lg }` to `globals.css` | pending | Hex values per DESIGN.md table |
| B2 | Extend `tailwind.config.ts` `theme.extend.colors` with `bg`, `surface`, `accent` etc → reading from CSS vars (`'rgb(var(--accent))'` pattern OR direct `var()` ref) | pending | Pick one strategy, document in DESIGN.md |
| B3 | Smoke test: open landing page, inspect computed styles, confirm tokens resolve | pending | grep `#0a0a` etc — should not appear hardcoded after B4 |

### C. Brand assets

| # | Task | Status | Notes |
|---|------|--------|-------|
| C1 | Logo SVGs already shipped (`public/logo.svg`, `public/logo-mono.svg`) | done | Committed `22f43ae` |
| C2 | Set SVG favicon in `src/app/layout.tsx` metadata | pending | `icons: { icon: '/logo.svg' }` |
| C3 | Add `themeColor: '#2d4a3e'` to layout metadata | pending | For browser chrome on supporting platforms |

### D. Shared components (used across all 8 pages)

| # | Task | Status | Notes |
|---|------|--------|-------|
| D1 | Build `src/components/Logo.tsx` — twin-leaves SVG inline + wordmark, props `{ size, variant: 'full' \| 'mark' \| 'mono' }` | pending | Use `<Image>` for SVG OR inline `<svg>` (inline preferred for currentColor) |
| D2 | Build `src/components/Sidebar.tsx` — logo at top + tagline + nav links + collapse toggle | pending | Active route highlighting via `usePathname` |
| D3 | Refactor `src/app/layout.tsx` to render `<Sidebar />` + `<main>` shell | pending | Replace whatever is there now |
| D4 | Build `src/components/StatusDot.tsx` — `{ status: 'ok' \| 'warn' \| 'err', label?: string }` | pending | 8px circle, semantic color, optional inline label |
| D5 | Build `src/components/SkillChip.tsx` — `{ name, variant?: 'default' \| 'optional' \| 'highlighted', onClick?: () => void }` | pending | Mono 10px, dashed border for `optional` |
| D6 | Build `src/components/PageHeader.tsx` — h2 with accent leader bar (per DESIGN.md `h2::before` pattern) | pending | Reusable section / page heading |

### E. Workflow data SSOT

| # | Task | Status | Notes |
|---|------|--------|-------|
| E1 | Design `workflow.json` schema: `{ tracks: CoreTrack[], domains: DomainFlow[], maintenance: Maintenance[], situational: Situational[], orphans: Orphan[] }` | pending | Mirror existing TypeScript interfaces in `src/app/workflow/page.tsx` |
| E2 | Move existing inline workflow data from `src/app/workflow/page.tsx` into `dashboard-next/data/workflow.json` | pending | Pure data extraction, no logic change |
| E3 | Write `src/lib/workflow.ts` — `loadWorkflow(): Promise<Workflow>`, type-only via `import type` | pending | Server-side `fs.readFileSync` or import-as-JSON; pick one |
| E4 | Add unit-style sanity check (or just dev-time console log) verifying counts match: tracks, domains, etc. | pending | Catches accidental data loss during E2 |

### F. Workflow page rebuild

| # | Task | Status | Notes |
|---|------|--------|-------|
| F1 | `pnpm add reactflow` | pending | Pin version |
| F2 | Build `src/components/workflow/StepNode.tsx` — custom React Flow node renderer matching mockup (step-num, step-label, stacked SkillChips) | pending | Width 165px, padding per DESIGN.md |
| F3 | Build `src/components/workflow/TrackRow.tsx` — renders one track: name + horizontal flow of StepNodes + Bezier connectors | pending | One React Flow instance per track, OR one global with multi-track layout |
| F4 | Build `src/components/workflow/CrossReferencePanel.tsx` — `{ skillName }` → reads workflow.json, computes references, renders aside panel | pending | Mini-stats can be stubbed initially (firings = 0 until token data wired) |
| F5 | Refactor `src/app/workflow/page.tsx` — load workflow.json, render top-bar (breadcrumb + search + Tree/Graph toggle), tracks list, cross-ref panel | pending | Tree = default; Graph = stub button for now |
| F6 | Wire SkillChip click → set `selectedSkill` state → CrossReferencePanel re-renders | pending | Lift state to workflow page |
| F7 | Smoke test at 1440×900: tracks visible, no horizontal overflow except inside flow canvas, click flow works | pending | Use `gstack-browse` or just open in browser |
| F8 | Edge case: empty cross-reference panel state when no skill selected | pending | Show "select a skill to see references" placeholder |

### G. Stage 1 wrap

| # | Task | Status | Notes |
|---|------|--------|-------|
| G1 | Type check + lint: `pnpm tsc --noEmit && pnpm lint` | pending | No errors before commit |
| G2 | `/gstack-review` on staged diff | pending | Pre-commit |
| G3 | Commit: `feat(dashboard-next): land design tokens + workflow map v4` | pending | Single squash or split per logical chunk |
| G4 | If Stage 1 reveals DESIGN.md gaps, update Decision Log | pending | E.g. picked tailwind-vs-css-vars strategy |

---

## Stage 2 — Apply tokens to remaining 7 pages

### H. Chart components (shared, build before page migration)

| # | Task | Status | Notes |
|---|------|--------|-------|
| H1 | Build `src/components/charts/LineTrend.tsx` — props `{ data: {x, y}[], yLabels?, xLabels? }`. Inline SVG | pending | Single forest stroke + soft gradient fill, mono axis labels |
| H2 | Build `src/components/charts/BarRank.tsx` — props `{ rows: { label, value }[] }` horizontal bar | pending | Forest fill on surface-2 track |
| H3 | Build `src/components/charts/Heatmap.tsx` — props `{ rows: string[], cols: string[], values: number[][], legend? }` | pending | Sequential greens + red for error |
| H4 | Smoke: render each in a Storybook-like dev page (or just on tokens page) | pending | Visual sanity before per-page migration |

### I. Page-by-page token migration

| # | Task | Status | Notes |
|---|------|--------|-------|
| I1 | `src/app/page.tsx` (landing) — strip hardcoded colors, apply tokens, place Logo, update copy | pending | Reference DESIGN.md hero pattern |
| I2 | `src/app/agents/page.tsx` — token swap, agent cards use Card pattern + StatusDot | pending |  |
| I3 | `src/app/harvest/page.tsx` — token swap | pending |  |
| I4 | `src/app/ports/page.tsx` — token swap | pending |  |
| I5 | `src/app/projects/page.tsx` — token swap | pending |  |
| I6 | `src/app/skills/page.tsx` — token swap; this is where cross-ref panel CTA links to | pending | Skill detail anchor (`/skills/[name]`) must work for the cross-ref CTA |
| I7 | `src/app/tokens/page.tsx` — token swap; replace any inline charts with `LineTrend`, `BarRank`, `Heatmap` from H | pending | This page demonstrates the chart components most |

### J. Stage 2 wrap

| # | Task | Status | Notes |
|---|------|--------|-------|
| J1 | Open all 8 pages in browser, click through nav, look for visual inconsistencies | pending | grep for any remaining hardcoded `#0a0a` / `bg-slate-` / `bg-gray-` / blue / purple |
| J2 | `pnpm tsc --noEmit && pnpm lint` clean | pending |  |
| J3 | `/gstack-design-review` for visual audit | pending | Optional but recommended |
| J4 | Commit: `feat(dashboard-next): apply design tokens across all 8 pages` | pending |  |
| J5 | Update DESIGN.md Decision Log with any deviations | pending |  |
| J6 | User self-acceptance: 30 min usage, evaluate "醜或亂" subjective pain | pending | Per requirement doc 主驗收 |

---

## Parking lot (deferred, not in this scope)

- **K1.** Graph view (skill-as-center DAG) for workflow map — implement Tree first, Graph after
- **K2.** React Flow drag/edit/connect-by-handle interactivity — needs `workflow.json` round-trip design (UI write back to JSON)
- **K3.** Auto-sync between `workflow.json` and `~/.claude/CLAUDE.md` flow doc — script or hook
- **K4.** `bin/sk rename` tool for skill renaming (raised in earlier conversation, not blocking this redesign)
- **K5.** Skills page detail-route (`/skills/[name]`) deep links from cross-ref CTA — confirm it exists; if not, build before Stage 1 ships
- **K6.** Mobile RWD — explicitly out of scope (desktop tool)

---

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| _(none yet)_ | | |

---

## Files Created / Modified Log

Track at end of each phase. Keeps blast radius visible.

| Phase | Files | Notes |
|-------|-------|-------|
| _pending_ | | |
