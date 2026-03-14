"""Token Usage page — cost trends and daily breakdown."""

import streamlit as st
import pandas as pd
import plotly.express as px
from lib.tokens import get_usage


def render() -> None:
    st.title("📈 Token Usage")

    # Time range selector
    range_options = {"7 Days": 7, "30 Days": 30, "All": None}
    selected = st.radio("Time Range", list(range_options.keys()), horizontal=True)
    days = range_options[selected]

    usage = get_usage(days)

    if not usage:
        st.warning("No token usage data yet. Run `sk audit` to populate.")
        return

    df = pd.DataFrame([
        {
            "Date": u.date,
            "Sessions": u.sessions,
            "API Calls": u.api_calls,
            "Tokens": u.tokens_total,
            "Cost (USD)": u.cost_usd,
        }
        for u in usage
    ])

    # Summary metrics
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Cost", f"${df['Cost (USD)'].sum():.2f}")
    col2.metric("Total Tokens", f"{df['Tokens'].sum():,}")
    col3.metric("Total Sessions", f"{df['Sessions'].sum():,}")

    # Line chart: daily cost
    fig_line = px.line(
        df, x="Date", y="Cost (USD)",
        title="Daily Cost (USD)",
        markers=True,
    )
    fig_line.update_layout(height=350)
    st.plotly_chart(fig_line, use_container_width=True)

    # Bar chart: daily tokens
    fig_bar = px.bar(
        df, x="Date", y="Tokens",
        title="Daily Token Usage",
    )
    fig_bar.update_layout(height=300)
    st.plotly_chart(fig_bar, use_container_width=True)

    # Detail table
    st.subheader("Daily Breakdown")
    st.dataframe(
        df.sort_values("Date", ascending=False),
        use_container_width=True,
        hide_index=True,
    )
