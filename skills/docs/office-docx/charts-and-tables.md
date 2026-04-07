# Charts, Tables, and Figures in DOCX

How to programmatically insert tables, charts, and images into Word documents — and avoid the common pitfalls.

## Decision Tree

| What you want | Tool |
|---------------|------|
| Simple data table (with headers, borders) | python-docx `add_table()` |
| Complex table (merged cells, varied styling) | python-docx + `_tc` XML manipulation |
| Bar / line / pie chart | matplotlib → save PNG → insert as image |
| Native editable Word chart | python-docx-oss-charts (rare — usually overkill) |
| Mermaid diagram (gantt, flowchart, sequence) | mmdc CLI → SVG/PNG → insert as image |
| Screenshot / external image | python-docx `add_picture()` |
| Excel-linked chart | Don't. Generate fresh chart in Word instead |

**Default rule**: For 95% of cases, generate the chart as a PNG with matplotlib and insert it as an image. Native Word charts are fragile, hard to style consistently, and usually a maintenance burden.

---

## Tables

### Basic table with python-docx

```python
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT

doc = Document()

# Create table with header row
data = [
    ["項目", "金額（未稅）", "備注"],
    ["顧問項目費", "NTD 1,500,000", "150 人天 × 10,000"],
    ["營業稅 5%", "NTD 75,000", ""],
    ["合計", "NTD 1,575,000", ""],
]

table = doc.add_table(rows=len(data), cols=len(data[0]))
table.style = "Light Grid Accent 1"   # built-in style — see list below
table.alignment = WD_TABLE_ALIGNMENT.CENTER

for row_idx, row_data in enumerate(data):
    for col_idx, cell_value in enumerate(row_data):
        cell = table.cell(row_idx, col_idx)
        cell.text = cell_value
        # Header row formatting
        if row_idx == 0:
            for paragraph in cell.paragraphs:
                for run in paragraph.runs:
                    run.bold = True
                    run.font.size = Pt(11)

doc.save("output.docx")
```

### Built-in table styles (commonly used)

```
Table Grid                    # Plain grid, all borders
Light Grid                    # Subtle grid, header band
Light Grid Accent 1-6         # Same with color accents
Light List                    # No vertical borders, header band
Light Shading                 # Alternating row shading
Medium Shading 1 Accent 1     # Stronger header + alternating
Colorful List Accent 1        # Bold colored header
```

> Tip: Use `Light Grid Accent 1` for business documents. Avoid `Colorful List` (looks dated).

### Common table problems

| Problem | Cause | Fix |
|---------|-------|-----|
| Chinese characters render as boxes | Font has no CJK glyphs | Set `run.font.name = '微軟正黑體'` AND `run._element.rPr.rFonts.set(qn('w:eastAsia'), '微軟正黑體')` |
| Columns auto-shrink to text width | No fixed widths set | Set `table.autofit = False` then `cell.width = Cm(4)` per column |
| Borders missing | Table style is "Table Normal" (default = no borders) | Apply a style with borders, OR set borders manually via XML |
| Cells overflow page width | Table width > page width | Use `Cm()` for cell widths summing to ≤ 16 (A4 portrait) or 25 (A4 landscape) |
| Header row repeats on every page | Default behavior off | `table.rows[0].cells[0]._tc.tcPr` — set `<w:tblHeader/>` in `trPr` |
| Merged cells look broken | Merging only one direction | Merge in both: `cell_a.merge(cell_b)` returns the merged cell |

### Set column widths properly

```python
from docx.shared import Cm

# Disable autofit FIRST, then set widths
table.autofit = False
table.allow_autofit = False

widths = [Cm(4), Cm(4), Cm(8)]
for row in table.rows:
    for idx, width in enumerate(widths):
        row.cells[idx].width = width
```

### Set CJK font for entire table

```python
from docx.oxml.ns import qn
from docx.shared import Pt

def set_cjk_font(cell, font_name="微軟正黑體", size=Pt(10)):
    for paragraph in cell.paragraphs:
        for run in paragraph.runs:
            run.font.name = font_name
            run.font.size = size
            # CRITICAL: also set East Asian font in rPr
            rPr = run._element.get_or_add_rPr()
            rFonts = rPr.find(qn('w:rFonts')) or rPr.makeelement(qn('w:rFonts'), {})
            if rFonts.getparent() is None:
                rPr.append(rFonts)
            rFonts.set(qn('w:eastAsia'), font_name)

for row in table.rows:
    for cell in row.cells:
        set_cjk_font(cell)
```

### Merged cells

```python
# Horizontal merge: header spanning 3 columns
table.cell(0, 0).merge(table.cell(0, 2))

# Vertical merge: first column for category groups
table.cell(1, 0).merge(table.cell(3, 0))

# After merging, write text to the FIRST cell only (the merged result)
# Writing to merged-away cells silently fails
```

### Cell background color

```python
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

def set_cell_background(cell, color_hex):
    """color_hex like 'D9E1F2' (no #)"""
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), color_hex)
    tc_pr.append(shd)

# Highlight header row
for cell in table.rows[0].cells:
    set_cell_background(cell, 'D9E1F2')   # light blue
```

---

## Charts (matplotlib → PNG → docx)

This is the recommended path for 95% of cases. Native Word charts are fragile.

### Bar chart

```python
import matplotlib.pyplot as plt
import matplotlib
from docx import Document
from docx.shared import Inches

# CRITICAL: set CJK font BEFORE creating any plot
matplotlib.rcParams['font.sans-serif'] = ['Microsoft JhengHei', 'PingFang TC', 'Arial Unicode MS']
matplotlib.rcParams['axes.unicode_minus'] = False  # fix minus sign rendering

# Data
items = ["顧問費", "工作坊", "開發", "API 交付", "教育訓練"]
days = [20, 30, 80, 10, 10]

fig, ax = plt.subplots(figsize=(8, 4.5), dpi=150)
bars = ax.bar(items, days, color='#4ecdc4', edgecolor='#1a1a2e', linewidth=1)
ax.set_ylabel('人天', fontsize=11)
ax.set_title('SOW 工作項目人天分配', fontsize=13, pad=15)

# Value labels on top of each bar
for bar, day in zip(bars, days):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
            f'{day}', ha='center', fontsize=10)

plt.tight_layout()
plt.savefig('chart.png', dpi=150, bbox_inches='tight')
plt.close()

# Insert into Word
doc = Document()
doc.add_picture('chart.png', width=Inches(6))
doc.save('output.docx')
```

### Pie chart

```python
fig, ax = plt.subplots(figsize=(6, 6), dpi=150)
ax.pie(days, labels=items, autopct='%1.1f%%',
       colors=['#4ecdc4', '#45b7d1', '#5f9ea0', '#88c0d0', '#a8dadc'],
       startangle=90, textprops={'fontsize': 11})
ax.set_title('人天分配', fontsize=13, pad=20)
plt.tight_layout()
plt.savefig('pie.png', dpi=150, bbox_inches='tight')
```

### Line chart

```python
months = ['1月', '2月', '3月', '4月', '5月', '6月']
revenue = [120, 145, 180, 210, 195, 240]

fig, ax = plt.subplots(figsize=(8, 4.5), dpi=150)
ax.plot(months, revenue, marker='o', linewidth=2, color='#4ecdc4',
        markerfacecolor='#1a1a2e', markersize=8)
ax.fill_between(range(len(months)), revenue, alpha=0.15, color='#4ecdc4')
ax.set_ylabel('營收 (萬)', fontsize=11)
ax.set_title('月營收趨勢', fontsize=13, pad=15)
ax.grid(True, alpha=0.3, linestyle='--')
plt.tight_layout()
plt.savefig('line.png', dpi=150, bbox_inches='tight')
```

### Common matplotlib problems

| Problem | Cause | Fix |
|---------|-------|-----|
| Chinese characters as boxes/squares | Default font has no CJK | Set `font.sans-serif` BEFORE plt.subplots() |
| Minus sign renders as 口 | Unicode minus issue | `axes.unicode_minus = False` |
| Image looks blurry in Word | Low DPI | Save with `dpi=150` minimum, `dpi=300` for print |
| Text cut off at edges | No tight_layout | Always call `plt.tight_layout()` and use `bbox_inches='tight'` in savefig |
| Image too wide in Word | No width constraint | `doc.add_picture('x.png', width=Inches(6))` (≤ 6.5 for A4) |

---

## Mermaid Diagrams → Word

Mermaid is great for SOW Gantt charts, flowcharts, sequence diagrams. Render with `mmdc` (mermaid CLI) then insert as image.

### Setup

```bash
npm install -g @mermaid-js/mermaid-cli
```

### Convert Mermaid to PNG

```python
import subprocess
from pathlib import Path

def mermaid_to_png(mermaid_code: str, output_path: str, theme: str = "default"):
    """Render Mermaid → PNG via mmdc."""
    mmd_file = Path(output_path).with_suffix('.mmd')
    mmd_file.write_text(mermaid_code, encoding='utf-8')

    subprocess.run([
        'mmdc',
        '-i', str(mmd_file),
        '-o', output_path,
        '-t', theme,         # default / dark / forest / neutral
        '-w', '1600',        # width
        '-b', 'white',       # background
    ], check=True)

    mmd_file.unlink()
    return output_path

# Example: Gantt chart for SOW
gantt = """
gantt
    title Sabre AI 方案 — 時程
    dateFormat YYYY-MM-DD
    axisFormat %m/%d

    section 里程碑
    M1 簽約         :milestone, m1, 2026-04-07, 0d
    M2 工作坊完成   :milestone, m2, 2026-04-30, 0d
    M3 API 交付     :milestone, m3, 2026-06-13, 0d
    M4 最終交付     :milestone, m4, 2026-06-30, 0d

    section 工作坊
    需求工作坊      :active, t2, 2026-04-08, 11d
    Metadata 工作坊 :t3, 2026-04-15, 16d

    section 開發
    AI Agent 開發   :t4, 2026-04-21, 47d
    API 封裝        :t5, 2026-06-01, 13d
"""
mermaid_to_png(gantt, 'gantt.png')

doc.add_picture('gantt.png', width=Inches(6.5))
```

### Mermaid common issues

| Problem | Fix |
|---------|-----|
| `mmdc: command not found` | `npm install -g @mermaid-js/mermaid-cli` |
| Chinese text missing | Use `-t neutral` theme, ensure system has CJK fonts |
| Gantt dates parsing fail | Use `dateFormat YYYY-MM-DD`, not `YYYY/MM/DD` |
| Output cut off | Increase `-w` width parameter |
| Puppeteer chrome download fails | Set `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` and use system chrome |

---

## Figures with Caption

```python
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

def add_figure(doc, image_path, caption, width_inches=6):
    """Insert image with centered caption beneath."""
    # Image
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    run.add_picture(image_path, width=Inches(width_inches))

    # Caption
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap_run = cap.add_run(caption)
    cap_run.italic = True
    cap_run.font.size = Pt(9)

add_figure(doc, 'gantt.png', '圖 1: 專案時程甘特圖')
```

---

## Multi-Page Tables (Headers Repeat)

```python
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

def set_repeat_header(table):
    """Make first row repeat on every page."""
    first_row = table.rows[0]
    tr_pr = first_row._tr.get_or_add_trPr()
    tbl_header = OxmlElement('w:tblHeader')
    tbl_header.set(qn('w:val'), 'true')
    tr_pr.append(tbl_header)

set_repeat_header(table)
```

---

## Reusable Snippet Library

For consulting documents (SOW, RFQ), keep these snippets ready:

```python
# 1. Pricing table (3 columns: 項目 / 未稅 / 含稅)
def pricing_table(doc, items: list[tuple[str, int]], tax_rate=0.05):
    """items = [(name, untaxed_amount), ...]"""
    rows = [["項目", "未稅金額", "含稅金額"]]
    total_untaxed = 0
    for name, amt in items:
        taxed = round(amt * (1 + tax_rate))
        rows.append([name, f"NTD {amt:,}", f"NTD {taxed:,}"])
        total_untaxed += amt
    total_taxed = round(total_untaxed * (1 + tax_rate))
    rows.append(["合計", f"NTD {total_untaxed:,}", f"NTD {total_taxed:,}"])

    table = doc.add_table(rows=len(rows), cols=3)
    table.style = "Light Grid Accent 1"
    for r_idx, row_data in enumerate(rows):
        for c_idx, val in enumerate(row_data):
            cell = table.cell(r_idx, c_idx)
            cell.text = val
            if r_idx == 0 or r_idx == len(rows) - 1:  # header + total
                for p in cell.paragraphs:
                    for run in p.runs:
                        run.bold = True
    return table

# 2. Milestone table
def milestone_table(doc, milestones: list[dict]):
    """milestones = [{'id': 'M1', 'desc': '...', 'date': '...'}]"""
    rows = [["里程碑", "內容", "預計完成日"]]
    for m in milestones:
        rows.append([m['id'], m['desc'], m['date']])
    table = doc.add_table(rows=len(rows), cols=3)
    table.style = "Light Grid Accent 1"
    for r_idx, row_data in enumerate(rows):
        for c_idx, val in enumerate(row_data):
            table.cell(r_idx, c_idx).text = val
    return table
```

---

## Quick Reference

| Task | Code |
|------|------|
| Insert table | `doc.add_table(rows=N, cols=M)` |
| Insert image | `doc.add_picture('x.png', width=Inches(6))` |
| Set CJK font | See `set_cjk_font()` above — must set both `name` and `eastAsia` |
| Cell background | See `set_cell_background()` |
| Merge cells | `table.cell(r1,c1).merge(table.cell(r2,c2))` |
| Repeat header row | See `set_repeat_header()` |
| Page break | `doc.add_page_break()` |
| Page orientation | `section.orientation = WD_ORIENT.LANDSCAPE` |
| A4 page size | `section.page_width = Cm(21)`, `page_height = Cm(29.7)` |
