---
name: company-deck-ingestion
description: "TRIGGER when: user uploads company presentation files (PDF/PPT/images) and requests analysis or extraction. Unified batch ingestion of company decks → structured text + chart descriptions for downstream memo/RFQ/pitch workflows"
version: 1.0.0
tags:
  - document-ingestion
  - company-intelligence
  - pe-memo-input
  - batch-processing
languages: all
---

## Overview

Company Deck Ingestion 是統一的檔案上傳 → 內容提取中介層，專門處理公司簡報批量上傳的場景。

**核心價值：**
- 一次處理多份公司簡報（PDF / PPT / 圖片混合）
- 統一提取結構化內容：文字段落 + 圖表描述 + 表格資料
- 產生「公司知識快照」，直接被 PE memo、RFQ writer、pitch deck skills 內嵌使用
- 自動路由提取引擎（office-pdf 用於 PDF/PPTX、pdf-ocr-routing 用於圖片/掃描件）

解決既有單檔工具成熟、但「多檔批量 → 統一知識提取」這層整合缺口的問題。Session 7、28 驗證了「先讀完所有檔案再進入分析」的需求模式。

## 何時使用

**典型觸發場景：**

1. **使用者直接上傳並要求摘要**
   - 「我上傳了 3 份資料，先讀完再幫我寫 PE memo」
   - 「這 5 張圖片是公司簡報，幫我整理成 RFQ 輸入資料」

2. **內嵌在其他 skills 初始化**
   - PE memo skill 撰寫前自動呼叫本 skill 統一準備素材
   - RFQ writer 需要公司基本面資訊時，走此 skill 先提取

3. **多檔混合格式**
   - PDF、PPT、截圖、掃描件混合，來源不同、格式不統一

4. **需要「知識快照」供反覆引用**
   - 抽完文字圖表後，後續對話反覆引用，無需重複讀檔

## 執行步驟

### A. 檔案收集與預檢

列舉工作目錄相關檔案：

    find . -maxdepth 2 \( -name "*.pdf" -o -name "*.pptx" -o -name "*.ppt" -o -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.tiff" \) -type f | sort

記錄以下資訊：
- 檔案完整路徑、檔案大小、修改時間
- 標記格式類型：office（PDF/PPTX）v.s. image（需 OCR）
- 預計處理順序（按檔名或邏輯層級）

### B. 並行提取工作流

使用 parallel 或 pipeline 分散提取：

    // JavaScript workflow pseudo-code
    const fileList = [
      { path: "company_2026-05_overview.pdf", type: "pdf" },
      { path: "product_lineup_slide.pptx", type: "pptx" },
      { path: "org_chart.png", type: "image" }
    ]

    const results = await parallel(
      fileList.map(file => () =>
        agent(
          `Extract all text, section headers, chart descriptions, and tables from: ${file.path}\n` +
          `Return as structured JSON with pages[] containing sections[] of {type, content}.`,
          {
            label: file.path,
            schema: {
              type: "object",
              properties: {
                file: { type: "string" },
                fileType: { type: "string", enum: ["pdf", "pptx", "image"] },
                pages: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      pageNum: { type: "number" },
                      sections: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            sectionType: { type: "string", enum: ["title", "heading", "body_text", "bullet_list", "chart", "table", "image_description"] },
                            content: { type: "string" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        )
      )
    )

### C. 內容整合與標準化

1. **統一格式轉換**
   - 所有提取結果合併為單一 JSON 結構：
     - 公司基本面：名稱、成立年份、產業分類、地點
     - 組織架構：管理團隊、董事會成員
     - 產品服務：主要產品線、市場定位、競爭優勢
     - 財務概況：營收規模、估值、融資歷史
     - 市場數據：目標市場規模、增長預測
     - 源檔映射：每項資訊來自哪份檔案 + 頁碼

2. **去重與衝突檢測**
   - 掃描結構化資訊（如多份檔案均含公司名、成立日期），去重並標出版本差異
   - 在摘要層標記「資料來源衝突」如有數字不符

3. **建立知識快照**
   - 輸出完整 JSON 檔案（含所有頁面內容 + 源檔映射）
   - 同時生成 Markdown 摘要（一頁，重點資訊歸類）

### D. 產出交付

**預設產出：**
1. `{company_name}_deck_snapshot.json` — 完整結構化資料
2. `{company_name}_deck_summary.md` — Markdown 格式快速摘要
3. `{company_name}_source_map.txt` — 源檔 + 頁碼映射表

使用者可選擇下載或在本 skill 內存儲，供後續 PE memo / RFQ skills 程式化引用。

## 注意事項

### 已知限制

1. **OCR 精度依賴影像品質**
   - 掃描件品質差、文字小、複雜背景會降低識別率
   - 手寫內容無法識別
   - 複雜表格（多軸圖、瀑布圖）的精確數據需驗證

2. **圖表描述完整性**
   - AI 能識別圖表存在並描述內容，但數值精確度可能不足
   - 品牌特定圖示或符號描述可能不精確

3. **檔案大小與效率**
   - 單份 PDF > 100 MB 或檔案數 > 20 份時，建議分批處理
   - OCR 工作量最大（圖片 > PDF > PPTX），時間差異明顯

4. **語言支援**
   - 支援繁中、簡中、英文、日文
   - 混合多語言時自動標記語言邊界，但不進行翻譯

5. **與 tw-company-pe-memo 協作**
   - 先確認 PE memo skill 是否已內嵌 ingest 步驟（檢查其 SKILL.md）
   - 若重複，改用本 skill 作共用基礎層，PE memo 直接引用輸出

### 最佳實踐

1. **檔案命名規範**
   - 使用 `{company_name}_{date}_{content_type}.{ext}` 如 `twse-2330_2026-05_deck.pdf`
   - 避免通用名稱 `1.pdf`、`2.pdf`

2. **事前驗證**
   - 上傳前檢查檔案完整（無缺頁、無損壞）
   - 掃描件需檢查方向、傾斜、裁剪是否正確

3. **輸出審查**
   - 提取完成後對照原檔快掃「知識快照」
   - 特別驗證數字、年份、組織名稱準確性

4. **版本追蹤**
   - 重複迭代時保留舊版本快照，便於追蹤變化