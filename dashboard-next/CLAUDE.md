# dashboard-next — Claude Code rules

## Design System

Always read `dashboard-next/DESIGN.md` before making any visual / UI / styling change.
All color, typography, spacing, layout, and component decisions are defined there.
Do not deviate from DESIGN.md without explicit user approval, and update the
"Decisions Log" section at the bottom of DESIGN.md when a deviation is approved.

In QA mode, flag any code that doesn't follow DESIGN.md (hardcoded colors, raw
font-family strings outside `globals.css`, blue/purple/indigo accent usage, etc.)

## Brand assets

- `public/logo.svg` — primary mark (twin leaves, hard-coded forest green `#2d4a3e`)
- `public/logo-mono.svg` — monochrome variant using `currentColor` for context-aware tinting
- Wordmark "rivendell" set in Geist 600, color `var(--accent)`, never italic

## Fonts

Self-hosted in `public/fonts/` (Geist Variable + Geist Mono Variable, .woff2).
@font-face declarations in `globals.css`. Do not switch to Google Fonts CDN —
portability across machines is a design constraint.

## Workflow page

`src/app/workflow/page.tsx` is the flagship page. Source of truth for the workflow
graph is `data/workflow.json` (single canonical file). Any UI edits round-trip
through this JSON. The CLAUDE.md flow docs (project-level + global) are derived
views and should remain in sync — when workflow.json changes substantively,
regenerate or hand-edit the flow doc to match.

For drag/edit/connect interactivity, use [React Flow](https://reactflow.dev).
