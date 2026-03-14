"""Token usage tracking for sk-dashboard."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from .db import get_conn


@dataclass
class DailyUsage:
    date: str
    sessions: int
    api_calls: int
    tokens_total: int
    cost_usd: float
    details_json: str | None = None


def get_usage(days: int | None = None) -> list[DailyUsage]:
    """Get daily usage records, optionally limited to last N days.

    Returns records sorted by date ascending.
    """
    conn = get_conn()
    try:
        if days is not None:
            cutoff = (date.today() - timedelta(days=days)).isoformat()
            rows = conn.execute(
                "SELECT * FROM token_usage WHERE date >= ? ORDER BY date",
                (cutoff,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM token_usage ORDER BY date",
            ).fetchall()

        return [
            DailyUsage(
                date=row["date"],
                sessions=row["sessions"],
                api_calls=row["api_calls"],
                tokens_total=row["tokens_total"],
                cost_usd=row["cost_usd"],
                details_json=row["details_json"],
            )
            for row in rows
        ]
    finally:
        conn.close()


def get_today_cost() -> float:
    """Get today's total cost in USD. Returns 0.0 if no data."""
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT cost_usd FROM token_usage WHERE date = ?",
            (date.today().isoformat(),),
        ).fetchone()
        return float(row["cost_usd"]) if row else 0.0
    finally:
        conn.close()


def upsert_usage(
    usage_date: str,
    sessions: int,
    api_calls: int,
    tokens_total: int,
    cost_usd: float,
    details_json: str | None = None,
) -> None:
    """Insert or update a daily usage record."""
    conn = get_conn()
    try:
        conn.execute(
            """INSERT INTO token_usage (date, sessions, api_calls, tokens_total, cost_usd, details_json)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(date) DO UPDATE SET
                   sessions = excluded.sessions,
                   api_calls = excluded.api_calls,
                   tokens_total = excluded.tokens_total,
                   cost_usd = excluded.cost_usd,
                   details_json = excluded.details_json
            """,
            (usage_date, sessions, api_calls, tokens_total, cost_usd, details_json),
        )
        conn.commit()
    finally:
        conn.close()
