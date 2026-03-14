"""Skills page — browsable skill catalog with categories and search."""

import streamlit as st
import pandas as pd
from lib.skills import list_skills


def render() -> None:
    st.title("Skill 總覽")

    skills = list_skills()

    if not skills:
        st.warning("未找到任何 skill。")
        return

    # Search
    search = st.text_input("搜尋 skill 名稱或功能說明", placeholder="輸入關鍵字...")

    # Category filter
    categories = sorted(set(s.category for s in skills))
    selected_cats = st.multiselect("篩選分類", categories, default=categories)

    # Filter
    filtered = [
        s for s in skills
        if s.category in selected_cats
        and (not search or search.lower() in s.name.lower() or search.lower() in s.summary.lower())
    ]

    st.caption(f"共 {len(filtered)} / {len(skills)} 個 skill")

    # Build dataframe
    df = pd.DataFrame([
        {
            "名稱": s.name,
            "分類": s.category,
            "功能說明": s.summary,
            "行數": s.line_count,
            "可呼叫": "✅" if s.invocable else "—",
            "狀態": s.lifecycle,
        }
        for s in filtered
    ])

    st.dataframe(
        df,
        use_container_width=True,
        hide_index=True,
        column_config={
            "名稱": st.column_config.TextColumn(width="medium"),
            "分類": st.column_config.TextColumn(width="small"),
            "功能說明": st.column_config.TextColumn(width="large"),
            "行數": st.column_config.NumberColumn(width="small"),
            "可呼叫": st.column_config.TextColumn(width="small"),
            "狀態": st.column_config.TextColumn(width="small"),
        },
    )
