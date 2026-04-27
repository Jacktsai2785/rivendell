# Learnings

## 2026-04-27 — Half-built `.next` (BUILD_ID present, chunks missing) makes Next.js 500 on every request — watchdog restart can't fix it

- **Category**: best_practice
- **Context**: After deploying the watchdog, web 500'd with `Cannot find module '../chunks/ssr/[turbopack]_runtime.js'` from `.next/server/app/page.js`. The watchdog correctly detected and `kickstart -k`'d the service, but the kickstart didn't fix it — the artifact on disk was broken, so every restart failed the same way.
- **Root cause**: `dashboard-next/start-web.sh` only rebuilds when `.next/BUILD_ID` is absent **or** sources are newer. It does not detect a half-finished build. If an earlier `npm run build` was killed mid-flight (SIGKILL from launchd grace expiry, OOM, disk full, Cmd+C), Next.js may have already written `BUILD_ID` and some output files but not all turbopack runtime chunks. `start-web.sh` then sees BUILD_ID, assumes the build is good, and runs `next start` against a poisoned cache.
- **Fix in this session**: `cd dashboard-next && rm -rf .next && npm run build && launchctl kickstart -k gui/$UID/com.sk.dashboard.web`. Web back to 200.
- **Prevention pattern**: Two-phase build — `npm run build` to a temp dir or with `--out-dir`, only `mv` it into place after success. The presence of `.next/BUILD_ID` should be a *commit point*, not something writable mid-build. Or: keep a sentinel like `.next/.build-complete` that's `touch`ed only after `npm run build` exits 0, and let `start-web.sh` check that instead of `BUILD_ID`.
- **Why the watchdog can't see this class of bug**: an HTTP-probe watchdog can detect the symptom (500) but `launchctl kickstart -k` only re-runs the same start script against the same broken artifact. Bad caches need cache invalidation, not process restart. Detection-and-restart is necessary but not sufficient.

## 2026-04-26 — `launchd KeepAlive` only catches process death, not hung processes — pair it with an HTTP-probe watchdog

- **Category**: best_practice
- **Context**: User reported "rivendell 又掛了" (the dashboard intermittently goes unresponsive). Both `com.sk.dashboard.api` and `com.sk.dashboard.web` already had `KeepAlive: true` in their plists, yet the dashboard was still going dark from the user's POV. At time of investigation both processes were live (PIDs 2086 and 2077) and the ports were listening, but the user had been seeing recurring outages.
- **Why `KeepAlive` alone is insufficient**: `launchd`'s `KeepAlive: true` only restarts a service when the process **exits**. It cannot detect:
  - A deadlocked event loop (port still listening, accept() never completes)
  - A frozen worker holding the only reqlock
  - A uvicorn that's still running but stuck in some library call
  In all these cases the process is "alive" by every signal launchd watches, so it never restarts.
- **Pattern**: Add an external HTTP-probe watchdog. The one I built (`bin/sk-watchdog`) runs every 60s via launchd `StartInterval`, curls each service URL with `--max-time 5`, and on threshold-many consecutive failures calls `launchctl kickstart -k gui/$UID/<label>` to force-restart the stuck service. Three details that matter:
  1. **Threshold + grace period** — restart on N consecutive failures (avoids restarting on one transient hiccup), then ignore that service for `GRACE_SECONDS` after restart (avoids restart-loop while the new process is starting up).
  2. **State file** — `reports/.watchdog-state` keeps `<key>:<consecutive_failures>:<last_restart_ts>` per service across watchdog invocations (each invocation is a fresh process, so state must be on disk).
  3. **Silent on success** — only write `reports/watchdog.log` on FAIL/RESTART/RECOVER events. If everything is healthy the log stays empty, which makes anomalies obvious instead of buried in noise.
- **Integration with `agents/agents.conf`**: A new row `com.sk.dashboard.watchdog | rivendell | bin/sk-watchdog | interval | 60 | reports` plus a re-run of `bin/sk-setup-agents` was all that was needed — the existing `interval` schedule type just worked.
- **Verify**: `launchctl list | grep com.sk.dashboard.watchdog` should show the label loaded; manually invoking the script in a healthy state should produce no log output and no state file changes.

## 2026-04-23 — macOS "Failed to fetch" from browser but curl 200 = IPv4-only uvicorn being shadowed by a Docker IPv6 listener

- **Category**: best_practice (a debugging checklist, not a correction)
- **Context**: Dashboard web app showed `Error: Failed to fetch` on every page that hit the API. Even incognito windows failed. But every curl I ran from the terminal — including curls with `Origin: http://127.0.0.1:3000` + `Content-Type: application/json` headers that simulated the exact React fetch — returned `200 OK` with correct CORS headers. I spent significant time chasing browser-state theories (cache, service workers, extensions, DevTools offline toggle) because curl was "proving" the server was fine.
- **Actual root cause**: A forgotten Docker container `sk-dashboard-api` (started 2 weeks prior, image `rivendell-dashboard-api`) had `0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp` port mappings. It was running an OLD build of the FastAPI server — specifically one missing the `http://127.0.0.1:3000` entry in `allow_origins` that I'd added on 2026-04-20.
  - Our macOS uvicorn bound only `127.0.0.1:8000` (IPv4).
  - Docker's userland proxy bound BOTH `0.0.0.0:8000` (IPv4) AND `[::]:8000` (IPv6). Docker "won" IPv6 uncontested.
  - macOS `/etc/hosts` has `::1 localhost` alongside `127.0.0.1 localhost`.
  - Browsers' Happy Eyeballs (RFC 8305) prefers IPv6 when available. They resolved `localhost` to `::1`, connected via Docker's proxy, reached the stale container uvicorn, got `400 Disallowed CORS origin` on preflight, and reported "Failed to fetch" to the React app.
  - Curl's Happy Eyeballs behavior defaults to IPv4-first on most macOS builds (or connects to whichever address responds first, which was the fast-local 127.0.0.1). That's why curl kept reaching the good uvicorn and saying "looks fine."
- **Debug checklist when a browser sees "Failed to fetch" but curl sees 200**:
  1. `lsof -nP -iTCP:<port> -sTCP:LISTEN` — list **every** listener, not just one. Look for separate IPv4 and IPv6 rows; they may be different processes.
  2. `curl -v http://[::1]:<port>/...` AND `curl -v http://127.0.0.1:<port>/...` with the **same** headers as the failing browser. If responses differ, you have two servers.
  3. `docker ps -a --format '{{.Names}} {{.Ports}}' | grep <port>` — Docker Desktop keeps port-published containers running invisibly; they survive across macOS reboots if "Start Docker Desktop when you log in" is on.
  4. When the browser shows `Failed to fetch` (not `CORS error`), it's often the **preflight** failing. A simple GET can succeed while OPTIONS fails. Always test OPTIONS too.
  5. `access-control-max-age: 600` means a failed preflight is cached per-tab for 10 min. Browser reloads alone don't clear it; close the whole tab/window.
- **Fix**: `docker stop sk-dashboard-api`. Follow-up: `docker rm` the stopped duplicates, or decide whether the whole docker-compose setup should be taken down — per the user's 2026-04-20 instruction, rivendell is no longer meant to run in Docker.

## 2026-04-22 — Bash `git log | head` under pipefail dies with exit 128 on empty-HEAD repos

- **Category**: best_practice
- **Context**: `sk maintain` (and therefore the launchd agent `com.sk.agent.rivendell.maintain`) was silently exiting 128 with zero output on stdout and stderr. Root cause: `bin/sk` has several lines of the form `"$(git -C "$proj_dir" log -1 --format='%s' 2>/dev/null | head -c 60)"`. The `2>/dev/null` hides git's "fatal: your current branch does not have any commits yet" message but does NOT mask the exit code. When git log fails (e.g. rakucamp had 22 dirty files and no commits), it exits **128** (git's fatal-error convention). Under `set -o pipefail`, that 128 propagates as the pipeline's exit. `$(…)` captures it. `set -e` then trips and the script dies — but since stdout/stderr are redirected to per-day log files, the error never reaches the launchd-visible stderr. The result is a mysterious exit 128 with empty logs.
- **Rule**: Any `$(git … 2>/dev/null [| …] )` pipeline under pipefail must end with `|| echo ''` (or similar fallback) to guarantee the command substitution produces a usable empty string. One sibling on line 2722 had the guard; the neighbors on 2723 and 2775 did not — exactly the two sites that broke.
- **Debugging tip**: When a launchd job exits 128 with no log output, run `bash -x ./script > /dev/null 2>/tmp/trace.err` and `tail /tmp/trace.err` — the last traced command will pinpoint the bail-out site, even when normal stderr is silent.

## 2026-04-21 — Auto-stage PostToolUse hook silently adds files to staging; always check `git diff --cached --name-only` before commit

- **Category**: correction
- **Context**: This repo runs a PostToolUse hook that auto-git-stages files after Claude edits/writes them. During `/qa` fix + commit flow, the hook had already staged unrelated files like `reports/harvest-2026-04-20.md` (created by a scheduled agent on the same day). When I ran `git commit` expecting to ship only my one-line change to `server.py`, the commit swept in the pre-staged harvest reports.
- **Recurrence**: Happened **3 times** across two sessions on 2026-04-21/22. Even after writing a learning entry (session 1), the mistake repeated in session 2 — the lesson doesn't stick as a passive rule; it needs a mechanical step.
- **Rule (hardened)**: Make staging inspection a SEPARATE Bash call before each `git commit`, never chained with `&&`. Structure:
  1. Run `git diff --cached --name-only` on its own → read the output → decide.
  2. If anything unintended is staged, `git restore --staged <path>` FIRST, then re-run step 1 to confirm.
  3. Only then run `git commit`.
  The intermediate `&&`-chained "check-then-commit" pattern fails because a multi-line pipeline runs too fast to meaningfully review.
- **Special note on `reports/*`**: Per the user's standing instruction, files under `reports/` (harvest-*.md, skill-audit-*.md, test-*.md, maintain-*.log, `.harvest-*.json`) are always kept out of repo-cleanup commits — they're scheduled-agent output the user curates manually.
- **Recovery recipe**: `git reset --soft HEAD~1` → `git restore --staged <unwanted>` → re-commit. Leaves the working tree identical, rewrites only the most recent commit.

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
