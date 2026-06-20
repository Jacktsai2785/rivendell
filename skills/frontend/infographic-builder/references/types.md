# Infographic Types

This is the full catalog. Read the entries for the type(s) you're considering before building. Each entry has: when to use, what content shape fits, an ASCII layout sketch, and 1-2 example titles.

---

## Process / Steps

**When to use:** The content describes a sequence where order matters. "How to X." "The Y-step framework." Steps depend on each other; doing them out of order breaks the result.

**Content cues:** Verbs at the start of each item ("Choose...", "Set up...", "Validate..."). Numbered list in the source. Words like "first," "then," "next," "finally."

**Layout:**
```
┌──────────────────────────────────────┐
│ Title                                │
│ Subtitle/promise                     │
│                                      │
│ ┌──┐    ┌──┐    ┌──┐    ┌──┐         │
│ │01│ →  │02│ →  │03│ →  │04│         │
│ └──┘    └──┘    └──┘    └──┘         │
│ Step    Step    Step    Step          │
│ name    name    name    name          │
│ Body    Body    Body    Body          │
│                                      │
│ Footer / CTA                         │
└──────────────────────────────────────┘
```

Vertical variant for portrait dimensions: stack the steps with connector lines on the left margin.

**Examples:**
- "The 4-Step Process to Validate Your First Digital Product"
- "How an Etsy Listing Goes from Draft to Live"

---

## Stats Hero

**When to use:** The numbers themselves are the story. One headline metric, supported by 2-4 corroborating stats. Don't use when the trend matters more than the values — that's a timeline or chart.

**Content cues:** Percentages, counts, dollar amounts, ratios. Words like "we hit," "grew by," "now at."

**Layout:**
```
┌──────────────────────────────────────┐
│ Headline (the takeaway in one line)  │
│                                      │
│   ┌────────────────────┐             │
│   │      47%           │  ← hero    │
│   │   month-over-month │    metric   │
│   │   growth           │             │
│   └────────────────────┘             │
│                                      │
│   12,400        4.6 ★       8         │
│   new users     up from     features  │
│                  3.2         shipped  │
│                                      │
│ Context line / period covered        │
└──────────────────────────────────────┘
```

**Examples:**
- "Q4 in numbers"
- "What 6 months of ListingView looked like"

---

## Comparison

**When to use:** Two or three options being weighed against the same criteria. Reader should walk away knowing which one fits which situation. **Do not** use for an unranked list of features — that's a listicle.

**Content cues:** "X vs. Y." "Should I use A or B." Repeated attributes ("price," "speed," "ease").

**Layout (2-way):**
```
┌──────────────────────────────────────┐
│ Title (the question being settled)   │
│                                      │
│              Option A      Option B  │
│              ────────      ────────  │
│ Best for     beginners     teams     │
│ Price        free          $29/mo    │
│ Speed        slow          fast      │
│ ...          ...           ...       │
│                                      │
│ Verdict / when to pick which         │
└──────────────────────────────────────┘
```

Avoid the equal-columns-equal-treatment trap when one option is clearly better — let the design lean. Use color or weight to signal the recommended pick if there is one.

**Examples:**
- "Etsy ads vs. SEO: which to invest in first"
- "Printify vs. Printful for POD beginners"

---

## Timeline

**When to use:** Events along a time axis. The dates carry meaning, or the spacing between events does. Founding stories, product roadmaps, "how X evolved."

**Content cues:** Years, months, dates. "In 2019..." "Six months later..." "By Q3..."

**Layout (horizontal):**
```
┌──────────────────────────────────────┐
│ Title                                │
│                                      │
│ ●────────●────────●────────●────●    │
│ 2022    2023    Q1'24   Q3'24  Now   │
│ Event   Event   Event   Event  Event │
│ Body    Body    Body    Body   Body  │
│                                      │
└──────────────────────────────────────┘
```

Vertical variant for portrait: the axis runs down the left side, events branch right.

**Examples:**
- "How ListingView grew from idea to 10k users"
- "5 years of Etsy SEO algorithm changes"

---

## Hierarchy / Pyramid

**When to use:** Layers building on each other, where the bottom supports the top. Maslow's hierarchy, "the foundation of X," priority tiers, skill levels.

**Content cues:** "Foundation," "core," "advanced." "First master X, then Y." A clear "bottom" and "top."

**Layout:**
```
┌──────────────────────────────────────┐
│ Title                                │
│                                      │
│              /\                      │
│             /  \   Peak: advanced    │
│            /────\                    │
│           /      \  Middle: practice │
│          /────────\                  │
│         /          \ Base: fundamentals│
│        /────────────\                │
│                                      │
└──────────────────────────────────────┘
```

Stacked-rectangles variant is often more readable than a literal triangle, especially when each tier has meaningful body text.

**Examples:**
- "The 4 levels of an Etsy seller's journey"
- "Maslow's hierarchy of POD success"

---

## Cycle

**When to use:** Repeating loop where stages feed back into themselves. No clear start or end. Use sparingly — most "cycles" are actually processes that happen to repeat.

**Content cues:** "Loop," "cycle," "feedback," "compounding." A stage that explicitly leads back to the first.

**Layout:**
```
        ┌─────┐
        │  1  │
        └──↓──┘
   ┌────┐    ┌────┐
   │ 4  │    │ 2  │
   └──↑─┘    └──↓─┘
        ┌──↓──┐
        │  3  │
        └─────┘
```

**Examples:**
- "The content-to-product flywheel"
- "How customer feedback drives the next feature"

---

## Listicle

**When to use:** A set of distinct items the reader should know. Ranked or unranked. Most flexible type and most overused — make sure another type doesn't fit better first.

**Content cues:** "Top 5." "10 things." "Best X for Y." Bullet points in the source with little dependency between them.

**Layout (vertical, scannable):**
```
┌──────────────────────────────────────┐
│ Title — "5 X You Need to Know"       │
│                                      │
│ 01 │ Item name                       │
│    │ Body / explanation              │
│ ─────────────────────────────────    │
│ 02 │ Item name                       │
│    │ Body                            │
│ ─────────────────────────────────    │
│ 03 │ Item name                       │
│    │ Body                            │
│                                      │
└──────────────────────────────────────┘
```

When ranking matters, scale the number size or add a visual weight gradient. When it doesn't, keep items visually equal.

**Examples:**
- "5 Etsy SEO mistakes killing your listings"
- "7 prompts every Etsy seller should steal"

---

## Anatomy / Labeled Diagram

**When to use:** One thing with labeled parts. A product breakdown, "anatomy of a good X," diagrams pointing at features.

**Content cues:** "Parts of," "anatomy of," "elements of." Labels with leader lines in the source.

**Layout:**
```
┌──────────────────────────────────────┐
│ Title — "Anatomy of a great X"       │
│                                      │
│  Label ─────┐                        │
│             │   ┌────────────┐       │
│             └──→│            │       │
│  Label ─────────│   THING    │       │
│                 │            │←──────│ Label
│                 └────────────┘       │
│                       ↑              │
│                       │ Label        │
│                                      │
└──────────────────────────────────────┘
```

Requires an actual illustration of the thing being labeled (SVG). When the thing is abstract (a "great listing"), use a stylized representation — a mock listing card with callouts works.

**Examples:**
- "Anatomy of a 5-figure Etsy listing"
- "What makes a lead magnet that actually converts"
