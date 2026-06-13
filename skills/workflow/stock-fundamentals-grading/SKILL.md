---
name: stock-fundamentals-grading
description: 將 MOPS 月營收、季財報原始資料計算成六大指標（營收成長性、營業利益率、稅後淨利年增率、累積 EPS、存貨周轉率、FCF），並依 rubric 給出 A/B/C 評等、Vue dashboard、PPTX 報告。TRIGGER when: 「六大指標」「股票基本面評等」「fundamentals grading」「月營收評分」「TEJ 風格評等」「FCF 排名」
when_to_use: 需要將原始 MOPS 月營收、季財報快照轉換成結構化的指標評分、生成儀表板視圖或 PowerPoint 報告供董事會/投資人審閱
version: 1.0.0
tags: [workflow, mops, financial-analysis, grading, dashboarding, reporting]
languages: all
---

## Overview

stock-fundamentals-grading 是位於 MOPS 資料取得與投資決策之間的關鍵處理層。既有的 `mops-financial-scraper` 專職抓取月營收、季財報原始快照，`investment-research` 負責 portfolio 決策；本 skill 填補中間的「計算指標→給評等→視覺化」缺口。

核心價值：
- **標準化指標計算**：六大指標（見下表）依據 GAAP / 國際通用定義計算，確保跨期、跨公司可比性
- **A/B/C 評分 rubric**：由 domain expert 編寫的分位數 rubric，將原始數值對映到評等
- **multimodal output**：支援 backfill 歷史資料、定期自動重算、Vue 儀表板展示、PPTX 報告生成
- **可延伸架構**：grading 演算法與視圖層解耦，支援新增指標、更新 rubric

### 六大指標定義

| 指標 | 計算式 | 資料源 | 作用 |
|------|--------|--------|------|
| 營收成長性 (YoY%) | (月營收 - 去年同月) / 去年同月 × 100 | MOPS monthly | 短期動能 |
| 營業利益率 (%) | 營業利益 / 營業收入 × 100 | Q季財報 | 營運效率 |
| 稅後淨利年增率 (%) | (稅後淨利 - 去年同期) / 去年同期 × 100 | Q季財報 | 獲利能力趨勢 |
| 累積 EPS (元) | 稅後淨利 / 流通在外股數 | Q季財報 + 股本結構 | 單位股東權益 |
| 存貨周轉率 (次) | 營業成本 / 平均存貨 | Q季財報 | 營運效率、過時風險 |
| FCF (百萬元) | 營運現金流 - 資本支出 | 現流表 | 真實現金產生力 |

### A/B/C 評等 Rubric

Rubric 依據樣本群體分位數校正（每季更新）：

- **A 級**：第 80 分位數以上（top 20%）
- **B 級**：第 50-80 分位數（中上 30%）
- **C 級**：第 50 分位數以下（bottom 50%）

各指標方向性：
- 營收成長性、營業利益率、稅後淨利年增率、累積 EPS、存貨周轉率、FCF：**高分為優** → 分位數升序
- 存貨周轉率低於產業中位數：降級提示（產業表查表）

---

## 何時使用

### 典型場景

1. **月營收發布後重算**（每月 3 日）
   - 新月營收納入，重新計算當年累積 EPS、YoY、FCF
   - 觸發儀表板自動刷新、email report 生成

2. **季財報發布後全量回填**（Q+45日）
   - 季財報公告→抓取利益表、現流表→重新計算所有六大指標
   - 通常涉及 3-6 個月歷史回填（前期快照未含完整數據）

3. **董事會/investor meeting 前報告生成**
   - 指定時點（e.g. 本月末）、指定公司清單、按 A/B/C 評等分層
   - 生成 PPTX：cover + 指標摘要表 + 散點圖（FCF vs 成長性）+ 分位數分佈圖

4. **portfolio 決策輔助**
   - 投資組合經理人查詢「最近 12M FCF 排名 top 20」或「評等從 C 升到 B 的公司」
   - 整合至儀表板側邊欄、支援篩選條件

---

## 執行步驟

### 前置條件

- 已執行 `mops-financial-scraper` 抓取月營收、季財報快照
- mops_dbs 叢集運行（見 `~/PORTS.md`）
- Python 環境已安裝：pandas, openpyxl, python-pptx, plotly

### 1. Backfill 歷史資料（首次執行）

```bash
cd ~/mops_dbs/grading-engine
./backfill_progress.sh --start-date 2024-01-01 --end-date 2025-12-31
```

- 掃描 mops_dbs 中所有月營收、季財報快照
- 依期間順序計算六大指標、套用分位數 rubric
- 結果寫入 `grading_results.db` 表 `fundamentals_grades`
- 進度輸出到 stdout + `backfill.log`

### 2. 定期自動重算（排程執行）

```bash
cd ~/mops_dbs/grading-engine
./auto_rerun_grading.sh
```

- Cron 入口：每月 5 日晨間 6 時、每季財報發布後手動觸發
- 邏輯：
  1. 掃描最新月營收、季財報時戳
  2. 與上次重算時戳對比→若更新，逐公司重新計算
  3. 分位數 rubric 自動從樣本群體（最近 12M）重新校正
  4. 更新儀表板快取、觸發 email 警告（若評等有升降）
- 可追蹤的進度記錄存於 `grading_state.json`

### 3. Vue 儀表板集成

在 `dashboard-next/src/components/` 中提供兩個元件：

**FundamentalsPanel.vue**
```vue
<FundamentalsPanel 
  :companyId="selectedCompany.id"
  :date="latestDate"
  :showHistoricalTrend="true"
/>
```
功能：
- 當前公司的六大指標 + 評等卡片（A/B/C 配色）
- 歷史 trend 迷你圖（最近 8 季）
- 分位數標記（自動刻度）

**SixIndicatorsView.vue**
```vue
<SixIndicatorsView 
  :filter="{ universe: 'TAIEX', sector: 'semiconductor' }"
  :sortBy="'fcf_rank'"
/>
```
功能：
- 散點圖：營收成長性 vs FCF（氣泡大小 = 市值）
- 評等分佈直方圖（A/B/C 堆積）
- 可篩選、可匯出為 CSV
- 點擊公司卡片進入 FundamentalsPanel 詳細檢視

### 4. PPTX 報告生成

```bash
python build_six_indicators_pptx.py \
  --companies semiconductor,finance \
  --date 2026-03-31 \
  --title "2026Q1 基本面評等報告" \
  --output report.pptx
```

指令參數：
- `--companies`：產業代碼或公司代碼清單（逗號分隔）
- `--date`：報告時點（格式 YYYY-MM-DD，預設今天）
- `--title`：報告封面標題
- `--include-forecast`：若帶此旗標，併入下季預測（基於過去 8 季線性迴歸）
- `--output`：輸出檔案名稱

報告結構：
1. 封面（標題、日期、產業別）
2. 指標說明表（定義、計算式、資料源）
3. 評等汇總表（公司清單 + 六大指標 + 總評 + 同期排名）
4. 散點圖：FCF 趨勢 vs 營收成長性（分公司、按評等著色）
5. 指標分佈圖：分位數直方圖（顯示樣本平均、中位、目標分位線）
6. 結論與建議（如有升降提示）

### 5. API 介面與查詢

若已部署 mops API (port 8001)：

```bash
# 查詢特定公司最新評等
curl http://localhost:8001/grading/company/2330/latest

# 查詢指定時點所有公司評等（JSON 陣列）
curl 'http://localhost:8001/grading/snapshot?date=2026-03-31&sector=semiconductor'

# 取得排名列表（按指定指標降序）
curl 'http://localhost:8001/grading/ranking?metric=fcf&limit=20&date=2026-03-31'
```

返回 JSON schema：
```json
{
  "company_id": 2330,
  "company_name": "TSMC",
  "date": "2026-03-31",
  "indicators": {
    "revenue_yoy": 8.5,
    "operating_margin": 42.1,
    "net_income_yoy": 12.3,
    "eps_cumulative": 18.50,
    "inventory_turnover": 2.8,
    "fcf_million": 450.2
  },
  "grades": {
    "revenue_yoy": "A",
    "operating_margin": "A",
    "net_income_yoy": "A",
    "eps_cumulative": "A",
    "inventory_turnover": "B",
    "fcf": "A"
  },
  "overall_grade": "A",
  "percentile_position": {
    "revenue_yoy": 0.92,
    "operating_margin": 0.88,
    "net_income_yoy": 0.91,
    "eps_cumulative": 0.85,
    "inventory_turnover": 0.72,
    "fcf": 0.89
  }
}
```

---

## 注意事項

### 資料完整性

- **月營收滯後**：上月營收通常於本月 3-10 日公告，automated 排程會自動偵測→無需手動觸發
- **季財報延遲**：Q 財報發布後常見回填調整，首次計算後 30 日內可能有 revision，建議搭配版本控制（時戳 + revision_id）
- **缺失數據處理**：若某公司該季尚無財報（新上市公司、未公開公司），指標標記為 `null`，評等欄位顯示 `--`（不含分位數計算）

### 分位數 Rubric 更新頻率

- 每月 1 日自動從過去 12M 樣本群體重新校正分位邊界
- 若月度樣本變動 >15%（新增/下市公司），會觸發 email 警告「rubric drifted」
- 可手動覆蓋 rubric 設定檔（`config/rubric_overrides.json`），用於特定產業或特定時期調整

### 產業別標籤化

- 存貨周轉率的評等需結合產業表查表（如 semiconductor > 2.5x 視為合理，而 retail > 6x 才算優異）
- `SixIndicatorsView` 儀表板自動標記產業背景色，趨勢比較時應按產業分組而非全市場排名
- 若涉及跨產業比較，建議在報告中加註「已按產業中位數調整」

### 已知限制

1. **EPS 計算基礎**：使用季財報公告的加權平均股數，不含每月實權股數波動；若公司當季有增資/股息發放，EPS 可能需手動調整
2. **FCF 定義**：採用「營運現金流 - capex」，不含債務償還、股息發放，適合成長階段評估；若需淨自由現金流（NFC），另需手動調整式
3. **季財報與月營收對齊**：三個月月營收累積 ≠ 季財報營業收入（往往偏低 2-3%，因為財報含其他營收），計算 YoY 時自動以季財報為準
4. **分位數邊界銳化**：A/B/C 三分點固定（80%, 50%），樣本群體小於 100 家時，邊界波動較大；建議樣本規模 >150 時才啟用 automated rubric 更新
5. **無貨幣轉換**：所有指標採用原幣（TWD），若涉及美股/港股，須手動轉換；FCF 單位為百萬元，NTD 預期自動轉換

### 故障排查

**症狀：「backfill_progress.sh」卡在某家公司**
- 常見原因：該公司季財報格式異常（合併報表含特殊備註）
- 解決：檢查 `backfill.log` 尾部→搜索公司代碼+年月→若為已知格式問題，可在 `config/data_quirks.json` 中加註 skip rule

**症狀：儀表板分位數標記不更新**
- 常見原因：cached rubric 未清除
- 解決：`rm -f /tmp/grading_rubric_cache.pkl` → 手動執行 `auto_rerun_grading.sh` 一次

**症狀：PPTX 報告圖表為空**
- 常見原因：指定的 `--date` 或 `--companies` 無對應資料
- 解決：先用 API 查詢 `/grading/snapshot?date=XXXX&sector=YYYY` 確認資料存在，再生成報告