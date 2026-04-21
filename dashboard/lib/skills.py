"""Merge TSV metadata + SKILL.md files for rivendell."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

SKILLS_DIR = Path.home() / ".claude" / "skills"
TSV_PATH = Path(__file__).parent.parent.parent / "data" / "skill-summaries-zh.tsv"


@dataclass
class SkillInfo:
    name: str
    category: str
    summary: str
    line_count: int
    invocable: bool
    lifecycle: str  # "manual" | "hook" | "agent" | "unknown"


def _read_tsv(tsv_path: Path | None = None) -> dict[str, dict[str, str]]:
    """Read TSV file into {name: {category_zh, summary_zh}}."""
    path = tsv_path or TSV_PATH
    if not path.exists():
        return {}

    result: dict[str, dict[str, str]] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) >= 3:
            result[parts[0]] = {
                "category_zh": parts[1],
                "summary_zh": parts[2],
            }
    return result


def _parse_frontmatter(text: str) -> dict[str, Any]:
    """Extract YAML frontmatter values (simple key: value parsing)."""
    match = re.match(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
    if not match:
        return {}

    fm: dict[str, Any] = {}
    for line in match.group(1).splitlines():
        # Handle simple key: value (skip multiline)
        m = re.match(r"^(\w[\w_-]*)\s*:\s*(.+)$", line)
        if m:
            key = m.group(1)
            val = m.group(2).strip()
            # Parse booleans
            if val.lower() in ("true", "yes"):
                fm[key] = True
            elif val.lower() in ("false", "no"):
                fm[key] = False
            # Parse lists like [tag1, tag2]
            elif val.startswith("[") and val.endswith("]"):
                fm[key] = [v.strip() for v in val[1:-1].split(",")]
            else:
                fm[key] = val
    return fm


def _detect_lifecycle(name: str, frontmatter: dict[str, Any]) -> str:
    """Determine skill lifecycle: manual, hook, agent, or unknown."""
    tags = frontmatter.get("tags", [])
    if isinstance(tags, str):
        tags = [tags]

    # Check tags for hints
    if "hooks" in tags or "hook" in tags:
        return "hook"
    if "agent" in tags:
        return "agent"

    # Check source field
    source = frontmatter.get("source", "")
    if source == "hook":
        return "hook"

    return "manual"


def list_skills(
    skills_dir: Path | None = None,
    tsv_path: Path | None = None,
) -> list[SkillInfo]:
    """Merge TSV metadata with SKILL.md files.

    Skills found in SKILL.md but not in TSV get empty category/summary.
    Skills in TSV but without SKILL.md are skipped (file is source of truth).
    """
    sdir = skills_dir or SKILLS_DIR
    tsv_data = _read_tsv(tsv_path)
    result: list[SkillInfo] = []

    if not sdir.is_dir():
        return result

    for skill_dir in sorted(sdir.iterdir()):
        # Skip hidden dirs, backup dirs (e.g. gstack.bak from upgrades),
        # and regular files (like __pycache__)
        name = skill_dir.name
        if name.startswith(".") or name.endswith(".bak") or name.endswith(".old"):
            continue
        if not skill_dir.is_dir():
            continue
        skill_md = skill_dir / "SKILL.md"
        if not skill_md.is_file():
            continue

        name = skill_dir.name
        text = skill_md.read_text(encoding="utf-8")
        line_count = len(text.splitlines())
        frontmatter = _parse_frontmatter(text)

        invocable = frontmatter.get("user_invocable", True)
        if isinstance(invocable, str):
            invocable = invocable.lower() not in ("false", "no")

        lifecycle = _detect_lifecycle(name, frontmatter)

        tsv_entry = tsv_data.get(name, {})
        category = tsv_entry.get("category_zh", "")
        summary = tsv_entry.get("summary_zh", "")
        if not category and (name.startswith("gstack") or name == "gstack"):
            category = "gstack"

        result.append(SkillInfo(
            name=name,
            category=category,
            summary=summary,
            line_count=line_count,
            invocable=bool(invocable),
            lifecycle=lifecycle,
        ))

    return result
