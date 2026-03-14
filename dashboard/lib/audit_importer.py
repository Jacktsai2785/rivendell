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

        cost = _extract_cost(content)
        tokens = _extract_tokens(content)
        sessions = _extract_sessions(content)
        api_calls = _extract_api_calls(content)

        if cost > 0 or tokens > 0:
            upsert_usage(date, sessions, api_calls, tokens, cost)
            imported += 1
    return imported


def _extract_cost(content: str) -> float:
    match = re.search(r"\$\s*([\d.]+)", content)
    return float(match.group(1)) if match else 0.0


def _extract_tokens(content: str) -> int:
    match = re.search(r"([\d,]+)\s*tokens", content, re.IGNORECASE)
    return int(match.group(1).replace(",", "")) if match else 0


def _extract_sessions(content: str) -> int:
    match = re.search(r"(\d+)\s*sessions?", content, re.IGNORECASE)
    return int(match.group(1)) if match else 0


def _extract_api_calls(content: str) -> int:
    match = re.search(r"(\d+)\s*(?:API\s*)?calls?", content, re.IGNORECASE)
    return int(match.group(1)) if match else 0
