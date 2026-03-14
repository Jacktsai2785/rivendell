"""Agents page — manage launchd agents with start/stop/run controls."""

import streamlit as st
from lib.agents import list_agents, load_agent, unload_agent, start_agent
from lib.db import get_conn


def render() -> None:
    st.title("🤖 Agents")

    agents = list_agents()

    if not agents:
        st.info("No sk agents found in ~/Library/LaunchAgents/")
        return

    for agent in agents:
        with st.container(border=True):
            # Header row
            col1, col2, col3 = st.columns([3, 1, 2])
            col1.subheader(f"{agent.project}/{agent.name}")

            status_text = "🟢 Loaded" if agent.loaded else "🔴 Unloaded"
            if agent.exit_code is not None and agent.exit_code != 0:
                status_text = f"🔴 Exit {agent.exit_code}"
            col2.write(status_text)
            col3.write(f"Schedule: {agent.schedule}")

            # Action buttons
            btn_col1, btn_col2, btn_col3 = st.columns(3)
            key_prefix = agent.label.replace(".", "_")

            if not agent.loaded:
                if btn_col1.button("▶ Start", key=f"start_{key_prefix}"):
                    ok = load_agent(agent.label)
                    if ok:
                        st.success(f"{agent.name} started")
                        st.rerun()
                    else:
                        st.error(f"Failed to start {agent.name}")
            else:
                if btn_col1.button("⏹ Stop", key=f"stop_{key_prefix}"):
                    ok = unload_agent(agent.label)
                    if ok:
                        st.success(f"{agent.name} stopped")
                        st.rerun()
                    else:
                        st.error(f"Failed to stop {agent.name}")

            if btn_col2.button("🔄 Run Now", key=f"run_{key_prefix}"):
                ok = start_agent(agent.label)
                if ok:
                    st.toast(f"{agent.name} triggered")
                else:
                    st.error(f"Failed to run {agent.name}")

            # Log viewer
            with st.expander("📋 Recent Logs"):
                _show_recent_logs(agent.label)


def _show_recent_logs(agent_label: str) -> None:
    """Show the 3 most recent agent_runs from SQLite."""
    conn = get_conn()
    parts = agent_label.split(".")
    agent_name = parts[-1] if len(parts) > 4 else parts[-1]

    rows = conn.execute("""
        SELECT * FROM agent_runs
        WHERE agent_name = ?
        ORDER BY started_at DESC
        LIMIT 3
    """, (agent_name,)).fetchall()
    conn.close()

    if not rows:
        st.caption("No run records yet.")
        return

    for row in rows:
        exit_icon = "✅" if row["exit_code"] == 0 else "❌"
        st.write(
            f"{exit_icon} {row['started_at']} → {row['finished_at'] or '?'} "
            f"| exit={row['exit_code']} | tokens={row['tokens_used'] or '?'}"
        )
        if row["report_path"]:
            st.caption(f"Report: `{row['report_path']}`")
