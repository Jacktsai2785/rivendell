# Business Charts (業務圖表)

> Read this after triage. 主檔 `SKILL.md` 的 R1–R4 + pre/post must-check 依然全套適用。本檔重點：**R4 type-to-structure** 在這類最常出錯（線性流程被亂塑成 2×2、table、bar、radar 全都見過）。

---

## What Counts as "Business Chart"

不是從 dataset 算出來的，是從**商業概念 / 策略框架 / 流程描述**畫出來的：

- 2×2 positioning matrix（BCG、Eisenhower、SWOT）
- Value chain / 流程
- Timeline / roadmap / milestone
- Funnel（漏斗 — 轉換、AARRR）
- Comparison table（feature × competitor）
- Framework matrix（3×3、5 forces、4P、7S）
- Org chart / 角色關係圖
- Pricing tier 比較
- Before / After / Future state 三聯圖

---

## Tool Defaults

| 用途 | 工具 | 為什麼 |
|------|------|--------|
| 精準排版 / 客戶交付 | **HTML/CSS**（嵌進 slide template）| 跟 slide-workflow / pitch-deck 同棧、CSS variables 統一風格 |
| 簡報 hand-drawn 感 | **Excalidraw**（`.excalidraw` JSON → PNG） | 親和、適合 pitch / external audience |
| 含結構化資料（feature×competitor） | **HTML table** 或 **office-pptx 原生 table** | 可後續編輯、好 paste |
| 純概念示意 | **Mermaid**（flowchart / mindmap） | 結構嚴謹、文字驅動 |

**不要用 matplotlib 做業務圖** — matplotlib 是 data-driven viz 的工具，畫 2×2 / value chain 會很醜且難排版。

---

## Per-Type Rules

### 2×2 Matrix (二維 positioning)

**用條件**：兩個正交的 qualitative 維度，每個維度可分高/低。

- 軸 label **必為形容詞或量級**（High / Low、Strategic / Tactical）— 不是動詞或步驟
- 每象限**必有名稱**（不是只放點），名稱解釋該區的策略含義
- 點 / item 加 label，不要靠 legend
- **絕對不要**把線性流程塞進來（step 1/2/3/4 ≠ 四象限）

**Anti-pattern**（user 親見）：「產品演進三階段 → 四象限」。改用 timeline。

### Value Chain / 線性流程

**用條件**：N 個有先後關係的 stage、每個 stage 有 input / activity / output。

- **箭頭方向一致**（左→右 or 上→下，不要 zig-zag）
- Stage 間距等寬（不是時間長短的 proxy；要 proxy 用 timeline 加軸）
- 每 stage 可有 sub-bullet，但每塊文字 ≤ 8 詞
- 若 stage > 7 → 拆兩列或抽象成 phase
- 結尾可加 outcome / metric block

**Anti-pattern**（user 親見）：「線性流程被畫成 2×2 / 多欄 table / bar 並列 / 雷達」— 任何沒有「方向感」的視覺都不行。

### Timeline / Roadmap

**用條件**：事件 / milestone 有確切或相對時間軸。

- **時間軸必為單向**（左→右）
- Milestone 在軸上，details 在軸外（上下交錯避免擠）
- 用色區分**主題**（產品 / 市場 / 團隊）不是區分**重要度**
- 加 "now" 標記（讓 reader 定位現況）
- 過去 → 黑/灰；未來 → 品牌主色（visual hierarchy）

### Comparison Table

**用條件**：N 個 item × M 個 dimension，N ≤ 8、M ≤ 8。

- **每 cell ≤ 5 詞**（超過 → 抽象成標籤）
- **表頭必標對比維度**（「定價」不是「資訊」；「年費 NT$」更具體）
- 同一 column 內**單位/格式一致**（不能上面寫 "12 萬"、下面寫 "180,000"）
- 用 ✓ / ✗ / ◐ 比 "Yes/No/Partial" 字省空間
- **highlight 一行**（我方）— 通常加底色 + 粗體
- 若有「優勝」cell → 加底色 + 圖示，不要只靠粗體

**Anti-pattern**：把表格當 data dump，沒選 dimension、沒 highlight → 視覺等於沒有

### Funnel (漏斗)

**用條件**：N 個 stage，後一 stage 的數量 ≤ 前一 stage（轉換）。

- 每 stage 必有**絕對數 + 轉換率**
- 寬度 proportional 反映數量（不要等寬騙人）
- 標出**最大 drop-off**（紅 highlight）作 narrative beat
- Max 5 stages（更多 → 拆成 macro + drill-down）

### Framework Matrix (3×3、4P、5 forces、SWOT)

**用條件**：套用已知商業框架。

- 用**官方框架名稱**（reader 認得就不用解釋）
- 每格內容**具體到 client / 場景**，不要寫一般理論（"product, price, place, promotion" 沒用 → 寫 client 的具體 product / pricing / channel / campaign）
- 框架是骨架，內容才是肉

### Funnel / Tier / Pricing 比較

- 階級數 ≤ 4（最佳 3）
- 推薦的 tier 視覺 emphasis（邊框 / 底色 / "Most Popular" badge）
- Feature list 直接對齊，**不要**「Standard 有 5 項、Pro 有 8 項」list 散排 — 用 table 整齊對齊

---

## R4 反例集（user 親見）

| 應該是 | 被錯畫成 | 為什麼錯 | 改用 |
|--------|---------|---------|------|
| 線性流程（3 階段產品演進） | 2×2 象限 | 沒有第二個維度，flow 變定位 | timeline / value chain |
| 線性流程 | 多欄 table | 順序不明顯、reader 不知該從哪欄開始讀 | horizontal arrow flow |
| 線性流程 | bar chart 並列長條 | reader 以為是量級比較 | sankey / numbered timeline |
| 線性流程 | 雷達圖 | radar 是 N 維評分，不是順序 | progress bar / staged milestone |
| 階段進度 % | 雷達圖 | 雷達不適合表達進度 | horizontal bar / circular progress |
| 兩個獨立系統 | 同一個 box | 違反 R3 homogeneity | 拆兩個 box + 連接線 |

---

## Style 一致性

業務圖表最容易**視覺漂移** — 跟 deck 其他 slide 不一致。守則：

- 顏色用 deck template 的 `:root` CSS variables（不要自己挑色）
- 字型跟 slide 同一套
- Padding / radius 跟 slide 內其他卡片一致
- icon set 統一（不要混 Material Icons + Font Awesome + 自繪）

---

## Pre-Check (此類專屬補充)

- [ ] **這支圖的 data structure 是什麼？**（線性 / 二維 / 階層 / 對比 N） — 寫下來
- [ ] **是否套用既知框架**（BCG / SWOT / Porter / 4P）— 若是，用官方名稱
- [ ] **highlight 哪一塊** — 一定要有一個視覺重心（我方 / 推薦 tier / 最大 drop-off）
- [ ] 內容是否**具體到客戶/場景** — 不是泛用理論

---

## Anti-Patterns (此類專屬)

| 不要 | 要 |
|------|---|
| 線性流程畫成 2×2 象限 | timeline / value chain |
| 線性流程畫成多欄 table | horizontal arrow flow |
| 線性流程畫成 bar 並列 | sankey / numbered flow |
| 階段進度畫成雷達圖 | progress bar |
| 2×2 軸 label 用動詞或步驟 | 用形容詞 / 量級（High/Low） |
| 2×2 沒給象限名稱 | 每象限取個策略名稱 |
| Comparison table 沒 highlight | 我方那一列必 highlight |
| Comparison table cell 塞長句 | ≤ 5 詞，超過抽標籤 |
| Funnel 等寬不照數量 | 寬度比例 proportional |
| Funnel > 5 stage | 拆 macro + drill-down |
| Framework 框架寫一般理論 | 寫 client 的具體內容 |
| 顏色自己挑 | 用 deck `:root` CSS variables |
| Icon 多套混用 | 統一一套 icon set |
