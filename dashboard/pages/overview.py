"""Overview page — system health at a glance."""

import streamlit as st
from lib.agents import list_agents
from lib.hooks import list_hooks
from lib.skills import list_skills
from lib.tokens import get_today_cost


def render() -> None:
    st.title("🏠 Overview")

    # Metrics row
    agents = list_agents()
    hooks = list_hooks()
    skills = list_skills()
    today_cost = get_today_cost()

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Skills", len(skills))
    col2.metric("Active Agents", sum(1 for a in agents if a.loaded))
    col3.metric("Active Hooks", len(hooks))
    col4.metric("Today Cost", f"${today_cost:.2f}")

    # Agent status table
    st.subheader("Agent Status")
    if agents:
        for agent in agents:
            status = "🟢 loaded" if agent.loaded else "🔴 unloaded"
            if agent.exit_code is not None and agent.exit_code != 0:
                status = f"🔴 exit={agent.exit_code}"
            col_a, col_b, col_c = st.columns([2, 1, 1])
            col_a.write(f"**{agent.project}/{agent.name}**")
            col_b.write(status)
            col_c.write(f"⏰ {agent.schedule}")
    else:
        st.info("No sk agents found in ~/Library/LaunchAgents/")

    # Hook status table
    st.subheader("Hook Status")
    if hooks:
        for hook in hooks:
            col_a, col_b, col_c = st.columns([1, 1, 2])
            col_a.write(f"**{hook.event}**")
            col_b.write(hook.matcher or "(all)")
            col_c.code(hook.command, language=None)
    else:
        st.info("No hooks configured in ~/.claude/settings.json")
