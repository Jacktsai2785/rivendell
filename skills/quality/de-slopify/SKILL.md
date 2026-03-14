---
name: De-Slopify
description: Remove telltale signs of AI-generated "slop" writing from documentation and prose. Make text sound authentically human-written.
when_to_use: before publishing READMEs, documentation, blog posts, or any public-facing text; after AI-assisted writing sessions; during documentation reviews
version: 1.0.0
tags: [writing, quality, documentation]
languages: all
user_invocable: true
---

# De-Slopify — Remove AI Writing Artifacts

## Overview

AI slop refers to writing patterns that LLMs produce disproportionately more often than human writers. These patterns make text sound inauthentic and cringe-worthy. You cannot fix this with regex or a script. It requires manual, systematic review of each line.

**Core principle:** Read every line. Recast sentences. Use judgment. Use ultrathink.

## When to Use

- Before publishing a README or documentation
- Before releasing blog posts or public-facing text
- After AI-assisted writing sessions
- During documentation reviews
- When text "feels AI-generated" but you can't pinpoint why

Files to check: README.md, CONTRIBUTING.md, API documentation, blog posts, any public-facing prose.

## THE EXACT PROMPT — De-Slopify Documentation

```
I want you to read through the complete text carefully and look for any telltale signs of "AI slop" style writing; one big tell is the use of emdash. You should try to replace this with a semicolon, a comma, or just recast the sentence accordingly so it sounds good while avoiding emdash.

Also, you want to avoid certain telltale writing tropes, like sentences of the form "It's not [just] XYZ, it's ABC" or "Here's why" or "Here's why it matters:".  Basically, anything that sounds like the kind of thing an LLM would write disproportionately more commonly that a human writer and which sounds inauthentic/cringe.

And you can't do this sort of thing using regex or a script, you MUST manually read each line of the text and revise it manually in a systematic, methodical, diligent way. Use ultrathink.
```

### Quick Version (for minor touch-ups)

```
Review this text and remove any AI slop patterns: excessive emdashes, "Here's why" constructions, "It's not X, it's Y" formulas, and other LLM writing tells. Recast sentences to sound more naturally human. Use ultrathink.
```

## Common English Slop Patterns

### Emdash Overuse

LLMs love emdashes. When you encounter one (—), consider:

| Original | Alternative |
|----------|-------------|
| `X—Y—Z` | `X; Y; Z` or `X, Y, Z` |
| `The tool—which is powerful—works well` | `The tool, which is powerful, works well` |
| `We built this—and it works` | `We built this, and it works` |
| `Here's the thing—it matters` | `Here's the thing: it matters` or recast entirely |

Sometimes the best fix is to split into two sentences or restructure entirely.

### "Here's why" Family

- "Here's why" -> Just explain why directly
- "Here's why it matters" -> Explain the importance inline
- "Here's the thing" -> Usually can be deleted entirely

### Contrast Formulas

- "It's not X, it's Y" -> "This is Y" or explain the distinction differently
- "It's not just X, it's also Y" -> "This does X and Y" or similar

### Forced Enthusiasm

- "Let's dive in!" -> Just start
- "Let's get started!" -> Just start
- "Excited to share..." -> Just share it

### Pseudo-Profound Openers

- "At its core..." -> Usually can be deleted
- "Fundamentally..." -> Often unnecessary
- "In essence..." -> Just say the essence

### Unnecessary Hedges

- "It's worth noting that..." -> Just note it
- "It's important to remember..." -> Just state the fact
- "Keep in mind that..." -> Often deletable

## Common Chinese (Traditional) Slop Patterns

When reviewing Traditional Chinese text, also watch for these AI tells:

### Filler Phrases

| Pattern | Problem | Fix |
|---------|---------|-----|
| 值得注意的是 | Unnecessary hedge, same as English "It's worth noting" | Just state the fact directly |
| 讓我們深入了解 | "Let's dive in" in Chinese | Just start explaining |
| 總而言之 | Overused summarizer | Cut it, or use a more natural transition |
| 事不宜遲，讓我們開始吧 | "Without further ado, let's begin" | Just begin |

### Structural Formulas

- 「不僅僅是X，更是Y」-> Same as English "It's not just X, it's Y." Recast to state what it actually is.
- 「換句話說」-> Often deletable. If the rephrasing is needed, just say it without the preamble.
- 「毫無疑問」-> Overused emphasis. If something is obvious, it doesn't need this qualifier.

### Emoji Overuse

LLMs writing Chinese text tend to insert excessive emojis. Remove them unless they serve a genuine purpose (e.g., in casual social media copy where emojis are expected).

## Before and After Examples

### Example 1: Emdash Overuse

**Before (sloppy):**
```
This tool—which we built from scratch—handles everything automatically—from parsing to output.
```

**After (clean):**
```
This tool handles everything automatically, from parsing to output. We built it from scratch.
```

### Example 2: "Here's why" Pattern

**Before (sloppy):**
```
We chose Rust for this component. Here's why: performance matters, and Rust delivers.
```

**After (clean):**
```
We chose Rust for this component because performance matters.
```

### Example 3: Contrast Formula

**Before (sloppy):**
```
It's not just a linter—it's a complete code quality system.
```

**After (clean):**
```
This complete code quality system goes beyond basic linting.
```

### Example 4: Forced Enthusiasm

**Before (sloppy):**
```
# Getting Started

Let's dive in! We're excited to help you get up and running with our amazing tool.
```

**After (clean):**
```
# Getting Started

Install the tool and run your first command in under a minute.
```

### Example 5: Chinese Slop

**Before (sloppy):**
```
值得注意的是，這個框架不僅僅是一個工具，更是一種全新的開發方式。讓我們深入了解它的核心功能吧！
```

**After (clean):**
```
這個框架提供了一套完整的開發方式，而不只是單一工具。以下說明它的主要功能。
```

## Why Manual Review is Required

1. **Context matters** - Sometimes an emdash is actually the right choice
2. **Recasting sentences** - Often the fix is not substitution but rewriting
3. **Tone consistency** - Need to maintain voice throughout
4. **Judgment calls** - Some patterns are fine in moderation

## What NOT to Fix

Some things are fine even if they seem "AI-like":

- **Technical accuracy** - Do not sacrifice correctness for style
- **Necessary structure** - Headers, lists, tables are fine
- **Clear explanations** - Being thorough is not slop
- **Code examples** - Focus on prose, not code

## Process

1. Read the entire text once to understand overall tone and content
2. Go through line by line using ultrathink
3. For each sentence, ask: "Would a human writer actually phrase it this way?"
4. Apply fixes: recast sentences, replace emdashes, remove filler phrases
5. Read the full text again to verify consistent tone
6. Verify no meaning was lost in the process
