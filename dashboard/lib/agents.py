"""Read and manage launchd agent state for sk-dashboard."""

from __future__ import annotations

import plistlib
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

AGENTS_DIR = Path.home() / "Library" / "LaunchAgents"
AGENT_PREFIX = "com.sk.agent."


@dataclass
class AgentInfo:
    label: str
    name: str
    project: str
    plist_path: Path
    schedule: dict[str, Any]
    loaded: bool
    pid: int | None = None
    exit_code: int | None = None


def _parse_schedule(plist_data: dict[str, Any]) -> dict[str, Any]:
    """Extract schedule info from plist (StartCalendarInterval or StartInterval)."""
    if "StartCalendarInterval" in plist_data:
        cal = plist_data["StartCalendarInterval"]
        # Can be a dict or list of dicts
        if isinstance(cal, list):
            return {"type": "calendar", "intervals": [dict(c) for c in cal]}
        return {"type": "calendar", **dict(cal)}
    if "StartInterval" in plist_data:
        return {"type": "interval", "seconds": plist_data["StartInterval"]}
    return {"type": "unknown"}


def _extract_name_and_project(label: str, plist_data: dict[str, Any]) -> tuple[str, str]:
    """Derive agent name and project from label and ProgramArguments."""
    # Label format: com.sk.agent.<project>.<name>
    parts = label.removeprefix(AGENT_PREFIX).split(".", 1)
    project = parts[0] if parts else "unknown"
    name = parts[1] if len(parts) > 1 else parts[0]

    # Try to get project path from ProgramArguments
    args = plist_data.get("ProgramArguments", [])
    if len(args) >= 2:
        project_path = Path(args[1])
        if project_path.is_dir():
            project = project_path.name

    return name, project


def _check_loaded(label: str) -> tuple[bool, int | None, int | None]:
    """Check if agent is loaded via launchctl list <label>.

    Returns (loaded, pid, exit_code).
    """
    try:
        result = subprocess.run(
            ["launchctl", "list", label],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode != 0:
            return False, None, None

        # Parse output for PID and LastExitStatus
        pid: int | None = None
        exit_code: int | None = None
        for line in result.stdout.splitlines():
            stripped = line.strip()
            if '"PID"' in stripped or "PID" in stripped:
                # Format: "PID" = 12345;
                val = stripped.split("=")[-1].strip().rstrip(";").strip()
                if val.isdigit():
                    pid = int(val)
            if "LastExitStatus" in stripped:
                val = stripped.split("=")[-1].strip().rstrip(";").strip()
                try:
                    exit_code = int(val)
                except ValueError:
                    pass
        return True, pid, exit_code
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False, None, None


def list_agents() -> list[AgentInfo]:
    """List all sk agents from ~/Library/LaunchAgents/."""
    agents: list[AgentInfo] = []
    for plist_path in sorted(AGENTS_DIR.glob(f"{AGENT_PREFIX}*.plist")):
        try:
            with open(plist_path, "rb") as f:
                data = plistlib.load(f)
        except Exception:
            continue

        label = data.get("Label", plist_path.stem)
        name, project = _extract_name_and_project(label, data)
        schedule = _parse_schedule(data)
        loaded, pid, exit_code = _check_loaded(label)

        agents.append(AgentInfo(
            label=label,
            name=name,
            project=project,
            plist_path=plist_path,
            schedule=schedule,
            loaded=loaded,
            pid=pid,
            exit_code=exit_code,
        ))
    return agents


def load_agent(label: str) -> bool:
    """Load (bootstrap) an agent via launchctl."""
    plist_path = AGENTS_DIR / f"{label}.plist"
    if not plist_path.exists():
        return False
    result = subprocess.run(
        ["launchctl", "load", str(plist_path)],
        capture_output=True, text=True, timeout=10,
    )
    return result.returncode == 0


def unload_agent(label: str) -> bool:
    """Unload (bootout) an agent via launchctl."""
    plist_path = AGENTS_DIR / f"{label}.plist"
    if not plist_path.exists():
        return False
    result = subprocess.run(
        ["launchctl", "unload", str(plist_path)],
        capture_output=True, text=True, timeout=10,
    )
    return result.returncode == 0


def start_agent(label: str) -> bool:
    """Manually start (kick) an agent via launchctl."""
    result = subprocess.run(
        ["launchctl", "start", label],
        capture_output=True, text=True, timeout=10,
    )
    return result.returncode == 0
