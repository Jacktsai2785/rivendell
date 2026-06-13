---
name: stock-data-gap-diagnose
description: "Diagnose and resolve 'data insufficient' messages for individual stocks on the selection frontend. TRIGGER when: user reports a stock showing incomplete data, or frontend displays data-unavailable state for a specific ticker."
trigger: "when user encounters 'data insufficient' or missing data for a specific stock ticker on the frontend"
when_to_use: 
  - 選股前端某檔股票顯示「資料不足」或「無法載入」
  - 使用者回報特定股票的財報、月營收或股價資料明顯不完整
  - 定期驗證資料完整性時發現特定代碼的資料缺口
  - 新版爬蟲或 API 部署後發現某些代碼資料異常
  - 分析為何過去正常的資料現在顯示不足
version: "1.0.0"
tags: 
  - stock-data
  - debugging
  - data-quality
  - mops
languages: all
---

## Overview

台灣選股系統中，前端有時會因資料缺失而顯示「資料不足」的訊息。與其盲目重撈全部資料，本 skill 提供系統化的診斷流程，快速定位根因並對症下藥。

根因可能包括：
- 特定資料維度（財報、月營收、股價等）的爬蟲失敗或遲延
- 資料庫轉換/ETL 步驟缺漏或產生錯誤
- API 回應格式變更導致解析失敗
- 前端查詢時間窗口設定不當
- 特定股票代碼的處理邏輯有缺陷

透過以下診斷步驟，可以在 5–15 分鐘內識別問題並決定修復策略（重爬、修復轉換邏輯、或補充缺失資料）。

## 何時使用

- **前端報警**：選股前端某檔股票顯示「資料不足」或「無法載入」
- **使用者反饋**：使用者回報特定股票的財報、月營收或股價資料明顯不完整
- **品質檢查**：定期驗證資料完整性時發現特定代碼的資料缺口
- **部署後檢驗**：新版爬蟲或 API 部署後，發現某些代碼的資料異常
- **回溯分析**：分析為何過去正常的資料現在顯示不足

## 執行步驟

### 1. 確認資料缺口的具體維度

首先辨識缺失的是哪一類資料：

```bash
# 登入 MOPS 前端，開發者工具 (F12) → Network，查看是否有錯誤的 API 呼叫
# 記下：
# - 股票代碼（e.g., 2330）
# - 缺失的資料類型：financial_report | monthly_revenue | stock_price | company_info
# - 錯誤訊息的具體內容
```

可能的資料維度：
- `financial_report`：財務報表（損益、資產負債、現金流）
- `monthly_revenue`：月營收（每月營收、營業費用等）
- `stock_price`：股價歷史（日線、週線、月線）
- `company_info`：公司基本資料（成立日、產業等）
- `analyst_consensus`：分析師共識、目標價

### 2. 檢查資料庫中該維度的資料覆蓋

```bash
cd ~/mops_dbs

# 查閱 REGISTRY 確認該維度對應的 DB
cat ~/.claude/databases/REGISTRY.md

# 範例：查財報覆蓋範圍
sqlite3 mops_financial_report.db << 'EOF'
SELECT symbol, COUNT(*) as report_count, MAX(report_date) as latest_report
FROM financial_reports
WHERE symbol = '2330'
GROUP BY symbol;
EOF

# 範例：查月營收覆蓋範圍
sqlite3 mops_monthly_revenue.db << 'EOF'
SELECT symbol, COUNT(*) as revenue_count, MAX(revenue_month) as latest_month
FROM monthly_revenues
WHERE symbol = '2330'
GROUP BY symbol;
EOF
```

**預期結果**：
- 如果資料為空或只有舊資料，問題在爬蟲/API 層
- 如果資料完整但前端顯示不足，問題在 API 轉換或前端邏輯

### 3. 檢查爬蟲的最近執行狀態

```bash
# 查中央排程器的日誌
cd ~/mops_dbs
ls -lah logs/

# 檢查特定資料維度的最近爬蟲執行
tail -100 logs/scraper_financial_report.log | grep -A5 "2330\|ERROR\|FAILED"
tail -100 logs/scraper_monthly_revenue.log | grep -A5 "2330\|ERROR\|FAILED"

# 查排程設定是否正常
cat .env | grep SCRAPER_SCHEDULE
```

**常見根因**：
- 爬蟲在特定日期失敗（如月初的月營收爬蟲未執行）
- API 呼叫被限流或拒絕
- 解析邏輯因網頁結構變動而失敗

### 4. 手動驗證資料來源

根據資料維度，檢查上游資料來源是否仍可用：

#### 財報資料（TSE / 公開資訊觀測站）

```bash
# 嘗試直接查詢公開資訊觀測站 API
curl -s "https://mops.twse.com.tw/mops/web/api_2/get_financial_report?symbol=2330&year=2024&season=1" \
  | jq .

# 或使用 MOPS 內建的 API 層
cd ~/mops_dbs/mops-core
curl -s "http://localhost:8080/api/financial-report?symbol=2330&limit=10" | jq .
```

#### 月營收資料（TSE 月營收網頁）

```bash
# 檢查 TSE 月營收頁面是否可達
curl -s "https://mops.twse.com.tw/mops/web/t21sc03_q1" \
  -H "User-Agent: Mozilla/5.0" | grep -q "2330" && echo "TSE月營收頁可達" || echo "無法存取"
```

#### 股價資料（Yahoo Finance / Twstock）

```bash
# 檢查 Yahoo Finance API
curl -s "https://query1.finance.yahoo.com/v8/finance/chart/2330.TW?interval=1d&range=1mo" | jq '.chart.result[0].timestamp' | head -5
```

### 5. 判定根因並決定修復策略

根據上述檢查的結果，判定屬於以下哪一類：

| 根因 | 檢查方法 | 修復策略 |
|------|--------|--------|
| **爬蟲未執行** | logs 中無最近記錄 | 手動觸發爬蟲；檢查 cron 設定 |
| **API 被限流/拒絕** | logs 中有 429/403 error | 調整請求速率；檢查 API key 有效期 |
| **上游格式變動** | API 回應無預期欄位 | 更新解析邏輯；測試後部署新版爬蟲 |
| **資料庫轉換失敗** | raw data 存在但 processed table 為空 | 檢查 ETL 邏輯；重新執行轉換 |
| **特定股票黑名單** | logs 中明確記錄該代碼被跳過 | 檢查黑名單規則；移除不當項目 |
| **前端查詢邏輯錯誤** | DB 有資料但 API 回應無 | 檢查前端 API 呼叫的時間篩選條件 |

### 6. 執行修復

#### 6a. 重新觸發爬蟲（針對單檔股票）

```bash
cd ~/mops_dbs

# 觸發財報爬蟲（限定特定股票）
python scripts/scrape_financial_report.py --symbol 2330 --force

# 觸發月營收爬蟲
python scripts/scrape_monthly_revenue.py --symbol 2330 --force

# 觸發股價爬蟲
python scripts/scrape_stock_price.py --symbol 2330 --days 365 --force
```

#### 6b. 驗證修復結果

```bash
# 爬蟲完成後，重新查詢 DB
sqlite3 mops_financial_report.db "SELECT * FROM financial_reports WHERE symbol='2330' ORDER BY report_date DESC LIMIT 3;"

# 測試 API 層是否已反映新資料
curl -s "http://localhost:8080/api/financial-report?symbol=2330&limit=3" | jq .

# 在前端重新載入該股票頁面，確認「資料不足」訊息消失
```

#### 6c. 如為格式變動，更新解析邏輯

```bash
cd ~/mops_dbs/mops-core

# 檢查解析邏輯
git log --oneline parsers/ | head -20

# 修改解析器後，執行單元測試
pytest tests/test_parsers.py::TestFinancialReportParser -v

# 部署新版本
git add .
git commit -m "fix(parser): adapt to TSE financial report format change for stock [代碼]"
git push
```

### 7. 記錄根因分析與防範措施

```bash
# 在案例記錄中備註
cat >> ~/mops_dbs/INCIDENT_LOG.md << 'EOF'
## 2026-06-13 Stock 2330 Data Gap

**症狀**：前端顯示 2330 財報資料不足  
**根因**：2026-06-10 月營收爬蟲因 API 限流失敗  
**修復**：調整請求頻率，重新觸發爬蟲，1 小時內恢復  
**防範**：增加爬蟲重試機制，API 限流時自動回退至上次成功的資料

EOF
```

## 注意事項

**權限檢查**：使用資料庫的 API 層而非直連，避免繞過認證邏輯。需要直連時，使用 `~/.mops_dbs_credentials` 中的只讀帳號。

**批量重撈的成本**：單個股票的重撈通常需時 10–60 秒，務必先確認是該股票而非系統級問題。若懷疑是系統級問題，先在 5–10 檔股票上驗證再決定是否全量重撈。

**時間窗口陷阱**：月營收資料通常在月底後 10 天才完整發佈；年財報通常在年底後 3–4 個月才發佈。若查詢的時間範圍未達預期，不代表爬蟲失敗，而是上游資料本身未就緒。

**前端快取**：前端可能快取舊資料。若修復後前端仍顯示不足，嘗試硬刷新（Ctrl+Shift+R）或清除 LocalStorage。

**並行爬蟲衝突**：同時重撈多檔股票時，注意資料庫鎖定。若 SQLite 被鎖，檢查是否有其他爬蟲進程仍在執行（`ps aux | grep scrape`），必要時先停止其他進程再重新開始。

**資料一致性**：某些維度的資料間存在時間依賴（如月營收→年財報推算）。若只修復了其中一個維度，其他依賴它的維度可能仍顯示不足。診斷時需留意跨維度的銜接。