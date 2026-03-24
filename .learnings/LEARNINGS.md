# Learnings

## 2026-03-18 — Repo rename breaks all agents and dashboard if not done systematically

- **Category**: best_practice
- **Context**: Renamed repo from `skills-test` to `rivendell`. Hardcoded repo name strings were scattered across LaunchAgent plists, agent cron scripts, dashboard lib, and projects.json. Dashboard also had a venv with stale absolute-path shebangs.
- **What breaks if rename is done manually without scanning**:
  - LaunchAgent plists (`~/Library/LaunchAgents/com.sk.agent.skills-test.*`) still point to old path → agents silently fail to run
  - Dashboard plists (`com.sk.dashboard.api/web.plist`) still point to old path → dashboard can't restart after reboot
  - `bin/sk-*-cron` scripts record runs under old project name → dashboard shows no history
  - `dashboard/lib/agents.py` still labels live agents as old project → dashboard UI shows wrong project
  - venv shebangs in `dashboard-next/api/.venv/bin/*` embed absolute paths → pip/uvicorn break after move
  - `~/.claude/projects.json` still points to old path → Claude Code can't find project
- **Resolution protocol** (must follow in order):
  1. `launchctl unload` all affected agents
  2. Rename/move the folder
  3. `grep -r "old-name" ~/Library/LaunchAgents/ ~/Documents/Projects/<repo>/bin/ ~/Documents/Projects/<repo>/dashboard/` to find all references
  4. Update all plist files (Label + ProgramArguments + log paths)
  5. Update all cron scripts (`_sk_exec_record_run` project arg)
  6. Update `dashboard/lib/agents.py` project fallback
  7. Update `~/.claude/projects.json`
  8. Delete and recreate venv (shebangs are not relocatable)
  9. `launchctl load` new plists
  10. Rename GitHub repo last (redirect keeps old URL working)
- **Also breaks (easy to miss)**:
  - **Other repos** that import from this repo (e.g. `news_stock/scripts/*.sh` sourcing `skills-test/bin/sk-exec-lib`) — must `grep -r "old-name" ~/Documents/Projects/` across ALL projects, not just the renamed one
  - `.next/` build cache embeds absolute paths — must `rm -rf .next` and rebuild
  - `package-lock.json` caches repo name
  - Skill SKILL.md files that reference repo name in docs
- **Rule**: When user asks to rename a repo/project, automatically scan ALL of the above locations **plus all sibling repos** before touching anything, present a complete change list, then execute in the correct order.

## 2026-03-18 — Never hardcode repo/project name in scripts; derive it dynamically

- **Category**: best_practice
- **Context**: After renaming `skills-test` → `rivendell`, cron scripts and `agents.py` still had the project name hardcoded as string literals. User also deploys the skills pack to multiple machines where the folder name may differ.
- **Root cause**: Using `"rivendell"` (or any literal name) instead of deriving from the repo path at runtime.
- **Fix pattern**:
  - Shell scripts: `PROJECT_NAME="$(basename "$REPO_DIR")"` then use `"$PROJECT_NAME"` everywhere
  - Python: `PROJECT_DIR.name` (since `PROJECT_DIR = Path(__file__).parent.parent.parent`)
  - Corollary: `REPO_DIR` / `PROJECT_DIR` itself must also be derived dynamically (`dirname "$0"` / `Path(__file__)`) — never hardcoded absolute path
- **What should NOT be hardcoded**: project name in `_sk_exec_record_run`, agent label prefix, DB query filters, dashboard project fallback
- **What is unavoidably machine-specific**: LaunchAgent plists (launchd requires absolute paths) — these must be generated per-machine via an install/setup script, not committed as static files
- **Rule**: Any string that would change on rename or cross-machine deploy must be derived at runtime, not written as a literal.

## 2026-03-17 — g0v PCC API brief.type is NOT the procurement method

- **Category**: knowledge_gap
- **Context**: Building tender-scraper skill, assumed `brief.type` from g0v API (`pcc-api.openfun.app/api/listbydate`) would contain the procurement method (招標方式) like "公開徵求"
- **Reality**: `brief.type` is always `"公開招標公告"` for all public tenders. The actual procurement method (公開招標 / 公開徵求 / 限制性招標) is only available in the **detail API** at `招標資料.招標方式`
- **Impact**: Cannot filter by 招標方式 at listing level — must fetch detail for each tender first, then filter. This significantly increases API calls needed per scrape run.
- **Resolution**: Updated scraper.md workflow to fetch-then-filter pattern at Phase 3

## 2026-03-24 — settings.local.json corrupted by one-time Bash permissions

- **Category**: best_practice
- **Context**: `.claude/settings.local.json` had accumulated ~50 one-time Bash commands as permission entries (git commit, python3 -c, find, etc.), plus missing commas in the array, making the file invalid JSON. Claude Code silently skipped the file.
- **Learning**: Periodically audit `settings.local.json` — one-time Bash approvals get saved as permanent permission patterns. Clean out entries that aren't reusable glob patterns (like `Bash(npm *)`) and keep only intentional permissions.

## 2026-03-24 — macOS TCC blocks /bin/bash from ~/Documents/ in launchd

- **Category**: knowledge_gap
- **Context**: Replacing compiled sk-agent-run binary with shell script caused "Operation not permitted" (exit 126) for all launchd agents accessing ~/Documents/
- **Learning**: macOS TCC (Transparency, Consent, and Control) protects ~/Documents/, ~/Desktop/, ~/Downloads/. When launchd spawns `/bin/bash`, it has no Full Disk Access. A compiled binary can be granted FDA individually. Shell scripts cannot.
- **Resolution**: Keep a compiled C launcher (`agents/sk-agent-run.c`), compile during setup, grant FDA once per machine.

## 2026-03-24 — Cross-project exec-lib sourcing needs export

- **Category**: best_practice
- **Context**: `SK_EXEC_REPO_DIR="$VAL" source exec-lib` worked during sourcing but the variable wasn't available when functions were called later under `set -u`
- **Learning**: Use `export SK_EXEC_REPO_DIR=...` before `source`, not inline `VAR=val source file`. The inline form may not persist for later function calls.

## 2026-03-24 — Dashboard must discover log paths from plist, not assume reports/

- **Category**: best_practice
- **Context**: Dashboard `/live` and `/files` only searched `reports/` but sales agents log to `materials/tenders/`, `materials/subsidies/`, etc.
- **Learning**: Read plist `StandardOutPath` to find correct log location. Added plist-based log discovery to `/live`, `/files`, `/file` endpoints.
