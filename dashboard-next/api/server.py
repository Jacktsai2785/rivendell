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
from lib.tokens import (
    get_daily_usage,
    get_model_summary,
    get_total_stats,
    get_filtered_usage,
    get_project_usage,
)
from lib.skills import list_skills
from lib.hooks import list_hooks

app = FastAPI(title="sk-dashboard API")

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

def _agent_to_dict(agent) -> dict[str, Any]:
    """Serialize AgentInfo to JSON-safe dict."""
    commit = None
    if agent.working_directory:
        commit = get_recent_commit(agent.working_directory, agent.name)

    cfg = agent.agents_json_config
    git_safety = None
    if cfg and (cfg.allowed_paths or cfg.forbidden_paths or cfg.max_files_changed):
        git_safety = {
            "allowed_paths": cfg.allowed_paths,
            "forbidden_paths": cfg.forbidden_paths,
            "max_files_changed": cfg.max_files_changed,
        }

    return {
        "label": agent.label,
        "name": agent.name,
        "project": agent.project,
        "plist_path": str(agent.plist_path),
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
    }


# ── Overview ──────────────────────────────────────────────────────────

@app.get("/api/overview")
def api_overview() -> dict[str, Any]:
    agents = list_agents()
    hooks = list_hooks()
    skills = list_skills()
    totals = get_total_stats()

    return {
        "metrics": {
            "total_skills": len(skills),
            "running_agents": sum(1 for a in agents if a.loaded),
            "enabled_hooks": len(hooks),
            "total_cost_usd": totals["total_cost_usd"],
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
    }


# ── Agents ────────────────────────────────────────────────────────────

@app.get("/api/agents")
def api_agents() -> dict[str, Any]:
    agents = list_agents()
    last_success = get_last_success_time()
    today_cost = get_today_agent_cost()

    return {
        "metrics": {
            "total": len(agents),
            "running": sum(1 for a in agents if a.loaded),
            "last_success": last_success[:16] if last_success else None,
            "today_cost": today_cost,
        },
        "agents": [_agent_to_dict(a) for a in agents],
    }


class AgentAction(BaseModel):
    label: str


@app.post("/api/agents/load")
def api_agent_load(body: AgentAction) -> dict[str, Any]:
    ok = load_agent(body.label)
    if not ok:
        raise HTTPException(400, f"Failed to load {body.label}")
    return {"ok": True}


@app.post("/api/agents/unload")
def api_agent_unload(body: AgentAction) -> dict[str, Any]:
    ok = unload_agent(body.label)
    if not ok:
        raise HTTPException(400, f"Failed to unload {body.label}")
    return {"ok": True}


@app.post("/api/agents/start")
def api_agent_start(body: AgentAction) -> dict[str, Any]:
    ok = start_agent(body.label)
    if not ok:
        raise HTTPException(400, f"Failed to start {body.label}")
    return {"ok": True}


class InstallAction(BaseModel):
    plist_path: str


@app.post("/api/agents/install")
def api_agent_install(body: InstallAction) -> dict[str, Any]:
    ok, logs = install_agent(Path(body.plist_path))
    if not ok:
        raise HTTPException(400, {"logs": logs})
    return {"ok": True, "logs": logs}


class ScheduleUpdate(BaseModel):
    label: str
    entries: list[dict[str, int]]


@app.post("/api/agents/schedule")
def api_agent_schedule(body: ScheduleUpdate) -> dict[str, Any]:
    agents = list_agents()
    agent = next((a for a in agents if a.label == body.label), None)
    if not agent:
        raise HTTPException(404, "Agent not found")
    ok, msg = update_schedule(agent, body.entries)
    if not ok:
        raise HTTPException(400, msg)
    return {"ok": True, "message": msg}


@app.get("/api/agents/{agent_label}/runs")
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


# ── Collaboration (learnings) ────────────────────────────────────────

@app.get("/api/collaboration")
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

@app.get("/api/tokens")
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


@app.get("/api/tokens/filtered")
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


# ── Skills ────────────────────────────────────────────────────────────

@app.get("/api/skills")
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
