"""Token usage data from Claude Code stats-cache.json and session JSONL files."""

from __future__ import annotations

import json
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

STATS_CACHE = Path.home() / ".claude" / "stats-cache.json"
PROJECTS_DIR = Path.home() / ".claude" / "projects"

# Pricing per million tokens
PRICING: dict[str, dict[str, float]] = {
    "claude-opus-4-6":              {"input": 15.0, "output": 75.0, "cache_read": 1.5, "cache_create": 18.75},
    "claude-opus-4-5-20251101":     {"input": 15.0, "output": 75.0, "cache_read": 1.5, "cache_create": 18.75},
    "claude-sonnet-4-5-20250929":   {"input": 3.0,  "output": 15.0, "cache_read": 0.3, "cache_create": 3.75},
    "claude-sonnet-4-6":            {"input": 3.0,  "output": 15.0, "cache_read": 0.3, "cache_create": 3.75},
    "claude-haiku-4-5-20251001":    {"input": 0.8,  "output": 4.0,  "cache_read": 0.08, "cache_create": 1.0},
}
DEFAULT_PRICING = {"input": 15.0, "output": 75.0, "cache_read": 1.5, "cache_create": 18.75}


@dataclass
class DailyUsage:
    date: str
    sessions: int
    messages: int
    tool_calls: int
    tokens_total: int
    cost_usd: float
    models: dict[str, int] = field(default_factory=dict)


@dataclass
class ProjectUsage:
    project: str
    sessions: int
    messages: int
    tool_calls: int
    tokens_total: int
    cost_usd: float


@dataclass
class ModelSummary:
    model: str
    input_tokens: int
    output_tokens: int
    cache_read_tokens: int
    cache_create_tokens: int
    cost_usd: float


def _estimate_cost(model: str, input_t: int, output_t: int,
                   cache_read: int, cache_create: int) -> float:
    p = PRICING.get(model, DEFAULT_PRICING)
    return (
        input_t * p["input"] / 1_000_000
        + output_t * p["output"] / 1_000_000
        + cache_read * p["cache_read"] / 1_000_000
        + cache_create * p["cache_create"] / 1_000_000
    )


def _read_stats_cache() -> dict:
    if not STATS_CACHE.exists():
        return {}
    return json.loads(STATS_CACHE.read_text())


def get_daily_usage(days: int | None = 30) -> list[DailyUsage]:
    """Get daily usage from stats-cache.json + recent JSONL sessions."""
    data = _read_stats_cache()
    if not data:
        return []

    cutoff = ""
    if days:
        cutoff = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

    # From stats-cache: dailyActivity + dailyModelTokens
    activity_by_date = {d["date"]: d for d in data.get("dailyActivity", [])}
    tokens_by_date = {d["date"]: d.get("tokensByModel", {})
                      for d in data.get("dailyModelTokens", [])}

    all_dates = sorted(set(list(activity_by_date.keys()) + list(tokens_by_date.keys())))
    results = []

    for date in all_dates:
        if cutoff and date < cutoff:
            continue
        act = activity_by_date.get(date, {})
        models = tokens_by_date.get(date, {})
        total_tokens = sum(models.values())

        results.append(DailyUsage(
            date=date,
            sessions=act.get("sessionCount", 0),
            messages=act.get("messageCount", 0),
            tool_calls=act.get("toolCallCount", 0),
            tokens_total=total_tokens,
            cost_usd=0.0,  # Per-day cost not available from cache
            models=models,
        ))

    # Supplement with recent JSONL data (after lastComputedDate)
    last_computed = data.get("lastComputedDate", "")
    if last_computed:
        recent = _parse_recent_sessions(last_computed)
        existing_dates = {r.date for r in results}
        for r in recent:
            if cutoff and r.date < cutoff:
                continue
            if r.date not in existing_dates:
                results.append(r)

    results.sort(key=lambda x: x.date)
    return results


def get_model_summary() -> list[ModelSummary]:
    """Get per-model token breakdown with estimated costs."""
    data = _read_stats_cache()
    model_usage = data.get("modelUsage", {})

    results = []
    for model, counts in model_usage.items():
        input_t = counts.get("inputTokens", 0)
        output_t = counts.get("outputTokens", 0)
        cache_read = counts.get("cacheReadInputTokens", 0)
        cache_create = counts.get("cacheCreationInputTokens", 0)
        cost = _estimate_cost(model, input_t, output_t, cache_read, cache_create)
        results.append(ModelSummary(
            model=model,
            input_tokens=input_t,
            output_tokens=output_t,
            cache_read_tokens=cache_read,
            cache_create_tokens=cache_create,
            cost_usd=cost,
        ))

    return sorted(results, key=lambda x: x.cost_usd, reverse=True)


def get_total_stats() -> dict[str, Any]:
    """Get high-level totals."""
    data = _read_stats_cache()
    models = get_model_summary()
    return {
        "total_sessions": data.get("totalSessions", 0),
        "total_messages": data.get("totalMessages", 0),
        "first_session": data.get("firstSessionDate", ""),
        "last_computed": data.get("lastComputedDate", ""),
        "total_cost_usd": sum(m.cost_usd for m in models),
        "total_input": sum(m.input_tokens for m in models),
        "total_output": sum(m.output_tokens for m in models),
        "total_cache_read": sum(m.cache_read_tokens for m in models),
    }


def _dir_to_project_name(dir_name: str) -> str:
    """Convert project dir name to human-readable project name.

    e.g. '-Users-manibari-Documents-Projects-skills-test' → 'skills-test'
    The dir name encodes the absolute path with dashes replacing slashes.
    """
    # Build prefix from actual home directory
    home = str(Path.home())  # e.g. /Users/manibari
    home_prefix = home.replace("/", "-")  # → -Users-manibari
    name = dir_name
    if name.startswith(home_prefix):
        name = name[len(home_prefix):]
        # Strip leading dash
        name = name.lstrip("-")
        # Try to get the last meaningful path segment
        # e.g. "Documents-Projects-skills-test" → "skills-test"
        parts = name.split("-")
        # Skip common intermediate dirs
        skip = {"Documents", "Projects", "Desktop", "repos", "src", "code", "dev"}
        meaningful = []
        found_project = False
        for p in parts:
            if p in skip and not found_project:
                continue
            found_project = True
            meaningful.append(p)
        name = "-".join(meaningful) if meaningful else name
    return name if name else dir_name


@dataclass
class FilteredUsage:
    """All usage data filtered by date range, parsed from JSONL in one pass."""
    models: list[ModelSummary]
    projects: list[ProjectUsage]
    daily: list[DailyUsage]
    total_sessions: int
    total_messages: int
    total_cost_usd: float
    total_tokens: int


def get_filtered_usage(date_start: str | None = None,
                       date_end: str | None = None) -> FilteredUsage:
    """Parse all JSONL sessions once, filtered by date range.

    date_start/date_end are ISO date strings (YYYY-MM-DD), inclusive.
    If both are None, returns all data.
    """
    # Per-project accumulators
    projects: dict[str, dict] = defaultdict(lambda: {
        "sessions": set(), "messages": 0, "tool_calls": 0,
        "by_model": defaultdict(lambda: {
            "input": 0, "output": 0, "cache_read": 0, "cache_create": 0,
        }),
    })
    # Per-model accumulators
    models_agg: dict[str, dict] = defaultdict(lambda: {
        "input": 0, "output": 0, "cache_read": 0, "cache_create": 0,
    })
    # Per-day accumulators
    daily_agg: dict[str, dict] = defaultdict(lambda: {
        "sessions": set(), "messages": 0, "tool_calls": 0,
        "by_model": defaultdict(lambda: {
            "input": 0, "output": 0, "cache_read": 0, "cache_create": 0,
        }),
    })
    all_sessions: set[str] = set()

    for project_dir in PROJECTS_DIR.iterdir():
        if not project_dir.is_dir():
            continue
        project_name = _dir_to_project_name(project_dir.name)
        for jsonl_path in project_dir.glob("*.jsonl"):
            _parse_jsonl_unified(
                jsonl_path, project_name, date_start, date_end,
                projects, models_agg, daily_agg, all_sessions,
            )

    # Build model summary
    model_results = []
    for model, m in models_agg.items():
        cost = _estimate_cost(model, m["input"], m["output"], m["cache_read"], m["cache_create"])
        model_results.append(ModelSummary(
            model=model, input_tokens=m["input"], output_tokens=m["output"],
            cache_read_tokens=m["cache_read"], cache_create_tokens=m["cache_create"],
            cost_usd=cost,
        ))
    model_results.sort(key=lambda x: x.cost_usd, reverse=True)

    # Build project usage
    proj_results = []
    for project, d in projects.items():
        tokens = sum(m["input"] + m["output"] for m in d["by_model"].values())
        cost = sum(
            _estimate_cost(mdl, m["input"], m["output"], m["cache_read"], m["cache_create"])
            for mdl, m in d["by_model"].items()
        )
        proj_results.append(ProjectUsage(
            project=project, sessions=len(d["sessions"]),
            messages=d["messages"], tool_calls=d["tool_calls"],
            tokens_total=tokens, cost_usd=cost,
        ))
    proj_results.sort(key=lambda x: x.cost_usd, reverse=True)

    # Build daily usage
    daily_results = []
    for date_str in sorted(daily_agg):
        d = daily_agg[date_str]
        tokens = sum(m["input"] + m["output"] for m in d["by_model"].values())
        cost = sum(
            _estimate_cost(mdl, m["input"], m["output"], m["cache_read"], m["cache_create"])
            for mdl, m in d["by_model"].items()
        )
        daily_results.append(DailyUsage(
            date=date_str, sessions=len(d["sessions"]),
            messages=d["messages"], tool_calls=d["tool_calls"],
            tokens_total=tokens, cost_usd=cost,
            models={mdl: m["input"] + m["output"] for mdl, m in d["by_model"].items()},
        ))

    total_cost = sum(m.cost_usd for m in model_results)
    total_tokens = sum(m.input_tokens + m.output_tokens for m in model_results)
    total_messages = sum(d["messages"] for d in projects.values())

    return FilteredUsage(
        models=model_results, projects=proj_results, daily=daily_results,
        total_sessions=len(all_sessions), total_messages=total_messages,
        total_cost_usd=total_cost, total_tokens=total_tokens,
    )


def _parse_jsonl_unified(
    path: Path, project: str,
    date_start: str | None, date_end: str | None,
    projects: dict, models_agg: dict, daily_agg: dict,
    all_sessions: set,
) -> None:
    """Parse one JSONL file, accumulating into all three aggregation dicts."""
    try:
        with open(path) as f:
            for line in f:
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue

                # Date filtering via entry timestamp
                ts = entry.get("timestamp", "")
                if not ts:
                    continue
                date_str = ts[:10]  # "2026-02-15T14:54:11.096Z" → "2026-02-15"
                if date_start and date_str < date_start:
                    continue
                if date_end and date_str > date_end:
                    continue

                msg = entry.get("message", {})
                usage = msg.get("usage")
                if not usage:
                    continue

                model = msg.get("model", "unknown")
                session_id = entry.get("sessionId", str(path))
                all_sessions.add(session_id)

                input_t = usage.get("input_tokens", 0)
                output_t = usage.get("output_tokens", 0)
                cache_read = usage.get("cache_read_input_tokens", 0)
                cache_create = usage.get("cache_creation_input_tokens", 0)

                # Count tool calls
                tool_calls = 0
                if msg.get("role") == "assistant":
                    content = msg.get("content", [])
                    if isinstance(content, list):
                        tool_calls = sum(
                            1 for c in content
                            if isinstance(c, dict) and c.get("type") == "tool_use"
                        )

                # Accumulate per-project
                pd = projects[project]
                pd["sessions"].add(session_id)
                pd["messages"] += 1
                pd["tool_calls"] += tool_calls
                pd["by_model"][model]["input"] += input_t
                pd["by_model"][model]["output"] += output_t
                pd["by_model"][model]["cache_read"] += cache_read
                pd["by_model"][model]["cache_create"] += cache_create

                # Accumulate per-model
                models_agg[model]["input"] += input_t
                models_agg[model]["output"] += output_t
                models_agg[model]["cache_read"] += cache_read
                models_agg[model]["cache_create"] += cache_create

                # Accumulate per-day
                dd = daily_agg[date_str]
                dd["sessions"].add(session_id)
                dd["messages"] += 1
                dd["tool_calls"] += tool_calls
                dd["by_model"][model]["input"] += input_t
                dd["by_model"][model]["output"] += output_t
                dd["by_model"][model]["cache_read"] += cache_read
                dd["by_model"][model]["cache_create"] += cache_create
    except Exception:
        pass


def get_project_usage() -> list[ProjectUsage]:
    """Get token usage aggregated by project from JSONL session files."""
    return get_filtered_usage().projects


def _parse_one_session_for_project(path: Path, project: str, projects: dict) -> None:
    """Parse a session JSONL and aggregate into the project bucket."""
    try:
        with open(path) as f:
            for line in f:
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue

                msg = entry.get("message", {})
                usage = msg.get("usage")
                if not usage:
                    continue

                model = msg.get("model", "unknown")
                session_id = entry.get("sessionId", str(path))

                d = projects[project]
                d["sessions"].add(session_id)
                d["messages"] += 1

                if msg.get("role") == "assistant":
                    content = msg.get("content", [])
                    if isinstance(content, list):
                        d["tool_calls"] += sum(
                            1 for c in content
                            if isinstance(c, dict) and c.get("type") == "tool_use"
                        )

                d["by_model"][model]["input"] += usage.get("input_tokens", 0)
                d["by_model"][model]["output"] += usage.get("output_tokens", 0)
                d["by_model"][model]["cache_read"] += usage.get("cache_read_input_tokens", 0)
                d["by_model"][model]["cache_create"] += usage.get("cache_creation_input_tokens", 0)
    except Exception:
        pass


def _parse_recent_sessions(after_date: str) -> list[DailyUsage]:
    """Parse JSONL session files modified after a given date."""
    cutoff_ts = datetime.strptime(after_date, "%Y-%m-%d").timestamp()

    daily: dict[str, dict] = defaultdict(lambda: {
        "sessions": set(),
        "messages": 0,
        "tool_calls": 0,
        "by_model": defaultdict(lambda: {
            "input": 0, "output": 0, "cache_read": 0, "cache_create": 0,
        }),
    })

    for project_dir in PROJECTS_DIR.iterdir():
        if not project_dir.is_dir():
            continue
        for jsonl_path in project_dir.glob("*.jsonl"):
            if jsonl_path.stat().st_mtime < cutoff_ts:
                continue
            _parse_one_session(jsonl_path, daily)

    results = []
    for date_str in sorted(daily):
        if date_str <= after_date:
            continue
        d = daily[date_str]
        total_tokens = sum(
            m["input"] + m["output"]
            for m in d["by_model"].values()
        )
        cost = sum(
            _estimate_cost(model, m["input"], m["output"], m["cache_read"], m["cache_create"])
            for model, m in d["by_model"].items()
        )
        models = {model: m["input"] + m["output"] for model, m in d["by_model"].items()}

        results.append(DailyUsage(
            date=date_str,
            sessions=len(d["sessions"]),
            messages=d["messages"],
            tool_calls=d["tool_calls"],
            tokens_total=total_tokens,
            cost_usd=cost,
            models=models,
        ))

    return results


def _parse_one_session(path: Path, daily: dict) -> None:
    """Parse a single JSONL session file for token usage."""
    file_date = datetime.fromtimestamp(path.stat().st_mtime).strftime("%Y-%m-%d")
    try:
        with open(path) as f:
            for line in f:
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue

                msg = entry.get("message", {})
                usage = msg.get("usage")
                if not usage:
                    continue

                model = msg.get("model", "unknown")
                session_id = entry.get("sessionId", str(path))
                date_str = file_date

                d = daily[date_str]
                d["sessions"].add(session_id)
                d["messages"] += 1

                if msg.get("role") == "assistant":
                    content = msg.get("content", [])
                    if isinstance(content, list):
                        d["tool_calls"] += sum(
                            1 for c in content
                            if isinstance(c, dict) and c.get("type") == "tool_use"
                        )

                d["by_model"][model]["input"] += usage.get("input_tokens", 0)
                d["by_model"][model]["output"] += usage.get("output_tokens", 0)
                d["by_model"][model]["cache_read"] += usage.get("cache_read_input_tokens", 0)
                d["by_model"][model]["cache_create"] += usage.get("cache_creation_input_tokens", 0)
    except Exception:
        pass
