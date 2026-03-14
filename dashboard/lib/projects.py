"""Manage project definitions from ~/.claude/projects.json."""

from __future__ import annotations

import json
import os
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

PROJECTS_JSON = Path.home() / ".claude" / "projects.json"


@dataclass
class ProjectInfo:
    name: str
    repo: str
    description: str
    agents: list[str] = field(default_factory=list)
    # runtime computed (filled by enrich_projects)
    agent_count_loaded: int = 0
    total_cost_usd: float = 0.0


def load_projects() -> dict[str, ProjectInfo]:
    """Read ~/.claude/projects.json and return {name: ProjectInfo}.

    Returns empty dict if file doesn't exist or is invalid.
    """
    if not PROJECTS_JSON.exists():
        return {}

    try:
        data = json.loads(PROJECTS_JSON.read_text())
    except (json.JSONDecodeError, OSError):
        return {}

    if not isinstance(data, dict):
        return {}

    projects: dict[str, ProjectInfo] = {}
    for name, entry in data.items():
        if not isinstance(entry, dict):
            continue
        projects[name] = ProjectInfo(
            name=name,
            repo=entry.get("repo", ""),
            description=entry.get("description", ""),
            agents=entry.get("agents", []),
        )
    return projects


def _serialize(projects: dict[str, ProjectInfo]) -> dict[str, Any]:
    """Convert ProjectInfo dict back to JSON-serializable form."""
    return {
        name: {
            "repo": p.repo,
            "description": p.description,
            "agents": p.agents,
        }
        for name, p in projects.items()
    }


def save_projects(projects: dict[str, ProjectInfo]) -> None:
    """Atomic write projects to ~/.claude/projects.json."""
    PROJECTS_JSON.parent.mkdir(parents=True, exist_ok=True)
    data = json.dumps(_serialize(projects), indent=2, ensure_ascii=False)

    fd, tmp_path = tempfile.mkstemp(
        dir=PROJECTS_JSON.parent,
        suffix=".tmp",
    )
    try:
        os.write(fd, data.encode())
        os.close(fd)
        fd = -1  # mark as closed
        os.replace(tmp_path, PROJECTS_JSON)
    except Exception:
        if fd >= 0:
            os.close(fd)
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise


def get_project(name: str) -> ProjectInfo | None:
    """Get a single project by name."""
    return load_projects().get(name)


def create_project(
    name: str,
    repo: str,
    description: str = "",
    agents: list[str] | None = None,
) -> ProjectInfo:
    """Create a new project and persist it."""
    projects = load_projects()
    if name in projects:
        raise ValueError(f"Project '{name}' already exists")
    project = ProjectInfo(
        name=name,
        repo=repo,
        description=description,
        agents=agents or [],
    )
    projects[name] = project
    save_projects(projects)
    return project


def update_project(name: str, **kwargs: Any) -> ProjectInfo:
    """Update an existing project's fields and persist."""
    projects = load_projects()
    if name not in projects:
        raise KeyError(f"Project '{name}' not found")
    p = projects[name]
    for key, val in kwargs.items():
        if hasattr(p, key) and key not in ("name", "agent_count_loaded", "total_cost_usd"):
            setattr(p, key, val)
    save_projects(projects)
    return p


def delete_project(name: str) -> None:
    """Delete a project from projects.json (does not touch plist files)."""
    projects = load_projects()
    if name not in projects:
        raise KeyError(f"Project '{name}' not found")
    del projects[name]
    save_projects(projects)


def enrich_projects(
    projects: dict[str, ProjectInfo],
    agents_list: list[Any],
) -> dict[str, ProjectInfo]:
    """Cross-reference loaded agents to fill runtime fields.

    Updates agent_count_loaded and total_cost_usd on each ProjectInfo.
    agents_list items are expected to have .name, .loaded, and optionally
    a way to compute cost (not available at this layer — caller provides).
    """
    for p in projects.values():
        p.agent_count_loaded = 0
        p.total_cost_usd = 0.0

    for agent in agents_list:
        for p in projects.values():
            if agent.name in p.agents:
                if agent.loaded:
                    p.agent_count_loaded += 1
                break

    return projects


def get_project_for_agent(agent_name: str) -> str | None:
    """Reverse lookup: return the project name an agent belongs to, or None."""
    projects = load_projects()
    for name, p in projects.items():
        if agent_name in p.agents:
            return name
    return None
