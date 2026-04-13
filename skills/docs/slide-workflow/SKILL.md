---
name: slide-workflow
description: >
  Step-by-step presentation creation workflow with confirmation gates.
  Ensures every deck goes through: purpose → style lock → outline → content → generate → review → export.
  Prevents the common failure mode of jumping straight to slide generation with inconsistent style and no outline.
  TRIGGER when: user says "做簡報", "做 deck", "準備提案", "幫我做 slides", "寫簡報",
  "presentation workflow", "簡報流程", or when pitch-deck / sales-material would trigger
  but the user hasn't specified an outline or template yet.
  DO NOT TRIGGER when: user already has a complete outline AND locked template AND says "直接生成".
tags: [docs, workflow]
version: 1.0.0
user-invocable: true
allowed-tools: "Read, Write, Edit, Bash, Glob, Grep"
---

# Slide Workflow

Seven gates, each requires user confirmation before proceeding. Never skip a gate unless the user explicitly says to.

## Gate 1: 確認目的與受眾

Ask these (skip those already answered):

| 問題 | 為什麼問 |
|------|---------|
| 這份簡報的**目的**是什麼？ | 決定走哪條路徑（pitch-deck / sales-material / 技術報告） |
| **受眾**是誰？ | 決定語言、深度、專業術語程度 |
| **場景**？（面對面 / email 附件 / 線上會議） | 決定頁數和資訊密度 |
| **時間**？（10 分鐘 / 30 分鐘 / 無限制閱讀） | 決定 slide 數量 |

### 路徑對應

| 目的 | 主力 Skill | 預期頁數 |
|------|-----------|---------|
| 投資人 / 募資 | `pitch-deck` | 10-16 |
| 客戶提案 / BD | `sales-material` | 8-15 |
| 技術報告 / 分析 | 手動 + locked template | 5-20 |
| 公司介紹 / 形象 | `pitch-deck` (simplified) | 6-10 |
| 內部報告 | 手動 + minimal template | 3-8 |

**Gate 1 輸出**: 確認目的、受眾、場景、預期頁數。

> 等待用戶確認後才進入 Gate 2。

---

## Gate 2: 確認品牌風格

```bash
# 列出可用的 locked templates
ls mockups/slide-templates/*.html 2>/dev/null
ls ../*/mockups/slide-templates/*.html 2>/dev/null
```

展示選項給用戶：

| Template | 風格 | 適用 |
|----------|------|------|
| `chimes-ai.html` | 深海軍藍 + 幾何 accent + 奶油色 title card | Chimes AI / 詠鋐智能品牌簡報 |
| `cht-corporate.html` | 白底 + CHT 藍 + 企業風 | 中華電信合作簡報 |
| （其他） | ... | ... |

如果沒有匹配的 template：
> 沒有找到適合的品牌 template。要不要：
> 1. 用 `slide-template-extractor` 從既有簡報抽出？
> 2. 用現有的最接近 template 改色？
> 3. 建一個新的 neutral template？

**Gate 2 輸出**: 確認使用哪個 template（檔案名稱）。

> 等待用戶確認後才進入 Gate 3。

---

## Gate 3: 確認大綱

這是最關鍵的一步。**不確認大綱就不動手生成任何 slide。**

產出一份大綱表：

```markdown
## 簡報大綱

| # | Slide 類型 | 標題 | 核心訊息（1 句話） | 數據/素材來源 |
|---|-----------|------|-------------------|-------------|
| 1 | Cover | {title} | — | brand logo |
| 2 | Agenda | 目錄 | 3 個 section | — |
| 3 | Problem | {pain point} | 量化痛點 | discovery data |
| 4 | Solution | {product/service} | 1 flow 或 3 步驟 | product info |
| 5 | How it works | {demo/arch} | 技術示意 | screenshot/diagram |
| 6 | Traction | {metrics} | 數字說話 | CRM / 報告 |
| 7 | Case study | {client name} | before → after | case study doc |
| 8 | Team | {key people} | 相關經歷 | bios |
| 9 | Ask / Next steps | {CTA} | 明確行動 | — |
```

### 大綱原則
- **每張 slide 只有一個核心訊息**
- 核心訊息用 1 句話寫完（如果需要 2 句，拆成 2 張 slide）
- Cover / Agenda / Closing 不算在「核心 slides」裡
- 數據 slide 必須標明數據來源
- 如果有 demo / screenshot，標明「需要準備 image」

**Gate 3 輸出**: 用戶確認大綱表（可能修改順序、增刪 slides、調整核心訊息）。

> 等待用戶確認後才進入 Gate 4。

---

## Gate 4: 蒐集內容

依大綱逐張蒐集素材。根據「數據/素材來源」欄位決定工具：

| 來源 | 工具 |
|------|------|
| 客戶情報 | `customer-intel` / `tw-company-lookup` |
| CRM 數據 | `crm-projection` |
| 案例庫 | `sales-material` (match case studies) |
| 補助資料 | `subsidy-scraper` output |
| 網路研究 | `autoresearch` / `WebSearch` |
| 既有文件 | Read local files |
| 需要用戶提供 | 列出清單請用戶補充 |

**如果有素材缺口**（用戶需要提供但還沒有的），**在這裡停下來要求**，不要等到生成時才發現缺。

**Gate 4 輸出**: 所有 slide 的素材已就位（或用戶確認「先用 placeholder」）。

> 等待用戶確認後才進入 Gate 5。

---

## Gate 5: 生成 HTML Slides

**必須使用 Gate 2 確認的 locked template**。

1. Read the template file → 提取 `:root` CSS variables + slide component classes
2. 依 Gate 3 大綱逐張生成 HTML
3. 每張 slide 使用 template 裡對應的 slide 類型（cover / section / cards / comparison / metrics / table）
4. 如果大綱有 template 未提供的 slide 類型，用最接近的 slide 類型改造
5. 存檔：`{output-dir}/{client}-deck.html`

**注意 CJK 字型**：如果 template 的 font stack 有 `Noto Sans TC`，確認 Google Fonts link 存在。

**Gate 5 輸出**: HTML 檔案路徑 → 請用戶在瀏覽器打開確認。

```bash
open {output-dir}/{client}-deck.html
```

> 等待用戶看完確認後才進入 Gate 6。

---

## Gate 6: 審閱與修改

用戶會說哪些 slides 需要改。常見修改：

| 修改類型 | 處理方式 |
|---------|---------|
| 文字修改 | Edit HTML content only |
| 順序調整 | 搬動 `<div class="slide">` block |
| 刪除 slide | 移除整個 block |
| 新增 slide | 複製最近的同類型 block，換內容 |
| 顏色/字型 | **不改** — 回去改 template 的 `:root` variables |
| 版面結構 | 換成 template 裡另一個 slide 類型 |

**反覆循環** Gate 5-6 直到用戶滿意。

> 用戶說「OK」或「可以了」後進入 Gate 7。

---

## Gate 7: 輸出 PPTX

使用 `office-pptx` skill 的 html2pptx 流程：

1. Read `office-pptx` skill 的 html2pptx 指引
2. 把 HTML slides 轉成 PPTX
3. 存檔：`{output-dir}/{client}-deck.pptx`

交付後確認：
> 簡報已匯出：`{path}.pptx`
> 需要其他格式嗎？（PDF / Google Slides 上傳）

---

## Quick Mode

如果用戶說「跳過流程，直接做」，仍然**至少確認 3 件事**：

1. 用哪個 template？（如果不確認 → 風格漂移）
2. 幾張 slides？（如果不確認 → 頁數失控）
3. 核心訊息是什麼？（如果不確認 → 內容空洞）

這 3 個是 non-negotiable，即使 quick mode 也不跳。

---

## Anti-Patterns

| 不要 | 要 |
|------|---|
| 沒確認 template 就開始寫 HTML | Gate 2 先選 template |
| 沒確認大綱就開始填 slide 內容 | Gate 3 先確認每張 slide 的 1 句話核心訊息 |
| 在 HTML 裡硬寫顏色/字型 | 使用 template 的 `:root` CSS variables |
| 一次生成 20 張 slides | 先做 3-5 張讓用戶確認風格對不對，再做剩下的 |
| 發現缺素材時用 placeholder 蒙混 | Gate 4 就列出缺口，請用戶補 |
| 改完不讓用戶看就直接輸出 PPTX | Gate 6 的 HTML review 是必要的 |
