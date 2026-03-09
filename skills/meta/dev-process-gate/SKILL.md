---
name: dev-process-gate
description: >
  Enforce development workflow: requirement → user-flow → wireframe → mockup → development → QA testing.
  TRIGGER when: user asks to build a feature, create a page, or implement UI functionality
  without providing requirements or design artifacts first, OR when development is complete
  and no tests have been written yet.
  DO NOT TRIGGER when: requirements/flows already exist and tests are written, or task is
  a bug fix, refactor, CLI tool, or backend-only change with no UI.
tags: [meta]
version: 1
source: manual
user_invocable: false
---

# Development Process Gate

Ensure the team follows the design-first workflow before writing code.

## Workflow Stages

```
1. Requirement  →  2. User Flow  →  3. Wireframe  →  4. Mockup  →  5. Development  →  6. QA Testing
   /requirement      /user-flow     ui-ux-pro-max   frontend-design  writing-plans     qa-testing
```

## Instructions

When the user requests a new feature or page, check what artifacts exist before proceeding.

### Step 1: Detect Existing Artifacts

Look for these in the current project:

| Stage | Look for | Location |
|-------|---------|----------|
| Requirement | User stories, acceptance criteria | `docs/requirements/` |
| User Flow | Mermaid flowcharts, screen inventory | `docs/flows/` |
| Wireframe | Low-fidelity layouts, component lists | `docs/wireframes/` or inline |
| Mockup | High-fidelity designs, style specs | `docs/mockups/` or inline |
| QA Testing | Test files matching the feature | `tests/`, `__tests__/`, `*Tests/` |

Also check if the user mentioned or linked any of these in their message.

### Step 2: Report Status & Guide

Report what's missing and suggest the next step:

**If no requirement:**
> Before building, let's define what we're building.
> I'll use the **requirement** skill to create user stories and scope.

**If requirement exists but no flow:**
> Requirements look good. Let's map the user journey next.
> I'll use the **user-flow** skill to create a flowchart.

**If flow exists but no wireframe:**
> Flow is defined. Let's sketch the layout before coding.
> I can use **ui-ux-pro-max** to guide component choices and layout.

**If wireframe exists but no mockup:**
> Layout is set. Let's finalize the visual design.
> I'll use **frontend-design** to create the high-fidelity mockup.

**If all design stages complete but no implementation:**
> All design artifacts are ready. Let's plan the implementation.
> I'll use **writing-plans** to create development tasks.

**If development is complete but no tests:**
> Implementation looks done. Before we call it finished, let's verify it works.
> I'll use **qa-testing** to write tests — especially verifying that the UI matches the mockup/requirement.

Specifically check:
1. **Acceptance criteria coverage** — each criterion in the requirement should have at least one test
2. **UI behavior tests** — key user interactions from the user-flow should be tested (use webapp-testing for web, XCUITest for iOS)
3. **Unit tests** — core logic added during development should have unit tests

**If all stages complete including tests:**
> Feature is complete with tests. Ready for code review.
> Run **code-reviewer** for a final check if desired.

### Step 3: Respect Overrides

If the user explicitly says to skip a stage (e.g., "just code it", "skip wireframe"), comply but note:

> Skipping wireframe stage as requested. You can always revisit with `/user-flow`.

Do NOT block the user — this is guidance, not a hard gate.

### When NOT to Gate

Skip this check entirely for:
- Bug fixes and patches
- Refactoring or code cleanup
- CLI tools, scripts, configs
- Backend-only changes with no UI
- Tasks where the user provides complete specs in their message
