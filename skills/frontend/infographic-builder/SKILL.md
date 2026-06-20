---
name: infographic-builder
description: Build a single-file, self-contained HTML infographic from text content, data, or article material. Use this skill whenever the user asks for an infographic, visual summary, social graphic, one-pager, lead magnet, visual explainer, or wants to "visualize", "turn into a graphic", or "make a shareable visual" out of text or data. Also trigger for Instagram/social post graphics, Notion-embeddable visuals, deck-ready visual slides, educational hand-outs, and interactive HTML visuals for web/Notion. Asks 3-4 clarifying questions upfront (destination, aesthetic, brand colors, interactivity) unless the prompt makes all of them obvious. Selects the right infographic type (process, stats, comparison, timeline, hierarchy, cycle, listicle, anatomy) and aesthetic preset based on the content and intended use, and supports brand color overrides.
---

# Infographic Builder

Build polished, single-file HTML infographics that look intentional, not templated. Each output is a self-contained `.html` file the user can open, screenshot for social, embed in Notion, or attach to email.

This skill's value is **judgment**, not boilerplate. Any model can write HTML; what's hard is choosing the right *structure* for the content, the right *aesthetic* for the destination, and the right *dimensions* for the medium. This skill encodes that judgment and bundles enough reference material to skip the "what should this look like" thinking.

## Workflow

For every infographic request, work through these in order. The intake step is mandatory unless every key decision is already unambiguous from the prompt.

1. **Intake.** Run `references/intake.md` — ask 3-4 batched clarifying questions about destination, aesthetic, brand colors, and (when relevant) interactivity. Skip only when all four are obvious from the prompt or the user said "just build it."
2. **Confirm decisions in one line** before building. Example: *"Got it — Stats hero / Notion (1200×720) / Minimal-mono with your #625EEB accent / static. Building now."*
3. **Pick the type.** See "Picking the type" below, or read `references/types.md`.
4. **Pick the aesthetic.** See "Picking the aesthetic" below, or `references/aesthetics.md`. For brand color overrides, use the "Brand color override" section of that file.
5. **Lock the dimensions.** `references/dimensions.md`.
6. **Decide on interactivity level.** Default is **Medium** for HTML deliverables (entrance stagger, counter-ups, hover lift). Step down to **Off** only if user asked. Step up to **High** when the deliverable lives on a marketing site or content benefits from tooltips/expand/filters. See `references/interactive.md` for the full pattern set.
7. **Build.** Start from `assets/boilerplate.html`. Read the closest example in `assets/examples/` before writing CSS. Inline everything.
8. **Self-review** against the checklist below.

## Picking the type

Quick decision guide. For deeper notes on each type with ASCII layout sketches and content cues, read `references/types.md`.

| Content shape | Type |
|---|---|
| Sequential actions ("first X, then Y, then Z") | **Process / steps** |
| Standalone numbers that matter ("47% growth, 12k users") | **Stats hero** |
| Two or three options compared across criteria | **Comparison** |
| Events along a time axis | **Timeline** |
| Layers from foundation to peak, or tiers | **Hierarchy / pyramid** |
| Repeating loop of stages with no clear start | **Cycle** |
| Ranked or unranked list of distinct items | **Listicle** |
| Parts of one whole thing being labeled | **Anatomy / labeled diagram** |

When content fits two types, pick the one that surfaces the *insight*, not the one that looks busiest. "Top 5 mistakes" with no ranking signal is a listicle, not a hierarchy. "How our growth compounded over 4 quarters" is a timeline if the dates carry meaning, a stats hero if just the final number does.

If nothing fits cleanly, ask the user. Don't force.

## Picking the aesthetic

Match aesthetic to **destination and audience**, not topic. A finance topic on Instagram needs Bold-Pop more than it needs serious-corporate.

The five presets live in `references/aesthetics.md` with full CSS variables, font imports, and example rules. Quick summary:

- **Minimal-mono** — Linear/Stripe vibe. Inter, lots of whitespace, single accent color, near-monochrome palette. Best for: tech, SaaS, internal reports, Notion embeds, dev-tool content.
- **Editorial** — Magazine feel. Serif headlines (Fraunces, Tiempos), asymmetric grid, restrained but warm color. Best for: long-form lead magnets, considered/luxury content.
- **Bold-pop** — Heavy color blocks, oversized type, high contrast. Best for: Instagram feed posts, lead magnet covers, scroll-stopping social.
- **Dark-tech** — Dark background, neon or saturated accents, mono-style. Best for: developer content, crypto, dashboards, "behind the scenes" technical posts.
- **Soft-organic** — Warm palette, rounded shapes, friendly serif or rounded sans. Best for: wellness, lifestyle, kids, food, anything human-centered.

When the user says "adapt to topic" or doesn't specify, **propose one and explain why in a single sentence before building**. Don't ask the user to choose blind, and don't default to Minimal-mono out of habit — make the call.

**When the user provides brand colors:** pick the host preset whose *typography and structure* fits the brand best (not whose colors are closest — those get overridden), then apply the override pattern from the "Brand color override" section of `references/aesthetics.md`.

## Build constraints

**Self-contained means self-contained.** The output `.html` file must open offline directly from disk with no network requests except optional Google Fonts. This is non-negotiable because the file gets screenshotted, emailed, embedded, and downloaded — it can't depend on external CDNs or assets.

- All CSS inline in one `<style>` block in the `<head>`
- No `<script src="...">` to external libraries. If JS is needed (rare), inline it
- No `<img src="https://...">` unless the user explicitly provided the URL
- Icons, shapes, and illustrations as inline SVG (look up tabler-icons or lucide path data — recreate it inline, don't link them)
- Google Fonts via `<link>` is OK because it's standard and degrades to system fonts when offline

**Width and dimensions are locked, not fluid.** Infographics are not responsive websites — they're documents with a target canvas. Wrap content in a fixed-width container at the dimensions for its destination. See `references/dimensions.md`.

**Density matches reading context.** Instagram = scannable in 2 seconds, big type, ruthless brevity. Lead magnet = readable in 30 seconds, room for nuance. Internal report = full detail at 2-minute scan. Calibrate type sizes and word counts to the context, not to "looks balanced."

## Self-review checklist

Before handing off, mentally open the file and check:

- Opens directly from disk without network (besides Google Fonts)
- Fits target dimensions; nothing overflows or feels cramped
- Visual hierarchy is obvious — one clear "main thing" per section, the eye knows where to land first
- No more than 3 active colors (accent + neutral + bg) unless the chosen aesthetic is explicitly multi-color
- Type sizes readable at the intended viewing distance (Instagram = phone at arms length, deck = projected at 10 feet)
- Numbers and key terms are emphasized, not buried in prose
- No "designed by Claude" energy — no generic emoji section headers, no AI-default purple gradients unless intentional, no rounded-corner-box-with-icon-and-three-bullets repeated four times

## Anti-patterns

These signal a mediocre infographic. Avoid them by default:

- Three or four equal-sized columns of boxes with an icon and 20 words each (the "SaaS landing page hero")
- Every section header gets a different emoji
- Generic gradient backgrounds spanning the entire canvas
- Centered text for everything — use centering as a deliberate choice, not the default
- "Lorem ipsum"–sized headlines on content that needs information density
- Identical card components stacked vertically with no visual variation across the canvas

## Bundled resources

- `assets/boilerplate.html` — Starter HTML with CSS reset, font loading scaffold, and the CSS variable structure shared across all aesthetic presets. Start every build here. Don't write the wrapper from scratch.
- `assets/examples/` — Complete reference builds. Read the closest match before writing CSS. Current examples:
  - `stats-hero-minimal.html` — Stats-hero in Minimal-mono, **Off** (static reference)
  - `stats-hero-minimal-alive.html` — Same content at **Medium**: entrance stagger, counter-ups, hover lift, accent pulse. Read this when applying Medium to any build.
- `references/intake.md` — The 3-4 question intake battery with smart-skip rules. Read at the start of every request.
- `references/types.md` — Full catalog of infographic types with content cues, ASCII layout sketches, and example titles per type.
- `references/aesthetics.md` — CSS variables, font imports, and visual rules for each of the five presets, plus a "Brand color override" section for applying user-provided brand colors.
- `references/dimensions.md` — Canvas size matrix for Instagram (square/portrait/story), X/LinkedIn, landscape decks, vertical one-pagers, Notion embeds, and print.
- `references/interactive.md` — Three levels (**Off / Medium / High**) with the full pattern catalog. Off = static document. Medium = entrance stagger, counter-ups, hover lift, accent pulse. High = tooltips, click-to-expand, view toggles, filter chips, hover-to-isolate on data viz.

## Output

Save the final HTML file to the working directory and present it via the file presentation flow. Name files descriptively based on content + type (`etsy-seo-mistakes-listicle.html`, not `infographic.html`).

After presenting, write **two short lines** explaining the choices: which type, which aesthetic, and why. Then ask if the user wants to iterate on either. Example:

> Used **Stats Hero** in **Minimal-mono** — the quarterly numbers carry the story, and the internal-Notion context wants restraint over flash. Want me to swap aesthetics or tighten the data?
