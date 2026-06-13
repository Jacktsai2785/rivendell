---
name: tw-company-batch-dd-pipeline
description: TRIGGER when: 使用者提供一份台灣公司名單（PDF、文字、試算表），需要批次產出多份完整 DD 備忘錄。協調名稱擷取 → 網站搜尋 → PE 備忘錄生成的三步工作流。
when_to_use: 投資前批次調查、portfolio 公司清單建檔、市場掃描後的快速 DD、競爭對手清單分析
version: 1.0.0
tags: [batch, dd, taiwan, company, workflow, pe-memo, pipeline, headless-agent]
languages: all
---

## Overview

tw-company-batch-dd-pipeline 是一個協調型 workflow skill，整合三個專門 skill 的輸出，自動化批次盡職調查流程：

1. **tw-company-name-extractor** — 從非結構化文本（PDF、Excel、文字清單）萃取台灣公司名稱，去重、標準化、對應法人登記資料
2. **tw-company-website-finder** — 對每家公司並行搜尋官方網站，驗證可達性，標註信心度分數
3. **pe-memo-already-generated-guard** 或同等 PE 備忘錄 skill — 基於公司名稱、網站內容、公開財務資訊產出標準化 PE 備忘錄

**核心價值**：
- 將手工逐家查詢的流程自動化為並行批次處理（8-16 家同時執行）
- 保證三步輸出的追蹤性：每家公司的進度、失敗原因、confidence 分數一目瞭然
- 統一格式輸出：markdown memo、摘要報告、失敗日誌、進度追蹤 JSON
- 適合投資人、并購團隊、市場分析師的快速初篩和資料彙整

## 何時使用

**典型觸發場景**：

1. **投資前調查** — 收到潛在投資標的清單，需在 1-2 小時內產出初步 DD 報告和背景資料
2. **Portfolio 維護** — 定期更新既有投資組合的基礎資訊（網站、財務概況、最新資訊）
3. **市場掃描** — 競爭對手研究或行業報告後，快速蒐集 20-100 家候選公司的資訊
4. **併購前期** — 篩選階段，需要大量對象的快速背景審視，找出值得深度 DD 的公司

**調用方式**：

```
/tw-company-batch-dd-pipeline <source> [選項]
```

其中 `<source>` 可以是：

- **檔案路徑**：`/tw-company-batch-dd-pipeline ./companies-list.xlsx`
- **PDF 檔**：`/tw-company-batch-dd-pipeline ./reports/market-scan-2026.pdf`
- **直接貼文字**：`/tw-company-batch-dd-pipeline "台積電、聯發科、鴻海、正新、和碩"`
- **URL**：`/tw-company-batch-dd-pipeline https://example.com/company-list`

**常用選項**：

- `--concurrent 16` — 增加並行處理數（默認 8），加快速度但提高網路風險
- `--skip-website-check` — 跳過網站驗證步驟，只做名稱擷取和 memo 產出
- `--memo-lang en` — PE 備忘錄改為英文輸出（默認中文）
- `--output-dir /path/to/dir` — 指定輸出資料夾位置

## 執行步驟

### 第 1 步：驗證及萃取名稱清單

skill 自動調用 **tw-company-name-extractor**：

- 檢驗輸入檔格式（自動偵測 PDF、Excel、純文字）
- 抽出所有公司名稱（含去重、正規化、拆分中英文別名）
- 對應商業登記資料和金融監管名冊（TWSE/TPEX 上市公司自動識別）
- 輸出帶追蹤 ID 的名稱清單

**第 1 步輸出範例**：

```
輸入：./tech-companies.xlsx
偵測格式：Excel (.xlsx)
總行數：47 行

萃取結果：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
comp_001 | 台灣積體電路製造股份有限公司
         | 英文別名：Taiwan Semiconductor Manufacturing Company Limited
         | 狀態：已確認上市公司（TSMC, 代號 2330）

comp_002 | 聯發科技股份有限公司
         | 英文別名：MediaTek Inc.
         | 狀態：已確認上市公司（代號 2454）

comp_003 | 鴻海精密工業股份有限公司
         | 英文別名：Foxconn Technology Group
         | 狀態：已確認上市公司（代號 2317）
         
comp_004 | XYZ 科技股份有限公司
         | 狀態：未確認（可能為新成立或非上市公司，將進行網路搜尋）

去重後總計：45 家公司
```

### 第 2 步：並行搜尋官方網站

skill 對每家公司（默認最多同時 8 家）調用 **tw-company-website-finder**：

- 使用多層搜尋策略：商業登記資料 → Google 搜尋 → LinkedIn → 業界資料庫
- 驗證網站可達性（HTTP 200、非釣魚、有實質內容）
- 判斷網站所有權（檢查 WHOIS、SSL 憑證、企業名稱提及）
- 回傳 {company_name, website_url, confidence_score, search_method, last_check_timestamp}

**第 2 步輸出範例**：

```
搜尋進度：[████████░░] 45/50 公司已完成

comp_001 | 台灣積體電路製造股份有限公司
         | URL：https://www.tsmc.com/
         | 信心度：0.99（來源：商業登記 + SSL 驗證）
         | 狀態：✓ 已驗證

comp_002 | 聯發科技股份有限公司
         | URL：https://www.mediatek.com/
         | 信心度：0.95（來源：Google + LinkedIn）
         | 狀態：✓ 已驗證

comp_004 | XYZ 科技股份有限公司
         | URL：無結果
         | 信心度：0.0
         | 狀態：✗ 未找到（建議手工搜尋或確認公司名稱）
         | 備註：可能為剛成立公司或已休業

搜尋完成。成功率：43/45 (95.6%)
```

### 第 3 步：產出 PE 備忘錄

skill 對每家公司調用 **pe-memo-already-generated-guard** 或同等 PE memo skill：

- 輸入：公司名稱 + 官網 URL + 選用的額外背景（財務報告、新聞連結等）
- 自動抓取網站公開資訊（公司簡介、產品清單、團隊介紹）、財務資料（若可取得）
- 輸出包含以下章節的標準化 markdown memo：
  - **公司基本資料**（法人代表、成立日期、資本額、註冊地、主要業務）
  - **營運概況**（員工數、產品線、主要市場）
  - **財務概況**（若為上市公司：近期營收、淨利、EPS；非上市則標註「未公開」）
  - **競爭優勢與市場位置**（基於網站和產業資訊的分析）
  - **風險因子**（產業風險、市場飽和度、技術淘汰風險等）
  - **建議後續行動**（值得接觸的部門、獲取資訊的方式、需要深度調查的領域）

**第 3 步輸出範例**：

```
產出進度：[██████░░░░] 30/45 memo 已生成

comp_001_pe-memo.md (台灣積體電路製造股份有限公司)
  ✓ 已生成 | 大小：12 KB | 預計品質：高（上市公司，公開資料充分）

comp_002_pe-memo.md (聯發科技股份有限公司)
  ✓ 已生成 | 大小：8.5 KB | 預計品質：高

comp_004_pe-memo.md (XYZ 科技股份有限公司)
  ⚠ 已生成但品質受限 | 大小：3.2 KB | 預計品質：中等
  警告：無官網、僅基於商業登記及 Google 快取生成，建議手工補充

生成完成。成功率：43/45
```

### 第 4 步：彙整及輸出

skill 自動生成以下產出物，置於 `./reports/batch-dd-{timestamp}/`：

1. **摘要報告** (`summary.md`)
   - 批次基本訊息：輸入檔、輸入公司數、執行時間
   - 各步驟成功率統計
   - 快速檢查清單（confidence >= 0.8 的公司數、完整 memo 數等）
   - 失敗清單和建議後續行動

2. **個別 memo 檔案** (`pe-memo_comp_001.md` ~ `pe-memo_comp_045.md`)
   - 每家公司一份 memo，可獨立編輯、分享、轉檔為 PDF/DOCX

3. **失敗日誌** (`failures.json`)
   - 結構化紀錄：哪些公司在哪一步失敗，失敗原因代碼和說明文字
   - 方便後續批次修復或手工追蹤

4. **進度追蹤檔** (`progress.json`)
   - 每家公司的狀態：待搜尋、搜尋中、已驗證、memo 中、已完成等
   - 各 skill 的執行時間和資源使用量
   - 用於診斷和重新開始

5. **最終清單** (`company-registry.csv`)
   - 所有公司的統整：名稱、網站 URL、信心度、memo 檔名、狀態

## 注意事項

### 已知限制

1. **網站搜尋品質取決於公司知名度**
   - 新創或微型企業可能無官網，或網站已過期
   - skill 會標註 confidence 分數；建議只信任 >= 0.8 的結果
   - 某些公司採用非標準域名（.xyz、.app 或子網域）可能搜尋失敗
   - **處理方法**：檢視第 2 步輸出，confidence < 0.8 的公司手工 Google 一次確認

2. **公司名稱標準化困難**
   - 使用者輸入可能不是正式法人登記名稱（例如簡稱、舊名、俗稱）
   - tw-company-name-extractor 會嘗試對應商業登記，但無法保證 100% 準確
   - **處理方法**：檢視第 1 步輸出，若有「未確認」狀態的公司，手工修正後重新執行

3. **PE 備忘錄是初篩級內容，非正式 DD**
   - 備忘錄基於公開資訊、網頁內容、公開財務數據產出，不構成深度盡職調查
   - 非上市公司的財務數據通常無法取得（memo 會標註「非公開」）
   - 某些敏感產業（金融、電信、防衛科技）的內容可能受法規限制
   - **處理方法**：memo 僅用於快速初篩，若進入投資流程須進行正式 DD

4. **並發限制與網路風險**
   - 默認同時處理 8 家，避免被搜尋引擎 IP 封鎖
   - 若傳入 `--concurrent 16` 或更高，風險自負（可能短期被限流或 IP 暫時封鎖）
   - **建議**：若清單超過 100 家，分 2-3 個批次執行，每批間隔 30 分鐘

5. **輸出格式侷限**
   - 所有 memo 均為 markdown 格式，方便編輯但某些使用者需要 Word/PDF
   - 轉檔可使用 `/make-pdf` 或 `/office-docx` skill 批次轉換

### 常見陷阱

- **重複輸入同一份清單** — skill 會自動去重，但若多次執行會產生同名覆蓋。建議先檢查 `company-registry.csv` 避免重複
- **期望 100% 涵蓋** — 某些老舊、已改名或已休業的公司無法搜尋到；memo 產出後需人工補充或標記為「資訊不足」
- **網路波動導致中斷** — 若執行中斷，可用 `--resume` 選項從最後一個成功的步驟繼續（需保留 `progress.json` 和上次執行的暫存檔）
- **信心度分數過度詮釋** — 0.99 confidence 不代表網站 100% 正確，僅代表多項驗證都通過；0.7-0.8 的結果仍需人工確認

### 建議工作流程

1. **準備階段**：檢查輸入檔格式，確保公司名稱盡量完整且無明顯誤字
2. **執行主流程**：`/tw-company-batch-dd-pipeline ./my-list.xlsx`
3. **檢視第 1 步輸出**：檢查萃取的名稱是否正確；有「未確認」狀態的手工修正
4. **檢視第 2 步輸出**：priority 檢查 confidence < 0.8 的公司，若需要的話手工補充網址
5. **初版 memo 檢視**：抽樣檢視 3-5 份 memo 品質，判斷是否需要調整 skill 參數
6. **最終彙整**：使用 `/document-release` 或 `/make-pdf` 將 memo 批次轉成 PDF 報告，或透過 `/office-xlsx` 產出摘要 Excel
7. **後續行動**：根據 memo 內容進行優先級排序，決定哪些公司值得進入深度 DD

### 與相關 skill 的整合

- **tw-company-name-extractor** — 若只需要名稱萃取，可單獨調用
- **tw-company-website-finder** — 若只需要網站搜尋，可單獨調用
- **pe-memo-already-generated-guard** — 若公司名稱和網址已知，可單獨產出 memo
- **document-release** — memo 產出後可調用此 skill 批次轉為 PDF 或 HTML
- **headless-agent** — 此 skill 內部使用 headless-agent 進行並行協調