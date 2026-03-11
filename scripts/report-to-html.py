#!/usr/bin/env python3
"""Generate a trader-focused HTML dashboard from daily report + portfolio state.

Data sources:
  --report     daily-YYYY-MM-DD.md  (markdown with tables)
  --state      portfolio-state.json (structured portfolio data)
  --structured *.structured.jsonl   (agent execution log, optional)

Design philosophy:
  1. Top strip: date, regime, VIX, key risk — one glance
  2. Heatmap: stock performance grid with color intensity
  3. Watchlist cards: thesis + entry condition, not raw tables
  4. Risk alerts: severity-colored cards
  5. Actions: what to do today
  6. Agent log: collapsible at bottom
"""

import argparse
import html as html_lib
import json
import re
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Data extraction from markdown
# ---------------------------------------------------------------------------

def extract_md_tables(md: str) -> dict[str, list[dict]]:
    """Extract all markdown tables into named groups by preceding ### heading."""
    tables: dict[str, list[dict]] = {}
    lines = md.split("\n")
    current_heading = ""
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("### ") or line.startswith("## "):
            current_heading = re.sub(r'^#+\s*', '', line).strip()
        elif "|" in line and i + 1 < len(lines) and re.match(r'\s*\|[-:|]+', lines[i + 1]):
            headers = [c.strip() for c in line.strip("|").split("|")]
            rows = []
            i += 2  # skip separator
            while i < len(lines) and "|" in lines[i] and lines[i].strip():
                cells = [c.strip() for c in lines[i].strip("|").split("|")]
                row = {}
                for hi, h in enumerate(headers):
                    row[h] = cells[hi] if hi < len(cells) else ""
                rows.append(row)
                i += 1
            tables[current_heading] = rows
            continue
        i += 1
    return tables


def extract_executive_summary(md: str) -> dict:
    """Pull key metrics from Executive Summary bullet points."""
    info = {}
    summary_match = re.search(r'## Executive Summary\n(.*?)(?=\n---|\n## )', md, re.DOTALL)
    if not summary_match:
        return info
    block = summary_match.group(1)
    for line in block.split("\n"):
        line = re.sub(r'\*\*', '', line).strip("- ")
        if "VIX" in line:
            m = re.search(r'VIX.*?:\s*([\d.]+)', line)
            if m:
                info["vix"] = float(m.group(1))
            info["vix_note"] = line
        elif "Fed" in line and "利率" in line:
            info["fed_note"] = line
        elif "市場週期" in line and "US" in line:
            m = re.search(r'(EXPANSION|CONTRACTION|RECOVERY|SLOWDOWN)', line)
            if m:
                info["us_regime"] = m.group(1)
        elif "市場週期" in line and "TW" in line:
            m = re.search(r'(EXPANSION|CONTRACTION|RECOVERY|SLOWDOWN)', line)
            if m:
                info["tw_regime"] = m.group(1)
        elif "CPI" in line:
            info["cpi_note"] = line
        elif "風險" in line or "risk" in line.lower():
            info["risk_note"] = line
    return info


def extract_sources(md: str) -> list[dict]:
    """Extract source links from end of markdown."""
    sources = []
    for m in re.finditer(r'- \[([^\]]+)\]\(([^)]+)\)', md):
        sources.append({"title": m.group(1), "url": m.group(2)})
    return sources


def pct_to_float(s: str) -> float | None:
    """Parse percentage string like '+2.17%' or '-0.46%' to float."""
    m = re.search(r'([+-]?\d+\.?\d*)%', re.sub(r'\*', '', s))
    return float(m.group(1)) if m else None


# ---------------------------------------------------------------------------
# HTML components
# ---------------------------------------------------------------------------

def esc(s: str) -> str:
    return html_lib.escape(str(s))


def regime_badge(regime: str) -> str:
    colors = {
        "EXPANSION": ("#3fb950", "#0d2818"),
        "SLOWDOWN": ("#d29922", "#2d1b00"),
        "CONTRACTION": ("#f85149", "#3d0c0c"),
        "RECOVERY": ("#58a6ff", "#0c2d4d"),
    }
    fg, bg = colors.get(regime, ("#8b949e", "#21262d"))
    return f'<span class="badge" style="background:{bg};color:{fg};border:1px solid {fg}40">{regime}</span>'


def vix_gauge(vix: float) -> str:
    """CSS-only VIX gauge."""
    if vix < 15:
        color, label = "#3fb950", "低"
    elif vix < 20:
        color, label = "#58a6ff", "正常"
    elif vix < 25:
        color, label = "#d29922", "偏高"
    elif vix < 30:
        color, label = "#db6d28", "警戒"
    else:
        color, label = "#f85149", "極端"
    pct = min(vix / 50 * 100, 100)
    return f'''<div class="gauge-box">
      <div class="gauge-label">VIX</div>
      <div class="gauge-bar"><div class="gauge-fill" style="width:{pct}%;background:{color}"></div></div>
      <div class="gauge-val" style="color:{color}">{vix:.1f} <small>{label}</small></div>
    </div>'''


def pct_bar(val: float | None, max_abs: float = 20) -> str:
    """Inline CSS bar for percentage change."""
    if val is None:
        return '<span class="dim">—</span>'
    color = "#3fb950" if val >= 0 else "#f85149"
    width = min(abs(val) / max_abs * 100, 100)
    sign = "+" if val >= 0 else ""
    direction = "right" if val >= 0 else "left"
    return f'''<div class="pct-cell">
      <span class="pct-num" style="color:{color}">{sign}{val:.2f}%</span>
      <div class="pct-track"><div class="pct-fill" style="width:{width}%;background:{color};float:{direction}"></div></div>
    </div>'''


def heatmap_tile(symbol: str, name: str, d1: float | None, d5: float | None, price: str = "") -> str:
    """Single stock tile for heatmap grid."""
    val = d1 if d1 is not None else d5
    if val is None:
        bg = "#21262d"
        fg = "#8b949e"
    elif val > 5:
        bg = "#0d3b1e"
        fg = "#3fb950"
    elif val > 2:
        bg = "#0d2818"
        fg = "#3fb950"
    elif val > 0:
        bg = "#0d2212"
        fg = "#56d364"
    elif val > -2:
        bg = "#2d0c0c"
        fg = "#f08080"
    elif val > -5:
        bg = "#3d0c0c"
        fg = "#f85149"
    else:
        bg = "#5a0c0c"
        fg = "#ff6b6b"
    sign = "+" if val and val > 0 else ""
    d1_str = f"{'+' if d1 and d1>0 else ''}{d1:.1f}%" if d1 is not None else "—"
    d5_str = f"{'+' if d5 and d5>0 else ''}{d5:.1f}%" if d5 is not None else "—"
    return f'''<div class="tile" style="background:{bg}">
      <div class="tile-sym" style="color:{fg}">{esc(symbol)}</div>
      <div class="tile-name">{esc(name)}</div>
      <div class="tile-pct" style="color:{fg}">{d1_str}</div>
      <div class="tile-sub">5d: {d5_str}</div>
    </div>'''


def alert_card(alert: dict) -> str:
    sev = alert.get("severity", "MEDIUM")
    colors = {"CRITICAL": "#f85149", "HIGH": "#db6d28", "MEDIUM": "#d29922", "LOW": "#58a6ff"}
    icons = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🔵"}
    color = colors.get(sev, "#8b949e")
    icon = icons.get(sev, "⚪")
    atype = alert.get("type", "").replace("_", " ")
    return f'''<div class="alert-card" style="border-left:3px solid {color}">
      <div class="alert-head"><span>{icon}</span> <strong>{esc(atype)}</strong> <span class="alert-sev" style="color:{color}">{sev}</span></div>
      <div class="alert-msg">{esc(alert.get("message", ""))}</div>
    </div>'''


def watchlist_card(item: dict) -> str:
    tier = item.get("tier", 2)
    tier_badge = f'<span class="tier tier{tier}">T{tier}</span>'
    price = item.get("last_price")
    price_str = f"${price:,.2f}" if isinstance(price, (int, float)) and price else "—"
    return f'''<div class="watch-card">
      <div class="watch-head">{tier_badge} <strong>{esc(item.get("symbol",""))}</strong> <span class="watch-name">{esc(item.get("name",""))}</span> <span class="watch-price">{price_str}</span></div>
      <div class="watch-thesis">{esc(item.get("thesis",""))}</div>
      <div class="watch-entry">進場條件: {esc(item.get("entry_condition",""))}</div>
    </div>'''


def allocation_chart(alloc: dict) -> str:
    """CSS-only donut-style horizontal bar chart for allocation."""
    items = [
        ("股票", alloc.get("stocks", 0), "#58a6ff"),
        ("債券", alloc.get("bonds_etf", 0), "#3fb950"),
        ("黃金", alloc.get("gold_commodities", 0), "#d29922"),
        ("現金", alloc.get("cash", 0), "#8b949e"),
    ]
    bars = ""
    for label, pct, color in items:
        w = pct * 100
        bars += f'<div class="alloc-row"><span class="alloc-label">{label}</span><div class="alloc-track"><div class="alloc-fill" style="width:{w}%;background:{color}"></div></div><span class="alloc-pct">{w:.0f}%</span></div>\n'
    rationale = esc(alloc.get("rationale", ""))
    return f'<div class="alloc-chart">{bars}<p class="alloc-note">{rationale}</p></div>'


def structured_log_section(jsonl_path: Path) -> str:
    if not jsonl_path or not jsonl_path.exists() or jsonl_path.stat().st_size == 0:
        return ""
    events = []
    with open(jsonl_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    if not events:
        return ""

    rows = ""
    for ev in events:
        ts = ev.get("ts", "?")
        time_part = ts.split("T")[1] if "T" in ts else ts
        etype = ev.get("type", "?")
        if etype == "thinking":
            rows += f'<div class="log-row log-think"><span class="lt">{time_part}</span> 🧠 思考 ({ev.get("len",0)} 字) <span class="dim">{esc(ev.get("preview","")[:80])}</span></div>\n'
        elif etype == "tool":
            name = ev.get("name", "?")
            inp = ev.get("input", "")
            try:
                obj = json.loads(inp)
                detail = obj.get("file_path") or obj.get("query") or obj.get("pattern") or obj.get("command","")[:60] or inp[:60]
            except Exception:
                detail = inp[:60]
            rows += f'<div class="log-row log-tool"><span class="lt">{time_part}</span> 🔧 {esc(name)} → <code>{esc(str(detail)[:60])}</code></div>\n'
        elif etype == "text":
            rows += f'<div class="log-row log-text"><span class="lt">{time_part}</span> 💬 Text ({ev.get("len",0)} 字)</div>\n'
        elif etype == "result":
            inp_t = ev.get("input_tokens", 0)
            out_t = ev.get("output_tokens", 0)
            cost = ev.get("cost_usd", 0)
            rows += f'<div class="log-row log-result"><span class="lt">{time_part}</span> 📊 {inp_t/1000:.1f}K in + {out_t/1000:.1f}K out = <strong>${cost:.2f}</strong></div>\n'

    return f'''<details class="agent-log">
      <summary>Agent 執行記錄 ({len(events)} 個事件)</summary>
      <div class="log-body">{rows}</div>
    </details>'''


def sources_section(sources: list[dict]) -> str:
    if not sources:
        return ""
    links = "".join(f'<a href="{esc(s["url"])}" target="_blank">{esc(s["title"])}</a>' for s in sources)
    return f'<details class="sources-box"><summary>資料來源 ({len(sources)})</summary><div class="sources-list">{links}</div></details>'


# ---------------------------------------------------------------------------
# Build full HTML
# ---------------------------------------------------------------------------

def build_dashboard(
    date: str,
    summary: dict,
    tables: dict[str, list[dict]],
    state: dict,
    sources: list[dict],
    log_html: str,
) -> str:
    # --- Top strip ---
    us_regime = summary.get("us_regime", state.get("cycle_phase", {}).get("US", {}).get("phase", "?"))
    vix = summary.get("vix", 0)
    top_strip = f'''<header class="top-strip">
      <div class="ts-left">
        <h1>投資組合儀表板</h1>
        <span class="date">{esc(date)}</span>
      </div>
      <div class="ts-right">
        <div class="regime-box">
          <span class="dim">US</span> {regime_badge(us_regime)}
        </div>
        {vix_gauge(vix) if vix else ""}
      </div>
    </header>'''

    # --- Alerts ---
    alerts = state.get("alerts", [])
    alerts_html = ""
    if alerts:
        cards = "".join(alert_card(a) for a in sorted(alerts, key=lambda a: {"CRITICAL":0,"HIGH":1,"MEDIUM":2,"LOW":3}.get(a.get("severity","MEDIUM"), 9)))
        alerts_html = f'<section class="section"><h2>風險警示</h2><div class="alerts-grid">{cards}</div></section>'

    # --- Heatmap ---
    heatmap_sections = []
    table_groups = [
        ("美股 AI 供應鏈", ["2b. AI Supply Chain — US", "AI Supply Chain — US"]),
        ("台股 AI 供應鏈", ["2c. AI Supply Chain — TW", "AI Supply Chain — TW"]),
        ("大盤指數", ["2a. Benchmarks", "Benchmarks"]),
        ("能源 & 國防", ["2d. Energy & Defense", "Energy & Defense"]),
    ]
    for group_label, possible_keys in table_groups:
        rows = None
        for k in possible_keys:
            if k in tables:
                rows = tables[k]
                break
        if not rows:
            continue
        tiles = ""
        for r in rows:
            sym = re.sub(r'\*', '', r.get("Symbol", r.get("指數", "")))
            name = r.get("名稱", r.get("備註", sym))
            d1 = pct_to_float(r.get("1日", r.get("1日", "")))
            d5 = pct_to_float(r.get("5日", r.get("5日", "")))
            tiles += heatmap_tile(sym, name, d1, d5)
        heatmap_sections.append(f'<div class="hmap-group"><h3>{esc(group_label)}</h3><div class="hmap-grid">{tiles}</div></div>')

    heatmap_html = ""
    if heatmap_sections:
        heatmap_html = f'<section class="section"><h2>市場熱力圖</h2>{"".join(heatmap_sections)}</section>'

    # --- Top movers ---
    movers_html = ""
    for k in ["2e. Top Movers (3/10)", "Top Movers"]:
        if k in tables:
            movers = tables[k]
            up = [r for r in movers if any('+' in r.get(c, '') for c in r)]
            down = [r for r in movers if any(c.startswith('-') for c in r.values())]
            items = ""
            for r in movers:
                sym = re.sub(r'\*', '', r.get("Symbol", ""))
                name = r.get("名稱", "")
                change = re.sub(r'\*', '', r.get("變動", ""))
                note = r.get("備註", "")
                pct = pct_to_float(change)
                color = "#3fb950" if pct and pct > 0 else "#f85149"
                items += f'<div class="mover"><span class="mover-sym">{esc(sym)}</span><span class="mover-change" style="color:{color}">{esc(change)}</span><span class="dim">{esc(name)} — {esc(note)}</span></div>'
            movers_html = f'<section class="section"><h2>漲跌排行</h2><div class="movers-list">{items}</div></section>'
            break

    # --- Allocation ---
    alloc = state.get("allocation_target", {})
    alloc_html = ""
    if alloc:
        alloc_html = f'<section class="section"><h2>目標配置</h2>{allocation_chart(alloc)}</section>'

    # --- Watchlist ---
    watchlist = state.get("watchlist", [])
    watchlist_html = ""
    if watchlist:
        t1 = [w for w in watchlist if w.get("tier") == 1]
        t2 = [w for w in watchlist if w.get("tier") == 2]
        cards = ""
        if t1:
            cards += '<h3>Tier 1 — 高優先</h3><div class="watch-grid">' + "".join(watchlist_card(w) for w in t1) + "</div>"
        if t2:
            cards += '<h3>Tier 2 — 持續觀察</h3><div class="watch-grid">' + "".join(watchlist_card(w) for w in t2) + "</div>"
        watchlist_html = f'<section class="section"><h2>觀察清單</h2>{cards}</section>'

    # --- Event timeline (from markdown table) ---
    timeline_html = ""
    for k in ["事件時間軸", "Event Timeline"]:
        if k in tables:
            rows = tables[k]
            trows = ""
            for r in rows:
                event = r.get("事件", r.get("Event", ""))
                time = r.get("時間", r.get("Time", ""))
                status = r.get("狀態", r.get("Status", ""))
                result = r.get("結果/備註", r.get("結果", r.get("Result", "")))
                # Color status
                if "✅" in status:
                    scls = "tl-done"
                elif "🔄" in status:
                    scls = "tl-progress"
                elif "⏳" in status:
                    scls = "tl-pending"
                else:
                    scls = ""
                trows += f'<tr class="{scls}"><td>{esc(event)}</td><td class="tl-time">{esc(time)}</td><td>{esc(status)}</td><td>{esc(result)}</td></tr>\n'
            timeline_html = f'''<section class="section"><h2>事件時間軸</h2>
              <table class="timeline-table">
                <thead><tr><th>事件</th><th>時間</th><th>狀態</th><th>結果 / 備註</th></tr></thead>
                <tbody>{trows}</tbody>
              </table></section>'''
            break

    # Fallback: if no timeline table found, show next_actions as list
    actions_html = ""
    if not timeline_html:
        actions = state.get("next_actions", [])
        if actions:
            items = "".join(f'<li>{esc(a)}</li>' for a in actions)
            actions_html = f'<section class="section"><h2>待辦事項</h2><ul class="actions">{items}</ul></section>'

    return f'''<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>投資組合儀表板 — {esc(date)}</title>
<style>
:root {{
  --bg: #0d1117; --s1: #161b22; --s2: #21262d; --border: #30363d;
  --t1: #e6edf3; --t2: #8b949e; --accent: #58a6ff;
  --green: #3fb950; --red: #f85149; --yellow: #d29922; --orange: #db6d28;
}}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; background:var(--bg); color:var(--t1); line-height:1.5; }}

/* Top strip */
.top-strip {{
  display:flex; justify-content:space-between; align-items:center;
  padding:1.2rem 2rem; background:var(--s1); border-bottom:1px solid var(--border);
  position:sticky; top:0; z-index:10;
}}
.ts-left h1 {{ font-size:1.3rem; font-weight:700; }}
.ts-left .date {{ color:var(--t2); font-size:0.9rem; }}
.ts-right {{ display:flex; gap:1.5rem; align-items:center; }}
.regime-box {{ text-align:center; }}
.regime-box .dim {{ display:block; font-size:0.7rem; color:var(--t2); }}
.badge {{
  display:inline-block; padding:0.15rem 0.6rem; border-radius:12px;
  font-size:0.8rem; font-weight:600; letter-spacing:0.5px;
}}

/* VIX gauge */
.gauge-box {{ width:120px; }}
.gauge-label {{ font-size:0.7rem; color:var(--t2); }}
.gauge-bar {{ height:6px; background:var(--s2); border-radius:3px; overflow:hidden; }}
.gauge-fill {{ height:100%; border-radius:3px; transition:width 0.3s; }}
.gauge-val {{ font-size:1.1rem; font-weight:700; }}
.gauge-val small {{ font-size:0.7rem; font-weight:400; }}

/* Layout */
.content {{ max-width:1200px; margin:0 auto; padding:1.5rem 2rem; }}
.section {{ margin-bottom:2rem; }}
.section h2 {{
  font-size:1.1rem; color:var(--t2); text-transform:uppercase; letter-spacing:1px;
  margin-bottom:0.8rem; padding-bottom:0.3rem; border-bottom:1px solid var(--border);
}}
h3 {{ font-size:0.95rem; color:var(--t2); margin:1rem 0 0.5rem; }}
.dim {{ color:var(--t2); }}

/* Alerts */
.alerts-grid {{ display:flex; flex-direction:column; gap:0.5rem; }}
.alert-card {{
  background:var(--s1); padding:0.6rem 1rem; border-radius:6px;
}}
.alert-head {{ display:flex; align-items:center; gap:0.5rem; font-size:0.9rem; }}
.alert-sev {{ font-size:0.75rem; margin-left:auto; }}
.alert-msg {{ font-size:0.85rem; color:var(--t2); margin-top:0.2rem; }}

/* Heatmap */
.hmap-group {{ margin-bottom:1rem; }}
.hmap-grid {{
  display:grid; grid-template-columns:repeat(auto-fill, minmax(110px, 1fr));
  gap:6px;
}}
.tile {{
  padding:0.5rem 0.6rem; border-radius:6px; text-align:center;
  border:1px solid var(--border);
}}
.tile-sym {{ font-weight:700; font-size:0.85rem; }}
.tile-name {{ font-size:0.65rem; color:var(--t2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }}
.tile-pct {{ font-size:1rem; font-weight:700; margin:0.2rem 0; }}
.tile-sub {{ font-size:0.65rem; color:var(--t2); }}

/* Top movers */
.movers-list {{ display:flex; flex-direction:column; gap:0.3rem; }}
.mover {{
  display:flex; align-items:center; gap:0.8rem;
  background:var(--s1); padding:0.4rem 0.8rem; border-radius:6px; font-size:0.88rem;
}}
.mover-sym {{ font-weight:700; min-width:70px; }}
.mover-change {{ font-weight:700; min-width:70px; }}

/* Allocation */
.alloc-chart {{ max-width:500px; }}
.alloc-row {{ display:flex; align-items:center; gap:0.6rem; margin:0.4rem 0; }}
.alloc-label {{ width:50px; font-size:0.85rem; color:var(--t2); }}
.alloc-track {{ flex:1; height:20px; background:var(--s2); border-radius:4px; overflow:hidden; }}
.alloc-fill {{ height:100%; border-radius:4px; transition:width 0.3s; }}
.alloc-pct {{ width:40px; text-align:right; font-weight:600; font-size:0.85rem; }}
.alloc-note {{ font-size:0.8rem; color:var(--t2); margin-top:0.5rem; }}

/* Watchlist */
.watch-grid {{ display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:0.6rem; }}
.watch-card {{
  background:var(--s1); border:1px solid var(--border); border-radius:8px;
  padding:0.8rem 1rem;
}}
.watch-head {{ display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; }}
.watch-head strong {{ font-size:1rem; }}
.watch-name {{ color:var(--t2); font-size:0.85rem; }}
.watch-price {{ margin-left:auto; font-weight:600; color:var(--accent); }}
.watch-thesis {{ font-size:0.85rem; margin:0.4rem 0; }}
.watch-entry {{ font-size:0.8rem; color:var(--yellow); }}
.tier {{
  display:inline-block; padding:0.1rem 0.4rem; border-radius:4px;
  font-size:0.7rem; font-weight:700;
}}
.tier1 {{ background:#0d3b1e; color:var(--green); }}
.tier2 {{ background:#2d1b00; color:var(--yellow); }}

/* Actions */
.actions {{ list-style:none; padding:0; }}
.actions li {{
  background:var(--s1); padding:0.5rem 1rem; margin:0.3rem 0; border-radius:6px;
  font-size:0.9rem; border-left:3px solid var(--accent);
}}
.actions li::before {{ content:"→ "; color:var(--accent); font-weight:700; }}

/* Event timeline */
.timeline-table {{ font-size:0.9rem; }}
.timeline-table th {{ font-size:0.8rem; text-transform:uppercase; letter-spacing:0.5px; }}
.timeline-table .tl-time {{ font-family:monospace; font-size:0.85rem; white-space:nowrap; color:var(--accent); }}
.tl-done {{ opacity:0.7; }}
.tl-done td:nth-child(4) {{ color:var(--green); }}
.tl-progress td:nth-child(3) {{ color:var(--yellow); }}
.tl-pending td:nth-child(3) {{ color:var(--t2); }}

/* Agent log */
.agent-log {{
  margin-top:2rem; background:var(--s1); border-radius:8px;
  border:1px solid var(--border);
}}
.agent-log summary {{
  padding:0.6rem 1rem; cursor:pointer; color:var(--t2); font-size:0.85rem;
}}
.log-body {{ padding:0 1rem 0.8rem; }}
.log-row {{ font-size:0.82rem; padding:0.2rem 0; font-family:monospace; }}
.log-row .lt {{ color:var(--t2); margin-right:0.5rem; }}
.log-row code {{ background:var(--s2); padding:0.1em 0.3em; border-radius:3px; font-size:0.8rem; color:var(--orange); }}
.log-think {{ color:var(--yellow); }}
.log-tool {{ color:var(--accent); }}
.log-result {{ color:var(--green); }}

/* 資料來源 */
.sources-box {{
  margin-top:1rem; background:var(--s1); border-radius:8px;
  border:1px solid var(--border);
}}
.sources-box summary {{
  padding:0.5rem 1rem; cursor:pointer; color:var(--t2); font-size:0.8rem;
}}
.sources-list {{ padding:0.5rem 1rem; display:flex; flex-wrap:wrap; gap:0.5rem; }}
.sources-list a {{
  display:inline-block; padding:0.2rem 0.6rem; background:var(--s2);
  border-radius:4px; color:var(--accent); text-decoration:none; font-size:0.78rem;
}}
.sources-list a:hover {{ text-decoration:underline; }}

.footer {{ text-align:center; padding:2rem; color:var(--t2); font-size:0.75rem; }}

@media (max-width:600px) {{
  .top-strip {{ flex-direction:column; gap:0.8rem; padding:1rem; }}
  .content {{ padding:1rem; }}
  .hmap-grid {{ grid-template-columns:repeat(3, 1fr); }}
  .watch-grid {{ grid-template-columns:1fr; }}
}}
@media print {{
  body {{ background:#fff; color:#111; }}
  .top-strip {{ background:#f5f5f5; }}
  .tile,.watch-card,.alert-card,.mover {{ border:1px solid #ddd; }}
}}
</style>
</head>
<body>
{top_strip}
<div class="content">
{alerts_html}
{heatmap_html}
{movers_html}
{alloc_html}
{watchlist_html}
{timeline_html}
{actions_html}
{sources_section(sources)}
{log_html}
</div>
<div class="footer">由投資研究 Agent 自動產出 · {esc(date)}</div>
</body>
</html>'''


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate trader dashboard HTML")
    parser.add_argument("--report", "-r", required=True, help="Daily markdown report")
    parser.add_argument("--state", help="portfolio-state.json (auto-detected if omitted)")
    parser.add_argument("--structured", "-s", help="Structured JSONL log (optional)")
    parser.add_argument("--output", "-o", help="Output HTML path")
    args = parser.parse_args()

    report_path = Path(args.report)
    if not report_path.exists():
        print(f"Report not found: {report_path}", file=sys.stderr)
        sys.exit(1)

    md = report_path.read_text(encoding="utf-8")

    # Auto-detect state file
    state_path = Path(args.state) if args.state else report_path.parent / "portfolio-state.json"
    state = {}
    if state_path.exists():
        with open(state_path) as f:
            state = json.load(f)

    # Extract data
    date_match = re.search(r'\d{4}-\d{2}-\d{2}', report_path.name)
    date = date_match.group() if date_match else "unknown"
    summary = extract_executive_summary(md)
    tables = extract_md_tables(md)
    sources = extract_sources(md)

    # Structured log
    log_html = ""
    if args.structured:
        log_html = structured_log_section(Path(args.structured))
    else:
        jsonl = report_path.parent / f"research-agent-{date}.structured.jsonl"
        if jsonl.exists():
            log_html = structured_log_section(jsonl)

    output_path = Path(args.output) if args.output else report_path.with_suffix(".html")
    html = build_dashboard(date, summary, tables, state, sources, log_html)
    output_path.write_text(html, encoding="utf-8")
    print(f"Generated: {output_path}")


if __name__ == "__main__":
    main()
