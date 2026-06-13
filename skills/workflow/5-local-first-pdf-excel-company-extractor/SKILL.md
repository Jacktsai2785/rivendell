---
name: 5-local-first-pdf-excel-company-extractor
description: |
  地端 PDF / Excel 檔案 → 公司名稱抽取 → 既有公司去重的整合工作流。
  TRIGGER when: 使用者說「PDF 抽公司名稱」、「Excel 提取公司」、「公司名稱去重」、「整理投資名單」等需要從檔案批量提取並去重公司資訊的場景。
when_to_use: 當需要從 PDF 或 Excel 檔案中批量提取公司名稱，並與既有公司資料庫進行去重和統一編號查詢時。
version: 1.0.0
tags:
  - pdf-extraction
  - excel-parsing
  - company-deduplication
  - data-pipeline
languages: all
---

## Overview

這個 skill 整合了三個既有 skill 的工作流程，形成完整的地端文件 → 公司資訊抽取 → 去重的資料管道：

1. **文件解析**（doc-to-structured-data）：將 PDF / Excel 檔案轉換為結構化資料
2. **公司查詢與統一**（tw-company-lookup）：抽取的公司名稱進行統一編號比對
3. **去重與 SSOT 維護**（markdown-file-ssot）：建立公司資訊的單一真實來源，避免重複記錄

這個整合流程特別適合需要批量處理的場景，例如投資名單、客戶清單、供應商資料等。

## 何時使用

- 你有一份 PDF 或 Excel 檔案，其中包含多個公司名稱
- 需要將提取的公司名稱與既有資料庫去重，避免同一公司被重複記錄
- 需要取得公司的統一編號或其他標準化識別符
- 最終結果需要存入一個中央的、易於查詢和更新的資料來源

典型使用場景：
- 從投資備忘錄 PDF 中提取目標公司清單
- 從客戶報告 Excel 中批量收集公司名稱
- 整理供應商名單並與既有供應商資料庫去重
- 建立和維護投資組合清單

## 執行步驟

### 第一步：准備檔案

確保你的 PDF 或 Excel 檔案中包含清晰的公司名稱資訊。最佳實踐：
- PDF：包含文字（非掃描影像）的 PDF 檔案效果最佳
- Excel：公司名稱在單一欄位或明確位置
- 檔案應上傳至工作目錄或通過 UI 提供

### 第二步：觸發文件解析

呼叫 `/doc-to-structured-data` skill，指定目標檔案。該 skill 會：
- 自動偵測檔案格式（PDF 或 Excel）
- 提取公司名稱相關欄位
- 輸出結構化 JSON 或 CSV 格式結果

範例：`/doc-to-structured-data <file.pdf>`

### 第三步：進行公司查詢與統一編號比對

將第二步輸出的公司名稱清單交給 `/tw-company-lookup` skill：
- 逐筆或批量查詢統一編號
- 識別可能的名稱變體或別名
- 回傳標準化的公司資訊（公司名、統一編號、狀態等）

### 第四步：建立或更新 SSOT

使用 `/markdown-file-ssot` skill 維護一份中央的公司資訊檔案：
- 輸入第三步查詢結果
- 該 skill 自動進行去重（以統一編號為主鍵）
- 合併新資料與既有資料，保持單一真實來源
- 輸出更新後的 SSOT 檔案

### 完整工作流示例

假設你有 `投資清單.xlsx`，其中有 20 家公司：

**提取階段**：`/doc-to-structured-data 投資清單.xlsx` → 輸出 JSON 陣列，包含 20 個公司名稱記錄

**查詢階段**：`/tw-company-lookup <上一步的 JSON>` → 輸出 20 筆記錄，帶有統一編號和公司狀態

**去重與 SSOT**：`/markdown-file-ssot --merge <查詢結果> --output-file 投資組合-ssot.md` → 輸出 `投資組合-ssot.md`，包含去重後的 19 家公司（去除重複），可供後續查詢和更新

## 注意事項

### 與既有 Skill 的關係

這個 skill 並非獨立工具，而是三個既有 skill 的編排模式。單獨呼叫本 skill 會導致順序執行這三個 skill。如果對工作流有特定需求：
- 只需要文件解析：直接用 `/doc-to-structured-data`
- 只需要公司查詢：直接用 `/tw-company-lookup`
- 只需要維護 SSOT：直接用 `/markdown-file-ssot`
- 需要完整流程：呼叫本 skill

### 可能的資料品質問題

**公司名稱格式不一致**：例如「台灣電子股份有限公司」vs「台灣電子有限公司」。tw-company-lookup 會處理大多數常見變體，但某些邊界情況可能無法完全匹配。

**繁簡混雜**：如果檔案包含簡體中文公司名，統一編號查詢可能失敗。建議先進行文本標準化。

**缺失資訊**：若檔案中的公司名稱極度簡略（如僅有公司簡稱），查詢成功率會降低。

### 成本和效能考量

**API 呼叫**：tw-company-lookup 每筆公司查詢會發出 API 呼叫。若批量檔案超過 100 筆，建議分批處理。

**檔案大小**：doc-to-structured-data 對 PDF 和 Excel 的支援都是地端處理，不受遠程 API 限制。

**SSOT 維護成本**：markdown-file-ssot 檔案越大，合併和查詢速度越慢。建議定期歸檔舊資料。

### 何時應該調整流程

**需要額外欄位**（如聯絡人、業務範圍）：在第二步後，手動補充欄位或使用其他資料來源。

**需要特定去重邏輯**（如按產業別去重）：先完成基礎流程，再用 markdown-file-ssot 的 filter 功能進行分類。

**大規模批量處理**（>1000 筆）：考慮拆分工作，每次處理 100-200 筆，逐次累積到 SSOT。