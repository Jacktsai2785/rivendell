# Interactivity

Three levels: **Off / Medium / High**. Ask the user during intake. Default to **Medium** for any HTML deliverable that won't be immediately flattened.

The dial:

- **Off** — no motion, no JS, no transitions. A flat document.
- **Medium** — subtle motion that triggers on load and reward hovering. Static end-state is identical to Off, so screenshots still work.
- **High** — the infographic becomes a small tool. Tooltips, click-to-expand, view toggles, filter chips, hover-to-isolate on data viz.

The differences:

| | Off | Medium | High |
|---|---|---|---|
| Entrance animation | — | ✓ | ✓ |
| Counter-up on stats | — | ✓ | ✓ |
| Hover lift on cards | — | ✓ | ✓ |
| Accent pulse | — | ✓ | ✓ |
| **Tooltips on terms/data** | — | — | ✓ |
| **Click-to-expand** | — | — | ✓ |
| **View toggle / filters** | — | — | ✓ |
| **Hover-to-isolate on viz** | — | — | ✓ |
| Screenshot-safe? | yes | yes | partial (loses interaction) |

---

## Off

No JavaScript. No CSS animations or transitions. Static document.

Use only when:
- The user explicitly chose Off
- The deliverable is being immediately exported to PNG/PDF and the live HTML is throwaway

This is not the default — it's an explicit downgrade.

---

## Medium (default)

Subtle motion. No clicks required to "get it." The static end-state is identical to Off.

What "Medium" should include by default on every build:

- **Entrance stagger** — main sections fade/translate in sequentially on load (200-400ms total)
- **Counter-ups on numbers** — big stats count from 0 to target when they enter the viewport
- **Hover lift on cards** — list items, stat cards, callouts gently raise + glow on hover
- **Accent pulse** — the brand mark or one signal indicator gently pulses

### Pattern: Entrance stagger

```css
.canvas > * {
  opacity: 0;
  transform: translateY(8px);
  animation: enter 600ms cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
}
.canvas > *:nth-child(1) { animation-delay: 0ms; }
.canvas > *:nth-child(2) { animation-delay: 80ms; }
.canvas > *:nth-child(3) { animation-delay: 160ms; }
.canvas > *:nth-child(4) { animation-delay: 240ms; }

@keyframes enter { to { opacity: 1; transform: translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .canvas > * { animation: none; opacity: 1; transform: none; }
}
```

### Pattern: Counter-up

```html
<span class="count" data-count="12418" data-format="comma">0</span>
<span class="count" data-count="47" data-suffix="%">0</span>
```

```javascript
const counts = document.querySelectorAll('.count');
counts.forEach(el => {
  const suffix = el.dataset.suffix || '';
  el.textContent = '0' + suffix;
});

const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const format = el.dataset.format;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min((t - start) / 1100, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.floor(target * eased);
      el.textContent = (format === 'comma' ? v.toLocaleString() : v) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    setTimeout(() => requestAnimationFrame(tick), 350);
    io.unobserve(el);
  });
}, { threshold: 0.4 });
counts.forEach(c => io.observe(c));
```

### Pattern: Hover lift

```css
.card, .callout, .stat, .item {
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}
.card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
```

### Pattern: Accent pulse

```css
.brand-mark { animation: pulse 2.6s ease-in-out infinite; }
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(98, 94, 235, 0.4); }
  50%      { box-shadow: 0 0 0 8px rgba(98, 94, 235, 0); }
}
```

---

## High

The infographic becomes a small tool. Includes everything from Medium, plus the patterns below. Pick the ones that earn their place — don't bolt all five onto every build.

### Pattern: Tooltips on terms and data points (the High signature)

The headline feature of High. Tooltips unlock real content density — you can put domain terms, source attributions, definitions, and secondary stats inline without crowding the canvas. Mark anything that benefits from explanation with a hairline dashed underline so the reader knows it's tappable/hoverable.

```html
<span class="tooltip-trigger">
  VAK model
  <span class="tooltip">Visual–Auditory–Kinesthetic. Popularized by Neil Fleming in 1992.</span>
</span>
```

```css
.tooltip-trigger {
  position: relative;
  cursor: help;
  border-bottom: 1px dashed currentColor;
  text-decoration: none;
}
.tooltip-trigger .tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  background: var(--text);
  color: var(--surface);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 400;
  font-style: normal;
  line-height: 1.4;
  padding: 8px 12px;
  border-radius: 6px;
  width: max-content;
  max-width: 240px;
  letter-spacing: 0;
  text-transform: none;
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease, transform 180ms ease;
  z-index: 100;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
}
.tooltip-trigger .tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--text);
}
.tooltip-trigger:hover .tooltip,
.tooltip-trigger:focus-visible .tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
```

For dark aesthetics, swap the tooltip background to a lighter contrasting color:
```css
.tooltip-trigger .tooltip {
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
}
.tooltip-trigger .tooltip::after { border-top-color: var(--surface-2); }
```

**When to use tooltips:**
- Domain-specific abbreviations or jargon (VAK, NPS, MoM, CAC, LTV)
- Stats that benefit from source attribution or caveats
- Category labels that have nuanced definitions (the three learner types, tiers in a hierarchy)
- Anything you'd otherwise have had to cut for space

**Don't tooltip everything.** Pick 3-7 elements that genuinely benefit. More than that and the reader doesn't know where to look.

### Pattern: Click-to-expand

Use `<details>` — native, no JS for the toggle itself.

```html
<details class="item">
  <summary>
    <span class="num">01</span>
    <span class="label">Stuffing the same keyword in every tag</span>
    <span class="chevron">+</span>
  </summary>
  <div class="detail">
    <p>Long-form explanation hidden by default. Add data, examples, sources — anything that would have overflowed the canvas.</p>
  </div>
</details>
```

```css
.item summary {
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 16px;
}
.item summary::-webkit-details-marker { display: none; }
.item .chevron { margin-left: auto; transition: transform 220ms ease; font-size: 20px; }
.item[open] .chevron { transform: rotate(45deg); }
.item[open] .detail {
  animation: slide-down 260ms ease;
  padding-top: 12px;
}
@keyframes slide-down {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Pattern: View toggle

```html
<div class="view-toggle">
  <button data-view="chart" class="active">Chart</button>
  <button data-view="table">Table</button>
</div>
<section class="view-chart">…</section>
<section class="view-table" hidden>…</section>
<script>
  document.querySelectorAll('.view-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      document.querySelectorAll('.view-toggle button').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('[class^="view-"]').forEach(s => {
        s.hidden = !s.className.endsWith(view);
      });
    });
  });
</script>
```

### Pattern: Filter chips

```html
<div class="filters">
  <button data-filter="all" class="active">All</button>
  <button data-filter="seo">SEO</button>
  <button data-filter="pricing">Pricing</button>
</div>
<div class="items">
  <article data-tag="seo">…</article>
  <article data-tag="pricing">…</article>
</div>
<script>
  const filters = document.querySelectorAll('.filters button');
  const items = document.querySelectorAll('.items article');
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.classList.toggle('active', b === btn));
      const tag = btn.dataset.filter;
      items.forEach(item => {
        item.style.display = (tag === 'all' || item.dataset.tag === tag) ? '' : 'none';
      });
    });
  });
</script>
```

### Pattern: Hover-to-isolate on data viz

Useful on dot grids, distribution charts, multi-series bar charts. Hovering a legend entry dims everything that doesn't belong to that group.

```css
.viz.hover-groupA .dot:not(.groupA) { filter: opacity(0.18); }
.viz.hover-groupB .dot:not(.groupB) { filter: opacity(0.18); }
.viz .dot { transition: filter 220ms ease; }
```

```javascript
document.querySelectorAll('.legend-row').forEach(row => {
  row.addEventListener('mouseenter', () => {
    viz.classList.remove('hover-groupA', 'hover-groupB');
    viz.classList.add('hover-' + row.dataset.group);
  });
  row.addEventListener('mouseleave', () => {
    viz.classList.remove('hover-groupA', 'hover-groupB');
  });
});
```

---

## Hard constraints (all levels)

- **Inline everything.** No CDNs, no icon packs. File must open offline.
- **Degrade gracefully.** If JS fails, content stays readable. Counter-ups fall back to showing the target number, not "0."
- **Static end-state is canonical.** First-frame and final-frame of any animation must both be screenshot-able and complete.
- **Respect `prefers-reduced-motion`.** Always include the media query that disables animations + snaps counter-ups to final values.
- **No infinite loops on main content.** Pulse on a small indicator is OK. Breathing animation on a headline is annoying.
- **Tooltips need a `:focus-visible` state too** — keyboard users should get them. Use both `:hover` and `:focus-visible` triggers.
- **Counter-ups only on numbers that benefit.** Skip anything under ~20. "8" counting up is too fast to read.
- **Keep `.canvas` overflow as `hidden`.** Never set canvas overflow to `visible` to make tooltips escape — it breaks the border-radius and lets content bleed past the rounded corners. Tooltips use `position: absolute` with `z-index: 100`, which already layers them above canvas content within the canvas bounds.
- **Position tooltips so they stay inside the canvas.** Before shipping, mentally trace each tooltip's position: a tooltip with `max-width: 240px` centered on a trigger near the right edge of the canvas will extend off the right side. Use the `.tooltip.right` right-anchored variant (or `.tooltip.left`) for triggers in the outer ~150px of the canvas. Default above-centered tooltips only work when the trigger is at least ~130px from any edge.
- **Don't decorate giant display numbers with tooltip underlines.** A 1px dashed underline beneath a 100px+ number reads as a rendering glitch, not a deliberate UI cue. If a hero stat needs a tooltip, attach it to the descriptive label next to the number, not to the number itself. (The information is usually duplicated elsewhere — e.g. a legend row — and the legend row is a better tooltip host.)

## Quick decision

When the deliverable is HTML and the user didn't specify a level:

- Default to **Medium** for almost everything
- Recommend **High** when: the page lives on a marketing site OR the content has terms/jargon that need tooltips OR there's secondary detail you'd otherwise have to cut
- Use **Off** only when the user said "static" or the live HTML is throwaway (going straight to PNG/PDF export)
