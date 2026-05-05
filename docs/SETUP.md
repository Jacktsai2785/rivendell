# Rivendell setup guide

For onboarding a colleague or setting up rivendell on a new machine.

---

## What rivendell is (and isn't)

**Rivendell is**: a curated library of file-based Claude Code skills (~90), launchd agents that automate parts of the Claude Code workflow, and a dashboard at `localhost:3000` that gives observability over both.

**Rivendell is NOT**: Claude Code itself. Claude Code (the `claude` CLI) ships independently from Anthropic. You install it once, separately, and rivendell runs on top.

### About "built-in" skills

When you run `claude` and look at available skills, you'll see ~16 skills that **are not in this repo**:

- `update-config`, `fewer-permission-prompts`, `simplify`, `loop`, `schedule`, `keybindings-help`, `claude-api`, `batch`, `claude-in-chrome`, `debug`, `dream` — these are all skills compiled into the `claude` binary itself.
- `/init`, `/init-verifiers`, `/insights`, `/review`, `/commit` — same thing, but registered as slash commands rather than skills.

They're real, they work, they auto-update with each Claude Code version bump. **You can't find them in `skills/` because there's no SKILL.md file** — Anthropic ships them as compiled JS inside the `claude` binary.

The dashboard now surfaces them under `category: builtin` so they appear alongside file-based skills. **The most useful ones to know about**:

| skill | why it matters |
|---|---|
| `update-config` | The only way to set hooks (auto-behaviors). Memory/preferences cannot enforce "from now on every X do Y" — only hooks in `settings.json` can, and `update-config` is how you write them. |
| `fewer-permission-prompts` | Auto-allowlist common read-only commands so Claude Code stops asking permission for every `grep` / `ls`. |
| `/insights` | Per-session usage report (which skills fire most, where time goes). |
| `/init-verifiers` | Auto-create verifier skills for a project. |

To see the full inventory of built-ins on your machine:

```bash
strings $(which claude) | grep -oE 'T\$\(\{name:"[a-z][a-z0-9-]+"' | sort -u
strings $(which claude) | grep -oE '\{type:"prompt",name:"[a-z][a-z0-9-]+"[^}]+source:"builtin"' \
  | grep -oE 'name:"[^"]+"' | sort -u
```

This list grows with each Claude Code upgrade — re-run after upgrading.

---

## Deploy on a new machine

### 1. Install Claude Code first

Follow Anthropic's installer. Verify:

```bash
which claude        # should print a path
claude --version    # should print a version
```

Without this, nothing else works — rivendell is built on top.

### 2. Clone rivendell

```bash
git clone <rivendell-repo-url> ~/Documents/Projects/rivendell
cd ~/Documents/Projects/rivendell
```

The path matters — agents.conf and launchd plist templates assume `~/Documents/Projects/<project>`. If you put it elsewhere, you'll need to adjust those.

### 3. Deploy skills + agents

```bash
./bin/sk deploy
```

This:
- Symlinks every `skills/<cat>/<name>/` into `~/.claude/skills/<name>` so Claude Code sees them.
- Installs `~/Library/LaunchAgents/com.sk.*.plist` files (replacing `REPO_PATH` placeholder with your actual path).

To activate the launchd agents:

```bash
./bin/sk-setup-agents
```

Verify:

```bash
launchctl list | grep com.sk
# Should show ~15 services: harvest, maintain, tester, dashboard.api, dashboard.web, etc.
```

### 4. Set up the dashboard

The dashboard is two services:

- **api (port 8000)**: Python FastAPI at `dashboard-next/api/`
- **web (port 3000)**: Next.js at `dashboard-next/`

Install Python deps:

```bash
cd dashboard-next/api
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cd ../..
```

Build the web frontend (use `--webpack`, see "Gotchas" below):

```bash
cd dashboard-next
npm install
npx next build --webpack
cd ..
```

The `dashboard.api` and `dashboard.web` launchd services should already be running from step 3. Verify:

```bash
curl -s -o /dev/null -w "api 8000: %{http_code}\n" http://127.0.0.1:8000/api/skills
curl -s -o /dev/null -w "web 3000: %{http_code}\n" http://127.0.0.1:3000/
# both should return 200
```

Open `http://localhost:3000` in a browser.

### 5. Optional: install Python utilities

```bash
pip install pyyaml requests
npm install -g agent-skills-cli  # only if you want `./bin/sk import` to work
```

---

## Gotchas

### Turbopack chunk-write race (Next.js 16.x)

Default `next build` uses Turbopack. Turbopack in 16.1.6 has a known race that produces broken `.next/` cache (`.js.map` written but `.js` missing). Symptom: web returns 500 with `Cannot find module ... .next/server/chunks/ssr/...`.

**Fix**: build with webpack instead.

```bash
cd dashboard-next
rm -rf .next node_modules/.cache
npx next build --webpack
launchctl kickstart -k gui/$UID/com.sk.dashboard.web
```

Slower than Turbopack but reliable. Update `package.json` build script if you want this default:

```json
"build": "next build --webpack"
```

### `.next/` cache poisoning

If `npm run build` is killed mid-flight (Ctrl+C, OOM, launchd grace expiry), the `.next/` directory ends up half-built — `BUILD_ID` written, chunks missing. Web 500s on every request afterward.

**Fix**: `rm -rf .next && npx next build --webpack`. The watchdog can detect the symptom (HTTP 500) but `launchctl kickstart` alone won't fix it — bad caches need cache invalidation, not process restart.

### `stats-cache.json` no longer maintained

Older Claude Code versions wrote `~/.claude/stats-cache.json` — usage telemetry. Recent versions stopped. Rivendell's dashboard used to read it; this caused multi-month gaps in the daily usage chart.

**Fix is in place**: `dashboard/lib/tokens.py` now reads `~/.claude/projects/*.jsonl` exclusively, with `bin/sk-token-snapshot` persisting daily totals to `data/rivendell.db` so they survive Claude Code's JSONL rotation (~5 weeks). Nothing for you to do — just be aware that `stats-cache.json` may exist on your machine but is irrelevant.

### IPv4 vs IPv6 listener conflicts

Both api and web bind IPv6 (`*:port`) by default. If you have Docker Desktop running with stale containers also bound to those ports, browsers may hit the Docker container instead and you'll see "Failed to fetch" errors with no obvious cause. Check:

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
lsof -nP -iTCP:3000 -sTCP:LISTEN
docker ps -a --format '{{.Names}} {{.Ports}}' | grep -E ':8000|:3000'
```

If Docker has port-publishing on these, stop the offending containers.

### Path encoding for Claude Code session jsonl

Claude Code stores session logs at `~/.claude/projects/-Users-<you>-Documents-Projects-<repo>/`. The dir name is the absolute path with `/` replaced by `-`. The dashboard parses these. If the colleague has rivendell at a non-standard path (e.g. `~/code/rivendell`), the dashboard's project-name extraction may misattribute tokens. Keeping rivendell at `~/Documents/Projects/rivendell` avoids this.

---

## Verifying the install

After everything's set up, run:

```bash
./bin/sk list                                       # should show ~90 skills across 7 categories
launchctl list | grep com.sk | wc -l                # should be ~15
curl -s http://127.0.0.1:8000/api/skills | python3 -c \
  'import json,sys; d=json.load(sys.stdin); print(f"{len(d)} skills, {sum(1 for s in d if s[\"category\"]==\"builtin\")} built-in")'
# should print ~144 skills, 16 built-in
```

If the built-in count is 0, the dashboard can't find `claude` on PATH. Check `which claude` returns a path the api process can also see.

---

## What to tell a colleague joining the project

Short version:

> Rivendell is a Claude Code skill library + dashboard. To onboard:
> 1. Install Claude Code from Anthropic
> 2. Clone rivendell at `~/Documents/Projects/rivendell`
> 3. `./bin/sk deploy && ./bin/sk-setup-agents`
> 4. Build dashboard: `cd dashboard-next && npm install && npx next build --webpack`
> 5. Open http://localhost:3000
>
> Full setup notes: `docs/SETUP.md`. The dashboard's "Built-in" category at the bottom is for skills compiled into the `claude` binary itself — they're not in this repo but you can use them like any other skill (`/update-config`, `/fewer-permission-prompts`, etc.).
