"""Token Usage page — cost trends and daily breakdown."""

import streamlit as st
import pandas as pd
import plotly.express as px
from lib.tokens import get_usage


def render() -> None:
    st.title("Token 用量")

    # Time range selector
    range_options = {"7 天": 7, "30 天": 30, "全部": None}
    selected = st.radio("時間範圍", list(range_options.keys()), horizontal=True)
    days = range_options[selected]

    usage = get_usage(days)

    if not usage:
        st.warning("尚無 token 用量資料，請先執行 `sk audit`。")
        return

    df = pd.DataFrame([
        {
            "日期": u.date,
            "Sessions": u.sessions,
            "API Calls": u.api_calls,
            "Tokens": u.tokens_total,
            "花費 (USD)": u.cost_usd,
        }
        for u in usage
    ])

    # Summary metrics
    col1, col2, col3 = st.columns(3)
    col1.metric("總花費", f"${df['花費 (USD)'].sum():.2f}")
    col2.metric("總 Tokens", f"{df['Tokens'].sum():,}")
    col3.metric("總 Sessions", f"{df['Sessions'].sum():,}")

    # Line chart: daily cost
    fig_line = px.line(
        df, x="日期", y="花費 (USD)",
        title="每日花費 (USD)",
        markers=True,
    )
    fig_line.update_layout(height=350)
    st.plotly_chart(fig_line, use_container_width=True)

    # Bar chart: daily tokens
    fig_bar = px.bar(
        df, x="日期", y="Tokens",
        title="每日 Token 用量",
    )
    fig_bar.update_layout(height=300)
    st.plotly_chart(fig_bar, use_container_width=True)

    # Detail table
    st.subheader("每日明細")
    st.dataframe(
        df.sort_values("日期", ascending=False),
        use_container_width=True,
        hide_index=True,
    )
