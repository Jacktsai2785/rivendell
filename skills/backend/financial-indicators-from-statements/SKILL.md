---
name: 2-financial-indicators-from-statements
description: |
  計算上市公司「6 大基本面指標」（營收成長、營業利益率、稅後淨利 YoY、累積 EPS、存貨周轉率、FCF）的公式與 SQL/Python 實作。
  
  TRIGGER when: 「6 大指標」、「基本面評分」、「fundamentals grading」、「自己算 ROE/EPS」、「從月報算年化指標」

version: 1.0.0
tags: [financial-analysis, fundamentals, quarterly-reporting, mops-ecosystem, backend]
languages: all
---

## Overview

財報分析中，「基本面評分」通常從原始的月/季財報數據（MOPS 三表：損益表、資產負債表、現金流量表）計算 6 大核心指標。本 skill 提供：

1. **各指標的業界標準定義與計算公式**
2. **從 MOPS 資料庫提取相關科目的 SQL 邏輯**
3. **Python 層的計算與驗證流程**
4. **指標之間的依賴關係與聚合邏輯**

這些指標是投資研究、credit risk assessment、以及自動化評分系統的基礎層，是 `mops-financial-scraper`（抓原始數據）與 `investment-research`（策略分析）之間的橋樑。

---

## 何時使用

- 使用者要求「算一下 EPS」或「這季營業利益率多少」—— 需要公式 + 從 MOPS 三表提取
- 「對比 4 季累積指標」或「年化月報數據」—— 涉及多季合併、季度對齐
- 「建立基本面評分模型」—— 需要這 6 項作為輸入特徵
- 「驗證財報健全性」—— 透過計算指標檢查數據一致性（如 FCF > 0 but 虧損？）

---

## 6 大指標定義與計算

### 1. 營收成長性（Revenue Growth）

**定義**：
- QoQ（季度環比）：`(Q_n 營收 - Q_{n-1} 營收) / Q_{n-1} 營收`
- YoY（年度同比）：`(Q_n 營收 - Q_{n-4} 營收) / Q_{n-4} 營收`

**SQL 提取**（以 MOPS 資料庫為例）：
```
SELECT 
  company_id, 
  year, 
  quarter,
  revenue,
  LAG(revenue, 1) OVER (PARTITION BY company_id ORDER BY year, quarter) AS prev_q_revenue,
  LAG(revenue, 4) OVER (PARTITION BY company_id ORDER BY year, quarter) AS prev_y_revenue
FROM quarterly_income_statement
WHERE report_type = 'consolidated'
```

**Python 計算**：
```python
def revenue_growth(df):
  df['qoq_growth'] = (df['revenue'] - df['prev_q_revenue']) / df['prev_q_revenue']
  df['yoy_growth'] = (df['revenue'] - df['prev_y_revenue']) / df['prev_y_revenue']
  return df
```

---

### 2. 營業利益率（Operating Margin）

**定義**：`營業利益 / 營收`（通常用合併報表）

**科目對應**（MOPS 損益表）：
- 分子：Operating Income（營業利益）= 營收 − 營業成本 − 營業費用
- 分母：Revenue（營收）

**注意**：MOPS 資料庫中科目名稱因財報制度年份異化；需檢查 `statement_account_code` 對應表。

**Python 實作**：
```python
def operating_margin(df):
  df['operating_margin'] = df['operating_income'] / df['revenue']
  return df[df['revenue'] != 0]
```

---

### 3. 稅後淨利 YoY（Net Income Year-over-Year Growth）

**定義**：`(淨利潤_季度 - 淨利潤_前年同季) / 淨利潤_前年同季`

**SQL 邏輯**：
```
SELECT 
  company_id, year, quarter,
  net_income,
  LAG(net_income, 4) OVER (PARTITION BY company_id ORDER BY year, quarter) AS net_income_yoy
FROM quarterly_income_statement
WHERE report_type = 'consolidated'
```

**邊界條件**：
- 分母為 0（前年虧損）→ 記為 NULL 或標記為 undefined
- 本期淨利轉正，前年虧損 → 記為「扭虧為盈」而非百分比

---

### 4. 累積 EPS（Trailing Twelve-Month EPS）

**定義**：`過去 4 季合計淨利潤 / 期末普通股股數`

**計算步驟**：
1. 確認 Q_n, Q_{n-1}, Q_{n-2}, Q_{n-3} 是否完整（不跨年度邊界倒推）
2. 累積淨利 = sum of 4 quarters' net income
3. 股數取該季末數據

**SQL 實作**：
```
SELECT 
  company_id, year, quarter,
  SUM(net_income) OVER (
    PARTITION BY company_id 
    ORDER BY year, quarter 
    ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
  ) AS ttm_net_income,
  shares_outstanding,
  SUM(net_income) OVER (...) / shares_outstanding AS ttm_eps
FROM quarterly_income_statement
JOIN quarterly_balance_sheet USING (company_id, year, quarter)
WHERE report_type = 'consolidated'
```

**注意事項**：
- 若跨年（e.g., 2025 Q1 往回推到 2024 Q2），需驗證兩年財報制度一致性
- 股數調整（配股、減資）需拉歷史序列驗證

---

### 5. 存貨周轉率（Inventory Turnover）

**定義**：`銷貨成本 / 平均存貨`

- 分子：Cost of Goods Sold（COGS）來自損益表
- 分母：(期初存貨 + 期末存貨) / 2

**SQL**：
```
SELECT 
  company_id, year, quarter,
  cogs,
  inventory,
  LAG(inventory, 1) OVER (PARTITION BY company_id ORDER BY year, quarter) AS prev_inventory,
  cogs / ((inventory + LAG(inventory, 1) OVER (...)) / 2.0) AS inventory_turnover
FROM quarterly_income_statement qis
JOIN quarterly_balance_sheet qbs USING (company_id, year, quarter)
```

**年化轉換**（月報升年化）：
```
annual_turnover = monthly_cogs * 12 / avg_inventory
```

---

### 6. 自由現金流（Free Cash Flow, FCF）

**定義**：`營業現金流 − 資本支出`

**科目對應**（現金流量表）：
- 營業現金流：Cash Flow from Operations（CFO）
- 資本支出：Capital Expenditure（取購置固定資產支出）

**SQL**：
```
SELECT 
  company_id, year, quarter,
  operating_cash_flow,
  capital_expenditure,
  operating_cash_flow - capital_expenditure AS fcf
FROM quarterly_cash_flow_statement
WHERE report_type = 'consolidated'
```

**Python 驗證**：
```python
def validate_fcf(df):
  # FCF 可為負（成長投資期），但應檢查趨勢
  df['fcf'] = df['operating_cf'] - df['capex']
  # 若營業 CF 為負，通常表示核心業務困難
  df['cf_concern'] = df['operating_cf'] < 0
  return df
```

---

## 聚合與驗證流程

### 多季合併邏輯

```python
def aggregate_trailing_metrics(company_id, latest_quarter):
  """
  取最近 4 季的指標，生成年化視圖
  """
  quarters = get_last_4_quarters(company_id, latest_quarter)
  
  data = query_financials(company_id, quarters)
  
  # 累積淨利 & TTM EPS
  ttm_net_income = data['net_income'].sum()
  ttm_eps = ttm_net_income / data.iloc[-1]['shares_outstanding']
  
  # 累積營收成長
  revenue_4q = data['revenue'].sum()
  revenue_4q_prior = get_prior_year_revenue(company_id, quarters[0])
  revenue_growth_annual = (revenue_4q - revenue_4q_prior) / revenue_4q_prior
  
  # 平均營業利益率（簡化：取最新季）
  latest_op_margin = data.iloc[-1]['operating_margin']
  
  # 累積 FCF
  fcf_4q = data['fcf'].sum()
  
  return {
    'ttm_eps': ttm_eps,
    'revenue_growth_annual': revenue_growth_annual,
    'op_margin': latest_op_margin,
    'fcf_4q': fcf_4q,
    'period': f"{quarters[0]} to {quarters[-1]}"
  }
```

### 數據品質檢查

```python
def validate_statement_consistency(company_id, year, quarter):
  """
  簡易財報勾稽檢查
  """
  bs = get_balance_sheet(company_id, year, quarter)
  is_ = get_income_statement(company_id, year, quarter)
  cf = get_cash_flow(company_id, year, quarter)
  
  checks = {
    'assets_eq_liab_equity': abs(bs['assets'] - (bs['liabilities'] + bs['equity'])) < 1,
    'net_income_to_cf': cf['net_income_per_cf'] <= 1.5,  # 合理的盈餘品質
    'cogs_le_revenue': is_['cogs'] <= is_['revenue'],
  }
  
  return checks
```

---

## 注意事項

### 資料完整性
- **科目對應異化**：MOPS 資料庫涵蓋多年制（民國、西元、IFRSs 導入前後），科目代碼與名稱會變。需要維護對應表或使用 `statement_account_mapping` 系統表。
- **併購/轉投資**：單季併購或股權轉移會扭曲成長率，需在計算前標記異常期。

### 季度邊界
- **月報升年化**：4 個月報數據合計 ≠ 該季財報（月報通常未審、調整不同）。若用月報計算年化指標，需註明「估計值」。
- **跨年倒推**：2025 Q1 往回推 4 季需觸及 2024 數據；若兩年財報制度不同（e.g., 民國→西元切換），需特別處理。

### 股數與配股
- TTM EPS 計算用期末股數，但若該年有配股，歷史季度的盈利應調整為「配後基數」進行比較。

### 零值與異常
- 營業利益為 0 時，margin 計算結果為 0（合理）。
- COGS 為 0 的產業（軟體、服務）：存貨周轉率無意義，應跳過或標記為 N/A。
- FCF 為負不一定代表企業困難（成長投資期常見），但應檢查趨勢。

---

## 與其他 Skills 的銜接

- **上游**：`mops-financial-scraper` 負責抓原始三表，落地至 MOPS DB；本 skill 直接查詢
- **下游**：`investment-research` 使用這 6 項指標作為輸入特徵，進行策略評分或警示
- **平行**：其他 skill（如 `tw-company-lookup`）可用本 skill 的計算結果豐富企業卡片資訊

---

## 快速參考：SQL 樣板

### 一鍵生成最新季 6 大指標

```
WITH latest_quarter AS (
  SELECT company_id, MAX(CONCAT(year, quarter)) AS latest FROM quarterly_income_statement 
  GROUP BY company_id
),
metrics AS (
  SELECT 
    company_id,
    year, quarter,
    revenue,
    LAG(revenue, 4) OVER (PARTITION BY company_id ORDER BY year, quarter) AS rev_prior_y,
    operating_income,
    net_income,
    SUM(net_income) OVER (PARTITION BY company_id ORDER BY year, quarter ROWS BETWEEN 3 PRECEDING AND CURRENT ROW) AS ttm_ni,
    cogs,
    operating_cash_flow,
    capital_expenditure,
    shares_outstanding,
    inventory
  FROM quarterly_income_statement qis
  JOIN quarterly_balance_sheet qbs USING (company_id, year, quarter)
  JOIN quarterly_cash_flow_statement qcf USING (company_id, year, quarter)
  WHERE report_type = 'consolidated'
)
SELECT 
  company_id, year, quarter,
  (revenue - rev_prior_y) / rev_prior_y AS revenue_growth_yoy,
  operating_income / revenue AS op_margin,
  ttm_ni / shares_outstanding AS ttm_eps,
  cogs / ((inventory + LAG(inventory) OVER (PARTITION BY company_id ORDER BY year, quarter)) / 2.0) AS inventory_turnover,
  operating_cash_flow - capital_expenditure AS fcf
FROM metrics
WHERE CONCAT(year, quarter) = (SELECT latest FROM latest_quarter WHERE latest_quarter.company_id = metrics.company_id)
```

