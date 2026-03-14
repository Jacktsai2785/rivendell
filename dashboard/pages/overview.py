"""Overview page — system health at a glance."""

import streamlit as st
from lib.agents import list_agents
from lib.hooks import list_hooks
from lib.skills import list_skills
from lib.tokens import get_total_stats


def render() -> None:
    st.title("總覽")

    # Metrics row
    agents = list_agents()
    hooks = list_hooks()
    skills = list_skills()
    totals = get_total_stats()

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Skill 總數", len(skills))
    col2.metric("執行中 Agent", sum(1 for a in agents if a.loaded))
    col3.metric("啟用 Hook", len(hooks))
    col4.metric("估算總花費", f"${totals['total_cost_usd']:.2f}")

    # Agent status table
    st.subheader("Agent 狀態")
    if agents:
        for agent in agents:
            if not agent.installed:
                status = "⚪ 未安裝"
            elif agent.loaded:
                status = "🟢 已載入"
            else:
                status = "🔴 未載入"
            if agent.exit_code is not None and agent.exit_code != 0:
                status = f"🔴 exit={agent.exit_code}"
            col_a, col_b, col_c = st.columns([2, 1, 1])
            col_a.write(f"**{agent.project}/{agent.name}**")
            col_b.write(status)
            col_c.write(f"排程 {agent.schedule_display}")
    else:
        st.info("未找到 sk agent")

    # Hook status table
    st.subheader("Hook 狀態")
    if hooks:
        for hook in hooks:
            col_a, col_b, col_c = st.columns([1, 1, 2])
            col_a.write(f"**{hook.event}**")
            col_b.write(hook.matcher or "（全部）")
            col_c.code(hook.command, language=None)
    else:
        st.info("未設定 hook（~/.claude/settings.json）")
