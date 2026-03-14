"""Agents page — manage launchd agents with start/stop/run controls."""

import streamlit as st
from lib.agents import list_agents, load_agent, unload_agent, start_agent
from lib.db import get_conn


def render() -> None:
    st.title("Agent 管理")

    agents = list_agents()

    if not agents:
        st.info("未找到 sk agent（~/Library/LaunchAgents/）")
        return

    for agent in agents:
        with st.container(border=True):
            # Header row
            col1, col2, col3 = st.columns([3, 1, 2])
            col1.subheader(f"{agent.project}/{agent.name}")

            status_text = "🟢 已載入" if agent.loaded else "🔴 未載入"
            if agent.exit_code is not None and agent.exit_code != 0:
                status_text = f"🔴 Exit {agent.exit_code}"
            col2.write(status_text)
            col3.write(f"排程：{agent.schedule}")

            # Action buttons
            btn_col1, btn_col2, btn_col3 = st.columns(3)
            key_prefix = agent.label.replace(".", "_")

            if not agent.loaded:
                if btn_col1.button("▶ 啟動", key=f"start_{key_prefix}"):
                    ok = load_agent(agent.label)
                    if ok:
                        st.success(f"{agent.name} 已啟動")
                        st.rerun()
                    else:
                        st.error(f"啟動 {agent.name} 失敗")
            else:
                if btn_col1.button("⏹ 停止", key=f"stop_{key_prefix}"):
                    ok = unload_agent(agent.label)
                    if ok:
                        st.success(f"{agent.name} 已停止")
                        st.rerun()
                    else:
                        st.error(f"停止 {agent.name} 失敗")

            if btn_col2.button("🔄 立即執行", key=f"run_{key_prefix}"):
                ok = start_agent(agent.label)
                if ok:
                    st.toast(f"{agent.name} 已觸發")
                else:
                    st.error(f"執行 {agent.name} 失敗")

            # Log viewer
            with st.expander("📋 最近執行紀錄"):
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
        st.caption("尚無執行紀錄")
        return

    for row in rows:
        exit_icon = "✅" if row["exit_code"] == 0 else "❌"
        st.write(
            f"{exit_icon} {row['started_at']} → {row['finished_at'] or '?'} "
            f"| exit={row['exit_code']} | tokens={row['tokens_used'] or '?'}"
        )
        if row["report_path"]:
            st.caption(f"Report: `{row['report_path']}`")
