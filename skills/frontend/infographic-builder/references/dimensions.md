# Dimensions

Each destination has a canonical canvas. Pick the right one — don't guess and don't try to be "responsive." Infographics are documents, not websites.

All sizes are in CSS pixels (which match image pixels for screenshot output at standard zoom).

## Social

| Destination | Width × Height | Notes |
|---|---|---|
| Instagram feed (square) | 1080 × 1080 | Most flexible. Default for feed posts. |
| Instagram feed (portrait) | 1080 × 1350 | Takes more feed real estate. Use when content is dense. |
| Instagram story / Reel cover | 1080 × 1920 | Vertical, mobile-first. Keep critical content in the middle 60% — top/bottom get covered by UI. |
| X / Twitter post | 1200 × 675 | 16:9, landscape. Compressed hard, keep type large. |
| LinkedIn post | 1200 × 627 | Slightly different ratio than X. Often previewed at small sizes. |
| LinkedIn carousel PDF | 1080 × 1080 per slide | Square slides exported as PDF. |
| Pinterest pin | 1000 × 1500 | Tall portrait. Title-heavy works well. |

## Docs and reports

| Destination | Width × Height | Notes |
|---|---|---|
| Notion embed | 1200 × auto | Width matches Notion's typical content width. Height can be whatever — scrolls inside the embed. |
| Landscape deck slide | 1600 × 900 | 16:9 for Keynote / Slides. Common for "one slide that explains it." |
| Vertical one-pager | 1200 × 1800 | Roughly Letter at 96 DPI. For lead magnets, hand-outs. |
| US Letter (print) | 816 × 1056 | 8.5×11 at 96 DPI. For actual print PDF export. |
| A4 (print) | 794 × 1123 | A4 at 96 DPI. For non-US print. |

## Web

| Destination | Width × Height | Notes |
|---|---|---|
| Inline web embed | 1200 × auto | Same as Notion. |
| Email-friendly | 600 × auto | Most email clients clip wider than 600px. Use this when explicitly for email. |
| Hero banner | 1600 × 600 | Wide-short. Like a landing-page header. |

## Picking when ambiguous

User context cues:
- "post it on Instagram" → 1080×1080 unless they specify story
- "drop in our Notion" → 1200×auto
- "send to my email list" → 1200×1800 if it's a downloadable; 600×auto if it's embedded in the email body
- "for our team Slack" → 1200×675 (landscape, behaves like an image preview)
- "lead magnet" → 1200×1800 (vertical, downloadable)

When the user doesn't specify and there are no cues, ask. The wrong canvas size is the single most expensive mistake to fix later — it requires rebuilding the layout, not just adjusting it.

## Implementation

Lock the canvas with explicit width and height on the outer container:

```css
.canvas {
  width: 1080px;
  height: 1350px;
  margin: 0 auto;
  overflow: hidden; /* so nothing escapes the canvas for screenshots */
}
```

For "auto" heights (Notion, email, web), drop the height and keep `min-height: 100vh` only if it helps preview. For fixed-size outputs (everything else), set both dimensions.
