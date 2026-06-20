# Intake

Before building, gather enough context to make the four critical decisions (type, aesthetic, dimensions, colors). The default is **one batched question call** at the start using `ask_user_input_v0` with 3-4 questions. Skip the intake entirely only when every answer is obvious from the user's prompt.

## When to skip intake

Skip the intake call when **all** of the following are unambiguous in the prompt:

- **Destination is named or implied unambiguously.** "Instagram post," "for our Notion," "lead magnet" all count. "Make a visual" does not.
- **Aesthetic is named, or the destination forces it.** "Dark-tech vibe," "make it editorial," "match Linear" all count. Generic destinations don't force aesthetics.
- **Brand colors are either irrelevant (use preset defaults) or already provided in the prompt.**
- **Interactivity level is named.** "Make it static," "go full interactive," "medium is fine" all count. Otherwise ask — the difference between Off/Medium/High is large enough that the user should consciously pick.

If the user explicitly says "just build it" or "use your judgment," skip intake and proceed with reasoned defaults (including Alive motion). State the choices in one line before building.

## The four intake questions

When asking, use `ask_user_input_v0` with these as a single batched call. Adapt wording to context — don't ask verbatim every time. Drop questions that already have answers from the prompt.

### Q1 — Destination (drives dimensions + density)

> Where will this live?

Options:
- Instagram feed — square (1080×1080)
- Instagram feed — portrait (1080×1350)
- Instagram story / vertical mobile (1080×1920)
- LinkedIn or X post (1200×675)
- Notion embed (1200×auto)
- Lead magnet / downloadable PDF (1200×1800)
- Deck slide (1600×900)
- Other — I'll specify

This is the highest-stakes question. The wrong canvas requires rebuilding, not adjusting.

### Q2 — Aesthetic (drives entire visual language)

> Which visual direction?

Options:
- Minimal-mono — clean, restrained, Linear/Stripe vibe
- Editorial — serif headlines, premium, considered
- Bold-pop — loud, high-contrast, scroll-stopping
- Dark-tech — terminal, neon accents, devy
- Soft-organic — warm, rounded, human-centered
- You pick — explain in one line before building

When the user picks "you pick," propose one with a one-sentence rationale before any other work. Don't ask follow-ups; just choose and explain.

### Q3 — Brand colors (skip when "use preset defaults")

> Use the preset's default colors, or override with brand colors?

Options:
- Use preset defaults
- Override accent color only (I'll provide hex)
- Full brand palette (I'll provide bg, accent, text hex codes)
- Match a brand I'll name

If the user picks "override" or "full palette," ask for the hex codes in the same conversation. Then apply the override pattern from `references/aesthetics.md` ("Brand color override" section). If "match a brand I'll name" and the brand isn't a major one you have a confident color memory of, ask for hex codes rather than guessing.

### Q4 — Interactivity level (always ask for HTML deliverables)

Ask every time the deliverable is HTML. Skip only when the user has already named a level earlier in the conversation, OR the deliverable is going straight to PDF/print with no live HTML stage.

> How interactive should this be?

Options:
- **Off** — flat document, no motion, no JS. Pure screenshot territory.
- **Medium (recommended)** — entrance animations, counter-ups on numbers, hover lift on cards, accent pulse. Feels alive on load and rewards hovering. Static screenshot still works perfectly.
- **High** — tooltips on terms and data, click-to-expand for detail, view toggles, filter chips, hover-to-isolate on data viz. The infographic becomes a small tool, not just a polished graphic.

Default recommendation is **Medium** for any HTML deliverable — the cost is tiny and the perceived-quality lift is large.

**Recommend High when:**
- Destination is a marketing site or product page (live HTML, no flattening expected)
- The content has terms or stats that benefit from inline explanation (perfect for tooltips)
- There's secondary detail you'd otherwise have to cut for space (perfect for click-to-expand)
- The reader will spend 30+ seconds with it

**Don't recommend High when:**
- Destination is social/PDF and the file will be flattened before publishing — the High features won't survive screenshotting
- Content is simple enough that the polish would feel like over-engineering

## Batching format

Use the `multi_select` or `single_select` types per the `ask_user_input_v0` tool spec. Wording stays conversational — not "Q1, Q2, Q3" formal. Example opening:

> Before I build, a few quick calls so I get this right:

Then 3-4 questions inline. Single response from the user, then build.

## After intake

State the four decisions in one line as a confirmation before building:

> Got it — **Stats hero / Notion embed (1200×720) / Minimal-mono with your #625EEB accent / static.** Building now.

This gives the user a chance to redirect before any HTML gets written.

## Anti-patterns

- **Don't ask about colors when the user just said "make me a quick infographic."** Use preset defaults silently.
- **Don't ask about interactivity for social/PDF/print outputs.** It can't travel; the question is noise.
- **Don't ask the user to pick a type from the catalog.** That's the skill's judgment — propose and explain instead.
- **Don't run multiple rounds of intake.** One batch, then build. If something's still unclear after the first batch, make a reasoned default and note it.
