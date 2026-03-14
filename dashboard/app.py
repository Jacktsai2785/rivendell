"""sk-dashboard — Streamlit management dashboard."""

import sys
from pathlib import Path

# Ensure dashboard/lib is importable
sys.path.insert(0, str(Path(__file__).parent))

import streamlit as st
from lib.db import init_db

st.set_page_config(page_title="sk-dashboard", page_icon="\U0001f4ca", layout="wide")
init_db()

from lib.audit_importer import import_audit_reports
if "imported" not in st.session_state:
    count = import_audit_reports()
    st.session_state.imported = True

st.sidebar.title("\U0001f4ca sk-dashboard")
page = st.sidebar.radio("Navigation", ["Overview", "Agents", "Token Usage"])

st.sidebar.divider()
if st.sidebar.button("🔍 Run Audit", use_container_width=True):
    with st.spinner("Running sk audit..."):
        import subprocess
        result = subprocess.run(
            ["./bin/sk", "audit"],
            capture_output=True, text=True,
            cwd="/Users/manibari/Documents/Projects/skills-test",
            timeout=120,
        )
        if result.returncode == 0:
            st.sidebar.success("Audit complete!")
            st.rerun()
        else:
            st.sidebar.error(f"Audit failed:\n{result.stderr[:300]}")

if page == "Overview":
    from pages.overview import render as overview_render
    overview_render()
elif page == "Agents":
    from pages.agents_page import render as agents_render
    agents_render()
elif page == "Token Usage":
    from pages.token_usage import render as token_render
    token_render()
