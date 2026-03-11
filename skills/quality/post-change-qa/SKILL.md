---
name: post-change-qa
description: >
  Auto-restart servers and run QA after code changes.
  TRIGGER when: code changes are complete (files edited/written) and the task is NOT in plan mode.
  Claude should proactively run this after finishing implementation work.
  DO NOT TRIGGER when: in plan mode, only reading/researching code, editing non-code files
  (docs, configs), or user explicitly says to skip QA.
tags: [quality, testing]
version: 1
source: manual
user_invocable: false
---

# Post-Change QA

Automatically restart servers and run QA verification after code changes are complete.

## When to Trigger

After ANY code change (edit, write, bug fix, feature implementation) that is NOT in plan mode:
1. Code files were modified (`.py`, `.ts`, `.tsx`, `.js`, `.jsx`, `.swift`, `.vue`, etc.)
2. The change is complete (not mid-implementation)
3. The project has a running or runnable server

**Do NOT trigger for**: config-only changes, documentation edits, or when the user says "skip QA" / "不用測".

## Flow

```
Code Change Complete
    │
    ├── 1. Detect Project Stack
    │
    ├── 2. Restart Backend (if applicable)
    │       kill old → start new → wait for ready
    │
    ├── 3. Restart Frontend (if applicable)
    │       kill old → start new → wait for ready
    │
    ├── 4. Run Tests
    │       unit tests → integration tests
    │
    ├── 5. Visual Verify (web projects)
    │       Playwright screenshot → report
    │
    └── 6. Report Results
```

## Step 1: Detect Project Stack

Read the project's config to determine the server commands and test runner.

### Detection Order

1. **CLAUDE.md / AGENTS.md** — look for documented run commands first (highest priority)
2. **package.json** — `scripts.dev`, `scripts.start`, `scripts.test`
3. **pyproject.toml / requirements.txt** — FastAPI, Streamlit, pytest
4. **Makefile** — `dev`, `start`, `test` targets
5. **scripts/** directory — `start_*.sh`, `stop_*.sh`, `ensure-dev-servers.sh`

### Known Project Profiles

| Project | Backend | Frontend | Tests |
|---------|---------|----------|-------|
| **sales-assistant** | `uvicorn backend.main:app --reload --port 8000` | `cd frontend && npm run dev` (3000) | `./tests/run_qa.sh` |
| **news_stock** | `uvicorn api.main:app --reload --port 8000` | `cd web && npm run dev` (3000) | pytest if available |
| **nexus-ai-company** | `uvicorn app.main:app --reload --port 8000` | `cd frontend && npm run dev` (5173) | `pytest` + `cd frontend && npm test` |
| **RTK** | `pnpm dev` (monorepo) | included in pnpm dev (3000) | `pnpm test` |
| **Marketing-Pal** | — | `cd web && npm run dev` (3000) | xcodebuild test (iOS) |
| **MingOS** | `streamlit run app.py` (8501) | — | — |
| **TailTrack** | — | xcodebuild (iOS) | xcodebuild test |

If the project is not in this table, detect from config files. If no server is detected, skip restart steps.

## Step 2: Restart Backend

```bash
# 1. Find and kill existing process on the port
lsof -ti :<PORT> | xargs kill 2>/dev/null

# 2. Wait for port to be free
sleep 1

# 3. Start backend in background
<BACKEND_COMMAND> &

# 4. Wait for ready (poll health endpoint or port)
for i in $(seq 1 30); do
  curl -s http://localhost:<PORT>/health >/dev/null 2>&1 && break
  # or: lsof -i :<PORT> >/dev/null 2>&1 && break
  sleep 1
done
```

**Important**: Use `--reload` flag for uvicorn when available — it auto-reloads on file changes, so a full restart may not be needed. Check if the server is already running with `--reload` before killing it:
- If uvicorn with `--reload` is already running → **skip restart** (it auto-reloads)
- If no `--reload` or other server → full restart

For `streamlit`, it also auto-reloads. Only restart if the app fails to load.

## Step 3: Restart Frontend

Same pattern as backend, but for the frontend port (typically 3000 or 5173).

**Hot-reload frameworks** (Next.js, Nuxt, Vite) auto-reload on file save — usually **skip restart** unless:
- The dev server is not running
- Build errors prevent hot reload
- `package.json` or config files changed

Check if frontend is already running:
```bash
lsof -ti :3000 >/dev/null 2>&1 && echo "Frontend running" || echo "Need to start"
```

## Step 4: Run Tests

Detect and run the appropriate test command:

| Indicator | Command |
|-----------|---------|
| `./tests/run_qa.sh` exists | `./tests/run_qa.sh` |
| `pytest` in deps | `python -m pytest -x --tb=short` |
| `vitest` in deps | `npx vitest run` |
| `jest` in deps | `npx jest` |
| `pnpm test` available | `pnpm test` |
| `package.json` has `test` script | `npm test` |
| Xcode project | `xcodebuild test -scheme <scheme> -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 16'` |

Rules:
- Use `-x` (fail fast) for pytest — stop at first failure
- Use `--tb=short` for concise tracebacks
- Run tests in the project root, not a subdirectory
- If tests fail, report the failure and stop — do NOT auto-fix

## Step 5: Visual Verify (Web Projects Only)

For projects with a web frontend, take Playwright screenshots of key pages after restart:

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    # Navigate to the page that was changed
    page.goto("http://localhost:<PORT>/<relevant-path>")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)

    # Full page screenshot
    page.screenshot(path="/tmp/qa_verify.png", full_page=True)

    # Check for console errors
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.reload()
    page.wait_for_load_state("networkidle")

    browser.close()
```

**Which pages to screenshot**:
- The page most related to the code change
- The home/index page (regression check)
- Any page mentioned in the user's task

Save screenshots to `/tmp/qa_<project>_<page>.png` and show them to the user.

## Step 6: Report Results

After all steps complete, report concisely:

```
## QA Results

**Backend**: ✅ Running (port 8000, uvicorn --reload)
**Frontend**: ✅ Running (port 3000, hot-reload active)
**Tests**: ✅ 12 passed, 0 failed (pytest, 3.2s)
**Visual**: ✅ Screenshot saved → /tmp/qa_verify.png
  - No console errors
```

Or if something failed:

```
## QA Results

**Backend**: ✅ Running (port 8000)
**Frontend**: ✅ Running (port 3000)
**Tests**: ❌ 1 failed
  FAILED tests/test_intel.py::test_create_intel - AssertionError: expected 201, got 422
**Visual**: ⚠️ Console error: "TypeError: Cannot read property 'id' of undefined"
```

**On failure**: Report the error clearly but do NOT auto-fix. Ask the user:
> Tests failed. Want me to investigate and fix?

## Skip Conditions

Skip this entire flow when:
- User says "skip QA", "不用測", "先不跑"
- In plan mode (planning only, no execution)
- Only non-code files changed (README, CLAUDE.md, .gitignore, etc.)
- The change is a work-in-progress (user says "still working on it", "還沒好")
- Project has no server and no tests (pure library or config repo)

## Integration with Other Skills

| Skill | Handoff |
|-------|---------|
| **dev-process-gate** | After development stage → post-change-qa runs automatically |
| **qa-testing** | If no tests exist, suggest using qa-testing to write them first |
| **webapp-testing** | Uses Playwright patterns from webapp-testing for visual verify |
| **systematic-debugging** | If QA fails, suggest systematic-debugging for root cause |
