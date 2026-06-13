---
name: mops-investee-holdings-debug
description: |
  TRIGGER when: 查詢公發公司持股回傳空結果或錯誤結果、「查無公發公司揭露持有此公司股份」、「investee holdings 找不到」、「持股查詢沒結果但資料應該有」、「MV 沒有更新」。

  WHEN TO USE: 當 mops_investee 持股查詢功能異常時，系統化排查 Materialized View (MV) → 資料管線 → 前端查詢的整條鏈路，快速定位問題在資料層、轉換邏輯、還是前端查詢。
version: 1.0.0
tags:
  - mops
  - debug
  - investee
  - materialized-view
  - data-pipeline
languages: all
---

## Overview

`mops-investee-holdings-debug` 是針對公發公司持股揭露查詢功能的系統化除錯流程。當使用者搜尋「某公司持有 A 公司股份」時，資訊可能在以下三層斷裂：

1. **資料層** — MV（materialized view）中的公司名稱正規化或資料未更新
2. **管線層** — migration 邏輯（如 `groupBy` 轉換）未正確處理特定公司名稱格式
3. **前端層** — 傳入的搜尋參數與 MV key 不匹配

本 skill 提供明確的排查順序與具體查詢指令，通常可在 5–10 分鐘內定位問題所在。

## 何時使用

- 使用者報告「公司 X 的持股找不到」，但該資料應該存在於系統
- 前端顯示「查無公發公司揭露持有此公司股份」，需驗證資料是否真的不在 MV
- MV 更新後持股結果仍未刷新，需檢查 refresh 流程或 groupBy 邏輯
- 特定公司名稱的持股查詢返回異常，懷疑是名稱正規化問題

## 執行步驟

### 第 1 步：確認 MV 中的資料存在

連接 `mops_investee` 資料庫，查詢 materialized view（通常名為 `investee_holdings_mv` 或類似）是否包含該公司名稱的記錄：

```sql
-- 列出 MV 中前 10 筆記錄（檢查結構）
SELECT * FROM investee_holdings_mv LIMIT 10;

-- 搜尋特定公司名稱（精確符合）
SELECT * FROM investee_holdings_mv 
WHERE company_name = '目標公司名稱';

-- 模糊搜尋（以防名稱有空格或符號差異）
SELECT * FROM investee_holdings_mv 
WHERE company_name ILIKE '%目標公司%';

-- 確認 MV 最近更新時間
SELECT last_refresh_time FROM materialized_views_log 
WHERE view_name = 'investee_holdings_mv' 
ORDER BY last_refresh_time DESC LIMIT 1;
```

**預期結果**：如果查詢返回空，表示資料確實未在 MV 中；如果有結果，進行第 2 步檢查 groupBy 邏輯。

### 第 2 步：檢查原始資料與 groupBy 轉換

MV 通常是基於 `mops_investee_raw` 表透過 migration（如 `c1f2e3d4a5b6_fix_mv_raw_name_groupby`）生成。檢查原始表中是否有該公司的記錄，以及 groupBy 邏輯是否正確：

```sql
-- 查詢原始表中該公司的所有記錄
SELECT company_name, UPPER(TRIM(company_name)) as normalized_key, 
       COUNT(*) as cnt FROM mops_investee_raw 
WHERE company_name ILIKE '%目標公司%' 
GROUP BY company_name, normalized_key;

-- 檢查 migration 後的轉換邏輯是否一致
-- 確認使用的 groupBy key（通常是 UPPER(TRIM(company_name)) 或自定義正規化函數）
SELECT * FROM mops_investee_raw 
WHERE UPPER(TRIM(company_name)) = UPPER(TRIM('目標公司名稱'));
```

**預期結果**：
- 若原始表有資料但 MV 沒有，表示 migration 或 refresh 過程出問題
- 若原始表也沒有，檢查資料來源是否該更新

### 第 3 步：驗證前端傳入的查詢參數

前端應用（通常在 `app.js` 或類似檔案）發送的 `company_name` 參數必須與 MV 中的 key 一致。檢查：

```javascript
// 在前端代碼中，驗證搜尋時的參數處理
// 1. 檢查搜尋框輸入是否被正規化（TRIM、UPPER）
const searchQuery = userInput.trim().toUpperCase();

// 2. 檢查 API 呼叫的參數
console.log('Sending company_name to API:', searchQuery);

// 或者在後端 API 日誌中確認收到的參數
```

同時檢查 `companies.py` 中的 API endpoint 實現：

```python
# 檢查 companies.py 中的 investee_holdings endpoint
# 該端點應該對傳入的 company_name 進行與 MV 一致的正規化

def get_investee_holdings(company_name):
    # 應該使用與 MV groupBy key 相同的正規化邏輯
    normalized_name = company_name.strip().upper()
    # 查詢 MV 時應使用 normalized_name
    result = db.query(f"""
        SELECT * FROM investee_holdings_mv 
        WHERE company_name = '{normalized_name}'
    """)
    return result
```

**預期結果**：前端發送的 `company_name` 必須在正規化後與 MV 中的 key 匹配（例如都使用 `UPPER(TRIM(...))`）。

### 第 4 步：驗證 API 端點回傳格式

調用 API 端點直接測試回傳結果，確認欄位名稱與前端期望的結構一致：

```bash
# 使用 curl 測試 API
curl -X GET "http://localhost:8001/api/companies/investee-holdings?company_name=目標公司名稱"

# 或在 Python 中直接測試
import requests
resp = requests.get(
    "http://localhost:8001/api/companies/investee-holdings",
    params={"company_name": "目標公司名稱"}
)
print(resp.json())
```

檢查 API 回傳的 JSON 結構：
- 是否有 `data` 或 `results` 欄位
- 是否包含 `shareholding_amount`、`holding_ratio` 等期望欄位
- 是否為空陣列 `[]` 或有具體記錄

**預期結果**：如果 API 返回空陣列，結合前面三步結果診斷原因；如果回傳結構不正確，檢查前端是否正確解析。

## 注意事項

1. **公司名稱正規化不一致是最常見原因**
   - MV 可能使用 `UPPER(TRIM(company_name))`，但前端發送原始使用者輸入
   - 確保整條鏈路使用相同的正規化邏輯（建議在 API endpoint 層統一處理）

2. **MV refresh 延遲**
   - 如果原始表更新了，MV 可能尚未刷新
   - 檢查 refresh 排程是否正常運作，或手動觸發刷新：
     ```sql
     REFRESH MATERIALIZED VIEW CONCURRENTLY investee_holdings_mv;
     ```

3. **migration 版本確認**
   - 確保所有環境（開發、測試、正式）都已套用最新的 migration（如 `c1f2e3d4a5b6_fix_mv_raw_name_groupby`）
   - 使用 `SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;` 檢查

4. **特殊字元與編碼**
   - 公司名稱若含有特殊字元（如 & 、括號、空格），正規化時務必一致處理
   - 測試時建議使用 SQL `LIKE` 與 `ILIKE` 進行模糊查詢，確認資料是否真的不存在

5. **API 端點 port 確認**
   - 本機環境中 dashboard API 運行在 port 8001（非 8000）
   - 確保測試 API 時使用正確的 port（參見 `~/PORTS.md`）

## 快速檢查清單

- [ ] SQL 查詢 MV，確認資料存在或不存在
- [ ] 原始表中搜尋該公司，檢查 groupBy 邏輯
- [ ] 檢查前端傳入的參數與 MV key 的正規化是否一致
- [ ] 測試 API 端點，確認回傳格式與內容
- [ ] 確認 MV 最近更新時間（是否超過預期）
- [ ] 驗證 migration 已在所有環境應用
- [ ] 檢查欄位名稱與前端期望一致