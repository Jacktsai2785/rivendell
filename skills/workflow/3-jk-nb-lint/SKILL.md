---
name: 3-jk-nb-lint
description: "執行 jk-nb wiki 的 lint 動詞，掃描整個 wiki/ 目錄，找出內容品質問題（重複定義、孤立頁面、broken links、title 不一致、內容矛盾、格式問題、缺少 metadata）並輸出可執行的審計報告"
trigger:
  when:
    - 使用者說「跑 lint」或「lint」
    - 使用者說「wiki lint」或「知識庫品質檢查」
    - 使用者說「jk-nb lint」
    - 使用者說「找矛盾」或「清 dead link」或「dead link」
    - working directory 是 jk-nb 且使用者提到品質問題、矛盾、連結失效
  if_missing: "Abort without error, do not suggest workarounds"
when_to_use: "當需要對 jk-nb wiki 進行系統化的品質檢查時，掃描 7 種問題類型並生成雙輸出（人類可讀報告 + 結構化修復清單），特別適用於定期審計、大量新增內容後的掃描、或準備重組時的預審"
version: 1.0.0
tags:
  - wiki
  - lint
  - quality-audit
  - knowledge-base
languages: all
---

## Overview

jk-nb wiki 的內容隨著時間演進，容易產生各種品質問題：重複定義、孤立頁面、broken links、title 不一致、內容矛盾、格式不符、メタデータ缺失。此 skill 自動掃描整個 wiki/ 目錄，系統化地找出這些問題，並生成兩份輸出：

- **審計報告**（Markdown）— 人類易讀格式，按嚴重程度分類，列舉所有發現與建議修復
- **Agent Actions 清單**（JSON）— 結構化的修復行動清單，可逐項手動執行或交由 Agent 批次處理

## 何時使用

- **定期品質檢查**：每月或每季進行一次全面掃描
- **大量內容新增後**：在併入新章節或外部文檔後，檢查是否產生衝突或重複
- **懷疑有連結失效**：快速診斷有多少 broken links 以及位置
- **準備歸檔或重組**：在大規模改組前進行預審，確認沒有孤立頁面被遺漏
- **使用者回饋根因分析**：當有人反映「找不到某個頁面」時，lint 可快速找到問題所在
- **跨作者一致性檢查**：多人編寫時確保 title、tag、格式統一

## 執行步驟

### 1. 確認 working directory

```bash
cd ~/jk-nb  # 或任何 jk-nb 副本路徑
```

### 2. 呼叫 skill

在 Claude Code 對話中：
- 說「跑 lint」
- 說「wiki lint」
- 說「知識庫品質檢查」
- 說「jk-nb lint」
- 或直接 `/3-jk-nb-lint`

### 3. Skill 執行流程

Skill 將依序掃描 wiki/ 目錄下所有 .md 檔案，逐種問題類型進行分析：

**7 種問題類型：**

1. **重複定義** — 同一概念在多個檔案的 frontmatter title 中定義，或主要內容重複超過 70% 相似度
2. **孤立頁面** — 沒有任何入站連結（internal link）、也不是首頁或根索引的頁面
3. **Broken links** — 指向不存在檔案的內部連結 `[text](path/to/missing.md)`
4. **Title inconsistency** — 同一主題在不同檔案的標題措辭明顯不一致（如「使用者」vs「用戶」）
5. **Content contradiction** — 不同檔案陳述相同事實但內容衝突（如日期、數據、結論不同）
6. **Formatting issues** — heading 層級跳躍（如 # 直接跳到 ###）、code block 缺少語言標記、清單混用符號等
7. **Missing metadata** — 缺少 frontmatter 中的必要欄位（title、tags、created_at 等）

### 4. 輸出檔案

Skill 產生兩份檔案，存放在 `reports/` 目錄：

- **`jk-nb-lint-YYYY-MM-DD-HHmmss.md`**
  - 人類可讀的完整報告
  - 按問題類型與嚴重程度分段
  - 每個問題附上檔案路徑、行號、修復建議

- **`jk-nb-lint-actions-YYYY-MM-DD-HHmmss.json`**
  - 結構化 JSON 清單
  - 每筆 action 包含：issue 類型、檔案路徑、詳細描述、建議修復步驟
  - 可供後續 Agent 或自動化工具消費

### 5. 檢視與應用結果

1. 打開 Markdown 報告檔案，從最高嚴重程度開始優先處理
2. 根據 JSON actions，逐項修正檔案
   - 可手動編輯
   - 或提給 Agent 批次處理（"根據 jk-nb-lint-actions-*.json，修復所有 broken links"）
3. 修復完成後，刪除或歸檔已處理的 action

## 注意事項

- **掃描範圍**：僅掃描 wiki/ 目錄；子模組、外部參考檔案或同步的遠端內容不在範圍內
- **定義衝突檢測準確度**：title inconsistency 與 content contradiction 的判斷仰賴詞彙相似度與語義分析，可能有假陽性；請人工複審高風險項目
- **孤立頁面判定**：錨點連結（`#section`）、前向參考（計畫中的連結）、以及外部入站連結（如 GitHub issue 連回 wiki）不納入計算；如果預計頁面將來會被引用，可在該頁面 frontmatter 加 `keep: true` 以跳過此檢查
- **執行時間**：規模影響明顯
  - 超大型 wiki（>5000 頁）可能需時 5–10 分鐘
  - 中等規模（500–1000 頁）通常 1–2 分鐘
  - 小型（<200 頁）通常 <30 秒
- **Agent Actions 不覆寫**：若先前有未執行的 `jk-nb-lint-actions-*.json`，新 lint 執行會 append 至同一檔案而非覆寫，防止遺失待辦事項；定期整理已完成項目以保持清單可讀
- **編碼與格式要求**：假設所有 wiki 檔案為 UTF-8 編碼、使用 YAML frontmatter 格式；若有不同編碼或格式，lint 可能失效或產生誤判
- **分支與版本控制**：建議在獨立分支執行 lint，審視報告後再併入 main；這樣可以逐批處理修復，避免單次提交過大