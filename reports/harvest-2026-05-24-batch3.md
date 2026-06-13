# Session Harvest — 2026-05-24 Batch 3

> 分析範圍：30 sessions（-home-jacktsai-mops-databases × 1、-home-jacktsai-taiwan-company × 29）
> 總訊息：~258 msgs｜工具使用：WebSearch(121) WebFetch(73) ToolSearch(20) Bash(6)
> Skills 觸發記錄：Skill(2)（僅 sessions #6 / #23 各一次）

---

## Session 摘要

| # | 專案 | 主要意圖 | Msgs | 技能觸發 |
|---|------|---------|------|---------|
| 1 | mops-databases | VS Code 顯示 32,000+ tracked files → 診斷 .gitignore | 11 | — |
| 2 | taiwan-company | 前瞻科技 17天多日新聞摘要 | 1 | — |
| 3 | taiwan-company | 羅賓斯科技 PE DD | 13 | — |
| 4 | taiwan-company | 批量公司→產業別 JSON 分類 | 1 | — |
| 5 | taiwan-company | AI 產業當日新聞分類 | 1 | — |
| 6 | taiwan-company | 善農科技 PE DD | 16 | **tw-company-pe-memo** ✓ |
| 7 | taiwan-company | 前瞻科技當日新聞分類 | 1 | — |
| 8 | taiwan-company | 吉爾科技 PE DD | 10 | — |
| 9 | taiwan-company | 綠色永續 14 天多日新聞摘要 | 1 | — |
| 10 | taiwan-company | 奇點無限 PE DD | 11 | — |
| 11 | taiwan-company | 居家整聊 PE DD | 12 | — |
| 12 | taiwan-company | 日目視覺藝術 PE DD | 13 | — |
| 13 | taiwan-company | 好域 PE DD | 12 | — |
| 14 | taiwan-company | 台灣百應生物科技 PE DD | 12 | — |
| 15 | taiwan-company | AI 產業 13 天多日新聞摘要 | 1 | — |
| 16 | taiwan-company | 台灣受恩 PE DD | 11 | — |
| 17 | taiwan-company | 見臻科技 PE DD | 15 | — |
| 18 | taiwan-company | 羅賓斯科技 PE DD（重複） | 10 | — |
| 19 | taiwan-company | 樂浪星晴國際 PE DD | 10 | — |
| 20 | taiwan-company | 壞主意 PE DD | 9 | — |
| 21 | taiwan-company | 消費生活 13 天多日新聞摘要 | 1 | — |
| 22 | taiwan-company | 消費生活當日新聞分類 | 1 | — |
| 23 | taiwan-company | 躺著喝 PE DD | 12 | **tw-company-pe-memo** ✓ |
| 24 | taiwan-company | 日目視覺藝術 PE DD（重複） | 8 | — |
| 25 | taiwan-company | 易開科技 PE DD | 13 | — |
| 26 | taiwan-company | 翔評互動 PE DD | 10 | — |
| 27 | taiwan-company | 悠勢科技 PE DD | 10 | — |
| 28 | taiwan-company | 綠色永續當日新聞分類 | 1 | — |
| 29 | taiwan-company | 班朋實業 PE DD | 12 | — |
| 30 | taiwan-company | 集智網路科技 PE DD | 19 | — |

---

## 重複工具流程分析

### 流程 A：PE DD 備忘錄（18 次未路由）
```
ToolSearch(1) → WebSearch(4~10) → WebFetch(2~7) → 輸出結構化投資備忘錄
```
- 出現次數：20 個 session（佔本批次 67%）
- 成功觸發 tw-company-pe-memo：**僅 2 次**（sessions #6、#23）
- 18 個 session 雖執行了 ToolSearch，仍繞過技能手動執行全流程

### 流程 B：當日新聞分類（4 次）
```
純 LLM 推理 → 輸出分類標籤（0 工具）
```
- Sessions: #5、#7、#22、#28（AI / 前瞻科技 / 消費生活 / 綠色永續）
- 0 工具呼叫，表示這是自動化 agent 的 prompt-only 任務

### 流程 C：多日新聞摘要（4 次）
```
純 LLM 推理 → 輸出多日摘要（0 工具）
```
- Sessions: #2、#9、#15、#21（各產業 13~17 天）

### 流程 D：批量公司→產業 JSON（1 次）
```
純 LLM 推理 → 輸出 {company_id: 產業名稱} JSON（0 工具）
```
- Session #4：公司清單 + 業務描述 → 對應預設產業清單

---

## 技能候選評估

### ⚠️ 最重要發現：現有技能是空 stub 且 trigger 無效

在分析前，先確認了兩個最相關技能的現況：

**`tw-company-pe-memo`（已存在）**
```yaml
description: 以台灣資深 PE 投資人視角，對已知公司進行初步盡職調查
when_to_use: when working with tw-company-pe-memo
```
- Trigger 條件只有「when working with tw-company-pe-memo」→ 等於要用戶說出技能名稱才會觸發
- 技能內容是空 TODO stub，沒有實際工作流程
- **結果：18/20 個 PE DD session 完全繞過此技能**

**`taiwan-industry-classifier`（已存在）**
```yaml
description: 將台灣公司或產業新聞依預設分類清單自動歸類，輸出 JSON 格式對應表
when_to_use: when working with taiwan-industry-classifier
```
- 同樣問題：trigger 無效，stub 內容空白

---

### 候選一：tw-company-pe-memo trigger 修復與內容填充
**評級：Strong（改善現有技能，非新增）**

**問題根因：**
- 這批 18 個 session 都從「你是一位在台灣有豐富經驗的資深私募股權（PE）投資人...」開頭
- 輸入包含：公司名稱、統一編號、核准設立日期
- 工具鏈：ToolSearch → WebSearch × N → WebFetch × N → 結構化備忘錄輸出

**建議 trigger 關鍵詞：**
- 「你是一位在台灣有豐富經驗的資深私募股權」
- 「初步盡職調查（Due Diligence）」
- 「統一編號」+ 「PE」/「投資」
- 「投資備忘錄」/「DD memo」

**需要填入的流程：**
1. 從輸入提取公司名稱、統編、成立日期
2. WebSearch：公司官網、LinkedIn、新聞報導、獲投記錄
3. WebFetch：官網 About/Product 頁面
4. 輸出結構：公司概況、核心業務、市場定位、競爭對手、風險提示、PE 評分

---

### 候選二：taiwan-industry-classifier trigger 修復
**評級：Moderate（改善現有技能）**

session #4 顯示的批量公司→產業 JSON 任務與此技能完全吻合，但 trigger 條件同樣無效。

**建議 trigger 關鍵詞：**
- 「以下是既有的產業別清單與公司清單」
- 「只輸出 JSON 物件，鍵為公司 ID」
- 輸入格式：公司清單 + 業務描述 + 產業分類清單

---

### 候選三：git-repo-size-doctor（新技能）
**評級：Weak**

**來源：Session #1**
- 症狀：VS Code 顯示 32,000+ tracked files，提示 .gitignore 問題
- 工具流程：Bash(診斷) → Read(.gitignore) → Edit(.gitignore) → Bash(驗證)
- 涉及：`git ls-files | wc -l`、`.gitignore` 規則補全、大型目錄排除

**評為 Weak 的原因：**
- 只出現 1 次，缺乏重複性
- 現有 `env-doctor` 和 `settings-audit` 涵蓋了部分環境診斷
- 流程簡單，不值得獨立技能

---

## 建議行動優先序

| 優先 | 行動 | 預期效益 |
|------|------|---------|
| P0 | 填充 `tw-company-pe-memo` 工作流程 + 修復 trigger | 每日 2~5 個 PE DD session 自動路由 |
| P1 | 修復 `taiwan-industry-classifier` trigger | 批量分類任務自動路由 |
| P2 | （觀望）git-repo-size-doctor | 出現頻率不足，暫不建立 |

---

## 附：PE DD 工具用量統計（18 個未路由 sessions）

| Session | 公司 | WebSearch | WebFetch | ToolSearch |
|---------|------|-----------|----------|------------|
| #3 | 羅賓斯科技 | 8 | 3 | 1 |
| #8 | 吉爾科技 | 5 | 3 | 1 |
| #10 | 奇點無限 | 6 | 3 | 1 |
| #11 | 居家整聊 | 5 | 5 | 1 |
| #12 | 日目視覺藝術 | 7 | 4 | 1 |
| #13 | 好域 | 6 | 4 | 1 |
| #14 | 台灣百應生物科技 | 6 | 4 | 1 |
| #16 | 台灣受恩 | 6 | 3 | 1 |
| #17 | 見臻科技 | 8 | 5 | 1 |
| #18 | 羅賓斯科技（重） | 5 | 3 | 1 |
| #19 | 樂浪星晴國際 | 4 | 4 | 1 |
| #20 | 壞主意 | 5 | 2 | 1 |
| #24 | 日目視覺藝術（重） | 4 | 2 | 1 |
| #25 | 易開科技 | 7 | 4 | 1 |
| #26 | 翔評互動 | 5 | 3 | 1 |
| #27 | 悠勢科技 | 6 | 2 | 1 |
| #29 | 班朋實業 | 6 | 4 | 1 |
| #30 | 集智網路科技 | 10 | 7 | 1 |
| **總計** | | **109** | **65** | **18** |

每個 PE DD session 平均消耗：WebSearch × 6、WebFetch × 3.6。
修復 tw-company-pe-memo 技能後，這些呼叫仍然需要，但可確保輸出格式一致、流程標準化。
