"""FastAPI backend — thin wrapper around existing dashboard/lib/ modules."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add dashboard lib to path
LIB_DIR = Path(__file__).resolve().parent.parent.parent / "dashboard"
sys.path.insert(0, str(LIB_DIR))

from lib.agents import (
    list_agents,
    load_agent,
    unload_agent,
    start_agent,
    install_agent,
    update_schedule,
    get_recent_commit,
)
from lib.db import init_db, get_conn, get_today_agent_cost, get_last_success_time
from lib.projects import (
    load_projects,
    get_project,
    create_project,
    update_project,
    delete_project,
    enrich_projects,
)
from lib.tokens import (
    get_daily_usage,
    get_model_summary,
    get_total_stats,
    get_filtered_usage,
    get_project_usage,
)
from lib.skills import list_skills
from lib.hooks import list_hooks

app = FastAPI(
    title="sk-dashboard API",
    openapi_tags=[
        {"name": "Overview", "description": "Dashboard overview metrics"},
        {"name": "Agents", "description": "Agent lifecycle & scheduling"},
        {"name": "Projects", "description": "Project CRUD & detail"},
        {"name": "Tokens", "description": "Token usage & cost analytics"},
        {"name": "Skills", "description": "Skills catalog"},
        {"name": "Collaboration", "description": "Learnings & error tracking"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()


# ── Helpers ───────────────────────────────────────────────────────────

_TOOL_LABELS: dict[str, str] = {
    "WebFetch": "抓取網頁",
    "WebSearch": "搜尋網路",
    "Read": "讀取檔案",
    "Write": "寫入檔案",
    "Edit": "編輯檔案",
    "Bash": "執行指令",
    "Glob": "搜尋檔案",
    "Grep": "搜尋內容",
    "Agent": "子任務",
}


def _get_agent_activity(agent) -> dict[str, Any] | None:
    """Read the tail of an agent's stream-json stdout to determine current activity.

    Returns {"tool": "WebFetch", "label": "抓取網頁", "detail": "..."} or None.
    """
    import json as _json
    import os

    if agent.pid is None:
        return None

    wd = agent.working_directory
    if not wd:
        return None

    # Try multiple log file patterns (agents log to different locations)
    candidates = []
    wd_path = Path(wd)
    from datetime import date as _date
    today = _date.today().isoformat()

    # Pattern 1: reports/{name}-stdout.log
    candidates.append(wd_path / "reports" / f"{agent.name}-stdout.log")
    # Pattern 2: materials/*/scraper-stdout.log (for scraper agents)
    for sub in ("tenders", "subsidies"):
        candidates.append(wd_path / "materials" / sub / "scraper-stdout.log")
    # Pattern 3: materials/*/scraper-{DATE}.jsonl
    for sub in ("tenders", "subsidies"):
        candidates.append(wd_path / "materials" / sub / f"scraper-{today}.jsonl")
    # Pattern 4: reports/{name}-{DATE}.jsonl (general pattern)
    candidates.append(wd_path / "reports" / f"{agent.name}-{today}.jsonl")

    # Find the most recently modified candidate that exists
    log_path = None
    best_mtime = 0
    for c in candidates:
        if c.is_file():
            mt = c.stat().st_mtime
            if mt > best_mtime:
                best_mtime = mt
                log_path = c

    if not log_path:
        return None

    # Only consider logs modified in the last 10 minutes (agent is "active")
    import time
    if time.time() - best_mtime > 600:
        return None

    # Read tail of file (last 8KB to find recent events)
    try:
        size = log_path.stat().st_size
        with open(log_path, "r", errors="replace") as f:
            if size > 8192:
                f.seek(size - 8192)
                f.readline()  # skip partial line
            content = f.read()
    except Exception:
        return None

    # Parse stream-json lines in reverse to find the most recent tool_use or text
    lines = content.strip().splitlines()
    for line in reversed(lines):
        try:
            obj = _json.loads(line)
        except (ValueError, _json.JSONDecodeError):
            continue

        msg = obj.get("message", obj)
        content_blocks = None

        # Handle Claude CLI stream-json format
        if isinstance(msg, dict) and "content" in msg:
            content_blocks = msg["content"]
        elif isinstance(msg, dict) and "role" in msg:
            content_blocks = msg.get("content", [])

        if not isinstance(content_blocks, list):
            continue

        for block in reversed(content_blocks):
            if not isinstance(block, dict):
                continue

            if block.get("type") == "tool_use":
                tool_name = block.get("name", "")
                label = _TOOL_LABELS.get(tool_name, tool_name)
                # Extract a short detail from input
                inp = block.get("input", {})
                detail = ""
                if isinstance(inp, dict):
                    # Common patterns
                    if "command" in inp:
                        detail = str(inp["command"])[:60]
                    elif "file_path" in inp:
                        detail = Path(str(inp["file_path"])).name
                    elif "pattern" in inp:
                        detail = str(inp["pattern"])[:40]
                    elif "url" in inp or "prompt" in inp:
                        detail = str(inp.get("url") or inp.get("prompt", ""))[:60]
                return {"tool": tool_name, "label": label, "detail": detail}

            if block.get("type") == "text":
                text = block.get("text", "")
                if text.strip():
                    return {"tool": "text", "label": "回覆中", "detail": text[:60]}

            if block.get("type") == "thinking":
                return {"tool": "thinking", "label": "思考中", "detail": ""}

    return None


def _agent_to_dict(agent) -> dict[str, Any]:
    """Serialize AgentInfo to JSON-safe dict."""
    commit = None
    if agent.working_directory:
        commit = get_recent_commit(agent.working_directory, agent.name)

    cfg = agent.agents_json_config
    description = cfg.description if cfg else ""
    git_safety = None
    if cfg and (cfg.allowed_paths or cfg.forbidden_paths or cfg.max_files_changed):
        git_safety = {
            "allowed_paths": cfg.allowed_paths,
            "forbidden_paths": cfg.forbidden_paths,
            "max_files_changed": cfg.max_files_changed,
        }

    def _resolve_working_dir(a) -> str:
        """Fallback: resolve working dir from projects.json repo path."""
        if a.project and a.project != "unknown":
            projects = load_projects()
            p = projects.get(a.project)
            if p:
                return p.repo
        return ""

    # Only compute activity for running agents (has PID)
    activity = _get_agent_activity(agent) if agent.pid else None

    return {
        "label": agent.label,
        "name": agent.name,
        "description": description,
        "project": agent.project,
        "plist_path": str(agent.plist_path),
        "working_directory": agent.working_directory or _resolve_working_dir(agent),
        "schedule": agent.schedule,
        "schedule_display": agent.schedule_display,
        "schedule_list": agent.schedule_list,
        "loaded": agent.loaded,
        "installed": agent.installed,
        "pid": agent.pid,
        "exit_code": agent.exit_code,
        "role_badge": agent.role_badge,
        "merge_strategy_display": agent.merge_strategy_display,
        "qa_display": agent.qa_display,
        "recent_commit": {"sha": commit[0], "message": commit[1]} if commit else None,
        "git_safety": git_safety,
        "current_activity": activity,
    }


# ── Overview ──────────────────────────────────────────────────────────

@app.get("/api/overview", tags=["Overview"])
def api_overview() -> dict[str, Any]:
    agents = list_agents()
    hooks = list_hooks()
    skills = list_skills()
    totals = get_total_stats()
    projects = load_projects()
    enrich_projects(projects, agents)

    return {
        "metrics": {
            "total_skills": len(skills),
            "running_agents": sum(1 for a in agents if a.loaded),
            "enabled_hooks": len(hooks),
            "total_cost_usd": totals["total_cost_usd"],
            "total_projects": len(projects),
        },
        "agents": [_agent_to_dict(a) for a in agents],
        "hooks": [
            {
                "event": h.event,
                "matcher": h.matcher or "",
                "command": h.command,
            }
            for h in hooks
        ],
        "projects_summary": [
            {
                "name": p.name,
                "description": p.description,
                "agent_count": len(p.agents),
                "agent_count_loaded": p.agent_count_loaded,
            }
            for p in projects.values()
        ],
    }


# ── Agents ────────────────────────────────────────────────────────────

@app.get("/api/agents", tags=["Agents"])
def api_agents() -> dict[str, Any]:
    agents = list_agents()
    last_success = get_last_success_time()
    today_cost = get_today_agent_cost()

    # Group agent names by project
    by_project: dict[str, list[str]] = {}
    for a in agents:
        by_project.setdefault(a.project, []).append(a.name)

    return {
        "metrics": {
            "total": len(agents),
            "running": sum(1 for a in agents if a.loaded),
            "last_success": last_success[:16] if last_success else None,
            "today_cost": today_cost,
        },
        "agents": [_agent_to_dict(a) for a in agents],
        "by_project": by_project,
    }


class AgentAction(BaseModel):
    label: str


@app.post("/api/agents/load", tags=["Agents"])
def api_agent_load(body: AgentAction) -> dict[str, Any]:
    ok = load_agent(body.label)
    if not ok:
        raise HTTPException(400, f"Failed to load {body.label}")
    return {"ok": True}


@app.post("/api/agents/unload", tags=["Agents"])
def api_agent_unload(body: AgentAction) -> dict[str, Any]:
    ok = unload_agent(body.label)
    if not ok:
        raise HTTPException(400, f"Failed to unload {body.label}")
    return {"ok": True}


@app.post("/api/agents/start", tags=["Agents"])
def api_agent_start(body: AgentAction) -> dict[str, Any]:
    ok = start_agent(body.label)
    if not ok:
        raise HTTPException(400, f"Failed to start {body.label}")
    return {"ok": True}


class InstallAction(BaseModel):
    plist_path: str


@app.post("/api/agents/install", tags=["Agents"])
def api_agent_install(body: InstallAction) -> dict[str, Any]:
    ok, logs = install_agent(Path(body.plist_path))
    if not ok:
        raise HTTPException(400, {"logs": logs})
    return {"ok": True, "logs": logs}


class ScheduleUpdate(BaseModel):
    label: str
    entries: list[dict[str, int]]


@app.post("/api/agents/schedule", tags=["Agents"])
def api_agent_schedule(body: ScheduleUpdate) -> dict[str, Any]:
    agents = list_agents()
    agent = next((a for a in agents if a.label == body.label), None)
    if not agent:
        raise HTTPException(404, "Agent not found")
    ok, msg = update_schedule(agent, body.entries)
    if not ok:
        raise HTTPException(400, msg)
    return {"ok": True, "message": msg}


@app.get("/api/agents/{agent_label}/live", tags=["Agents"])
def api_agent_live(agent_label: str, offset: int = 0) -> dict[str, Any]:
    """Live execution status: is agent running + tail of stdout log."""
    import re as _re
    import subprocess

    agents = list_agents()
    agent = next((a for a in agents if a.label == agent_label), None)
    if not agent:
        raise HTTPException(404, "Agent not found")

    # Check if running via launchctl
    running = False
    pid = None
    try:
        result = subprocess.run(
            ["launchctl", "list", agent_label],
            capture_output=True, text=True, timeout=5,
        )
        for line in result.stdout.splitlines():
            if '"PID"' in line:
                m = _re.search(r"(\d+)", line)
                if m:
                    pid = int(m.group(1))
                    running = True
    except Exception:
        pass

    # Find and tail stdout log
    wd = agent.working_directory
    if not wd and agent.project and agent.project != "unknown":
        projects = load_projects()
        p = projects.get(agent.project)
        if p:
            wd = p.repo

    log_lines: list[str] = []
    log_size = 0
    if wd:
        # Search multiple candidate log paths
        wd_path = Path(wd)
        candidates = [
            wd_path / "reports" / f"{agent.name}-stdout.log",
        ]
        # Also check plist StandardOutPath (handles agents with non-standard log dirs)
        if agent.plist_path:
            try:
                import plistlib
                with open(agent.plist_path, "rb") as pf:
                    pdata = plistlib.load(pf)
                sop = pdata.get("StandardOutPath")
                if sop:
                    candidates.insert(0, Path(sop))
            except Exception:
                pass

        stdout_log = None
        for c in candidates:
            if c.is_file():
                stdout_log = c
                break

        if stdout_log:
            content = stdout_log.read_text(errors="replace")
            # Strip ANSI
            content = _re.sub(r'\033\[[0-9;]*m', '', content)
            all_lines = content.splitlines()
            log_size = len(all_lines)
            # Return lines after offset
            if offset < log_size:
                log_lines = all_lines[offset:]

    return {
        "running": running,
        "pid": pid,
        "log_lines": log_lines,
        "log_size": log_size,
        "offset": offset,
    }


@app.get("/api/agents/{agent_label}/runs", tags=["Agents"])
def api_agent_runs(agent_label: str, limit: int = 10) -> list[dict[str, Any]]:
    conn = get_conn()
    parts = agent_label.split(".")
    agent_name = parts[-1] if len(parts) > 4 else parts[-1]

    rows = conn.execute(
        """
        SELECT started_at, finished_at, exit_code, tokens_used, cost_usd,
               commit_sha, files_changed, qa_passed, branch_name, pr_url
        FROM agent_runs
        WHERE agent_name = ?
        ORDER BY started_at DESC
        LIMIT ?
        """,
        (agent_name, limit),
    ).fetchall()
    conn.close()

    return [
        {
            "started_at": row["started_at"],
            "finished_at": row["finished_at"],
            "exit_code": row["exit_code"],
            "tokens_used": row["tokens_used"],
            "cost_usd": row["cost_usd"],
            "commit_sha": row["commit_sha"],
            "files_changed": row["files_changed"],
            "qa_passed": row["qa_passed"],
            "branch_name": row["branch_name"],
            "pr_url": row["pr_url"],
        }
        for row in rows
    ]


# ── Agent Files ──────────────────────────────────────────────────────

@app.get("/api/agents/{agent_label}/files", tags=["Agents"])
def api_agent_files(agent_label: str) -> list[dict[str, Any]]:
    """List log/report files for an agent."""
    agents = list_agents()
    agent = next((a for a in agents if a.label == agent_label), None)
    if not agent:
        return []

    wd = agent.working_directory
    if not wd and agent.project and agent.project != "unknown":
        projects = load_projects()
        p = projects.get(agent.project)
        if p:
            wd = p.repo
    if not wd:
        return []

    # Determine log directory: prefer plist StandardOutPath dir, fallback to reports/
    reports_dir = Path(wd) / "reports"
    log_dirs = [reports_dir]
    if agent.plist_path:
        try:
            import plistlib
            with open(agent.plist_path, "rb") as pf:
                pdata = plistlib.load(pf)
            sop = pdata.get("StandardOutPath")
            if sop:
                plist_log_dir = Path(sop).parent
                if plist_log_dir != reports_dir and plist_log_dir.is_dir():
                    log_dirs.insert(0, plist_log_dir)
        except Exception:
            pass

    # Match files by agent name prefix or known output patterns
    name = agent.name
    files = []
    seen_names: set[str] = set()
    for log_dir in log_dirs:
        if not log_dir.is_dir():
            continue
        for f in sorted(log_dir.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
            if not f.is_file():
                continue
            fname = f.name
            if fname in seen_names:
                continue
            # Match: agent-name*.log, agent-name*.md, agent-name*.jsonl,
            #        stdout/stderr logs, scraper-* logs, daily/weekly reports
            if (fname.startswith(name)
                or fname.startswith(f"{name}-stdout")
                or fname.startswith(f"{name}-stderr")
                or fname.startswith("scraper-")
                or (name.endswith("-daily") and fname.startswith("daily-"))
                or (name.endswith("-weekly") and fname.startswith("weekly-"))):
                seen_names.add(fname)
                stat = f.stat()
                files.append({
                    "name": fname,
                    "path": str(f),
                    "size": stat.st_size,
                    "modified": stat.st_mtime,
                    "type": f.suffix.lstrip("."),
                })
    return files[:30]


def _plain_log_timeline(agent, wd: str, started_at: str | None) -> list[dict[str, Any]]:
    """Fallback: convert plain log files to timeline events for non-Claude agents."""
    import re as _re
    from datetime import datetime

    # Find the log file — check plist StandardOutPath dir for dated logs
    log_dir = Path(wd) / "reports"
    if agent.plist_path:
        try:
            import plistlib
            with open(agent.plist_path, "rb") as pf:
                pdata = plistlib.load(pf)
            sop = pdata.get("StandardOutPath")
            if sop:
                log_dir = Path(sop).parent
        except Exception:
            pass

    if not log_dir.is_dir():
        return []

    # Find dated log file matching started_at
    run_date = ""
    if started_at:
        try:
            run_date = datetime.fromisoformat(started_at).strftime("%Y-%m-%d")
        except ValueError:
            pass

    # Search for: scraper-YYYY-MM-DD.log, agent-name-YYYY-MM-DD.log, etc.
    log_file = None
    name = agent.name
    for pattern in [f"scraper-{run_date}.log", f"{name}-{run_date}.log", f"{name}.log"]:
        candidate = log_dir / pattern
        if candidate.is_file():
            log_file = candidate
            break

    if not log_file:
        # Try any log file modified around started_at
        if started_at:
            try:
                target_ts = datetime.fromisoformat(started_at).timestamp()
                logs = [f for f in log_dir.glob("*.log")
                        if f.is_file() and abs(f.stat().st_mtime - target_ts) < 300]
                if logs:
                    log_file = max(logs, key=lambda f: f.stat().st_mtime)
            except ValueError:
                pass

    if not log_file:
        return []

    # Parse log lines into events
    events = []
    content = log_file.read_text(errors="replace")
    for line in content.splitlines():
        line = _re.sub(r'\033\[[0-9;]*m', '', line).strip()
        if not line:
            continue

        # Extract timestamp from Python logging format: "2026-03-24 12:41:04,748 INFO ..."
        ts = ""
        text = line
        ts_match = _re.match(r'^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}),?\d*\s+(\w+)\s+(.*)', line)
        if ts_match:
            ts = ts_match.group(1).replace(" ", "T")
            level = ts_match.group(2)
            text = ts_match.group(3)

            # Color-code by level
            if level == "ERROR":
                events.append({"ts": ts, "type": "log_error", "text": text})
            elif level == "WARNING":
                events.append({"ts": ts, "type": "log_warn", "text": text})
            else:
                events.append({"ts": ts, "type": "log", "text": text})
        elif line.startswith("==="):
            events.append({"ts": "", "type": "log_header", "text": line.strip("= ")})
        else:
            events.append({"ts": ts, "type": "log", "text": text})

    return events


@app.get("/api/agents/{agent_label}/timeline", tags=["Agents"])
def api_agent_timeline(
    agent_label: str,
    run_index: int = 0,
    started_at: str | None = None,
) -> list[dict[str, Any]]:
    """Parse structured JSONL into a timeline of events.

    If started_at is provided (e.g. '2026-03-15T12:54:12'), match the
    structured log file whose filename timestamp is closest to that time.
    Otherwise fall back to run_index (0 = most recent).
    """
    agents = list_agents()
    agent = next((a for a in agents if a.label == agent_label), None)
    if not agent:
        return []

    wd = agent.working_directory
    if not wd and agent.project and agent.project != "unknown":
        projects = load_projects()
        p = projects.get(agent.project)
        if p:
            wd = p.repo
    if not wd:
        return []

    reports_dir = Path(wd) / "reports"
    if not reports_dir.is_dir():
        return []

    # Find structured JSONL files, sorted newest first
    name = agent.name
    # Also match base name (research-agent for research-agent-weekly)
    base = name.replace("-weekly", "").replace("-daily", "")
    jsonl_files = sorted(
        [f for f in reports_dir.glob("*.structured.jsonl")
         if f.name.startswith(name) or f.name.startswith(base)],
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )

    if not jsonl_files:
        # Fallback: convert plain log to timeline events for non-Claude agents
        return _plain_log_timeline(agent, wd, started_at)

    # Match by started_at timestamp if provided
    target = None
    if started_at:
        # Extract date+time from started_at: "2026-03-15T12:54:12" → "20260315-1254"
        import re
        clean = re.sub(r"[T:\-]", "", started_at)[:12]  # "20260315125412"
        match_prefix = clean[:8] + "-" + clean[8:]  # "20260315-125412"
        for f in jsonl_files:
            # Filename like: research-agent-20260315-125412.structured.jsonl
            if match_prefix[:13] in f.name:  # match "20260315-1254"
                target = f
                break
        # Fallback: closest by mtime
        if not target:
            from datetime import datetime
            try:
                target_ts = datetime.fromisoformat(started_at).timestamp()
                target = min(jsonl_files, key=lambda f: abs(f.stat().st_mtime - target_ts))
            except ValueError:
                pass

    if not target:
        if run_index >= len(jsonl_files):
            return []
        target = jsonl_files[run_index]
    events = []
    import json as _json
    for line in target.read_text(errors="replace").splitlines():
        try:
            obj = _json.loads(line)
        except (ValueError, _json.JSONDecodeError):
            continue
        etype = obj.get("type", "")
        ts_val = obj.get("ts", "")
        if etype == "tool":
            # Parse input JSON for display
            input_str = obj.get("input", "")
            try:
                input_parsed = _json.loads(input_str) if isinstance(input_str, str) else input_str
            except (ValueError, _json.JSONDecodeError):
                input_parsed = input_str
            events.append({
                "ts": ts_val,
                "type": "tool",
                "name": obj.get("name", ""),
                "input": input_parsed,
            })
        elif etype == "text":
            events.append({
                "ts": ts_val,
                "type": "text",
                "text": obj.get("text", "")[:500],
                "len": obj.get("len", 0),
            })
        elif etype == "thinking":
            events.append({
                "ts": ts_val,
                "type": "thinking",
                "preview": obj.get("preview", ""),
                "len": obj.get("len", 0),
            })
        elif etype == "result":
            events.append({
                "ts": ts_val,
                "type": "result",
                "model": obj.get("model", ""),
                "input_tokens": obj.get("input_tokens", 0),
                "output_tokens": obj.get("output_tokens", 0),
                "cost_usd": obj.get("cost_usd", 0),
            })
        elif etype in ("auto_commit", "auto_push", "qa_gate_failed", "path_filter_rejected"):
            events.append({
                "ts": ts_val,
                "type": etype,
                "detail": obj.get("detail", ""),
            })

    return events


@app.get("/api/agents/{agent_label}/artifacts", tags=["Agents"])
def api_agent_artifacts(agent_label: str, started_at: str = "") -> list[dict[str, Any]]:
    """Find report/output files associated with a specific run.

    Matches by:
    1. Filename containing the run date (e.g. daily-2026-03-15.md)
    2. File modification time within the run window (started_at → finished_at)
    """
    if not started_at:
        return []

    agents = list_agents()
    agent = next((a for a in agents if a.label == agent_label), None)
    if not agent:
        return []

    wd = agent.working_directory
    if not wd and agent.project and agent.project != "unknown":
        projects = load_projects()
        p = projects.get(agent.project)
        if p:
            wd = p.repo
    if not wd:
        return []

    reports_dir = Path(wd) / "reports"
    if not reports_dir.is_dir():
        return []

    from datetime import datetime, timedelta

    try:
        run_dt = datetime.fromisoformat(started_at)
    except ValueError:
        return []

    run_date = run_dt.strftime("%Y-%m-%d")
    run_ts = run_dt.timestamp()
    # Search window: from run start to +2 hours (generous for long runs)
    window_end = run_ts + 7200

    results = []
    seen = set()
    for f in sorted(reports_dir.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        if not f.is_file():
            continue
        fname = f.name
        suffix = f.suffix.lower()
        # Only report files (.md, .html, .json) — skip logs/jsonl
        if suffix not in (".md", ".html", ".json"):
            continue
        # Skip structured log jsonl and stdout/stderr logs
        if "structured" in fname or "stdout" in fname or "stderr" in fname:
            continue

        mtime = f.stat().st_mtime
        # Match by date in filename or by modification time within window
        if run_date in fname or (run_ts - 60 <= mtime <= window_end):
            if fname not in seen:
                seen.add(fname)
                results.append({
                    "name": fname,
                    "path": str(f),
                    "size": f.stat().st_size,
                    "modified": mtime,
                    "type": suffix.lstrip("."),
                })

    return results[:10]


@app.get("/api/agents/{agent_label}/file", tags=["Agents"])
def api_agent_file(agent_label: str, path: str = "") -> dict[str, Any]:
    """Read content of a specific agent file."""
    agents = list_agents()
    agent = next((a for a in agents if a.label == agent_label), None)
    if not agent:
        raise HTTPException(404, "Agent not found")

    wd = agent.working_directory
    if not wd and agent.project and agent.project != "unknown":
        projects = load_projects()
        p = projects.get(agent.project)
        if p:
            wd = p.repo
    if not wd:
        raise HTTPException(404, "Agent working directory unknown")

    file_path = Path(path)
    wd_path = Path(wd)

    # Security: allow reading from the agent's working directory tree
    try:
        file_path.resolve().relative_to(wd_path.resolve())
    except ValueError:
        raise HTTPException(403, "Access denied")

    if not file_path.is_file():
        raise HTTPException(404, "File not found")

    content = file_path.read_text(errors="replace")
    # Strip ANSI escape codes for display
    import re
    content = re.sub(r'\033\[[0-9;]*m', '', content)

    return {
        "name": file_path.name,
        "content": content,
        "size": len(content),
    }


# ── Collaboration (learnings) ────────────────────────────────────────

@app.get("/api/collaboration", tags=["Collaboration"])
def api_collaboration() -> dict[str, Any]:
    import re

    agents = list_agents()
    seen_dirs: set[str] = set()
    for agent in agents:
        if agent.working_directory:
            seen_dirs.add(agent.working_directory)

    total_pending = 0
    total_resolved = 0
    found = False

    for wd in seen_dirs:
        errors_md = Path(wd) / ".learnings" / "ERRORS.md"
        if not errors_md.exists():
            continue
        found = True
        content = errors_md.read_text()
        for line in content.splitlines():
            s = line.strip()
            if not s or s.startswith("#"):
                continue
            if re.match(r"^-\s*\[x\]", s, re.IGNORECASE):
                total_resolved += 1
            elif re.match(r"^-\s*\[\s\]", s):
                total_pending += 1
            elif "resolved" in s.lower() or "fixed" in s.lower():
                total_resolved += 1
            elif s.startswith("- ") or s.startswith("* "):
                total_pending += 1

    total = total_pending + total_resolved
    return {
        "found": found,
        "pending": total_pending,
        "resolved": total_resolved,
        "resolution_rate": round(total_resolved / total * 100) if total > 0 else 0,
    }


# ── Tokens ────────────────────────────────────────────────────────────

@app.get("/api/tokens", tags=["Tokens"])
def api_tokens(days: int = 30) -> dict[str, Any]:
    daily = get_daily_usage(days)
    models = get_model_summary()
    totals = get_total_stats()

    return {
        "totals": totals,
        "daily": [
            {
                "date": d.date,
                "sessions": d.sessions,
                "messages": d.messages,
                "tool_calls": d.tool_calls,
                "tokens_total": d.tokens_total,
                "cost_usd": d.cost_usd,
                "models": d.models,
            }
            for d in daily
        ],
        "models": [
            {
                "model": m.model,
                "input_tokens": m.input_tokens,
                "output_tokens": m.output_tokens,
                "cache_read_tokens": m.cache_read_tokens,
                "cache_create_tokens": m.cache_create_tokens,
                "cost_usd": m.cost_usd,
            }
            for m in models
        ],
    }


@app.get("/api/tokens/filtered", tags=["Tokens"])
def api_tokens_filtered(
    date_start: str | None = None,
    date_end: str | None = None,
) -> dict[str, Any]:
    f = get_filtered_usage(date_start, date_end)
    return {
        "total_sessions": f.total_sessions,
        "total_messages": f.total_messages,
        "total_cost_usd": f.total_cost_usd,
        "total_tokens": f.total_tokens,
        "daily": [
            {
                "date": d.date,
                "sessions": d.sessions,
                "messages": d.messages,
                "tokens_total": d.tokens_total,
                "cost_usd": d.cost_usd,
            }
            for d in f.daily
        ],
        "models": [
            {
                "model": m.model,
                "input_tokens": m.input_tokens,
                "output_tokens": m.output_tokens,
                "cost_usd": m.cost_usd,
            }
            for m in f.models
        ],
        "projects": [
            {
                "project": p.project,
                "sessions": p.sessions,
                "messages": p.messages,
                "tokens_total": p.tokens_total,
                "cost_usd": p.cost_usd,
            }
            for p in f.projects
        ],
    }


# ── Projects ──────────────────────────────────────────────────────────

def _project_to_dict(p, agents_list: list | None = None) -> dict[str, Any]:
    """Serialize ProjectInfo to JSON-safe dict."""
    d: dict[str, Any] = {
        "name": p.name,
        "repo": p.repo,
        "description": p.description,
        "agents": p.agents,
        "agent_count_loaded": p.agent_count_loaded,
        "total_cost_usd": p.total_cost_usd,
    }
    if agents_list is not None:
        d["agent_details"] = [
            _agent_to_dict(a)
            for a in agents_list
            if a.name in p.agents
        ]
    return d


@app.get("/api/projects", tags=["Projects"])
def api_projects() -> dict[str, Any]:
    agents = list_agents()
    projects = load_projects()
    enrich_projects(projects, agents)
    return {
        "projects": [_project_to_dict(p) for p in projects.values()],
    }


@app.get("/api/projects/{name}", tags=["Projects"])
def api_project_detail(name: str) -> dict[str, Any]:
    p = get_project(name)
    if not p:
        raise HTTPException(404, f"Project '{name}' not found")
    agents = list_agents()
    enrich_projects({name: p}, agents)
    return _project_to_dict(p, agents_list=agents)


class ProjectCreate(BaseModel):
    name: str
    repo: str
    description: str = ""
    agents: list[str] = []


@app.post("/api/projects", tags=["Projects"])
def api_project_create(body: ProjectCreate) -> dict[str, Any]:
    try:
        p = create_project(body.name, body.repo, body.description, body.agents)
    except ValueError as e:
        raise HTTPException(409, str(e))
    return {"ok": True, "project": _project_to_dict(p)}


class ProjectUpdate(BaseModel):
    repo: str | None = None
    description: str | None = None
    agents: list[str] | None = None


@app.put("/api/projects/{name}", tags=["Projects"])
def api_project_update(name: str, body: ProjectUpdate) -> dict[str, Any]:
    kwargs = {k: v for k, v in body.model_dump().items() if v is not None}
    try:
        p = update_project(name, **kwargs)
    except KeyError as e:
        raise HTTPException(404, str(e))
    return {"ok": True, "project": _project_to_dict(p)}


@app.delete("/api/projects/{name}", tags=["Projects"])
def api_project_delete(name: str) -> dict[str, Any]:
    try:
        delete_project(name)
    except KeyError as e:
        raise HTTPException(404, str(e))
    return {"ok": True}


# ── Skills ────────────────────────────────────────────────────────────

@app.get("/api/skills", tags=["Skills"])
def api_skills() -> list[dict[str, Any]]:
    skills = list_skills()
    return [
        {
            "name": s.name,
            "category": s.category,
            "summary": s.summary,
            "line_count": s.line_count,
            "invocable": s.invocable,
            "lifecycle": s.lifecycle,
        }
        for s in skills
    ]


@app.get("/api/skills/{name}", tags=["Skills"])
def api_skill_content(name: str) -> dict[str, Any]:
    """Return the raw SKILL.md content for a single skill."""
    skill_md = Path.home() / ".claude" / "skills" / name / "SKILL.md"
    if not skill_md.is_file():
        raise HTTPException(404, f"Skill '{name}' not found")
    return {"name": name, "content": skill_md.read_text(encoding="utf-8")}


# ── Harvest ──────────────────────────────────────────────────────────

HARVEST_DECISIONS_FILE = Path(__file__).resolve().parent.parent.parent / "reports" / ".harvest-decisions.json"


def _load_harvest_decisions() -> dict[str, str]:
    """Load user decisions {candidate_key: "accepted"|"dismissed"}."""
    if HARVEST_DECISIONS_FILE.exists():
        import json
        return json.loads(HARVEST_DECISIONS_FILE.read_text())
    return {}


def _save_harvest_decisions(decisions: dict[str, str]) -> None:
    import json
    HARVEST_DECISIONS_FILE.write_text(json.dumps(decisions, indent=2, ensure_ascii=False))


def _parse_harvest_reports() -> list[dict[str, Any]]:
    """Parse all harvest-*.md reports and extract skill candidates."""
    import re

    reports_dir = Path(__file__).resolve().parent.parent.parent / "reports"
    candidates: list[dict[str, Any]] = []

    for md_file in sorted(reports_dir.glob("harvest-*.md")):
        # Extract date from filename
        m = re.search(r"harvest-(\d{4}-\d{2}-\d{2})", md_file.name)
        if not m:
            continue
        report_date = m.group(1)
        content = md_file.read_text()

        # Split into sections by ### headers
        sections = re.split(r"^### ", content, flags=re.MULTILINE)

        for section in sections[1:]:
            lines = section.strip().splitlines()
            if not lines:
                continue
            heading = lines[0].strip()

            # Determine strength from heading
            strength = ""
            heading_lower = heading.lower()
            # Skip non-candidate sections
            if "結論" in heading_lower or "重複模式" in heading_lower or "跨 session" in heading_lower:
                continue
            if "strong" in heading_lower or "強烈" in heading_lower:
                strength = "strong"
            elif "moderate" in heading_lower or "中等" in heading_lower:
                strength = "moderate"
            elif "weak" in heading_lower or "不建議" in heading_lower:
                strength = "weak"
            else:
                continue  # Not a candidate section
            # Skip "無" entries like "Strong — 無"
            if re.search(r"[—–-]\s*無", heading):
                continue

            # Check for sub-candidates (#### headers within this section)
            body = "\n".join(lines[1:])

            # Check for table-format candidates (| 名稱 | 用途 | ... |)
            if re.search(r"^\|\s*名稱\s*\|", body, re.MULTILINE):
                for row in body.splitlines():
                    row = row.strip()
                    if not row.startswith("|") or row.startswith("|--") or "名稱" in row:
                        continue
                    cols = [c.strip() for c in row.split("|")[1:-1]]
                    if len(cols) >= 2 and cols[0]:
                        candidates.append({
                            "key": f"{report_date}:{cols[0]}",
                            "name": cols[0],
                            "strength": strength,
                            "purpose": cols[1] if len(cols) > 1 else "",
                            "trigger": "",
                            "category": "",
                            "reasoning": cols[2] if len(cols) > 2 else "",
                            "conclusion": "",
                            "report_date": report_date,
                        })
                continue

            sub_sections = re.split(r"^#### ", body, flags=re.MULTILINE)

            if len(sub_sections) > 1:
                # Multiple candidates under one strength heading
                for sub in sub_sections[1:]:
                    candidate = _parse_candidate_section(sub, strength, report_date)
                    if candidate:
                        candidates.append(candidate)
            else:
                # Single candidate in this ### section
                candidate = _parse_candidate_section(
                    heading + "\n" + body, strength, report_date
                )
                if candidate:
                    candidates.append(candidate)

    return candidates


def _parse_candidate_section(text: str, strength: str, report_date: str) -> dict[str, Any] | None:
    """Parse a single candidate section into structured data."""
    import re

    lines = text.strip().splitlines()
    if not lines:
        return None

    # Extract name from heading — look for backtick-wrapped name or parenthesized name
    heading = lines[0].strip()
    # Clean emoji/markers
    heading = re.sub(r"^[✅🟡🔴⚪\s]+", "", heading).strip()

    # Skip meta-headings that aren't actual candidates
    skip_patterns = ["排除的候選", "不建立原因", "觀察到但不建議"]
    if any(p in heading for p in skip_patterns):
        return None

    body = "\n".join(lines[1:])

    # Check body for **名稱** table row (table-format candidates)
    name_from_table = re.search(r"\*\*名稱\*\*[：:|\s]*`([^`]+)`", body)

    # Extract name — prefer backtick in heading, then table, then heading text
    name_match = re.search(r"`([^`]+)`", heading)
    if name_match:
        name = name_match.group(1)
    elif name_from_table:
        name = name_from_table.group(1)
    else:
        name = re.sub(r"^(Strong|Moderate|Weak|強烈建議建立|中等|不建議獨立 skill)[：:\s—–-]*", "", heading, flags=re.IGNORECASE).strip()
        name = re.split(r"\s*[—–(（]", name)[0].strip()

    if not name or len(name) > 80 or name == "無":
        return None

    # Extract fields — support both "**用途**: text" and "| **用途** | text |" formats
    def _extract(field_names: list[str]) -> str:
        for fn in field_names:
            # Inline format: **field**: value
            m = re.search(rf"\*\*{fn}\*\*[：:|\s]+(.+?)(?:\s*\|?\s*$)", body, re.MULTILINE)
            if m:
                val = m.group(1).strip().strip("|").strip()
                if val:
                    return val
        return ""

    purpose = _extract(["目的", "用途"])
    trigger = _extract(["觸發條件", "觸發"])
    category = _extract(["建議分類", "分類"]).strip("`")

    # Extract reasoning
    reasoning = ""
    reason_match = re.search(r"\*\*理由\*\*[：:]\s*\n?((?:[\s\S]*?)(?=\n\*\*|\n---|\n###|\Z))", body)
    if reason_match:
        reasoning = reason_match.group(1).strip()
        # Truncate to first 300 chars
        if len(reasoning) > 300:
            reasoning = reasoning[:300] + "..."

    # Extract conclusion
    conclusion = ""
    concl_match = re.search(r"\*\*結論\*\*[：:]\s*(.+)", body)
    if concl_match:
        conclusion = concl_match.group(1).strip()

    # Build unique key
    key = f"{report_date}:{name}"

    return {
        "key": key,
        "name": name,
        "strength": strength,
        "purpose": purpose,
        "trigger": trigger,
        "category": category,
        "reasoning": reasoning,
        "conclusion": conclusion,
        "report_date": report_date,
    }


@app.get("/api/harvest", tags=["Overview"])
def api_harvest() -> dict[str, Any]:
    """Return all skill candidates from harvest reports with user decisions."""
    candidates = _parse_harvest_reports()
    decisions = _load_harvest_decisions()

    for c in candidates:
        c["decision"] = decisions.get(c["key"], "pending")

    # Stats
    pending = [c for c in candidates if c["decision"] == "pending"]
    accepted = [c for c in candidates if c["decision"] == "accepted"]
    dismissed = [c for c in candidates if c["decision"] == "dismissed"]

    return {
        "total": len(candidates),
        "pending_count": len(pending),
        "accepted_count": len(accepted),
        "dismissed_count": len(dismissed),
        "candidates": candidates,
    }


class HarvestDecision(BaseModel):
    key: str
    decision: str  # "accepted" | "dismissed" | "pending"


_CATEGORY_DIRS = {
    "backend": "backend",
    "frontend": "frontend",
    "workflow": "workflow",
    "quality": "quality",
    "meta": "meta",
    "git": "git",
    "docs": "docs",
}


def _slugify(name: str) -> str:
    """Convert skill name to filesystem-safe slug."""
    import re
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug


def _generate_skill_md(candidate: dict[str, Any]) -> str:
    """Generate SKILL.md content from a harvest candidate."""
    name = candidate.get("name", "unknown")
    purpose = candidate.get("purpose", "")
    trigger = candidate.get("trigger", "")
    category = candidate.get("category", "workflow")
    reasoning = candidate.get("reasoning", "")

    # Build description — truncate if too long
    description = purpose[:200] if purpose else f"{name} skill"

    # Build when_to_use from trigger
    when_to_use = trigger[:200] if trigger else f"when working with {name}"

    # Build tags from category
    tags = [category] if category else ["workflow"]

    lines = [
        "---",
        f"name: {name}",
        "description: >",
        f"  {description}",
        f"  TRIGGER when: {when_to_use}",
        f"when_to_use: {when_to_use}",
        "version: 1.0.0",
        f"tags: [{', '.join(tags)}]",
        "languages: all",
        "source: harvest-auto",
        "---",
        "",
        f"# {name}",
        "",
        "## Overview",
        "",
        purpose or f"Auto-generated skill from session harvest.",
        "",
    ]

    if trigger:
        lines += [
            "## When to Use",
            "",
            trigger,
            "",
        ]

    if reasoning:
        lines += [
            "## Background",
            "",
            "From session harvest analysis:",
            "",
            reasoning,
            "",
        ]

    lines += [
        "## TODO",
        "",
        "This skill was auto-generated from a harvest candidate.",
        "Fill in the implementation details, patterns, and examples.",
        "",
    ]

    return "\n".join(lines)


def _auto_create_skill(candidate: dict[str, Any]) -> dict[str, Any]:
    """Create skill directory + SKILL.md + deploy symlink. Returns result dict."""
    import re

    name = candidate.get("name", "")
    if not name:
        return {"created": False, "error": "no name"}

    slug = _slugify(name)
    category = candidate.get("category", "workflow")
    cat_dir = _CATEGORY_DIRS.get(category, "workflow")

    repo_dir = Path(__file__).resolve().parent.parent.parent
    skill_dir = repo_dir / "skills" / cat_dir / slug
    deploy_target = Path.home() / ".claude" / "skills" / slug

    # Check if already exists
    if skill_dir.exists():
        return {
            "created": False,
            "already_exists": True,
            "skill_path": str(skill_dir),
            "deploy_path": str(deploy_target),
        }

    # Create skill directory + SKILL.md
    skill_dir.mkdir(parents=True, exist_ok=True)
    skill_md = skill_dir / "SKILL.md"
    skill_md.write_text(_generate_skill_md(candidate))

    # Deploy symlink
    deploy_target.parent.mkdir(parents=True, exist_ok=True)
    if not deploy_target.exists() and not deploy_target.is_symlink():
        deploy_target.symlink_to(skill_dir)
        deployed = True
    else:
        deployed = False

    return {
        "created": True,
        "skill_path": str(skill_dir),
        "deploy_path": str(deploy_target) if deployed else None,
        "deployed": deployed,
        "slug": slug,
        "category": cat_dir,
    }


@app.post("/api/harvest/decide", tags=["Overview"])
def api_harvest_decide(body: HarvestDecision) -> dict[str, Any]:
    """Record user decision on a skill candidate. Auto-creates skill when accepted."""
    if body.decision not in ("accepted", "dismissed", "pending"):
        raise HTTPException(400, "decision must be accepted, dismissed, or pending")

    decisions = _load_harvest_decisions()
    if body.decision == "pending":
        decisions.pop(body.key, None)
    else:
        decisions[body.key] = body.decision
    _save_harvest_decisions(decisions)

    result: dict[str, Any] = {"ok": True, "key": body.key, "decision": body.decision}

    # Auto-create skill when accepted
    if body.decision == "accepted":
        candidates = _parse_harvest_reports()
        candidate = next((c for c in candidates if c["key"] == body.key), None)
        if candidate:
            result["skill_created"] = _auto_create_skill(candidate)

    return result


# ── Issues ───────────────────────────────────────────────────────────

@app.get("/api/issues", tags=["Overview"])
def api_issues() -> dict[str, Any]:
    """Aggregate pending issues from multiple sources."""
    import re
    import subprocess

    issues: list[dict[str, Any]] = []

    # 1. Agent errors — exit_code != 0 and not running
    agents = list_agents()
    for a in agents:
        if a.exit_code is not None and a.exit_code != 0 and a.pid is None:
            issues.append({
                "source": "agent",
                "severity": "error",
                "title": f"Agent {a.name} 執行失敗",
                "detail": f"exit code {a.exit_code} — {a.project}/{a.name}",
                "label": a.label,
            })
        elif a.installed and not a.loaded:
            issues.append({
                "source": "agent",
                "severity": "warning",
                "title": f"Agent {a.name} 未載入",
                "detail": f"已安裝但未載入 — {a.project}/{a.name}",
                "label": a.label,
            })

    # 2. .learnings/ERRORS.md — group entries by ## heading
    seen_dirs: set[str] = set()
    for agent in agents:
        if agent.working_directory:
            seen_dirs.add(agent.working_directory)

    for wd in seen_dirs:
        errors_md = Path(wd) / ".learnings" / "ERRORS.md"
        if not errors_md.exists():
            continue
        project_name = Path(wd).name
        content = errors_md.read_text()

        # Parse by ## sections
        sections = re.split(r"^## ", content, flags=re.MULTILINE)
        for section in sections[1:]:  # skip content before first ##
            lines = section.strip().splitlines()
            if not lines:
                continue
            heading = lines[0].strip()
            body_lines = [l.strip() for l in lines[1:] if l.strip() and not l.strip().startswith("#")]

            # Check if resolved
            full_text = " ".join(body_lines).lower()
            if "[x]" in full_text or "✅" in heading.lower():
                continue

            # Extract detail from bullet points
            detail_parts = []
            for bl in body_lines[:3]:  # first 3 bullets as detail
                cleaned = re.sub(r"^-\s*(\*\*[^*]+\*\*:\s*)?", "", bl).strip()
                if cleaned:
                    detail_parts.append(cleaned)
            detail = " | ".join(detail_parts) if detail_parts else ""

            issues.append({
                "source": "learnings",
                "severity": "error",
                "title": heading,
                "detail": detail or f"from {project_name}/.learnings/ERRORS.md",
                "label": project_name,
            })

    # 3. Skill deployment — missing symlinks
    skills_dir = Path(__file__).resolve().parent.parent.parent / "skills"
    deploy_target = Path.home() / ".claude" / "skills"
    if skills_dir.exists() and deploy_target.exists():
        for skill_md in skills_dir.glob("*/*/SKILL.md"):
            name = skill_md.parent.name
            target = deploy_target / name
            if not target.exists() and not target.is_symlink():
                issues.append({
                    "source": "skill",
                    "severity": "warning",
                    "title": f"Skill {name} 未部署",
                    "detail": f"執行 sk deploy 修復",
                    "label": name,
                })
        # Dangling symlinks
        for link in deploy_target.iterdir():
            if link.is_symlink() and not link.exists():
                issues.append({
                    "source": "skill",
                    "severity": "warning",
                    "title": f"Skill {link.name} symlink 已失效",
                    "detail": f"指向 {link.resolve()} 但目標不存在",
                    "label": link.name,
                })

    # 4. Missing .env — check sibling projects with .env.example but no .env
    projects_dir = Path(__file__).resolve().parent.parent.parent.parent
    for env_example in projects_dir.glob("*/.env.example"):
        proj_dir = env_example.parent
        if not (proj_dir / ".env").exists():
            issues.append({
                "source": "env",
                "severity": "warning",
                "title": f"{proj_dir.name} 缺少 .env",
                "detail": "有 .env.example 但沒有 .env — 執行 sk env 修復",
                "label": proj_dir.name,
            })

    # Sort: errors first, then warnings
    severity_order = {"error": 0, "warning": 1, "info": 2}
    issues.sort(key=lambda x: severity_order.get(x["severity"], 9))

    return {
        "total": len(issues),
        "errors": sum(1 for i in issues if i["severity"] == "error"),
        "warnings": sum(1 for i in issues if i["severity"] == "warning"),
        "issues": issues,
    }
