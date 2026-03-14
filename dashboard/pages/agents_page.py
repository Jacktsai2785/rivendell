"""Agents page — manage launchd agents with start/stop/run controls."""

import datetime
import time
import streamlit as st
from lib.agents import (
    list_agents, load_agent, unload_agent, start_agent,
    install_agent, update_schedule, WEEKDAY_NAMES,
)
from lib.db import get_conn


def render() -> None:
    st.title("Agent 管理")

    agents = list_agents()

    if not agents:
        st.info("未找到 sk agent")
        return

    for agent in agents:
        with st.container(border=True):
            # Header row
            col1, col2, col3 = st.columns([3, 1, 2])
            col1.subheader(f"{agent.project}/{agent.name}")

            if not agent.installed:
                status_text = "⚪ 未安裝"
            elif agent.loaded:
                status_text = "🟢 已載入"
            else:
                status_text = "🔴 未載入"
            if agent.exit_code is not None and agent.exit_code != 0:
                status_text = f"🔴 Exit {agent.exit_code}"
            col2.write(status_text)
            col3.write(f"排程：{agent.schedule_display}")

            # Action buttons
            btn_col1, btn_col2, _ = st.columns(3)
            key_prefix = agent.label.replace(".", "_")

            if not agent.installed:
                if btn_col1.button("📥 安裝", key=f"install_{key_prefix}"):
                    progress_bar = st.progress(0, text="準備安裝...")
                    status_area = st.empty()

                    def on_progress(step, total, msg):
                        progress_bar.progress(step / total, text=msg)

                    ok, logs = install_agent(agent.plist_path, progress_callback=on_progress)
                    for log_line in logs:
                        status_area.caption(log_line)
                    if ok:
                        progress_bar.progress(1.0, text="✅ 安裝完成")
                        st.success(f"{agent.name} 已安裝並載入")
                        time.sleep(1.5)
                        st.rerun()
                    else:
                        progress_bar.progress(1.0, text="❌ 安裝失敗")
                        st.error(f"安裝 {agent.name} 失敗")
                        for log_line in logs:
                            st.caption(log_line)
                btn_col2.caption("plist 尚未安裝到 LaunchAgents")
            elif not agent.loaded:
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

            if agent.installed:
                if btn_col2.button("🔄 立即執行", key=f"run_{key_prefix}"):
                    ok = start_agent(agent.label)
                    if ok:
                        st.toast(f"{agent.name} 已觸發")
                    else:
                        st.error(f"執行 {agent.name} 失敗")

            # Schedule editor
            with st.expander("⏰ 修改排程"):
                _schedule_editor(agent, key_prefix)

            # Log viewer
            with st.expander("📋 最近執行紀錄"):
                _show_recent_logs(agent.label)


def _schedule_editor(agent, key_prefix: str) -> None:
    """Multi-entry schedule editor."""
    # Initialize session state for this agent's schedule entries
    state_key = f"sched_entries_{key_prefix}"
    if state_key not in st.session_state:
        existing = agent.schedule_list
        if existing:
            st.session_state[state_key] = existing
        else:
            st.session_state[state_key] = [{"Hour": 0, "Minute": 0}]

    entries = st.session_state[state_key]

    # Render each entry
    for i, entry in enumerate(entries):
        col_time, col_freq, col_day, col_del = st.columns([2, 2, 2, 1])

        with col_time:
            t = st.time_input(
                f"時間 #{i+1}",
                value=datetime.time(entry.get("Hour", 0), entry.get("Minute", 0)),
                key=f"time_{key_prefix}_{i}",
            )
            entries[i]["Hour"] = t.hour
            entries[i]["Minute"] = t.minute

        with col_freq:
            has_wd = "Weekday" in entry
            freq = st.selectbox(
                f"頻率 #{i+1}",
                ["每天", "每週"],
                index=1 if has_wd else 0,
                key=f"freq_{key_prefix}_{i}",
            )

        with col_day:
            if freq == "每週":
                wd = st.selectbox(
                    f"星期 #{i+1}",
                    options=list(range(7)),
                    format_func=lambda x: f"週{WEEKDAY_NAMES[x]}",
                    index=entry.get("Weekday", 0),
                    key=f"wd_{key_prefix}_{i}",
                )
                entries[i]["Weekday"] = wd
            else:
                entries[i].pop("Weekday", None)
                st.write("")  # spacer

        with col_del:
            st.write("")  # align with inputs
            if len(entries) > 1:
                if st.button("🗑️", key=f"del_{key_prefix}_{i}"):
                    entries.pop(i)
                    st.rerun()

    # Add entry button
    if st.button("➕ 新增排程", key=f"add_{key_prefix}"):
        entries.append({"Hour": 0, "Minute": 0})
        st.rerun()

    # Preview
    from lib.agents import _format_one_schedule
    preview = " / ".join(_format_one_schedule(e) for e in entries)
    st.caption(f"預覽：{preview}")

    # Save
    if st.button("💾 儲存排程", key=f"save_sched_{key_prefix}"):
        ok, msg = update_schedule(agent, entries)
        if ok:
            st.success(msg)
            # Clear cached entries so next render reads from plist
            del st.session_state[state_key]
            time.sleep(1)
            st.rerun()
        else:
            st.error(msg)


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
            st.caption(f"報告: `{row['report_path']}`")
