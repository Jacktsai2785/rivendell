# Session Harvest Report — 2026-05-30 (batch2)

## Session 摘要

- **時間範圍**：近期 11 個 session
- **專案**：全部來自 `-home-jacktsai-taiwan-company`（單一專案）
- **訊息總數**：約 33 則
- **主力工具**：`Read`（18 次）— 用於讀取 PDF 與圖片
- **主要活動類型**：
  1. **產業新聞分類／多日彙整**（8 個 session）：涵蓋 4 個產業垂直（AI、前瞻科技、綠色永續、消費生活），含「當日分類」與「過去 N 天 digest」兩種輸出。
  2. **投資評估報告 PDF / 拍照圖檔擷取**（3 個 session：1、6、9）：透過後端產生的「請先用 Read tool 逐一讀取以下檔案」prompt template，把 PDF / 多張 JPG 餵給 Claude 進行結構化抽取。Session 9 一次讀了 5 張手機拍照的 JPG（檔名格式 `20260527_092834.jpg`），疑似列印投影片拍照後上傳。

---

## Skill 候選

### 1. `multi-industry-news-pipeline-orchestrator` — Moderate

- **Purpose**：把「4 個固定產業（AI / 前瞻科技 / 綠色永續 / 消費生活）× 兩種輸出（單日分類 / 多日 digest）」串成一次性編排，避免使用者手動逐產業觸發 `taiwan-news-classifier` + `1-taiwan-news-multiday-digest`。
- **Trigger**：使用者說「跑今天 4 個產業的新聞」「把這週 4 個產業彙整出來」「news pipeline 一次跑完」「4 industry batch」。
- **Category**：`workflow/`
- **Rationale**：
  - 本批 11 個 session 中有 8 個是這 4 個產業的反覆觸發，**4 產業 × 兩種輸出**幾乎是固定組合。
  - 既有 `taiwan-news-classifier`（單日、單產業）與 `1-taiwan-news-multiday-digest`（跨日、單產業）已存在，但沒有**多產業一次跑 + 進度追蹤**的編排層。
  - 可額外帶來：產業 coverage 檢查（今日是否 4 個產業都跑了）、輸出檔案命名一致（`news-{industry}.md`）、避免漏跑。
- **不要重複**：不是再寫一個分類器，是**呼叫已有 skill** 的 orchestrator。

### 2. `ic-report-multimodal-ingest` — Moderate

- **Purpose**：當投資評估報告同時有 PDF（正式版）+ 手機拍照 JPG（會議現場補充頁）時，**把所有來源讀完→輸出統一的結構化 IC memo 草稿**（標的、產業、財務摘要、風險、決議建議）。
- **Trigger**：使用者一次貼上 1 個 PDF + N 張 JPG（檔名含 `YYYYMMDD_HHMMSS`），並要求「整理成 IC 評估」「彙整這份報告」。
- **Category**：`workflow/`（投資決策流程支援）
- **Rationale**：
  - Session 1、6、9 是同一份 `Chimes_AI評估報告_to_IC_20250331.pdf`，session 9 再加 5 張手機拍照（`20260527_*.jpg`），暗示**「正式 PDF + 現場補充照片」是反覆出現的 IC 輸入組合**。
  - 既有 `tw-company-pe-memo` / `tw-company-pe-memo-refine` 處理的是「**已知公司→產出 memo**」，不處理「**多模態輸入→先 normalize**」這段。
  - `office-pdf` 與 `5-local-first-pdf-excel-company-extractor` 只各自處理 PDF / Excel，沒有 PDF + 拍照 mixed 的 SOP。
- **Risk / 不要做**：如果只是單一 PDF 抽取，已有 skill 覆蓋，不必新建。本 skill 的核心價值在於**多模態混合 + IC memo 輸出格式**。

### 3. `phone-photo-slide-evidence-pack` — Weak

- **Purpose**：把手機拍攝的列印投影片照片（檔名格式 `YYYYMMDD_HHMMSS.jpg`）按拍攝時序 normalize、去重、補上 OCR 文字、組成 evidence pack（每頁標題 + 重點 + 原圖連結）。
- **Trigger**：使用者一次上傳 N 張 `20*_*.jpg` 拍照檔（檔名為相機 timestamp），不是螢幕截圖。
- **Category**：`backend/` 或 `docs/`
- **Rationale**：
  - Session 9 一次處理 5 張 JPG，檔名形態 `20260527_092834~093123.jpg`（拍攝間隔 ~3 分鐘）幾乎可確定是會議現場連拍。
  - 但這個 pattern 只在 1 個 session 出現，**樣本不足**，且實際擷取邏輯與 `office-pdf` / `pdf-ocr-routing` 有大量重疊。
- **建議**：先不獨立成 skill，等下次再出現類似 session 再評估。

---

## 不建議重複的既有 skill

以下需求已被覆蓋，本批未建議新 skill：

| 需求 | 已有 skill |
|---|---|
| 單日台灣新聞分類（單一產業） | `taiwan-news-classifier` |
| 跨日新聞 digest + 高頻標題 | `1-taiwan-news-multiday-digest` / `5-taiwan-news-weekly-digest` |
| PDF 文字抽取（含 OCR 路由） | `office-pdf` / `pdf-ocr-routing` |
| 已知公司產出 PE 投資 memo | `tw-company-pe-memo` / `tw-company-pe-memo-refine` |
| 公司盡職調查 pipeline | `tw-company-dd-pipeline` |
| 投資研究通用流程 | `investment-research` |

---

## 結論與下一步

- **強建議**：本批沒有 Strong 候選（多數需求已覆蓋）。
- **建議優先評估**：`multi-industry-news-pipeline-orchestrator`（樣本最足、價值最高，但需先確認使用者是否有意願以「一次跑 4 個產業」為單位觸發，而不是每個產業各自手動跑）。
- **次優先**：`ic-report-multimodal-ingest`（再多收 1–2 個 session 樣本確認是否為穩定 pattern 後再建）。
- **暫不建**：`phone-photo-slide-evidence-pack`（樣本不足）。
