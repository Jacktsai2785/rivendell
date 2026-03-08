---
name: requirement
description: >
  Define structured requirements, user stories, and acceptance criteria for a feature.
  TRIGGER when: user says "define requirement", "write user story", "what should we build",
  or describes a feature idea without clear scope.
  DO NOT TRIGGER when: requirements already exist and user is asking to implement.
tags: [workflow]
version: 1
source: manual
user_invocable: true
---

# Requirement Definition

Produce a structured requirement document before any design or implementation begins.

**Announce at start:** "I'm using the Requirement skill to define the scope."

## Instructions

### Step 1: Clarify the Goal

Ask the user (skip questions they already answered):

1. **Who** is the target user?
2. **What** problem does this solve?
3. **Why** now — what's the trigger or business context?

### Step 2: Write User Stories

For each distinct user action, produce:

```markdown
### US-{N}: {title}

**As a** {role}
**I want to** {action}
**So that** {benefit}

**Acceptance Criteria:**
- [ ] Given {context}, when {action}, then {result}
- [ ] Given {context}, when {edge case}, then {fallback}
```

Rules:
- One story per user action — don't bundle
- Acceptance criteria must be testable (no "should be nice")
- Include at least one error/edge case per story

### Step 3: Define Scope Boundary

Produce a two-column table:

| In Scope | Out of Scope |
|----------|-------------|
| ... | ... |

This prevents scope creep later.

### Step 4: Output

Save to `docs/requirements/{feature-name}.md` (ask user for feature name if unclear).

### Step 5: Handoff

After saving, prompt:

> **Requirement complete.** Next step: define the user flow.
> Run `/user-flow` or describe the main user journey to continue.
