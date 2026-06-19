"""Read and manage systemd user agent state for rivendell.

Source of truth is agents/agents.conf (pipe-delimited fleet definition); live
state comes from `systemctl --user`. This replaces the old launchd/plist model
(macOS) — on Linux/WSL2 there is no ~/Library/LaunchAgents, so the plist-based
reader returned an empty list and the dashboard showed no agents at all.
"""

from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

PROJECT_DIR = Path(__file__).parent.parent.parent          # repo root (rivendell)
PROJECTS_DIR = PROJECT_DIR.parent                          # parent of repo = /home/jacktsai
AGENTS_CONF = PROJECT_DIR / "agents" / "agents.conf"
UNIT_DIR = Path.home() / ".config" / "systemd" / "user"
AGENT_PREFIX = "com.sk.agent."
MAINTAIN_PREFIX = "com.skills."

# Role inference from agent name/type
ROLE_MAP: dict[str, tuple[str, str]] = {
    "maintainer": ("🔧", "maintainer"),
    "maintain": ("🔧", "maintainer"),
    "tester": ("🧪", "tester"),
    "developer": ("🚀", "developer"),
    "researcher": ("📊", "researcher"),
    "audit": ("🔍", "auditor"),
    "review": ("📝", "reviewer"),
}


@dataclass
class AgentsJsonConfig:
    """Parsed config from .claude/agents.json for a specific agent."""
    description: str = ""
    merge_strategy: str = "auto"  # "auto" or "pr"
    allowed_paths: list[str] = field(default_factory=list)
    forbidden_paths: list[str] = field(default_factory=list)
    max_files_changed: int = 0
    qa_pre_commit: str = "off"  # "off", "auto", or script path
    raw: dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentInfo:
    label: str
    name: str
    project: str
    plist_path: Path          # systemd: path to the .service unit (kept for API compat)
    schedule: dict[str, Any]
    loaded: bool              # scheduled: timer active / keepalive: service active
    installed: bool = True    # unit file present in ~/.config/systemd/user/
    pid: int | None = None
    exit_code: int | None = None
    working_directory: str = ""
    agents_json_config: AgentsJsonConfig | None = None

    @property
    def role_badge(self) -> str:
        name_lower = self.name.lower()
        for key, (emoji, label) in ROLE_MAP.items():
            if key in name_lower:
                return f"{emoji} {label}"
        return "⚙️ agent"

    @property
    def merge_strategy_display(self) -> str:
        cfg = self.agents_json_config
        if not cfg:
            return "—"
        if cfg.merge_strategy == "pr":
            return "PR → branch"
        return "auto → main"

    @property
    def qa_display(self) -> str:
        cfg = self.agents_json_config
        if not cfg:
            return "off"
        qa = cfg.qa_pre_commit
        if qa == "off":
            return "off"
        if qa == "auto":
            return "auto (pytest)"
        return qa

    @property
    def schedule_list(self) -> list[dict[str, Any]]:
        s = self.schedule
        if s.get("type") == "calendar":
            intervals = s.get("intervals")
            if intervals:
                return intervals
            entry = {k: v for k, v in s.items() if k != "type"}
            return [entry] if entry else []
        return []

    @property
    def schedule_display(self) -> str:
        s = self.schedule
        stype = s.get("type")
        if stype == "keepalive":
            return "常駐（keepalive）"
        if stype == "calendar":
            entries = self.schedule_list
            if not entries:
                return "手動"
            return " / ".join(_format_one_schedule(e) for e in entries)
        if stype == "interval":
            secs = s.get("seconds", 0)
            if secs >= 3600:
                return f"每 {secs // 3600} 小時"
            return f"每 {secs // 60} 分鐘"
        return "手動"


WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"]


def _format_one_schedule(entry: dict) -> str:
    parts = []
    if "Weekday" in entry:
        wd = entry["Weekday"]
        parts.append(f"每週{WEEKDAY_NAMES[wd % 7]}")
    h = entry.get("Hour", "*")
    m = entry.get("Minute", 0)
    parts.append(f"{h}:{m:02d}" if isinstance(m, int) else f"{h}:{m}")
    return " ".join(parts)


# ── agents.conf parsing ──────────────────────────────────────────────

def _parse_conf_schedule(sched_type: str, sched_value: str) -> dict[str, Any]:
    """Map an agents.conf schedule (type, value) to the AgentInfo schedule dict."""
    sched_type = sched_type.strip()
    sched_value = sched_value.strip()

    if sched_type == "keepalive":
        return {"type": "keepalive"}

    if sched_type == "interval":
        try:
            return {"type": "interval", "seconds": int(sched_value)}
        except ValueError:
            return {"type": "unknown"}

    def _one(token: str) -> dict[str, int]:
        # "H:MM" or "W:H:MM"
        bits = token.split(":")
        if len(bits) == 3:
            w, h, m = bits
            return {"Weekday": int(w), "Hour": int(h), "Minute": int(m)}
        if len(bits) == 2:
            h, m = bits
            return {"Hour": int(h), "Minute": int(m)}
        return {}

    if sched_type == "calendar":
        e = _one(sched_value)
        return {"type": "calendar", **e} if e else {"type": "unknown"}

    if sched_type == "calendar_multi":
        entries = [_one(tok) for tok in sched_value.split(",") if tok.strip()]
        entries = [e for e in entries if e]
        return {"type": "calendar", "intervals": entries} if entries else {"type": "unknown"}

    return {"type": "unknown"}


def _read_conf_rows() -> list[dict[str, str]]:
    """Parse agents.conf into row dicts. Skips comments and blank lines."""
    rows: list[dict[str, str]] = []
    if not AGENTS_CONF.exists():
        return rows
    for line in AGENTS_CONF.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 6:
            continue
        rows.append({
            "label": parts[0],
            "project_rel": parts[1],
            "script": parts[2],
            "sched_type": parts[3],
            "sched_value": parts[4],
            "log_dir_rel": parts[5],
            "extra_args": parts[6] if len(parts) > 6 else "",
        })
    return rows


def _extract_name_and_project(label: str, project_rel: str) -> tuple[str, str]:
    """Derive (name, project) from the unit label and the conf project path."""
    project = project_rel or "unknown"
    if label.startswith(AGENT_PREFIX):
        # com.sk.agent.<project>.<name>
        parts = label.removeprefix(AGENT_PREFIX).split(".", 1)
        name = parts[1] if len(parts) > 1 else parts[0]
    elif label.startswith("com.sk.dashboard."):
        name = label.removeprefix("com.sk.")          # e.g. dashboard.api
    elif label.startswith(MAINTAIN_PREFIX):
        name = label.removeprefix(MAINTAIN_PREFIX)
    else:
        name = label
    return name, project


# ── systemd state ────────────────────────────────────────────────────

def _systemctl_show(unit: str, props: list[str]) -> dict[str, str]:
    try:
        r = subprocess.run(
            ["systemctl", "--user", "show", unit, "-p", ",".join(props)],
            capture_output=True, text=True, timeout=5,
        )
        out: dict[str, str] = {}
        for line in r.stdout.splitlines():
            if "=" in line:
                k, v = line.split("=", 1)
                out[k] = v
        return out
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return {}


def _unit_state(label: str, is_keepalive: bool) -> tuple[bool, int | None, int | None, bool]:
    """Return (loaded, pid, exit_code, installed) from systemd.

    loaded  = scheduled? timer active : service active   (i.e. "supposed to run")
    pid     = MainPID of the .service if currently running, else None
    exit_code = ExecMainStatus of the last .service run
    installed = the .service unit file exists on disk
    """
    service = f"{label}.service"
    svc = _systemctl_show(service, ["ActiveState", "MainPID", "ExecMainStatus"])
    installed = (UNIT_DIR / service).exists()

    main_pid = 0
    try:
        main_pid = int(svc.get("MainPID", "0"))
    except ValueError:
        main_pid = 0
    pid = main_pid if main_pid > 0 else None

    exit_code: int | None = None
    if svc.get("ExecMainStatus", "") not in ("", None):
        try:
            exit_code = int(svc["ExecMainStatus"])
        except ValueError:
            exit_code = None

    if is_keepalive:
        loaded = svc.get("ActiveState") in ("active", "activating")
    else:
        tmr = _systemctl_show(f"{label}.timer", ["ActiveState"])
        loaded = tmr.get("ActiveState") == "active"

    return loaded, pid, exit_code, installed


def read_agents_json(project_dir: str | Path) -> dict[str, AgentsJsonConfig]:
    """Read .claude/agents.json and return per-agent config (empty if absent)."""
    agents_json = Path(project_dir) / ".claude" / "agents.json"
    if not agents_json.exists():
        return {}
    try:
        data = json.loads(agents_json.read_text())
    except (json.JSONDecodeError, OSError):
        return {}

    configs: dict[str, AgentsJsonConfig] = {}
    agents_section = data if isinstance(data, dict) else {}
    if "agents" in agents_section and isinstance(agents_section["agents"], dict):
        agents_section = agents_section["agents"]

    for agent_name, agent_data in agents_section.items():
        if not isinstance(agent_data, dict):
            continue
        git = agent_data.get("git", {})
        qa = agent_data.get("qa", {})
        configs[agent_name] = AgentsJsonConfig(
            description=agent_data.get("description", ""),
            merge_strategy=git.get("merge_strategy", "auto"),
            allowed_paths=git.get("allowed_paths", []),
            forbidden_paths=git.get("forbidden_paths", []),
            max_files_changed=git.get("max_files_changed", 0),
            qa_pre_commit=qa.get("pre_commit", "off"),
            raw=agent_data,
        )
    return configs


def get_recent_commit(project_dir: str, agent_name: str) -> tuple[str, str] | None:
    """Most recent auto-commit (short_sha, message) for an agent, or None."""
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", "--grep", f"agent.*{agent_name}",
             "-n", "1", "--format=%h|%s"],
            capture_output=True, text=True, timeout=5, cwd=project_dir,
        )
        if result.returncode == 0 and result.stdout.strip():
            parts = result.stdout.strip().split("|", 1)
            if len(parts) == 2:
                return parts[0], parts[1]
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return None


def list_agents() -> list[AgentInfo]:
    """List all sk agents from agents.conf, enriched with live systemd state."""
    agents: list[AgentInfo] = []
    for row in _read_conf_rows():
        label = row["label"]
        is_keepalive = row["sched_type"].strip() == "keepalive"
        name, project = _extract_name_and_project(label, row["project_rel"])
        schedule = _parse_conf_schedule(row["sched_type"], row["sched_value"])
        loaded, pid, exit_code, installed = _unit_state(label, is_keepalive)
        working_directory = str((PROJECTS_DIR / row["project_rel"]).resolve())

        agents.append(AgentInfo(
            label=label,
            name=name,
            project=project,
            plist_path=UNIT_DIR / f"{label}.service",
            schedule=schedule,
            loaded=loaded,
            installed=installed,
            pid=pid,
            exit_code=exit_code,
            working_directory=working_directory,
        ))

    # Enrich from projects.json (authoritative project + working_directory)
    try:
        from lib.projects import load_projects
        projects = load_projects()
        for agent in agents:
            for proj_name, proj in projects.items():
                if agent.name in getattr(proj, "agents", []):
                    agent.project = proj_name
                    if proj.repo:
                        agent.working_directory = proj.repo
                    break
    except Exception:
        pass

    # Enrich with .claude/agents.json config
    configs_cache: dict[str, dict[str, AgentsJsonConfig]] = {}
    for agent in agents:
        wd = agent.working_directory
        if not wd:
            continue
        if wd not in configs_cache:
            configs_cache[wd] = read_agents_json(wd)
        configs = configs_cache[wd]
        if agent.name in configs:
            agent.agents_json_config = configs[agent.name]
        else:
            for key, cfg in configs.items():
                if key in agent.name or agent.name in key:
                    agent.agents_json_config = cfg
                    break

    return agents


# ── lifecycle (systemctl --user) ─────────────────────────────────────

def _primary_unit(label: str) -> str:
    """Pick the unit to act on: timer if it exists (scheduled), else service."""
    if (UNIT_DIR / f"{label}.timer").exists():
        return f"{label}.timer"
    return f"{label}.service"


def _systemctl(*args: str) -> bool:
    try:
        r = subprocess.run(
            ["systemctl", "--user", *args],
            capture_output=True, text=True, timeout=15,
        )
        return r.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def load_agent(label: str) -> bool:
    """Enable + start the agent's unit (timer for scheduled, service for keepalive)."""
    return _systemctl("enable", "--now", _primary_unit(label))


def unload_agent(label: str) -> bool:
    """Disable + stop the agent's unit."""
    return _systemctl("disable", "--now", _primary_unit(label))


def start_agent(label: str) -> bool:
    """Kick a one-off run now (always the .service, even for scheduled agents)."""
    return _systemctl("start", f"{label}.service")


def install_agent(plist_path: Path, progress_callback=None) -> tuple[bool, list[str]]:
    """Installing new agents is done by regenerating units from agents.conf."""
    msg = ("systemd 模式：新增 agent 請編輯 agents/agents.conf 後執行 "
           "`./bin/sk-setup-systemd`（不再使用 plist 安裝）。")
    if progress_callback:
        progress_callback(1, 1, msg)
    return False, [msg]


def update_schedule(agent: AgentInfo,
                    entries: list[dict[str, int]]) -> tuple[bool, str]:
    """Schedule lives in agents.conf; editing it + regenerating is the path."""
    return (False,
            "systemd 模式：請於 agents/agents.conf 修改排程後執行 "
            "`./bin/sk-setup-systemd` 重新生成 timer。")
