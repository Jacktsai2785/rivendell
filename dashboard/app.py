"""sk-dashboard — Streamlit management dashboard."""

import sys
from pathlib import Path

# Ensure dashboard/lib is importable
sys.path.insert(0, str(Path(__file__).parent))

import streamlit as st
from lib.db import init_db

st.set_page_config(page_title="sk-dashboard", page_icon="📊", layout="wide")
init_db()

from lib.audit_importer import import_audit_reports
if "imported" not in st.session_state:
    count = import_audit_reports()
    st.session_state.imported = True

st.sidebar.title("📊 sk-dashboard")
page = st.sidebar.radio("導覽", ["總覽", "Agent 管理", "Token 用量", "Skill 總覽"])

st.sidebar.divider()
if st.sidebar.button("🔍 執行 Audit", use_container_width=True):
    with st.spinner("正在執行 sk audit..."):
        import subprocess
        result = subprocess.run(
            ["./bin/sk", "audit"],
            capture_output=True, text=True,
            cwd="/Users/manibari/Documents/Projects/skills-test",
            timeout=120,
        )
        if result.returncode == 0:
            st.sidebar.success("Audit 完成！")
            st.rerun()
        else:
            st.sidebar.error(f"Audit 失敗：\n{result.stderr[:300]}")

if page == "總覽":
    from pages.overview import render as overview_render
    overview_render()
elif page == "Agent 管理":
    from pages.agents_page import render as agents_render
    agents_render()
elif page == "Token 用量":
    from pages.token_usage import render as token_render
    token_render()
elif page == "Skill 總覽":
    from pages.skills_page import render as skills_render
    skills_render()
