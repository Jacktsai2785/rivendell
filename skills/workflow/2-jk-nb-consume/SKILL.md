---
name: 2-jk-nb-consume
description: 執行 jk_nb vault 的 consume 動詞——掃 raw/ 依 frontmatter type 路由至 wiki/ 子目錄、補 entity wikilinks、regen index、append logs。TRIGGER when: 「跑 consume」「編譯 raw」「整理筆記到 wiki」「jk-nb consume」「vault 編譯」「處理 dropbox」，或 working directory 是 jk_nb/jk-nb 時自動建議。
when_to_use: 每次整理 jk_nb vault 中的原始筆記（raw/）到維基知識庫（wiki/）時執行，自動處理分類、wikilink 補齊、索引重建
version: 1.0.0
tags: [workflow, vault, wiki, markdown, knowledge-base]
languages: all
---

## Overview

`jk-nb-consume` 是 jk_nb 個人知識庫的編譯流程自動化工具。該 skill 將分散在 `raw/` 與 `raw/_dropbox/_processed/` 中的原始筆記，根據 frontmatter 的 `type` 欄位自動分類、路由至 `wiki/` 子目錄，並自動補齊 entity wikilinks、更新編譯時間戳記、重建維基索引。

與 `markdown-file-ssot` 不同，本 skill 專注於**寫入路徑**，不是查詢用途。它將流程中 44 則訊息中反覆出現的手動步驟（掃檔案、檢查 frontmatter、補 link、append log）自動化，同時強制執行多項非顯然的規則——特別是 wikilink 絕對路徑規則（`[[wiki/...]]`，禁止 `[[../X]]`）和 entity 首次出現才 link 的約定，避免產生 Obsidian 無法辨識的路徑與重複 link。

## 何時使用

### 主動觸發
使用者在命令行說出以下任一表述：
- 「跑 consume」
- 「編譯 raw」
- 「整理筆記到 wiki」
- 「jk-nb consume」
- 「vault 編譯」
- 「處理 dropbox」

### 自動建議
當使用者的 working directory 為 `jk_nb` 或 `jk-nb` 時，該 skill 會被列為推薦選項。

### 典型場景
- 從 Dropbox、郵件、或其他外部來源批量匯入筆記後，需要統一編譯至知識庫
- 定期整理新增的 `raw/` 原始筆記，使其進入 `wiki/` 組織結構
- 發現缺漏的 entity wikilink 或過期的 `last_compiled` 時間戳記

## 執行步驟或模式

### 第 1 步：掃描源檔案

掃描以下目錄中的所有 markdown 檔案：
- `raw/` 根目錄
- `raw/_dropbox/_processed/` 子目錄

記錄檔案數量。若超過 5 個，僅處理前 5 個（按字母順序），其餘留待下次執行。

### 第 2 步：檢查 frontmatter 與路由

對每個檔案：
1. 讀取 YAML frontmatter，找到 `type` 欄位
2. 根據 `type` 決定目的地路徑：
   - 若 `type: company-profile`，路由至 `wiki/companies/<slug>.md`（其中 `<slug>` 從檔案 frontmatter 的 `slug` 欄位取值）
   - 若 `type: industry-digest`，路由至 `wiki/news/<industry>.md`（其中 `<industry>` 從 frontmatter 的 `industry` 欄位取值）
   - 其他 type，路由至 `wiki/<topic>.md`（其中 `<topic>` 為 frontmatter 的 `topic` 欄位，或預設為 `type` 值）
3. 若目的地檔案不存在，建立新檔案（保留原檔案內容結構）

### 第 3 步：更新 last_compiled

在目的地檔案的 frontmatter 中：
- 新增或更新 `last_compiled` 欄位，值為當前 ISO 8601 時間戳記（格式：`2026-06-13T14:30:00Z`）

### 第 4 步：補齊 Entity Wikilinks

掃描目的地檔案的正文內容（不含 frontmatter），找出所有被提及但未以 wikilink 方式標記的 entity（人名、公司名、地點等）。規則：

**新增 wikilink 時的約定：**
1. 使用**絕對路徑** `[[wiki/category/slug]]`，**禁止** `[[../X]]` 相對路徑（Obsidian 會將 `..` 視為字面資料夾名，導致路徑錯誤）
2. 每個 entity 在該檔案中**第一次出現時才補 link**，後續重複出現的同一 entity 不重複補 link
3. 若無法確定 entity 屬於哪個 wiki 子目錄（category），暫不補 link，記錄在稍後的審查日誌中

### 第 5 步：重建 wiki/_index.md

掃描 `wiki/` 目錄下的所有 `.md` 檔案（包括所有子目錄），生成索引：
- 列表項格式：`- [標題](相對路徑)`，標題取自各檔案 frontmatter 的 `title` 欄位
- 按目錄結構分組（如 `## Companies`、`## News` 等）
- 確保所有檔案都出現在索引中，無遺漏

### 第 6 步：Append 執行日誌

在 `logs/agent-actions.md` 末尾 append 一條記錄：

```
### [2026-06-13 14:30] consume batch
- Processed: raw/company-xyz.md → wiki/companies/xyz.md
- Processed: raw/industry-tech.md → wiki/news/tech.md
- Updated wikilinks: 3 entities linked
- Index regenerated: wiki/_index.md
- Status: success
```

記錄格式：
- 時間戳記：當前執行時刻
- Processed 列表：每個轉移的檔案
- Entity link 統計：補齊的 wikilink 數量
- Index 重建確認
- 整體狀態：success / partial / error

### 第 7 步：清理源檔案

執行完成後，將已處理的 `raw/` 檔案**移動至** `raw/_archive/` 子目錄（或刪除，取決於保留策略），確保下次執行時不會重複處理。

## 注意事項

### 非顯然的規則（易出錯）

1. **Wikilink 絕對路徑強制規則**
   - 必須使用 `[[wiki/...]]` 形式，**禁止** `[[../X]]`
   - 原因：Obsidian 將 `..` 視為字面資料夾名，不會解析為上一層目錄，導致 link 失效且產生孤立資料夾
   - 每次執行時提醒此規則，若發現相對路徑自動轉換為絕對路徑

2. **Entity 首次出現才 link**
   - 同一 entity 在單一檔案中出現多次時，僅第一次加上 wikilink
   - 後續重複出現的同名 entity 保留原文本（不加 link）
   - 目的：避免過度連結導致閱讀困難

3. **5 頁上限**
   - 每次 consume 最多處理 5 個檔案
   - 若源目錄含有超過 5 個檔案，批次執行，每次 5 個，依字母順序遞進
   - 防止單次執行時間過長、避免 index 重建過頻繁

4. **Frontmatter 欄位必填檢查**
   - 每個來源檔案必須包含 `type` 欄位，否則無法路由
   - `company-profile` 必須有 `slug` 欄位，`industry-digest` 必須有 `industry` 欄位
   - 缺漏必填欄位的檔案應記錄警告，暫不處理，由使用者後續補齊

5. **_index.md 完整性校驗**
   - 重建索引前，校驗 `wiki/` 下是否有任何 `.md` 檔案未被納入索引
   - 若有遺漏，於日誌中標註 missing files 清單

### 已知限制

- 不會自動推斷 entity 類型或 slug，rely on 檔案 frontmatter 和人工審查
- 若 frontmatter 中 `type` 值為自訂類型（非 company-profile、industry-digest），wikilink 補齊時可能無法確定目標目錄，需人工確認後手動 adjust
- 一次最多 5 頁限制，對大規模批次匯入會導致多輪執行

### 整合建議

- 建議每週或每次 Dropbox 同步後執行一次
- 與 `logs/agent-actions.md` 的執行日誌一併保存，便於事後審計和 entity 管理
- 若發現規則衝突或邊界情況，應更新該 skill 文檔或提出修訂需求