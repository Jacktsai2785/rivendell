---
name: review-pr
description: >
  Analyzes PR changes for correctness, security, performance, and best practices.
  TRIGGER when: user says /review-pr, asks to review a pull request, or provides a PR URL/number.
  DO NOT TRIGGER when: reviewing local code without a PR (use code-reviewer),
  or creating a PR (use git commands directly).
tags: [git]
version: 1
user_invocable: true
---

# review-pr

## Instructions

When reviewing a pull request, follow this structured process:

### Step 1: Gather PR context

```bash
# Get PR details
gh pr view <number> --json title,body,files,additions,deletions,baseRefName,headRefName

# Get the diff
gh pr diff <number>

# Check CI status
gh pr checks <number>
```

If no PR number given, check the current branch:
```bash
gh pr view --json title,body,files,additions,deletions
```

### Step 2: Analyze changes

For each changed file, evaluate:

1. **Correctness** — Does the logic work? Edge cases handled?
2. **Security** — Input validation, injection risks, secrets exposure?
3. **Performance** — N+1 queries, unnecessary re-renders, memory leaks?
4. **Readability** — Clear naming, appropriate abstractions, comments where needed?
5. **Testing** — Are changes tested? Are tests meaningful?
6. **Breaking changes** — API compatibility, migration needs?

### Step 3: Provide structured feedback

Format your review as:

```
## PR Review: <title>

### Summary
<1-2 sentence overview of what this PR does>

### Verdict: ✅ Approve / ⚠️ Request Changes / 💬 Comment

### Issues Found
- 🔴 **Critical**: <must fix before merge>
- 🟡 **Suggestion**: <would improve but not blocking>
- 🟢 **Nitpick**: <style/preference, take it or leave it>

### What's Good
- <positive observations>
```

### Step 4: Submit review (if requested)

Only submit the review on GitHub if the user explicitly asks to post it:
```bash
gh pr review <number> --approve --body "..."
gh pr review <number> --request-changes --body "..."
gh pr review <number> --comment --body "..."
```
