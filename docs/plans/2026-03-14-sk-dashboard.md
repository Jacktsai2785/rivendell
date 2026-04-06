# rivendell V1 Implementation Plan

> **For Claude:** Use `${SUPERPOWERS_SKILLS_ROOT}/skills/collaboration/executing-plans/SKILL.md` to implement this plan task-by-task.

**Goal:** Build a Streamlit dashboard to manage agents, view token usage trends, and monitor system health — replacing scattered CLI commands with a unified interface.

**Architecture:** Multi-page Streamlit app with SQLite persistence. Each page is a separate module under `dashboard/pages/`. A shared `lib/` layer handles data access (launchd, settings.json, SQLite, TSV). The app reads real system state and writes to SQLite for historical tracking.

**Tech Stack:** Python 3.11+, Streamlit, SQLite3, Plotly (charts), pandas (data manipulation)

---

## Task 1: Project Scaffold + SQLite Schema

**Files:**
- Create: `dashboard/app.py`
- Create: `dashboard/lib/db.py`
- Create: `dashboard/requirements.txt`

**Step 1: Create requirements.txt**

```
streamlit>=1.40.0
plotly>=5.24.0
pandas>=2.2.0
```

**Step 2: Run pip install**

Run: `cd /Users/manibari/Documents/Projects/skills-test && pip install -r dashboard/requirements.txt`

**Step 3: Write db.py with schema init**

```python
"""SQLite database layer for rivendell."""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "rivendell.db"


def get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS token_usage (
            date TEXT PRIMARY KEY,
            sessions INTEGER,
            api_calls INTEGER,
            tokens_total INTEGER,
            cost_usd REAL,
            details_json TEXT
        );

        CREATE TABLE IF NOT EXISTS agent_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_name TEXT NOT NULL,
            project TEXT NOT NULL,
            started_at TEXT,
            finished_at TEXT,
            exit_code INTEGER,
            log_path TEXT,
            report_path TEXT,
            tokens_used INTEGER,
            cost_usd REAL
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    """)
    conn.commit()
    conn.close()
```

**Step 4: Write minimal app.py**

```python
"""rivendell — Streamlit management dashboard."""

import streamlit as st
from lib.db import init_db

st.set_page_config(page_title="rivendell", page_icon="📊", layout="wide")
init_db()

st.sidebar.title("📊 rivendell")
page = st.sidebar.radio("Navigation", ["Overview", "Agents", "Token Usage"])

if page == "Overview":
    st.title("Overview")
    st.info("Coming in Task 3")
elif page == "Agents":
    st.title("Agents")
    st.info("Coming in Task 5")
elif page == "Token Usage":
    st.title("Token Usage")
    st.info("Coming in Task 4")
```

**Step 5: Verify app launches**

Run: `cd /Users/manibari/Documents/Projects/skills-test && streamlit run dashboard/app.py --server.headless true &`
Wait 3 seconds, then: `curl -s http://localhost:8501 | head -5`
Expected: HTML response from Streamlit

Stop the server after verification.

**Step 6: Commit**

```bash
git add dashboard/
git commit -m "feat(dashboard): scaffold project with SQLite schema"
```

---

## Task 2: Data Collection Layer

**Files:**
- Create: `dashboard/lib/agents.py`
- Create: `dashboard/lib/hooks.py`
- Create: `dashboard/lib/skills.py`
- Create: `dashboard/lib/tokens.py`

**Step 1: Write agents.py — launchd agent state reader**

```python
"""Read launchd agent state and plist metadata."""

import subprocess
import plistlib
from pathlib import Path
from dataclasses import dataclass

LAUNCH_AGENTS_DIR = Path.home() / "Library" / "LaunchAgents"
SK_AGENT_PREFIX = "com.sk.agent."


@dataclass
class AgentInfo:
    label: str
    name: str  # human-readable
    project: str
    plist_path: Path
    schedule: str
    loaded: bool
    pid: int | None
    exit_code: int | None


def parse_schedule(plist_data: dict) -> str:
    cal = plist_data.get("StartCalendarInterval", {})
    if isinstance(cal, dict):
        h = cal.get("Hour", "*")
        m = cal.get("Minute", "*")
        return f"{h}:{m:02d}" if isinstance(m, int) else f"{h}:{m}"
    interval = plist_data.get("StartInterval")
    if interval:
        return f"every {interval}s"
    return "manual"


def list_agents() -> list[AgentInfo]:
    """List all sk agents from ~/Library/LaunchAgents/."""
    agents = []
    for plist_path in sorted(LAUNCH_AGENTS_DIR.glob(f"{SK_AGENT_PREFIX}*.plist")):
        with open(plist_path, "rb") as f:
            data = plistlib.load(f)
        label = data["Label"]
        # Extract project.name from com.sk.agent.project.name
        parts = label.removeprefix(SK_AGENT_PREFIX).split(".")
        project = parts[0] if parts else "unknown"
        name = ".".join(parts[1:]) if len(parts) > 1 else parts[0]

        loaded, pid, exit_code = _get_launchctl_status(label)
        agents.append(AgentInfo(
            label=label,
            name=name,
            project=project,
            plist_path=plist_path,
            schedule=parse_schedule(data),
            loaded=loaded,
            pid=pid,
            exit_code=exit_code,
        ))
    return agents


def _get_launchctl_status(label: str) -> tuple[bool, int | None, int | None]:
    """Check if agent is loaded and get PID/exit code."""
    try:
        result = subprocess.run(
            ["launchctl", "list", label],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode != 0:
            return False, None, None
        # Parse output: PID\tStatus\tLabel
        for line in result.stdout.strip().splitlines():
            parts = line.split("\t")
            if len(parts) >= 3 and parts[2] == label:
                pid = int(parts[0]) if parts[0] != "-" else None
                exit_code = int(parts[1]) if parts[1] != "-" else None
                return True, pid, exit_code
        # If label found in output but not in tabular format, it's loaded
        return True, None, None
    except (subprocess.TimeoutExpired, Exception):
        return False, None, None


def load_agent(plist_path: Path) -> tuple[bool, str]:
    """Load (start) an agent via launchctl."""
    result = subprocess.run(
        ["launchctl", "load", str(plist_path)],
        capture_output=True, text=True, timeout=10,
    )
    return result.returncode == 0, result.stderr.strip()


def unload_agent(plist_path: Path) -> tuple[bool, str]:
    """Unload (stop) an agent via launchctl."""
    result = subprocess.run(
        ["launchctl", "unload", str(plist_path)],
        capture_output=True, text=True, timeout=10,
    )
    return result.returncode == 0, result.stderr.strip()


def start_agent(label: str) -> tuple[bool, str]:
    """Trigger a single run of an agent via launchctl."""
    result = subprocess.run(
        ["launchctl", "start", label],
        capture_output=True, text=True, timeout=10,
    )
    return result.returncode == 0, result.stderr.strip()
```

**Step 2: Write hooks.py — settings.json hook reader**

```python
"""Read and toggle hooks from ~/.claude/settings.json."""

import json
import shutil
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass

SETTINGS_PATH = Path.home() / ".claude" / "settings.json"


@dataclass
class HookInfo:
    event: str  # PreToolUse, PostToolUse, UserPromptSubmit
    matcher: str
    command: str
    script_path: Path | None


def list_hooks() -> list[HookInfo]:
    """Parse hooks from settings.json."""
    if not SETTINGS_PATH.exists():
        return []
    data = json.loads(SETTINGS_PATH.read_text())
    hooks_section = data.get("hooks", {})
    result = []
    for event, entries in hooks_section.items():
        for entry in entries:
            matcher = entry.get("matcher", "")
            for hook in entry.get("hooks", []):
                cmd = hook.get("command", "")
                script_path = _extract_script_path(cmd)
                result.append(HookInfo(
                    event=event,
                    matcher=matcher,
                    command=cmd,
                    script_path=script_path,
                ))
    return result


def _extract_script_path(command: str) -> Path | None:
    """Extract the script file path from a hook command string."""
    expanded = command.replace("~", str(Path.home()))
    path = Path(expanded)
    return path if path.exists() else None


def backup_settings() -> Path:
    """Create a timestamped backup of settings.json."""
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = SETTINGS_PATH.parent / f"settings.json.bak.{ts}"
    shutil.copy2(SETTINGS_PATH, backup)
    return backup
```

**Step 3: Write skills.py — TSV + SKILL.md reader**

```python
"""Read skill metadata from TSV and SKILL.md files."""

import csv
from pathlib import Path
from dataclasses import dataclass

SKILLS_DIR = Path.home() / ".claude" / "skills"
TSV_PATH = Path(__file__).parent.parent.parent / "data" / "skill-summaries-zh.tsv"


@dataclass
class SkillInfo:
    name: str
    category: str
    summary: str
    line_count: int
    invocable: bool
    lifecycle: str  # active, deprecated, etc.


def list_skills() -> list[SkillInfo]:
    """Merge TSV data with SKILL.md frontmatter."""
    tsv_data = _read_tsv()
    skills = []
    for skill_dir in sorted(SKILLS_DIR.iterdir()):
        skill_md = skill_dir / "SKILL.md"
        if not skill_md.exists():
            continue
        name = skill_dir.name
        content = skill_md.read_text()
        line_count = len(content.splitlines())
        invocable = "user_invocable: true" in content
        lifecycle = "active"  # default

        tsv_entry = tsv_data.get(name, {})
        category = tsv_entry.get("category", "未分類")
        summary = tsv_entry.get("summary", _extract_description(content))

        skills.append(SkillInfo(
            name=name,
            category=category,
            summary=summary,
            line_count=line_count,
            invocable=invocable,
            lifecycle=lifecycle,
        ))
    return skills


def _read_tsv() -> dict[str, dict]:
    """Read skill-summaries-zh.tsv into a dict keyed by skill name."""
    if not TSV_PATH.exists():
        return {}
    result = {}
    for line in TSV_PATH.read_text().splitlines():
        if line.startswith("#") or not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) >= 3:
            result[parts[0]] = {"category": parts[1], "summary": parts[2]}
    return result


def _extract_description(content: str) -> str:
    """Extract description from SKILL.md frontmatter."""
    in_frontmatter = False
    desc_lines = []
    for line in content.splitlines():
        if line.strip() == "---":
            if in_frontmatter:
                break
            in_frontmatter = True
            continue
        if in_frontmatter and line.startswith("description:"):
            desc = line.split(":", 1)[1].strip().strip(">").strip()
            if desc:
                desc_lines.append(desc)
        elif in_frontmatter and desc_lines and line.startswith("  "):
            text = line.strip()
            if text.startswith("TRIGGER"):
                break
            desc_lines.append(text)
    return " ".join(desc_lines)[:100] if desc_lines else ""
```

**Step 4: Write tokens.py — token usage data layer**

```python
"""Token usage data access and audit integration."""

import json
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from dataclasses import dataclass

from .db import get_conn


@dataclass
class DailyUsage:
    date: str
    sessions: int
    api_calls: int
    tokens_total: int
    cost_usd: float
    details: dict | None


def get_usage(days: int | None = 30) -> list[DailyUsage]:
    """Get token usage history from SQLite."""
    conn = get_conn()
    if days:
        cutoff = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        rows = conn.execute(
            "SELECT * FROM token_usage WHERE date >= ? ORDER BY date",
            (cutoff,),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM token_usage ORDER BY date"
        ).fetchall()
    conn.close()
    return [
        DailyUsage(
            date=r["date"],
            sessions=r["sessions"] or 0,
            api_calls=r["api_calls"] or 0,
            tokens_total=r["tokens_total"] or 0,
            cost_usd=r["cost_usd"] or 0.0,
            details=json.loads(r["details_json"]) if r["details_json"] else None,
        )
        for r in rows
    ]


def get_today_cost() -> float:
    """Get today's total cost."""
    conn = get_conn()
    today = datetime.now().strftime("%Y-%m-%d")
    row = conn.execute(
        "SELECT cost_usd FROM token_usage WHERE date = ?", (today,)
    ).fetchone()
    conn.close()
    return row["cost_usd"] if row else 0.0


def upsert_usage(date: str, sessions: int, api_calls: int,
                 tokens_total: int, cost_usd: float,
                 details: dict | None = None) -> None:
    """Insert or update a day's token usage."""
    conn = get_conn()
    conn.execute("""
        INSERT INTO token_usage (date, sessions, api_calls, tokens_total, cost_usd, details_json)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(date) DO UPDATE SET
            sessions = excluded.sessions,
            api_calls = excluded.api_calls,
            tokens_total = excluded.tokens_total,
            cost_usd = excluded.cost_usd,
            details_json = excluded.details_json
    """, (date, sessions, api_calls, tokens_total, cost_usd,
          json.dumps(details) if details else None))
    conn.commit()
    conn.close()
```

**Step 5: Commit**

```bash
git add dashboard/lib/
git commit -m "feat(dashboard): add data collection layer for agents, hooks, skills, tokens"
```

---

## Task 3: Overview Page

**Files:**
- Create: `dashboard/pages/overview.py`
- Modify: `dashboard/app.py` — import and call overview

**Step 1: Write overview.py**

```python
"""Overview page — system health at a glance."""

import streamlit as st
from lib.agents import list_agents
from lib.hooks import list_hooks
from lib.skills import list_skills
from lib.tokens import get_today_cost


def render() -> None:
    st.title("🏠 Overview")

    # Metrics row
    agents = list_agents()
    hooks = list_hooks()
    skills = list_skills()
    today_cost = get_today_cost()

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Skills", len(skills))
    col2.metric("Active Agents", sum(1 for a in agents if a.loaded))
    col3.metric("Active Hooks", len(hooks))
    col4.metric("Today Cost", f"${today_cost:.2f}")

    # Agent status table
    st.subheader("Agent Status")
    if agents:
        for agent in agents:
            status = "🟢 loaded" if agent.loaded else "🔴 unloaded"
            if agent.exit_code is not None and agent.exit_code != 0:
                status = f"🔴 exit={agent.exit_code}"
            col_a, col_b, col_c = st.columns([2, 1, 1])
            col_a.write(f"**{agent.project}/{agent.name}**")
            col_b.write(status)
            col_c.write(f"⏰ {agent.schedule}")
    else:
        st.info("No sk agents found in ~/Library/LaunchAgents/")

    # Hook status table
    st.subheader("Hook Status")
    if hooks:
        for hook in hooks:
            col_a, col_b, col_c = st.columns([1, 1, 2])
            col_a.write(f"**{hook.event}**")
            col_b.write(hook.matcher or "(all)")
            col_c.code(hook.command, language=None)
    else:
        st.info("No hooks configured in ~/.claude/settings.json")
```

**Step 2: Update app.py to use overview**

Replace the `if page == "Overview"` block:

```python
if page == "Overview":
    from pages.overview import render as overview_render
    overview_render()
```

**Step 3: Verify**

Run: `cd /Users/manibari/Documents/Projects/skills-test && streamlit run dashboard/app.py`
Expected: Overview page shows 4 metric cards + agent/hook tables

**Step 4: Commit**

```bash
git add dashboard/pages/overview.py dashboard/app.py
git commit -m "feat(dashboard): add Overview page with metrics and status tables"
```

---

## Task 4: Token Usage Page

**Files:**
- Create: `dashboard/pages/token_usage.py`
- Modify: `dashboard/app.py` — import and call token_usage

**Step 1: Write token_usage.py**

```python
"""Token Usage page — cost trends and daily breakdown."""

import streamlit as st
import pandas as pd
import plotly.express as px
from lib.tokens import get_usage


def render() -> None:
    st.title("📈 Token Usage")

    # Time range selector
    range_options = {"7 Days": 7, "30 Days": 30, "All": None}
    selected = st.radio("Time Range", list(range_options.keys()), horizontal=True)
    days = range_options[selected]

    usage = get_usage(days)

    if not usage:
        st.warning("No token usage data yet. Run `sk audit` to populate.")
        return

    df = pd.DataFrame([
        {
            "Date": u.date,
            "Sessions": u.sessions,
            "API Calls": u.api_calls,
            "Tokens": u.tokens_total,
            "Cost (USD)": u.cost_usd,
        }
        for u in usage
    ])

    # Summary metrics
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Cost", f"${df['Cost (USD)'].sum():.2f}")
    col2.metric("Total Tokens", f"{df['Tokens'].sum():,}")
    col3.metric("Total Sessions", f"{df['Sessions'].sum():,}")

    # Line chart: daily cost
    fig_line = px.line(
        df, x="Date", y="Cost (USD)",
        title="Daily Cost (USD)",
        markers=True,
    )
    fig_line.update_layout(height=350)
    st.plotly_chart(fig_line, use_container_width=True)

    # Bar chart: daily tokens
    fig_bar = px.bar(
        df, x="Date", y="Tokens",
        title="Daily Token Usage",
    )
    fig_bar.update_layout(height=300)
    st.plotly_chart(fig_bar, use_container_width=True)

    # Detail table
    st.subheader("Daily Breakdown")
    st.dataframe(
        df.sort_values("Date", ascending=False),
        use_container_width=True,
        hide_index=True,
    )
```

**Step 2: Update app.py**

Replace the `elif page == "Token Usage"` block:

```python
elif page == "Token Usage":
    from pages.token_usage import render as token_render
    token_render()
```

**Step 3: Add sample data for testing**

Create a small test script to verify charts render:

Run:
```python
cd /Users/manibari/Documents/Projects/skills-test && python3 -c "
from dashboard.lib.db import init_db
from dashboard.lib.tokens import upsert_usage
init_db()
upsert_usage('2026-03-10', 5, 120, 450000, 2.35)
upsert_usage('2026-03-11', 8, 200, 780000, 4.10)
upsert_usage('2026-03-12', 3, 80, 250000, 1.20)
upsert_usage('2026-03-13', 6, 150, 520000, 2.80)
upsert_usage('2026-03-14', 4, 100, 380000, 1.95)
print('Sample data inserted')
"
```

**Step 4: Verify**

Run: `streamlit run dashboard/app.py`
Navigate to Token Usage page.
Expected: Line chart + bar chart + table with 5 rows of sample data

**Step 5: Commit**

```bash
git add dashboard/pages/token_usage.py dashboard/app.py
git commit -m "feat(dashboard): add Token Usage page with charts and breakdown table"
```

---

## Task 5: Agents Page

**Files:**
- Create: `dashboard/pages/agents_page.py`
- Modify: `dashboard/app.py` — import and call agents_page

**Step 1: Write agents_page.py**

```python
"""Agents page — manage launchd agents with start/stop/run controls."""

import streamlit as st
from lib.agents import list_agents, load_agent, unload_agent, start_agent
from lib.db import get_conn


def render() -> None:
    st.title("🤖 Agents")

    agents = list_agents()

    if not agents:
        st.info("No sk agents found in ~/Library/LaunchAgents/")
        return

    for agent in agents:
        with st.container(border=True):
            # Header row
            col1, col2, col3 = st.columns([3, 1, 2])
            col1.subheader(f"{agent.project}/{agent.name}")

            status_text = "🟢 Loaded" if agent.loaded else "🔴 Unloaded"
            if agent.exit_code is not None and agent.exit_code != 0:
                status_text = f"🔴 Exit {agent.exit_code}"
            col2.write(status_text)
            col3.write(f"Schedule: {agent.schedule}")

            # Action buttons
            btn_col1, btn_col2, btn_col3 = st.columns(3)
            key_prefix = agent.label.replace(".", "_")

            if not agent.loaded:
                if btn_col1.button("▶ Start", key=f"start_{key_prefix}"):
                    ok, err = load_agent(agent.plist_path)
                    if ok:
                        st.success(f"{agent.name} started")
                        st.rerun()
                    else:
                        st.error(f"Failed: {err}")
            else:
                if btn_col1.button("⏹ Stop", key=f"stop_{key_prefix}"):
                    ok, err = unload_agent(agent.plist_path)
                    if ok:
                        st.success(f"{agent.name} stopped")
                        st.rerun()
                    else:
                        st.error(f"Failed: {err}")

            if btn_col2.button("🔄 Run Now", key=f"run_{key_prefix}"):
                ok, err = start_agent(agent.label)
                if ok:
                    st.toast(f"{agent.name} triggered")
                else:
                    st.error(f"Failed: {err}")

            # Log viewer
            with st.expander("📋 Recent Logs"):
                _show_recent_logs(agent.label)


def _show_recent_logs(agent_label: str) -> None:
    """Show the 3 most recent agent_runs from SQLite."""
    conn = get_conn()
    # Extract agent_name from label: com.sk.agent.project.name -> name
    parts = agent_label.split(".")
    agent_name = parts[-1] if len(parts) > 4 else parts[-1]

    rows = conn.execute("""
        SELECT * FROM agent_runs
        WHERE agent_name = ?
        ORDER BY started_at DESC
        LIMIT 3
    """, (agent_name,)).fetchall()
    conn.close()

    if not rows:
        st.caption("No run records yet.")
        return

    for row in rows:
        exit_icon = "✅" if row["exit_code"] == 0 else "❌"
        st.write(
            f"{exit_icon} {row['started_at']} → {row['finished_at'] or '?'} "
            f"| exit={row['exit_code']} | tokens={row['tokens_used'] or '?'}"
        )
        if row["report_path"]:
            st.caption(f"Report: `{row['report_path']}`")
```

**Step 2: Update app.py**

Replace the `elif page == "Agents"` block:

```python
elif page == "Agents":
    from pages.agents_page import render as agents_render
    agents_render()
```

**Step 3: Verify**

Run: `streamlit run dashboard/app.py`
Navigate to Agents page.
Expected: 2 agent cards (research-agent, research-agent-weekly) with Start/Stop/Run Now buttons

**Step 4: Commit**

```bash
git add dashboard/pages/agents_page.py dashboard/app.py
git commit -m "feat(dashboard): add Agents page with launchctl controls and log viewer"
```

---

## Task 6: Sidebar — Run Audit Button

**Files:**
- Modify: `dashboard/app.py` — add Run Audit to sidebar

**Step 1: Add Run Audit button to sidebar**

Add after the navigation radio in `app.py`:

```python
st.sidebar.divider()
if st.sidebar.button("🔍 Run Audit", use_container_width=True):
    with st.spinner("Running sk audit..."):
        import subprocess
        result = subprocess.run(
            ["./bin/sk", "audit"],
            capture_output=True, text=True,
            cwd="/Users/manibari/Documents/Projects/skills-test",
            timeout=120,
        )
        if result.returncode == 0:
            st.sidebar.success("Audit complete!")
            st.rerun()
        else:
            st.sidebar.error(f"Audit failed:\n{result.stderr[:300]}")
```

**Step 2: Verify**

Run: `streamlit run dashboard/app.py`
Click "Run Audit" in sidebar.
Expected: Spinner → success message → page refresh

**Step 3: Commit**

```bash
git add dashboard/app.py
git commit -m "feat(dashboard): add Run Audit button to sidebar"
```

---

## Task 7: Integration — Wire sk audit to SQLite

**Files:**
- Create: `dashboard/lib/audit_importer.py`
- Modify: `dashboard/app.py` — auto-import on startup

**Step 1: Write audit_importer.py**

This reads existing audit reports and populates token_usage table so we have historical data immediately:

```python
"""Import audit report data into SQLite for historical tracking."""

import re
from pathlib import Path
from .tokens import upsert_usage

REPORTS_DIR = Path(__file__).parent.parent.parent / "reports"


def import_audit_reports() -> int:
    """Scan reports/ for audit files and import token data."""
    imported = 0
    for report in sorted(REPORTS_DIR.glob("skill-audit-*.md")):
        date_match = re.search(r"skill-audit-(\d{4}-\d{2}-\d{2})", report.name)
        if not date_match:
            continue
        date = date_match.group(1)
        content = report.read_text()

        # Extract token stats from audit report
        cost = _extract_cost(content)
        tokens = _extract_tokens(content)
        sessions = _extract_sessions(content)
        api_calls = _extract_api_calls(content)

        if cost > 0 or tokens > 0:
            upsert_usage(date, sessions, api_calls, tokens, cost)
            imported += 1
    return imported


def _extract_cost(content: str) -> float:
    """Extract USD cost from audit report."""
    match = re.search(r"\$\s*([\d.]+)", content)
    return float(match.group(1)) if match else 0.0


def _extract_tokens(content: str) -> int:
    """Extract total token count from audit report."""
    match = re.search(r"([\d,]+)\s*tokens", content, re.IGNORECASE)
    return int(match.group(1).replace(",", "")) if match else 0


def _extract_sessions(content: str) -> int:
    """Extract session count from audit report."""
    match = re.search(r"(\d+)\s*sessions?", content, re.IGNORECASE)
    return int(match.group(1)) if match else 0


def _extract_api_calls(content: str) -> int:
    """Extract API call count from audit report."""
    match = re.search(r"(\d+)\s*(?:API\s*)?calls?", content, re.IGNORECASE)
    return int(match.group(1)) if match else 0
```

**Step 2: Add auto-import to app.py startup**

After `init_db()`:

```python
# Auto-import audit data on first run
from lib.audit_importer import import_audit_reports
if "imported" not in st.session_state:
    count = import_audit_reports()
    st.session_state.imported = True
```

**Step 3: Verify**

Run: `streamlit run dashboard/app.py`
Navigate to Token Usage page.
Expected: Historical data from audit reports appears in charts

**Step 4: Commit**

```bash
git add dashboard/lib/audit_importer.py dashboard/app.py
git commit -m "feat(dashboard): auto-import audit reports to SQLite on startup"
```

---

## Task 8: Final Polish + .gitignore

**Files:**
- Modify: `.gitignore` — exclude SQLite DB
- Modify: `dashboard/app.py` — final cleanup

**Step 1: Update .gitignore**

Add:
```
dashboard/data/*.db
dashboard/data/*.db-wal
dashboard/data/*.db-shm
```

**Step 2: Final app.py cleanup**

Ensure clean imports, proper page config, and consistent styling.

**Step 3: Manual smoke test**

Run: `cd /Users/manibari/Documents/Projects/skills-test && streamlit run dashboard/app.py`

Verify:
- [ ] Overview: 4 metrics, agent status, hook status
- [ ] Token Usage: line chart, bar chart, table
- [ ] Agents: agent cards with Start/Stop/Run Now
- [ ] Run Audit button works
- [ ] No errors in terminal

**Step 4: Commit**

```bash
git add .gitignore dashboard/
git commit -m "feat(dashboard): V1 complete — Overview, Token Usage, Agents pages"
```
