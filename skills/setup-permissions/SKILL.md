---
name: setup-permissions
description: Set up Claude Code permission allowlists for common dev workflows
tags: [meta]
user_invocable: true
---

# setup-permissions

## Instructions

This skill configures Claude Code permission allowlists so common operations don't require manual approval each time.

When invoked, do the following:

### 1. Read current settings

Read both files if they exist:
- `~/.claude/settings.json` (global)
- `.claude/settings.local.json` (project-local)

### 2. Write global permissions

Update `~/.claude/settings.json`, preserving any existing non-permissions keys (like `alwaysThinkingEnabled`, `enabledPlugins`, etc.). Set the `permissions` key to:

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Edit",
      "Write",
      "Glob",
      "Grep",
      "WebSearch",
      "WebFetch(domain:github.com)",
      "WebFetch(domain:npmjs.com)",
      "WebFetch(domain:pypi.org)",
      "WebFetch(domain:docs.anthropic.com)",
      "WebFetch(domain:stackoverflow.com)",
      "WebFetch(domain:developer.mozilla.org)",
      "Bash(git status*)",
      "Bash(git log *)",
      "Bash(git diff*)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git checkout *)",
      "Bash(git branch*)",
      "Bash(git merge *)",
      "Bash(git rebase *)",
      "Bash(git stash*)",
      "Bash(git remote -v*)",
      "Bash(git fetch*)",
      "Bash(git tag *)",
      "Bash(git init*)",
      "Bash(git clone *)",
      "Bash(gh *)",
      "Bash(npm *)",
      "Bash(npx *)",
      "Bash(yarn *)",
      "Bash(pnpm *)",
      "Bash(bun *)",
      "Bash(node *)",
      "Bash(python *)",
      "Bash(python3 *)",
      "Bash(pip *)",
      "Bash(pip3 *)",
      "Bash(uv *)",
      "Bash(cargo *)",
      "Bash(rustc *)",
      "Bash(go *)",
      "Bash(swift *)",
      "Bash(swiftc *)",
      "Bash(xcodebuild *)",
      "Bash(make *)",
      "Bash(cmake *)",
      "Bash(docker *)",
      "Bash(docker-compose *)",
      "Bash(kubectl *)",
      "Bash(brew *)",
      "Bash(which *)",
      "Bash(command -v *)",
      "Bash(type *)",
      "Bash(ls*)",
      "Bash(pwd)",
      "Bash(cat *)",
      "Bash(head *)",
      "Bash(tail *)",
      "Bash(wc *)",
      "Bash(find *)",
      "Bash(grep *)",
      "Bash(rg *)",
      "Bash(sort *)",
      "Bash(uniq *)",
      "Bash(cut *)",
      "Bash(tr *)",
      "Bash(sed *)",
      "Bash(awk *)",
      "Bash(jq *)",
      "Bash(curl *)",
      "Bash(wget *)",
      "Bash(echo *)",
      "Bash(printf *)",
      "Bash(touch *)",
      "Bash(mkdir *)",
      "Bash(cp *)",
      "Bash(mv *)",
      "Bash(chmod *)",
      "Bash(date *)",
      "Bash(env *)",
      "Bash(export *)",
      "Bash(source *)",
      "Bash(* --version)",
      "Bash(* --help*)",
      "Bash(* -h)",
      "Bash(./bin/sk *)",
      "Bash(skills *)"
    ],
    "deny": [
      "Bash(rm -rf /)*",
      "Bash(sudo rm -rf *)",
      "Bash(> /dev/sda*)",
      "Bash(dd if=*)"
    ]
  }
}
```

### 3. Clean up project-local settings

If `.claude/settings.local.json` exists and has a `permissions.allow` array full of one-off specific commands (like exact `Bash(...)` entries that are already covered by the global wildcard rules above), replace it with a minimal version:

```json
{
  "permissions": {
    "allow": []
  }
}
```

Keep any project-specific rules that are NOT covered by the global config.

### 4. Report what was done

After writing, show:
- What was written to `~/.claude/settings.json`
- What was cleaned from `.claude/settings.local.json`
- Remind the user to restart Claude Code for changes to take effect
- Mention they can use `/permissions` to verify
