# Learnings

## 2026-04-21 — Auto-stage PostToolUse hook silently adds files to staging; always check `git diff --cached --name-only` before commit

- **Category**: correction
- **Context**: This repo runs a PostToolUse hook that auto-git-stages files after Claude edits/writes them. During `/qa` fix + commit flow, the hook had already staged unrelated files like `reports/harvest-2026-04-20.md` (created by a scheduled agent on the same day). When I ran `git commit` expecting to ship only my one-line change to `server.py`, the commit swept in the pre-staged harvest reports.
- **Happened twice in one session** — fixed the first with `git reset --soft HEAD~1 + git restore --staged`, then made the same mistake committing `sales-material/SKILL.md`. Lesson didn't stick without an explicit process step.
- **Rule**: Before EVERY `git commit` on this repo, run `git diff --cached --name-only` and verify the list matches exactly what you intend to ship. The auto-stage hook means the index is not a reliable summary of "what you last edited."
- **If you want to commit only specific files when others are already staged**: use `git stash push --staged --keep-index` plus targeted `git add`, OR explicitly unstage with `git restore --staged <unwanted>` before commit.
- **See also**: `reports/*` per the user's standing instruction is always kept out of `/qa`-generated commits — those files belong to the user to curate manually.

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

## 2026-03-24 — Autoresearch discard must NOT use git clean

- **Category**: best_practice
- **Context**: `sk-autoresearch` discard step used `git checkout -- . && git clean -fd`. The `git clean -fd` deleted untracked files from other agents (subsidy data, client projections, tender cases) that were never committed.
- **Learning**: In multi-agent repos, NEVER use `git clean` for discard. Only `git checkout -- .` to revert tracked modifications. Untracked files belong to other agents' output.
- **Also learned**: Autoresearch metric commands must be local and deterministic — never depend on external API calls (rate limits make results non-reproducible).

## 2026-03-24 — Cross-project exec-lib sourcing needs export

- **Category**: best_practice
- **Context**: `SK_EXEC_REPO_DIR="$VAL" source exec-lib` worked during sourcing but the variable wasn't available when functions were called later under `set -u`
- **Learning**: Use `export SK_EXEC_REPO_DIR=...` before `source`, not inline `VAR=val source file`. The inline form may not persist for later function calls.

## 2026-04-01 — Always check port map before starting a dev server; ask before allocating new ports

- **Category**: correction
- **Context**: Started RTK dev server on port 3001 without checking the port map. Port 3001 was already allocated to news-stock Frontend. RTK had no entry in the port map at all.
- **Two mistakes**:
  1. Assumed port 3001 was free instead of reading the port map first
  2. Started a new project's server without first asking the user to assign it a port
- **Rule**: Before starting any dev server, (a) read `mockups/port-map.html` SERVICES array to find what's taken, (b) if the project has no assigned port, ask the user what port to use, (c) only then `lsof -i :<port>` to confirm it's actually free, then start.

## 2026-04-07 — launchd agents: source across ~/Documents/ intermittently fails with EDEADLK

- **Category**: best_practice
- **Context**: `sk-harvest-cron`, `sk-maintain-cron`, `sk-tester-cron`, `knowledge-sync.sh` all had bare `source sk-exec-lib` under `set -euo pipefail`. In launchd environment, sourcing files in `~/Documents/` (different project) intermittently fails with "Resource deadlock avoided" (EDEADLK), causing the script to exit early with a non-zero code (launchctl showed exit 78).
- **Learning**: Wrap any cross-project `source` with `set +e ... set -e` + `|| true`:
  ```bash
  set +e; source "$RIVENDELL_DIR/bin/sk-exec-lib" 2>/dev/null || true; set -e
  ```
  The main task still runs; only the optional dashboard recording is skipped.
- **Also**: Sales agent plists had label prefix `com.sk.agent.sales.*` but project dir name is `sales-assistant`. The `sk agent start` CLI derives label from dir name. Must match or `sk maintain` shows them as "unloaded". Fix: unload old plists, reinstall with `sk agent start --project sales-assistant`.

## 2026-04-07 — Docker API: Path(__file__).parent×N breaks when WORKDIR differs from local layout

- **Category**: best_practice
- **Context**: `dashboard-next/api/server.py` uses `Path(__file__).resolve().parent.parent.parent / "reports"` to find the reports dir. Locally this resolves to the repo root. In Docker, `server.py` is copied to `/app/server.py` so `.parent.parent.parent` = `/` and `/reports` doesn't exist (mounted at `/data/reports`).
- **Fix**: Use env var with fallback: `Path(os.environ.get("REPORTS_DIR", str(Path(__file__).resolve().parent.parent.parent / "reports")))`. Set `REPORTS_DIR=/data/reports` in docker-compose `environment:`.
- **Rule**: Any path that diverges between local dev and Docker must be an env var, not computed from `__file__`.

## 2026-03-24 — Dashboard must discover log paths from plist, not assume reports/

- **Category**: best_practice
- **Context**: Dashboard `/live` and `/files` only searched `reports/` but sales agents log to `materials/tenders/`, `materials/subsidies/`, etc.
- **Learning**: Read plist `StandardOutPath` to find correct log location. Added plist-based log discovery to `/live`, `/files`, `/file` endpoints.
