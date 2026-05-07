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

### A. Font self-hosting (use Next.js `next/font/local`, not raw @font-face)

> **Review note (2026-05-07):** project uses Next.js 16 + `next/font/google` already. Switch to `next/font/local` — Next.js handles all the @font-face plumbing, asset hashing, and CSS variable wiring. No raw @font-face needed.

| # | Task | Status | Notes |
|---|------|--------|-------|
| A1 | Download `Geist-Variable.woff2` → `dashboard-next/src/fonts/` (NOT public/, keep co-located with loader) | pending | https://github.com/vercel/geist-font/releases |
| A2 | Download `GeistMono-Variable.woff2` → `dashboard-next/src/fonts/` | pending | Same release |
| A3 | Refactor `src/app/layout.tsx`: replace `import { Geist, Geist_Mono } from "next/font/google"` with `import localFont from "next/font/local"` and point to `./fonts/Geist-Variable.woff2` etc. Keep `--font-geist-sans` / `--font-geist-mono` variable names (already wired into @theme inline) | pending | Single-file change |
| A4 | `pnpm dev` → DevTools Network tab → confirm no `fonts.googleapis.com` request | pending | All font loading should be `_next/static/media/...` |

### B. Design tokens (Tailwind v4 native: `:root` + `@theme inline`)

> **Review note (2026-05-07):** Tailwind v4 already configured. globals.css already has `:root` + `@theme inline` block. Extend the EXISTING block, do not create new infrastructure. No `tailwind.config.ts` needed — v4 uses CSS @theme directives.

| # | Task | Status | Notes |
|---|------|--------|-------|
| B0 | **Remove `@media (prefers-color-scheme: dark)` block** from globals.css | pending | DESIGN.md is light-only. Single-user tool, no dark mode |
| B1 | Extend `:root` in globals.css with all DESIGN.md tokens: `--bg, --surface, --surface-2, --border, --border-strong, --text, --text-muted, --text-subtle, --accent, --accent-soft, --accent-bg, --status-ok, --status-warn, --status-err, --space-1..8, --radius-sm/md/lg` | pending | Hex values per DESIGN.md color table |
| B2 | Extend `@theme inline { ... }` block with semantic color names: `--color-bg, --color-surface, --color-accent` etc → `var(--bg)` etc. This makes Tailwind utilities like `bg-accent`, `text-muted` work | pending | Single block edit in globals.css |
| B3 | Smoke test: open landing page, inspect computed styles, confirm `bg-accent` class resolves to `#2d4a3e` | pending | grep for `#0a0a` `bg-slate-` `bg-gray-` `bg-violet-` etc to find leftover hardcoded values |

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
| D2 | **Refactor existing** `src/components/Sidebar.tsx` — replace existing layout with logo at top + tagline + nav links + collapse toggle. Already imported in layout.tsx | pending | Active route highlighting via `usePathname` |
| D3 | Refactor `src/app/layout.tsx` to render `<Sidebar />` + `<main>` shell | pending | Replace whatever is there now |
| D4 | Build `src/components/StatusDot.tsx` — `{ status: 'ok' \| 'warn' \| 'err', label?: string }` | pending | 8px circle, semantic color, optional inline label |
| D5 | Build `src/components/SkillChip.tsx` — `{ name, variant?: 'default' \| 'optional' \| 'highlighted', onClick?: () => void }` | pending | Mono 10px, dashed border for `optional` |
| D6 | Build `src/components/PageHeader.tsx` — h2 with accent leader bar (per DESIGN.md `h2::before` pattern) | pending | Reusable section / page heading |

### E. Workflow data — DEFERRED to parking lot K2

> **Review decision (2026-05-07):** API already returns typed `WorkflowData` via `apiFetch("/workflow")` in `src/app/workflow/page.tsx`. Stage 1 = readonly view. Freezing into a JSON file SSOT only matters when UI starts writing back (drag/edit, parking lot K2). **All E1-E4 deferred to K2** — keep using the API in Stage 1.

| # | Task | Status | Notes |
|---|------|--------|-------|
| E1-E4 | _deferred to K2 in parking lot_ | deferred | When React Flow drag/edit lands, then design the JSON SSOT + write loader |

### F. Workflow page rebuild (HTML/CSS/SVG, no React Flow yet)

> **Review decision (2026-05-07):** React Flow's value is drag/connect/edit. Stage 1 is readonly tree view. v4 mockup proves HTML + flexbox + SVG Bezier connectors render the same visual. **Skip React Flow installation.** Defer to K2 in parking lot when drag/edit lands. Saves ~30% Stage 1 complexity.

| # | Task | Status | Notes |
|---|------|--------|-------|
| F1 | _deferred to K2 in parking lot_ — no React Flow install in Stage 1 | deferred | |
| F2 | Build `src/components/workflow/StepNode.tsx` — pure HTML/CSS card matching mockup (step-num, step-label, stacked SkillChips). Width 165px, padding per DESIGN.md | pending | Direct port from `dashboard-next/mockups/workflow-map-v4.html` `.step-node` markup |
| F3 | Build `src/components/workflow/TrackRow.tsx` — renders one track: name + flexbox row of StepNodes + absolutely-positioned SVG layer with Bezier `<path>` connectors | pending | Connector SVG sits behind nodes (z-index 0), nodes z-index 1. Pattern in mockup |
| F4 | Build `src/components/workflow/CrossReferencePanel.tsx` — `{ skillName, workflow }` props. Computes references in-component. Renders aside panel | pending | Mini-stats can stub firings=0 until token data wired |
| F5 | Refactor `src/app/workflow/page.tsx` — keep `apiFetch("/workflow")`, render top-bar (breadcrumb + search + Tree/Graph toggle), tracks list, cross-ref panel | pending | Tree = default; Graph = `<button disabled>` stub for now |
| F6 | Wire SkillChip click → lift state to workflow page → CrossReferencePanel re-renders | pending | Standard React `useState` lift |
| F7 | Smoke test at 1440×900: tracks visible, only flow-canvas scrolls horizontally, click flow works | pending | Just open in browser |
| F8 | Empty state for cross-reference panel when no skill selected | pending | "Pick a skill to see where it appears" placeholder |
| F9 | Loading state: while `apiFetch("/workflow")` resolves, render skeleton (per DESIGN.md spirit — no spinner, just muted placeholder boxes) | pending | Was missing from original plan |

### G. Stage 1 wrap

| # | Task | Status | Notes |
|---|------|--------|-------|
| G0 | **Stage 1 prereq** (promoted from K5): verify `/skills/[name]` route exists in `src/app/skills/`. If not, scaffold a minimal route — cross-ref panel CTA depends on it. | pending | `ls src/app/skills/\\[name\\]/page.tsx 2>/dev/null` |
| G1 | Type check + lint: `pnpm tsc --noEmit && pnpm lint` | pending | No errors before commit |
| G2 | `/gstack-review` on staged diff | pending | Pre-commit |
| G3 | Commit: `feat(dashboard-next): land design tokens + workflow map v4` | pending | Single squash or split per logical chunk |
| G4 | If Stage 1 reveals DESIGN.md gaps, update Decision Log | pending | E.g. confirm next/font/local pattern |

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
- **K2.** React Flow integration: drag/edit/connect-by-handle + `data/workflow.json` SSOT + loader (was tasks E1-E4 + F1) + auto-write API endpoint for round-trip
- **K3.** Auto-sync between `workflow.json` (or API) and `~/.claude/CLAUDE.md` flow doc — script or hook
- **K4.** `bin/sk rename` tool for skill renaming (raised in earlier conversation, not blocking this redesign)
- **K5.** _PROMOTED to G0 (Stage 1 prereq)._ Skills page `/skills/[name]` deep-link route. Cross-ref CTA depends on it.
- **K6.** Mobile RWD — explicitly out of scope (desktop tool)
- **K7.** ⌘K skill search (shown in v4 mockup top-bar) — nice-to-have. Stage 1 = static placeholder text. Real implementation needs fuzzy search lib (Fuse.js or similar)

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

---

## Plan Review Report (tight eng review · 2026-05-07)

| Decision | Verdict | Principle |
|----------|---------|-----------|
| Tailwind ↔ CSS vars strategy | Auto-decided: use Tailwind v4 native `@theme` + `:root` (already partially in place) | P3 pragmatic — v4's pattern IS the right answer, A/B from findings.md is obsolete |
| `workflow.json` SSOT | Taste decision → user picked **defer to K2** | P5 explicit/simple — readonly view doesn't need the SSOT round-trip yet |
| React Flow integration | Taste decision → user picked **defer to K2**, use HTML/CSS/SVG for Stage 1 | P3 pragmatic + P5 explicit — v4 mockup proves HTML/CSS reaches readonly target |

**Auto-fixes applied to task_plan.md:**
- A1-A4: switched from raw @font-face → `next/font/local` (Next.js native)
- B0 added: remove `prefers-color-scheme: dark` block from globals.css
- B1-B2: extend existing `:root` + `@theme inline` (not create new infrastructure)
- D2: refactor existing Sidebar.tsx (not build from scratch)
- E1-E4: deferred to parking lot K2
- F1: deferred to parking lot K2 (no React Flow in Stage 1)
- F2-F4: rewritten to plain HTML/CSS/SVG components
- F9 added: API loading skeleton (was missing from original plan)
- G0 added (Stage 1 prereq, promoted from K5): verify `/skills/[name]` route exists
- K7 added: ⌘K search promoted to nice-to-have parking lot item

**Net effect on Stage 1 scope**: ~25–30% smaller (drop reactflow install + 4 React Flow components + JSON SSOT setup). Stage 2 unchanged.

**Recharts conflict noted, not blocking**: DESIGN.md says "inline SVG only", but `recharts ^3.8.0` is in package.json. Decision: keep recharts installed (might be used elsewhere) but H1-H3 chart components built fresh as inline SVG. Don't uninstall, don't expand recharts usage.
