"""SQLite database layer for sk-dashboard."""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "sk-dashboard.db"


def get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS token_usage (
            date TEXT PRIMARY KEY,
            sessions INTEGER,
            api_calls INTEGER,
            tokens_total INTEGER,
            cost_usd REAL,
            details_json TEXT
        );

        CREATE TABLE IF NOT EXISTS agent_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_name TEXT NOT NULL,
            project TEXT NOT NULL,
            started_at TEXT,
            finished_at TEXT,
            exit_code INTEGER,
            log_path TEXT,
            report_path TEXT,
            tokens_used INTEGER,
            cost_usd REAL
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    """)
    conn.commit()
    conn.close()
