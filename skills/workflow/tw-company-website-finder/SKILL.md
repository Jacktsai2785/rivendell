---
name: tw-company-website-finder
description: >
  給定台灣公司名稱與統一編號，用 WebSearch 找出最可能的官方網站 URL。
  寧缺勿錯：找不到就回 null，絕不因「同名異公司」或「舊名」誤判統編不符。
  TRIGGER when: when working with tw-company-website-finder
when_to_use: when working with tw-company-website-finder
version: 1.1.0
tags: [台灣公司資料堆]
languages: all
source: harvest-auto
---

# tw-company-website-finder

## Overview

給定台灣公司名稱（可為簡稱）與統一編號，用 WebSearch 找出最可能的官方網站 URL。

## 核心原則

### 統編是唯一識別碼

**統一編號不會因公司更名而改變。** 以下情境都是同一家公司：

- 我們存的名稱是「惠生醫藥國際」，第三方網站寫「鼎橙國際」→ **更名前舊名，同一家**
- 我們存的名稱是「壹泊科技」，搜到「USPACE / 悠勢科技」統編不同 → **那是另一家，本公司仍是壹泊科技**
- 我們存的名稱省略了「股份有限公司」後綴 → **簡稱，同一家**

**正確邏輯：**
1. 統編吻合 → 就是同一家，不管搜到什麼旁支結果
2. 搜到「類似名稱但統編不同的公司」→ 那是**干擾**，不代表我們的統編對不上
3. 若想確認公司是否存在：用統編查 GCIS（`https://data.gcis.nat.gov.tw/od/data/api/5F64D864-61CB-4D0D-8AD9-492047CC1EA6?$format=json&$filter=Business_Accounting_NO eq {tax_id}&$skip=0&$top=1`），不是用 WebSearch

### 錯誤推理（禁止）

❌ 「我找到一個同名但統編不同的公司 → 所以我們存的統編對不上 → 不填」
❌ 「第三方網站的公司名與我們不同 → 名稱與統編不符 → 不填」
❌ 「GCIS 沒查，光靠 WebSearch 判定公司不存在」

### 正確推理

✅ 「搜到同名異公司 → 那是干擾，跳過 → 繼續找本公司官網」
✅ 「第三方站名稱不同 → 可能是舊名或簡稱 → 以統編為準，繼續找官網」
✅ 「找不到官網 → 回 null + 說明『查無官網』，而非說『查無公司』或『統編不符』」

## 搜尋策略

1. 先搜 `"公司全名" 官網`
2. 再搜 `"公司全名" 官方網站`
3. 找不到加上產業關鍵字
4. 還找不到用統編搜：`統一編號 {tax_id}`

## 合格 URL 判斷（寧缺勿錯）

**收錄：**
- 公司自有網域（.com.tw / .tw / .com / .co 等）
- 確認內容與公司相符（公司名、產品、聯絡資訊）

**排除（即使有相關資訊也不填）：**
- 人力銀行：104.com.tw, 1111.com.tw, yes123.com.tw
- 登記查詢站：findbiz.nat.gov.tw, twincn.com, gcis.nat.gov.tw, zhupiter.com
- 社群頁：facebook.com, instagram.com, linkedin.com
- 新聞報導、產業資料庫（FINDIT, CMoney 著陸頁）
- 第三方代管詢價頁（web66, taiwantrade 平台頁）
- **同名但統編不同的另一家公司的網站**

## 回傳格式

```json
{
  "id": "<原id>",
  "name": "<公司名>",
  "website": "<https://...> 或 null",
  "note": "官網確認 / 查無官網 / 僅FB粉專(無獨立官網) / ..."
}
```

note 只描述**官網找沒找到**，不要說「查無公司」或「統編不符」。
公司存不存在是另一個問題，不在此 skill 的範疇。

## 常見陷阱

| 情境 | 錯誤做法 | 正確做法 |
|---|---|---|
| 搜到同名異公司 | 判定「統編不符，不填」 | 忽略干擾，繼續找本公司官網 |
| 第三方站顯示舊公司名 | 判定「名稱不符，不填」 | 以統編為準，可能是更名 |
| 只找到 FB 粉專 | 填 FB URL | website=null, note=「僅FB粉專」 |
| 找到黃頁/代管頁 | 填進去 | 排除，繼續找或回 null |
| 完全找不到任何線索 | 說「查無公司」 | note=「查無官網」（不否定公司存在） |
