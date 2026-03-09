---
name: setup-permissions
description: >
  Detect project tooling and configure Claude Code permissions automatically.
  TRIGGER when: user says /setup-permissions, or .claude/settings.local.json
  is missing in a project that has package.json, pyproject.toml, Makefile,
  Cargo.toml, go.mod, or other tooling indicators.
  DO NOT TRIGGER when: .claude/settings.local.json already exists with allow entries.
tags: [meta]
version: 1
user_invocable: false
---

# setup-permissions

Automatically configure Claude Code permission allowlists based on detected project tooling.

## Instructions

When invoked, follow these steps:

### Step 1: Ensure global baseline exists

Read `~/.claude/settings.json`. If it doesn't have a `permissions` key, write this baseline (preserving other keys like `enabledPlugins`, `alwaysThinkingEnabled`):

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
      "WebFetch(domain:localhost)",
      "Bash(git *)",
      "Bash(gh *)",
      "Bash(which *)",
      "Bash(command -v *)",
      "Bash(command *)",
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
      "Bash(rm *)",
      "Bash(chmod *)",
      "Bash(date*)",
      "Bash(env *)",
      "Bash(export *)",
      "Bash(source *)",
      "Bash(bash *)",
      "Bash(sh *)",
      "Bash(ln *)",
      "Bash(tree *)",
      "Bash(diff *)",
      "Bash(test *)",
      "Bash([ *)",
      "Bash(readlink *)",
      "Bash(realpath *)",
      "Bash(file *)",
      "Bash(stat *)",
      "Bash(open *)",
      "Bash(lsof *)",
      "Bash(kill *)",
      "Bash(pkill *)",
      "Bash(dirname *)",
      "Bash(basename *)",
      "Bash(xargs *)",
      "Bash(tee *)",
      "Bash(true*)",
      "Bash(false*)",
      "Bash(brew *)",
      "Bash(screencapture *)",
      "Bash(osascript *)",
      "Bash(* --version)",
      "Bash(* --help*)",
      "Bash(* -h)",
      "Bash(./bin/*)",
      "Bash(./scripts/*)"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(sudo rm -rf *)",
      "Bash(> /dev/sda*)",
      "Bash(dd if=*)"
    ]
  }
}
```

If baseline already exists, skip this step.

### Step 2: Detect project tooling

Scan the current project root for these indicators:

#### Package managers & runtimes

| File | Detected Tools | Permissions to Add |
|------|---------------|-------------------|
| `package.json` | Node.js, npm | `Bash(npm *)`, `Bash(npx *)`, `Bash(node *)` |
| `package.json` with `bun.lock` / `bun.lockb` | bun | `Bash(bun *)`, `Bash(bunx *)` |
| `package.json` with `yarn.lock` | yarn | `Bash(yarn *)` |
| `package.json` with `pnpm-lock.yaml` | pnpm | `Bash(pnpm *)`, `Bash(pnpx *)` |
| `pyproject.toml` or `requirements.txt` | Python | `Bash(python *)`, `Bash(python3 *)`, `Bash(pip *)`, `Bash(pip3 *)` |
| `pyproject.toml` with `[tool.poetry]` | poetry | `Bash(poetry *)` |
| `uv.lock` or `[tool.uv]` in pyproject | uv | `Bash(uv *)` |
| `Cargo.toml` | Rust | `Bash(cargo *)`, `Bash(rustc *)` |
| `go.mod` | Go | `Bash(go *)` |
| `Gemfile` | Ruby | `Bash(bundle *)`, `Bash(ruby *)`, `Bash(rake *)` |

#### Apple / Xcode

| File | Detected Tools | Permissions to Add |
|------|---------------|-------------------|
| `Package.swift` or `*.xcodeproj` or `project.yml` | Swift/Xcode | `Bash(swift *)`, `Bash(swiftc *)`, `Bash(xcodebuild *)`, `Bash(xcode-select *)`, `Bash(xcrun *)` |
| `project.yml` | XcodeGen | `Bash(xcodegen *)` |
| `Podfile` | CocoaPods | `Bash(pod *)` |
| iOS/macOS project (any Xcode indicator) | Simulator & macOS tools | `Bash(xcrun simctl *)`, `Bash(osascript *)`, `Bash(screencapture *)`, `Bash(plutil *)`, `Bash(defaults *)` |

#### Build & infrastructure

| File | Detected Tools | Permissions to Add |
|------|---------------|-------------------|
| `Makefile` | make | `Bash(make *)` |
| `CMakeLists.txt` | cmake | `Bash(cmake *)`, `Bash(make *)` |
| `firebase.json` or `.firebaserc` | Firebase CLI | `Bash(firebase *)` |
| `Dockerfile` or `docker-compose.yml` | Docker | `Bash(docker *)`, `Bash(docker-compose *)` |
| `k8s/` or `*.yaml` with kind: Deployment | k8s | `Bash(kubectl *)` |
| `.terraform/` or `*.tf` | Terraform | `Bash(terraform *)` |

#### Python tools (scan `pyproject.toml` and `requirements.txt`)

| Indicator | Detected Tools | Permissions to Add |
|-----------|---------------|-------------------|
| `streamlit` in deps | Streamlit | `Bash(streamlit *)` |
| `uvicorn` in deps | uvicorn | `Bash(uvicorn *)` |
| `fastapi` in deps | FastAPI dev server | `Bash(uvicorn *)`, `Bash(fastapi *)` |
| `pytest` in deps or `[tool.pytest]` | pytest | `Bash(pytest *)`, `Bash(python -m pytest *)` |
| `[tool.ruff]` or `ruff` in deps | ruff | `Bash(ruff *)` |
| `[tool.black]` or `black` in deps | black | `Bash(black *)` |
| `[tool.mypy]` or `mypy` in deps | mypy | `Bash(mypy *)` |
| `.pre-commit-config.yaml` | pre-commit | `Bash(pre-commit *)` |
| `playwright` in deps | Playwright | `Bash(playwright *)`, `Bash(python -m playwright *)` |

#### JS/TS tools (scan `package.json` scripts & deps)

| Indicator | Detected Tools | Permissions to Add |
|-----------|---------------|-------------------|
| `vitest` in scripts/deps | Vitest | `Bash(vitest *)`, `Bash(npx vitest *)` |
| `jest` in scripts/deps | Jest | `Bash(jest *)`, `Bash(npx jest *)` |
| `eslint` in scripts/deps | ESLint | `Bash(eslint *)`, `Bash(npx eslint *)` |
| `prettier` in scripts/deps | Prettier | `Bash(prettier *)`, `Bash(npx prettier *)` |
| `next` in scripts/deps | Next.js | `Bash(next *)`, `Bash(npx next *)` |
| `nuxt` or `nuxi` in scripts/deps | Nuxt | `Bash(nuxt *)`, `Bash(npx nuxi *)`, `Bash(npx nuxt *)` |
| `turbo` in scripts/deps | Turborepo | `Bash(turbo *)`, `Bash(npx turbo *)` |
| `wrangler` in scripts/deps | Cloudflare Workers | `Bash(wrangler *)`, `Bash(npx wrangler *)` |
| `tsx` in deps | tsx | `Bash(npx tsx *)` |
| `playwright` in deps | Playwright | `Bash(playwright *)`, `Bash(npx playwright *)` |

#### Database tools

| Indicator | Detected Tools | Permissions to Add |
|-----------|---------------|-------------------|
| `*.db` files or `sqlite` in deps | SQLite | `Bash(sqlite3 *)` |
| `prisma` in deps | Prisma | `Bash(npx prisma *)` |
| `drizzle` in deps | Drizzle | `Bash(npx drizzle-kit *)` |

#### Project-local scripts

Also check for project-specific CLI tools:
- `./bin/*`, `./scripts/*` -> add `Bash(./bin/*)`, `Bash(./scripts/*)`
- `Makefile` targets -> add `Bash(make <target>)` for common targets
- Extract all unique command prefixes from `package.json` scripts values

### Step 3: Write project-local permissions

Write detected permissions to `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      // Only project-specific tools NOT in global baseline
      // e.g. "Bash(npm *)", "Bash(vitest *)", "Bash(./bin/dev *)"
    ],
    "deny": []
  }
}
```

Rules:
- Do NOT duplicate anything already in global `settings.json`
- Only add tools actually detected in this project
- If `.claude/settings.local.json` already has entries, MERGE (don't overwrite) — add new detections, keep existing custom rules
- Remove one-off command entries (like hardcoded `git commit -m "..."` lines) — replace with generic patterns (like `Bash(git *)`)
- Clean up colon-style patterns (`Bash(cmd:*)`) — use space-style (`Bash(cmd *)`) for consistency

### Step 4: Report

Show a summary:

```
Project: ~/my-project
Detected: Node.js (bun), TypeScript, Vitest, Docker

Global baseline: (exists | written)

Project permissions (.claude/settings.local.json):
  Added:
    + Bash(bun *)
    + Bash(bunx *)
    + Bash(vitest *)
    + Bash(docker *)
    + Bash(docker-compose *)
    + Bash(./bin/dev *)
  Kept (existing):
    = Bash(custom-tool *)
  Cleaned up:
    - Bash(git -C /full/path/to/project commit -m "...")  (covered by global)

Restart Claude Code for changes to take effect.
```
