"""Read and manage launchd agent state for sk-dashboard."""

from __future__ import annotations

import plistlib
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

AGENTS_DIR = Path.home() / "Library" / "LaunchAgents"
PROJECT_DIR = Path(__file__).parent.parent.parent  # skills-test root
AGENT_PREFIX = "com.sk.agent."
MAINTAIN_PREFIX = "com.skills."


@dataclass
class AgentInfo:
    label: str
    name: str
    project: str
    plist_path: Path
    schedule: dict[str, Any]
    loaded: bool
    installed: bool = True  # plist is in ~/Library/LaunchAgents/
    pid: int | None = None
    exit_code: int | None = None

    @property
    def schedule_list(self) -> list[dict[str, Any]]:
        """Return schedule as a list of calendar dicts (normalized)."""
        s = self.schedule
        if s.get("type") == "calendar":
            intervals = s.get("intervals")
            if intervals:
                return intervals
            # Single entry — extract calendar fields
            entry = {k: v for k, v in s.items() if k != "type"}
            return [entry] if entry else []
        return []

    @property
    def schedule_display(self) -> str:
        """Human-readable schedule string."""
        s = self.schedule
        if s.get("type") == "calendar":
            entries = self.schedule_list
            if not entries:
                return "手動"
            return " / ".join(_format_one_schedule(e) for e in entries)
        if s.get("type") == "interval":
            secs = s.get("seconds", 0)
            if secs >= 3600:
                return f"每 {secs // 3600} 小時"
            return f"每 {secs // 60} 分鐘"
        return "手動"


WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"]


def _format_one_schedule(entry: dict) -> str:
    """Format a single StartCalendarInterval entry."""
    parts = []
    if "Weekday" in entry:
        wd = entry["Weekday"]
        parts.append(f"每週{WEEKDAY_NAMES[wd % 7]}")
    h = entry.get("Hour", "*")
    m = entry.get("Minute", 0)
    parts.append(f"{h}:{m:02d}" if isinstance(m, int) else f"{h}:{m}")
    return " ".join(parts)


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
    if label.startswith(AGENT_PREFIX):
        # Label format: com.sk.agent.<project>.<name>
        parts = label.removeprefix(AGENT_PREFIX).split(".", 1)
        project = parts[0] if parts else "unknown"
        name = parts[1] if len(parts) > 1 else parts[0]
    elif label.startswith(MAINTAIN_PREFIX):
        # Label format: com.skills.<name>
        name = label.removeprefix(MAINTAIN_PREFIX)
        project = "skills-test"
    else:
        name = label
        project = "unknown"

    # Try to get project from WorkingDirectory
    wd = plist_data.get("WorkingDirectory", "")
    if wd:
        project = Path(wd).name

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
    """List all sk agents from ~/Library/LaunchAgents/ + project plist files."""
    agents: list[AgentInfo] = []
    seen_labels: set[str] = set()

    # 1. Installed agents in ~/Library/LaunchAgents/
    for plist_path in sorted(
        list(AGENTS_DIR.glob(f"{AGENT_PREFIX}*.plist"))
        + list(AGENTS_DIR.glob(f"{MAINTAIN_PREFIX}*.plist"))
    ):
        agent = _load_agent_info(plist_path, installed=True)
        if agent:
            agents.append(agent)
            seen_labels.add(agent.label)

    # 2. Project-level plist files (not yet installed)
    for plist_path in sorted(PROJECT_DIR.glob("com.*.plist")):
        agent = _load_agent_info(plist_path, installed=False)
        if agent and agent.label not in seen_labels:
            agents.append(agent)
            seen_labels.add(agent.label)

    return agents


def _load_agent_info(plist_path: Path, installed: bool) -> AgentInfo | None:
    """Load agent info from a plist file."""
    try:
        with open(plist_path, "rb") as f:
            data = plistlib.load(f)
    except Exception:
        return None

    label = data.get("Label", plist_path.stem)
    name, project = _extract_name_and_project(label, data)
    schedule = _parse_schedule(data)

    if installed:
        loaded, pid, exit_code = _check_loaded(label)
    else:
        loaded, pid, exit_code = False, None, None

    return AgentInfo(
        label=label,
        name=name,
        project=project,
        plist_path=plist_path,
        schedule=schedule,
        loaded=loaded,
        installed=installed,
        pid=pid,
        exit_code=exit_code,
    )


def install_agent(plist_path: Path, progress_callback=None) -> tuple[bool, list[str]]:
    """Copy plist to ~/Library/LaunchAgents/ and load it.

    Returns (success, log_messages).
    progress_callback(step, total, message) is called for each step.
    """
    import shutil
    logs: list[str] = []
    dest = AGENTS_DIR / plist_path.name

    def _step(step: int, total: int, msg: str) -> None:
        logs.append(msg)
        if progress_callback:
            progress_callback(step, total, msg)

    try:
        _step(1, 4, f"讀取 plist: {plist_path.name}")

        # Validate plist
        with open(plist_path, "rb") as f:
            data = plistlib.load(f)
        label = data.get("Label", "")
        if not label:
            _step(2, 4, "❌ plist 缺少 Label 欄位")
            return False, logs
        _step(2, 4, f"驗證通過: label={label}")

        # Copy to LaunchAgents
        shutil.copy2(plist_path, dest)
        _step(3, 4, f"複製到 {dest}")

        # Unload first in case already loaded
        subprocess.run(
            ["launchctl", "unload", str(dest)],
            capture_output=True, text=True, timeout=10,
        )

        # Load
        result = subprocess.run(
            ["launchctl", "load", str(dest)],
            capture_output=True, text=True, timeout=10,
        )

        # Verify loaded
        check = subprocess.run(
            ["launchctl", "list", label],
            capture_output=True, text=True, timeout=5,
        )
        if check.returncode == 0:
            _step(4, 4, "✅ launchctl load 成功")
            return True, logs
        elif result.returncode == 0:
            # load said OK but list says not found — still treat as success
            _step(4, 4, "✅ launchctl load 成功（等待排程）")
            return True, logs
        else:
            err = result.stderr.strip() or "unknown error"
            _step(4, 4, f"❌ launchctl load 失敗: {err}")
            return False, logs
    except Exception as e:
        logs.append(f"❌ 例外: {e}")
        return False, logs


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


def update_schedule(agent: AgentInfo,
                    entries: list[dict[str, int]]) -> tuple[bool, str]:
    """Update an agent's schedule in its plist, then reload.

    Args:
        agent: The agent to update.
        entries: List of schedule dicts, each with Hour, Minute, and optionally Weekday.
                 Example: [{"Hour": 7, "Minute": 30}, {"Hour": 22, "Minute": 0}]

    Returns (success, message).
    """
    if not entries:
        return False, "至少需要一個排程"

    plist_path = agent.plist_path
    try:
        with open(plist_path, "rb") as f:
            data = plistlib.load(f)

        # Single entry → dict, multiple → list of dicts
        if len(entries) == 1:
            data["StartCalendarInterval"] = entries[0]
        else:
            data["StartCalendarInterval"] = entries

        data.pop("StartInterval", None)

        with open(plist_path, "wb") as f:
            plistlib.dump(data, f)

        # If installed, also update the copy in LaunchAgents and reload
        if agent.installed:
            import shutil
            dest = AGENTS_DIR / plist_path.name
            if dest != plist_path:
                shutil.copy2(plist_path, dest)

            subprocess.run(
                ["launchctl", "unload", str(dest)],
                capture_output=True, text=True, timeout=10,
            )
            result = subprocess.run(
                ["launchctl", "load", str(dest)],
                capture_output=True, text=True, timeout=10,
            )
            if result.returncode != 0:
                return False, f"plist 已更新但 reload 失敗: {result.stderr.strip()}"

        display = " / ".join(_format_one_schedule(e) for e in entries)
        return True, f"排程已更新為：{display}"
    except Exception as e:
        return False, f"更新失敗: {e}"
