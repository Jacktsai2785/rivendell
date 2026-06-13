---
name: jk-nb-digest
description: |
  TRIGGER when: 使用者說「跑 digest」「整理 inbox」「inbox 清掉」「promote 到 wiki」「劃掉的條目可以刪了嗎」，或在 jk_nb 專案根目錄執行類似指令
  
  jk-nb vault 的 digest 動詞 runtime：掃 inbox.md 中還活著（未劃線）的條目，依語意分類 promote 到對應 wiki/<topic>.md，原行用 ~~...~~ 刪除線標記保留；30 天以上已刪除線的陳舊項目主動提示刪除。
when_to_use: |
  - 定期整理 jk_nb inbox，避免條目堆積
  - 發現 inbox 中值得長期保留的想法或筆記，需要分類進 wiki
  - 檢視已標記刪除線但長時間未清理的舊條目，決定是否真正刪除
version: 1.0.0
tags: [workflow, jk-nb, knowledge-base, digest, inbox-management]
languages: all
---

## Overview

digest 是 jk-nb vault 四動詞（ingest / consume / digest / query）中的信息流轉環節，負責將 inbox 中成熟的、值得長期保存的條目升格到對應的 wiki 主題區。

與 `2-jk-nb-consume` 不同（consume 處理 raw/ 新訊息入 wiki），digest 專責 **inbox 到 wiki 的語意分類與提升**，並透過刪除線保留審計軌跡——這樣既避免資訊遺失，也讓「已決定不保留」的項目留下清晰的標記和時間戳記。

## 何時使用

**觸發信號：**
- inbox.md 條目累積超過 5-10 項未處理
- 發現某些 inbox 項目已成熟可進 wiki（足夠清晰、高複用價值、已驗證正確）
- 定期檢查（建議周／月）是否有 30+ 天前的刪除線條目可以永久刪除

**使用模式：**
```
$ cd ~/jk_nb  # 進入 vault 根目錄
$ sk run 2-jk-nb-digest  # 或直接調用 LLM：「跑 digest」
```

## 執行步驟與規則

### 第一步：掃描 inbox.md 中的活條目

1. 開啟 `inbox.md`
2. 找出所有**未劃線**的行（即不包含 `~~...~~` 格式的行）
3. 保留空行與層級結構，只關注內容行

**條目格式範例：**
```markdown
## Inbox

- AI agent 架構中的 context window 最佳化技巧
- WSL2 systemd 與 launchd 互操作性問題
- ~~舊的打包方案，已改用 uv~~（這行被標記，跳過）
- CLI 工具的 help 文案規範檢查表
```

活條目：第 1, 2, 4 行；第 3 行已刪除線，跳過。

### 第二步：依語意分類與 promote

對每個活條目：

1. **判斷主題分類**：該條目最適合進哪個 wiki/<topic>.md？
   - 若已有對應主題，選中該檔案
   - 若無，可建立新的 wiki/<topic>.md

2. **Promote 到 wiki**：
   - 複製條目內容（或適當改寫使其更成體系化、可被 wiki 直接引用）
   - 追加到 `wiki/<topic>.md` 的合適位置（通常末尾或按時序）
   - 保留原 inbox 條目不動，但：

3. **在 inbox.md 中標記刪除線**：
   ```markdown
   - ~~AI agent 架構中的 context window 最佳化技巧~~
   ```
   - 使用 `~~` 和 `~~` 包住整行內容
   - **保留原文**，不刪除，這樣可以查詢審計軌跡

4. **記錄時間戳記**（可選但推薦）：
   - 若 markdown 格式支持，可在刪除線行末加註：
     ```markdown
     - ~~AI agent 架構中的 context window 最佳化技巧~~ (promoted 2026-06-13 → wiki/ai-systems.md)
     ```
   - 或在 inbox.md 的 metadata 區塊（YAML 前文或註解區）記錄本次 digest 時間

### 第三步：清理超期條目

1. **掃描所有已劃線項目**（包含 `~~...~~` 的行）
2. **估算時間跨度**：
   - 可基於 git commit 最後修改時間
   - 或手動檢查（如有時間戳記）
3. **識別 30+ 天舊條目**：
   - 提示使用者：「以下項目已標記 30+ 天，確認刪除嗎？」
   - 列出具體行內容
4. **刪除決策**：
   - 確認刪除：直接從 inbox.md 移除該行
   - 保留：可重新啟用（移除 `~~`）或保持

**30 天判斷方式：**
```bash
# 在 jk_nb 目錄下，查找 inbox.md 的最後修改時間
git log --follow -p inbox.md | grep -A2 "^~~" | head -20
```

或更實務地，用 LLM 協助解析 inbox.md 中的時間註記。

## 注意事項

### 刪除線 retention 為什麼重要

- **完全刪除會失去審計軌跡**：你無法查證「為什麼這條被丟了」
- **刪除線 + 時間戳記形成決策日誌**：未來回顧 wiki 時，可看到哪些想法被遷棄、何時遷棄
- **再發現舊想法的線索**：若重複出現類似 inbox 項目，可快速查看是否已在刪除線區被 reject

### 避免的常見錯誤

1. **不要改寫刪除線內容**：標記為 `~~...~~` 後，就讓原文保持原樣，不要修飾或縮寫
2. **不要盲目 promote 不成熟的條目**：promote 應只發生在條目已驗證正確、足夠具體、對 wiki 有獨立價值時
3. **不要忽略 30 天清理提示**：長期的已刪除線條目會占用視覺空間和檔案大小，定期清理保持 inbox 整潔

### 與其他 skill 的分工

- **`1-llm-wiki-knowledge-base`**：四動詞概念與架構層面的文檔
- **`2-jk-nb-consume`**：raw/ 輸入端，處理新外部訊息進 wiki
- **`2-jk-nb-digest`**（本 skill）：inbox 到 wiki 的語意分類與升格，加上陳舊項目清理

三者共同構成 jk_nb 從輸入到整理到查詢的完整生命週期。

## 例子流程

```
初始 inbox.md：
- API design guideline：authentication vs authorization 差異
- ~~Ruby on Rails 6.0 migration 筆記~~ (2026-05-10)
- 台灣財報查詢 API 返回格式優化建議

執行 digest：

第一項 → promote 到 wiki/api-design.md，inbox.md 變成：
- ~~API design guideline：authentication vs authorization 差異~~ (promoted 2026-06-13 → wiki/api-design.md)

第二項 → 30+ 天舊項目，提示刪除
使用者確認刪除 → 從 inbox.md 完全移除

第三項 → promote 到 wiki/finance-tools.md，inbox.md 變成：
- ~~台灣財報查詢 API 返回格式優化建議~~ (promoted 2026-06-13 → wiki/finance-tools.md)

清理完成，inbox.md 只剩活項（未劃線）和已整理項（劃線留痕跡）。