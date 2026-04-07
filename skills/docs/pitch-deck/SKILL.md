---
name: pitch-deck
description: >
  Create professional business pitch decks and investor presentations with strategic storytelling.
  Covers discovery interview, narrative planning, HTML slide generation, and PPTX export.
  TRIGGER when: user says "做 BP", "投資人 deck", "商業計畫簡報", "pitch deck", "公司介紹簡報",
  "募資簡報", "business plan slides", "investor presentation", "提案簡報", "產品介紹 slides".
  Always do Discovery interview first unless user already provides detailed content.
  DO NOT TRIGGER when: user wants a technical documentation slide or internal status update
  (use office-pptx directly).
tags: [docs, workflow]
version: 1.0.0
user-invocable: true
allowed-tools: "Read, Write, Edit, Bash, Glob, Grep, WebSearch"
---

# Pitch Deck

Strategic business presentation — from blank page to final PPTX.

## Phase 1: Discovery Interview

Ask these questions before writing any slide. Skip those already answered in context.

**Company & Product**
- 公司/產品名稱是什麼？一句話描述它做什麼？
- 解決什麼問題？目前的解法為何（現狀 / 痛點）？
- 你們的解法為何更好？（差異化/護城河）

**Market**
- 目標客戶是誰？（B2B / B2C / B2G）
- 市場規模估計（TAM/SAM/SOM）？有沒有參考數據？
- 主要競爭對手？

**Traction & Team**
- 目前進展？（用戶數、MRR、客戶名單、POC 等）
- 創辦團隊背景（1-2 句）？

**The Ask**
- 這份 deck 的目的？（種子輪募資、BD 提案、競賽、內部報告）
- 募資金額 / 期望成果？

---

## Phase 2: Narrative Structure

Map answers to slides. Standard investor pitch flow:

| # | Slide | 核心訊息 | 1 sentence hook |
|---|-------|---------|-----------------|
| 1 | Cover | 公司名 + tagline | 讓人想繼續看 |
| 2 | Problem | 痛點有多真實 | 觀眾點頭認同 |
| 3 | Solution | 你怎麼解決 | 簡單直覺 |
| 4 | How It Works | 產品邏輯 | 1 flow 或 3 步驟 |
| 5 | Market | 機會多大 | TAM → SAM → SOM funnel |
| 6 | Traction | 你已證明什麼 | 數字說話 |
| 7 | Business Model | 怎麼賺錢 | 清晰的收費邏輯 |
| 8 | Competition | 為何你贏 | 2×2 matrix 或 feature table |
| 9 | Team | 為何你們能做到 | 相關經歷背書 |
| 10 | Ask | 你要什麼 | 明確的數字與用途 |

> Adjust slide count based on deck type:
> - **Seed (≤12 slides)**: skip Competition if market is new
> - **Series A (12-16 slides)**: add Financial Projections, Roadmap
> - **BD/Sales deck**: replace Ask with Next Steps + CTA
> - **Competition deck**: add Demo slide, shorten Team

---

## Phase 3: HTML Slides

Generate one HTML file per 3-4 slides, or a single-file multi-slide deck using a scroll or nav structure.

### Slide design principles
- One main idea per slide — supporting content is secondary
- Max 5 bullet points; prefer visuals (charts, icons, diagrams) over text
- Consistent brand color throughout (ask user for brand color, default: #1a1a2e with accent #4ecdc4)
- Font: Inter or Geist Sans (load from Google Fonts if HTML)

### HTML slide template

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>[Company] Pitch Deck</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #0f0f1a; color: #fff; }
    .slide {
      width: 1280px; height: 720px;
      display: flex; flex-direction: column;
      justify-content: center; align-items: flex-start;
      padding: 80px; page-break-after: always;
      background: #0f0f1a; border: 1px solid #222;
      margin-bottom: 40px;
    }
    .slide-number { position: absolute; bottom: 24px; right: 32px;
      font-size: 12px; color: rgba(255,255,255,0.3); }
    h1 { font-size: 52px; font-weight: 700; line-height: 1.1; margin-bottom: 24px; }
    h2 { font-size: 36px; font-weight: 600; margin-bottom: 16px; color: #4ecdc4; }
    p, li { font-size: 22px; line-height: 1.6; color: rgba(255,255,255,0.85); }
    .tagline { font-size: 28px; color: #4ecdc4; margin-top: 12px; }
    .metric { font-size: 64px; font-weight: 800; color: #4ecdc4; }
    .metric-label { font-size: 18px; color: rgba(255,255,255,0.6); margin-top: 4px; }
  </style>
</head>
<body>
  <!-- Slides go here -->
</body>
</html>
```

### Visual components to use

- **Problem**: quote/story from a real user, then stats
- **Market**: TAM/SAM/SOM concentric circles or bar chart
- **Traction**: metric cards (`<div class="metric">`)
- **Competition**: 2×2 positioning matrix (CSS grid)
- **Team**: headshot placeholder + name + 1-line bio

---

## Phase 4: Export to PPTX

After HTML is finalized, hand off to `office-pptx` skill:

> "HTML slides 已完成。現在用 office-pptx 將這些 slides 轉換成 PPTX 格式，
> 保持相同的設計風格與品牌色。每個 HTML slide 對應一頁 PPTX。"

Or if user needs editable PPTX directly (without HTML preview first):
Use `office-pptx` skill with the narrative structure above to generate PPTX directly.

---

## Slide Copy Principles

- **Problem slide**: lead with a relatable story or shocking stat, not abstract description
- **Solution slide**: show the product in 1 image or 3-step flow; avoid feature lists
- **Traction slide**: only metrics that prove demand (revenue, users, NPS, pilots); omit vanity metrics
- **Ask slide**: specific amount + specific use of funds (not "grow the team") + timeline
- **Team slide**: relevance over prestige — connect past experience directly to this problem
