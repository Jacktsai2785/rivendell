---
name: 3-obsidian-vault-link-rules
description: |
  Codify Obsidian vault 內的 wikilink 寫法規則。TRIGGER when: 使用者提及「Obsidian wikilink」「vault 連結規則」「wiki link 寫法」「[[]]」「Obsidian graph」「entity linking」。when_to_use: 需要規範 vault 內連結格式、建立 entity 連結時、檢查 unresolved link、審視已有頁面的連結是否符合規範。
version: 1.0.0
tags:
  - obsidian
  - documentation
  - knowledge-management
  - wiki-linking
  - entity-linking
languages: all
category: docs
priority: moderate
---

## Overview

Obsidian wikilink 規則是知識庫維護的基礎。這份 skill 整理 jk_nb vault 的連結規範，解決常見的踩坑問題——特別是 `[[../X]]` 的陷阱行為、entity 首次出現才 link、不同類型詞彙的連結原則。

該規則可被 jk-nb-consume 或其他 Obsidian-aware skill 引用，未來如有第二個 Obsidian vault 專案可直接複用。降級為 Moderate 優先級是因為目前單一 vault 使用，泛用性待驗證。

## 何時使用

- 使用者提出 Obsidian 連結相關問題或需要指導
- 新增頁面時需要決定連結策略
- 檢查已有連結是否符合規範
- 整理 unresolved link 時判斷該建頁還是移除
- 審視 Obsidian graph 視圖的連結密度與可讀性

## Wikilink 寫法規則

### 1. 路徑格式

**絕對路徑（推薦）**
使用 `[[wiki/分類/頁面名]]` 格式，從 wiki 資料夾根目錄開始。
範例：`[[wiki/company/TSMC]]`、`[[wiki/policy/數位發展部法規]]`、`[[wiki/tech/LLM]]`

**同目錄 basename**
同一資料夾內引用其他頁面時，只用頁面名稱。
範例：在 `wiki/company/` 資料夾內，引用 TSMC 時寫 `[[TSMC]]` 而非完整路徑

**禁用相對路徑 `[[../X]]`**
Obsidian 會將 `..` 解讀為字面資料夾名稱（如「..」目錄），導致連結無法正常識別。必須改用絕對路徑或 basename。
錯誤範例：`[[../company/TSMC]]`
正確範例：`[[wiki/company/TSMC]]` 或同目錄時用 `[[TSMC]]`

### 2. 外部專案連結

**外部 docs 格式**
引用非 vault 內的文件（如其他 wiki、GitHub docs、官方規範等），使用 `[[_external/<專案名>/<頁面>]]`。
範例：`[[_external/claude-sdk/agents]]`、`[[_external/django-docs/models]]`

### 3. Entity 類型與連結規則

**公司與組織**
去除冗餘後綴，以簡潔正式名稱為主。
範例：台積電（不寫「台積電公司」）、OpenAI（不寫「OpenAI Inc」）
頁面位置：`[[wiki/company/台積電]]`、`[[wiki/company/OpenAI]]`

**政策與法規**
用全名或官方名稱便於搜尋，避免縮寫造成歧義。
範例：`[[wiki/policy/個資法]]`、`[[wiki/policy/數位發展部組織法]]`

**技術主題**
用市場普遍簡稱，便於業內人士識別。
範例：`[[wiki/tech/LLM]]`（而非「Large Language Model」）、`[[wiki/tech/RAG]]`、`[[wiki/tech/RLHF]]`

### 4. 首次提及才 link

新概念首次在文中出現時才建立連結，後續提及不重複 link。
範例：
文段：「Claude 是由 Anthropic 開發的 AI 助手。Claude 在推理上表現優異。」
做法：只 link 第一個「Claude」→ `[[Claude]]` ... Claude 在推理上...

### 5. 不 link 的詞彙

以下詞彙不建立 wikilink：

**政府機關及其簡稱**
不 link：經濟部、財政部、教育部、FDA、GDPR、行政院、立法院等

**展會與時間性活動**
不 link：某年某月的研討會、線上發表會、一次性活動
例外：常態系列活動可 link（如 WWDC、Google I/O、SXSW）

**泛用詞彙與概念**
不 link：人工智能、機器學習、深度學習、數位化、雲端、DevOps 等行業通用術語

**人名**
除非是歷史人物、重要研究者或領域奠基人，否則不 link。
不 link：文中提及的現任 CEO、記者、員工
可 link：圖靈、馮諾依曼、Geoffrey Hinton（領域奠基人）、李開復（深度學習先驅）

### 6. Unresolved Link 處理

Obsidian 顯示紅色 unresolved link 時的決策流程：

**已有相關頁面存在**
完成連結，修正拼寫或路徑。

**概念值得被獨立記錄**
新建頁面並填充實質內容（至少簡述定義、用途、關鍵事實）。

**概念過小、臨時或屬於泛用詞**
刪除連結，改用純文字提及。不預建空頁面。

原則：每個 link 對應的頁面都應有實質內容，至少 1-2 段落以上。

### 7. Link 中的別名與特殊字符

Obsidian wikilink 不支援管道符 `|` 等某些字符，改用別名語法：
`[[實際頁面名|顯示的標題]]`
範例：`[[OpenAI|Open AI]]`（顯示「Open AI」但連至 OpenAI 頁面）

## 注意事項

**Obsidian `..` 陷阱**
相對路徑 `[[../]]` 不被解讀為路徑上升，而是字面目錄名稱。這是 Obsidian 的已知行為。必須用絕對路徑 `[[wiki/...]]` 或同目錄 basename。

**Graph 視圖的關聯性與可讀性**
過度 link 會讓 graph view 變得混亂。建立規則限制 link 範圍（如不 link 泛用詞、政府機關），有助於保持知識圖的清晰與導航性。

**別名與搜尋機制**
使用別名語法 `[[X|Y]]` 時，全文搜尋仍基於實際頁面名（X），別名只影響視覺顯示。注意不要因別名混淆而誤認頁面不存在。

**跨 vault 連結的約定**
Obsidian 原生不支援 vault 間的動態連結。使用 `[[_external/<vault>/<page>]]` 作為標記性約定，便於未來工具化或遷移時辨識外部參考。

**分類命名的一致性**
wiki 資料夾下的分類名（company、policy、tech 等）統一使用 lowercase，頁面名保留原文大小寫與正式寫法。

## 執行檢查清單

在新增或修改連結時，逐項檢查：

- [ ] 路徑使用絕對格式 `[[wiki/...]]` 或同目錄 basename，無相對路徑 `[[../...]]`
- [ ] Entity 名稱符合類型規範（公司去後綴、政策用全名、技術用簡稱）
- [ ] 新概念首次提及時才建立連結，同一頁面內不重複 link 相同詞
- [ ] 詞彙不在「不 link」清單內（政府機關、展會、泛用詞、一般人名）
- [ ] Link 目標頁面已存在或已規劃建立
- [ ] Unresolved link 經檢查，已決定是建頁、完成連結還是移除
- [ ] 若使用別名語法，確認實際頁面名與顯示名的用途對應

---