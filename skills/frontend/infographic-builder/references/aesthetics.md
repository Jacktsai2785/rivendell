# Aesthetic Presets

Each preset is defined as a complete CSS variable block. Copy the block into the `:root` of your build. Don't reinvent the values — they're chosen to be visually coherent.

For each preset: when to use, font imports, full `:root` CSS, and one styling note that makes it look like itself (not generic).

---

## Minimal-mono

**When to use:** SaaS, dev tools, internal reports, Notion embeds. Anywhere restraint reads as confidence. Default for ListingView-style content.

**Fonts:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

**CSS:**
```css
:root {
  --font-sans: 'Inter', -apple-system, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;

  --bg: #FAFAF9;
  --surface: #FFFFFF;
  --text: #0A0A0A;
  --text-muted: #6B7280;
  --text-subtle: #9CA3AF;
  --border: #E5E7EB;
  --accent: #625EEB;
  --accent-soft: #ECECFB;

  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.06);
}

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  -webkit-font-smoothing: antialiased;
}
```

**The "looks like itself" move:** Hairline 1px borders in `--border`, generous whitespace (32px+ gaps), uppercase tracked-out labels at 11px for section headers. Numbers in `--font-mono` with `font-feature-settings: 'tnum'` for tabular figures.

---

## Editorial

**When to use:** Long-form lead magnets, considered content, anything where the reader will spend 30+ seconds. Luxury, design, considered purchases.

**Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
```

**CSS:**
```css
:root {
  --font-serif: 'Fraunces', 'Tiempos', Georgia, serif;
  --font-sans: 'Inter', sans-serif;

  --bg: #F7F3ED;
  --surface: #FFFFFF;
  --text: #1A1410;
  --text-muted: #6B5D52;
  --border: #D9CFC0;
  --accent: #B8410C;
  --accent-soft: #F5DDD0;

  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;
}

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
}

h1, h2, .display {
  font-family: var(--font-serif);
  font-optical-sizing: auto;
  font-variation-settings: 'opsz' 144;
  letter-spacing: -0.02em;
  line-height: 1.05;
}
```

**The "looks like itself" move:** Big optical-sized serif headlines (60px+) with negative letter-spacing. Body text in restrained sans. Drop caps on opening paragraphs. Asymmetric grids — never four equal columns.

---

## Bold-pop

**When to use:** Instagram feed posts, lead magnet *covers*, anything that needs to stop the scroll. High-contrast topics: money, hot takes, transformation.

**Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;800;900&family=Inter:wght@400;600&display=swap" rel="stylesheet">
```

**CSS:**
```css
:root {
  --font-display: 'Archivo', 'Inter Display', sans-serif;
  --font-sans: 'Inter', sans-serif;

  --bg: #FFE94D;
  --surface: #0A0A0A;
  --text: #0A0A0A;
  --text-on-dark: #FFE94D;
  --text-muted: #2A2A2A;
  --border: #0A0A0A;
  --accent: #FF3D00;
  --accent-2: #0066FF;

  --radius-sm: 0px;
  --radius-md: 0px;
  --radius-lg: 8px;
}

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
}

.display {
  font-family: var(--font-display);
  font-weight: 900;
  font-stretch: 110%;
  letter-spacing: -0.04em;
  line-height: 0.9;
  text-transform: uppercase;
}
```

**The "looks like itself" move:** Massive uppercase display type (100px+), 3-4px solid borders, color blocks that bleed off the edge, occasional negative-margin overlap, hard shadows (no blur) at `4px 4px 0 #000`.

---

## Dark-tech

**When to use:** Developer content, crypto/web3, dashboards, "behind the scenes" technical posts. Anywhere a terminal vibe reads correctly.

**Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

**CSS:**
```css
:root {
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  --bg: #0A0A0F;
  --surface: #14141C;
  --surface-2: #1E1E2A;
  --text: #E6E6F0;
  --text-muted: #8B8BA0;
  --text-subtle: #4A4A5C;
  --border: #2A2A38;
  --accent: #00FF88;
  --accent-2: #00D4FF;
  --warn: #FFB800;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
}

.mono-label, .stat-value {
  font-family: var(--font-mono);
  font-feature-settings: 'tnum', 'zero';
}
```

**The "looks like itself" move:** Mono for numbers and labels. Subtle scanline or grid overlay on the bg (1% opacity SVG). Glow on the accent color (`box-shadow: 0 0 24px var(--accent)` at low opacity). Terminal-style brackets `[ LABEL ]` for section headers.

---

## Soft-organic

**When to use:** Wellness, lifestyle, kids, food, fitness, anything human-centered. Warm rather than precise.

**Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
```

**CSS:**
```css
:root {
  --font-display: 'DM Serif Display', Georgia, serif;
  --font-sans: 'Nunito', 'SF Pro Rounded', system-ui, sans-serif;

  --bg: #F4EDE2;
  --surface: #FFFCF6;
  --text: #2D2419;
  --text-muted: #7A6B58;
  --border: #E5D9C5;
  --accent: #D97757;
  --accent-2: #5C8A6B;
  --accent-soft: #F5E2D4;

  --radius-sm: 16px;
  --radius-md: 24px;
  --radius-lg: 40px;
}

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
  font-weight: 400;
}

h1, .display {
  font-family: var(--font-display);
  font-weight: 400;
  line-height: 1.1;
}
```

**The "looks like itself" move:** Generous border-radius everywhere (24px+). Soft drop shadows. Hand-drawn-feeling SVG accents (wavy underlines, organic blob shapes as section dividers). Warm cream backgrounds, not white.

---

## Mixing presets

Don't. Pick one and commit. If the user's content genuinely spans aesthetics (a wellness brand's quarterly metrics), pick the destination's preset, not the topic's.

---

## Brand color override

When the user provides brand colors during intake, start from the closest preset and override the color-bearing variables. Keep the preset's typography, spacing, radii, and "looks like itself" moves — only the colors change.

### What to override

Each preset's `:root` block has 6-10 color variables. The minimum override is:

- `--accent` — the brand's primary action/highlight color
- `--bg` — only if the brand uses a non-white background
- `--text` — only if the brand uses a non-black text color

Leave `--text-muted`, `--text-subtle`, and `--border` at the preset's defaults unless the user specifies — those are calibrated for legibility and shouldn't shift to "brand grey #777" without a reason.

### Override patterns

**Accent-only override** (most common — the user has one signature color)

```css
:root {
  /* ... preset's other variables unchanged ... */
  --accent: #625EEB;        /* user's brand color */
  --accent-soft: #ECECFB;   /* tint at ~10% opacity, hand-mixed */
}
```

To derive `--accent-soft`: open the brand hex in a color tool, lower saturation, raise lightness toward the bg. Or use `color-mix(in srgb, var(--accent) 12%, var(--bg))` if the build can use modern CSS.

**Full palette override** (the user provided bg, accent, text)

```css
:root {
  /* ... typography variables from chosen preset unchanged ... */
  --bg: #F4ECE3;       /* brand-provided */
  --surface: #FFFEFB;  /* slight lift from bg, hand-mixed */
  --text: #1A1410;     /* brand-provided */
  --text-muted: #6B5D52;  /* darker than --text-subtle, lighter than --text */
  --text-subtle: #A89887; /* mid-tone */
  --border: #D9CFC0;   /* slight darkening of bg, hand-mixed */
  --accent: #B8410C;   /* brand-provided */
  --accent-soft: #F5DDD0; /* hand-mixed tint */
}
```

When mixing dependent values (surface, border, muted text), aim for the same *relationships* the original preset had between its values — not the same hex codes. The preset's grey is "border at 1 tonal step from bg"; preserve that step distance, not the exact hex.

### Brand name → palette inference

When the user says "match Stripe" or "match Linear" and you have confident memory of that brand's palette, apply it. When the brand is more obscure or you're guessing, ask for hex codes instead. A wrong inferred color is worse than asking.

### Picking the host preset for a brand override

Match the brand's typographic and structural sensibility, not the colors. Examples:

- Stripe-like brand colors (clean tech blues) → Minimal-mono preset
- Mailchimp-like brand colors (yellow + black) → Bold-pop preset
- A wellness brand's earth tones → Soft-organic preset
- A crypto brand's neon green → Dark-tech preset
- A luxury brand's deep navy + cream → Editorial preset

When in doubt, default to Minimal-mono as the host — it's the most neutral and overrides cleanly.
