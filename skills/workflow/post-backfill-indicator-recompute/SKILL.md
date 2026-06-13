---
name: post-backfill-indicator-recompute
description: 在 mops_db 補完 XBRL 財報資料後，對選股指標快照做資料完整度校正式的增量重算。觸發：補完資料後重新檢查指標、mops_db 補了 XBRL 要更新評級、增量刷新快照、只重算資料不足的公司、valid<6 重算、資料完整度校正。
version: 1.0.0
tags: [stock-grading, batch-refresh, incremental, mops-backfill]
languages: all
when_to_use: |
  當在 mops_db 補進一批先前缺漏的 XBRL 財報資料後，需要快速更新選股評級快照，但不想整批重跑所有公司的完整指標。
when: |
  - 使用者補完資料後重新檢查/重算指標
  - mops_db 補了 XBRL 要更新評級
  - 增量刷新快照
  - 只重算資料不足的公司
  - valid<6 重算
  - 資料完整度校正

---

## Overview

本 skill 針對**已補完資料後的選股指標快照更新**，提供「增量校正」而非「全量重跑」的方案。

背景：`stock-fundamentals-grading` 定義了「六大指標與評等如何計算」，`stock-data-gap-diagnose` 診斷「單股缺漏根因」；本 skill 則**聚焦於 XBRL 補資料後，如何只重算受影響子集（valid_count < 6 的公司），並產出 funnel 一致的新快照**。

**核心價值**：
- **只重算不足格公司**：已滿格（valid==6）公司直接沿用舊評級，無須重新計算
- **快照一致性**：新快照的結構、字段、排序與生產快照保持完全一致，前端可無縫切換
- **増量透明**：重算列的 `regressed` 欄位統一設為 `False`（資料補全，不算回退）
- **事後驗證**：內含分桶檢查，確保調整後的評級分布合理

適用於月度或季度資料補全場景，週期為「數分鐘」（不涉及整月重新下載 XBRL）。

---

## 何時使用

### 具體觸發場景

1. **月度 XBRL 遲到補進**：某月財報延遲發布，補進後需立即更新快照
   - 舊快照中有 `valid_count < 6` 的公司被新資料填滿
   - 需從 `候選區` 或 `風險區` 升級至 `標準區`

2. **季度財報大補單**：一次性補進多檔漏掉的季報
   - `universe=all` 中有批次 valid_count < 6 的公司需重評
   - 舊快照時間戳為上月，新快照應基於最新資料重算

3. **檢查資料補完效果**：補完後想驗證「缺漏問題是否真的解決」
   - 執行前置 `probe_datafill.py`，找出仍舊 valid < 6 的「頑固公司」
   - 決定是否還需補進更多子表或改補充邏輯

4. **月度迭代流程**（推薦自動化）：
   - 日期：月初後 5 個工作日（大多財報已補齊）
   - 流程：probe → incremental recompute → recheck → 發佈新快照

### 不適用場景

- ❌ 變更評級演算法本身（六大指標定義、權重、分值區間）→ 改用 `stock-fundamentals-grading` 重新建構
- ❌ 需要完整月對月趨勢對比 → 應調用全量 recompute（因本次聚焦「完整度校正」，regressed=False）
- ❌ 單個公司臨時查驗 → 改用 `stock-data-gap-diagnose` + 手動 SQL

---

## 執行步驟

### 前置：資料完整度探測

**目的**：確認有多少公司仍然 valid < 6，評估是否值得執行增量重算。

```bash
cd ~/mops_dbs/rev_webui/backend/scripts
python probe_datafill.py
```

**輸出示例**：
```
Universe: all (1247 companies)
Current IndicatorRun timestamp: 2026-05-10T12:34:56Z

Companies with valid_count < 6:
  valid=5: 12 companies (e.g., 2330.TW, 2454.TW)
  valid=4: 3 companies
  valid=3: 1 company
  valid=0: 0 companies

Total need recompute: 16 companies
Estimated runtime: ~45 seconds (parallel batch)
```

**決策點**：
- 若 `< 10 companies`：進行增量重算
- 若 `> 100 companies`：考慮數據補進是否完整，或改用全量重跑

---

### 第一步：取得最新快照基線

```bash
cd ~/mops_dbs/rev_webui/backend

# 獲取 universe=all 的最新 IndicatorRun 與全部 IndicatorScore
python -c "
from api.indicators import get_latest_snapshot
snapshot = get_latest_snapshot(universe='all')
print(f'IndicatorRun ID: {snapshot[\"run_id\"]}')
print(f'Total companies: {len(snapshot[\"scores\"])}')
print(f'Timestamp: {snapshot[\"timestamp\"]}')
"
```

### 第二步：執行增量重算

**核心指令**（已內建所有邏輯）：

```bash
python scripts/refresh_indicators_incremental.py \
  --universe all \
  --threshold 6 \
  --parallel-workers 8 \
  --output-format snapshot \
  --regressed-flag false
```

**參數說明**：
- `--universe all`：針對全量公司集合（預設值）
- `--threshold 6`：只重算 valid_count < 6 的公司（內部邏輯）
- `--parallel-workers 8`：平行度（預設 CPU 核心數，8 核機器推薦 8）
- `--output-format snapshot`：輸出完整快照（包含所有字段、排序、funnel）
- `--regressed-flag false`：所有重算列 regressed=False（資料補全不算回退）

**執行時間**：
- 若 valid<6 公司 < 20：~30 秒
- 若 valid<6 公司 20–100：~1.5 分鐘

**輸出位置**：
```
~/mops_dbs/rev_webui/backend/snapshots/
  ├─ indicator_snapshot_incremental_2026-06-13T14-32-10Z.jsonl
  └─ indicator_snapshot_incremental_2026-06-13T14-32-10Z.metadata.json
```

### 第三步：驗證快照一致性

腳本內建自檢，會列出：
```
✓ Schema validation: PASS
✓ Funnel consistency: PASS (900 in "標準區", 280 in "候選區", 67 in "風險區")
✓ Timestamp freshness: PASS (age: 2 minutes)
✓ Recomputed companies: 16 (all regressed=False)
✓ Unchanged companies: 1231 (preserved from previous snapshot)
```

若任何項目 FAIL，腳本會回報具體行數與字段，**不會寫入快照**。

### 第四步：分桶驗證（可選深度檢查）

針對重算的 16 家公司，檢查評級變化是否合理：

```bash
python scripts/recheck_buckets.py \
  --snapshot snapshots/indicator_snapshot_incremental_2026-06-13T14-32-10Z.jsonl \
  --previous snapshots/indicator_snapshot_2026-06-10T08-00-00Z.jsonl \
  --threshold 6
```

**輸出示例**：
```
Recomputed companies & bucket changes:
  2330.TW:  候選區 → 標準區  (score: 72 → 76)  ✓ valid: 5→6
  2454.TW:  風險區 → 候選區  (score: 45 → 58)  ✓ valid: 4→6
  ...
  
Summary:
  Upgrades: 14 (標準區 +8, 候選區 +6)
  Downgrades: 2 (候選區 → 風險區, 原因：新增負債資料拉低)
  No change: 0
  
Alert: 2454.TW shows downgrade despite data_fill — suggest data audit
```

**檢查重點**：
- ✓ 升級多於降級（資料補全應總體改善）
- ✓ 無新增無根據的大幅波動（> 15 分 points）
- ⚠️ 若出現反直覺的降級，回查原始公司財報、檢查補進數據是否異常

### 第五步：發佈新快照（前端自動取用）

新快照可直接放入生產目錄供前端查詢：

```bash
cp snapshots/indicator_snapshot_incremental_2026-06-13T14-32-10Z.* \
   snapshots/latest/
   
# 或：自動切 symlink
ln -sf indicator_snapshot_incremental_2026-06-13T14-32-10Z.jsonl \
       snapshots/indicator_snapshot_latest.jsonl
```

前端無需改動任何查詢邏輯，自動使用最新快照。

---

## 注意事項

### 已知限制

1. **regressed 欄位固定為 False**
   - 本次增量重算專門用於「資料完整度校正」，不涉及月對月對比
   - 若要做「本月 vs 上月」的回退偵測，應使用全量 recompute + 月度對比邏輯
   - 前端展示「本月迴歸」時應從另一個全量快照中讀取

2. **不處理「刪除已有評級」的場景**
   - 若某公司原本 valid=6、新資料發現某項有誤需刪除，本腳本不會自動降級
   - 應明確使用 `--force-recompute <company_id>` 或改用全量重跑

3. **並行度上限**
   - 單次最多 16 個 worker（OS 檔案句柄限制）
   - 若機器資源緊張（< 4 核），改用 `--parallel-workers 2`

4. **快照備份**
   - 舊快照自動保留 30 天，之後清理
   - 若需長期保留某個快照版本，手動複製至 `archive/` 目錄

### 陷阱與排查

**陷阱 1：新資料補進但 valid 仍未增加**
```bash
# 原因：score_company 邏輯可能需要多個必填字段同時存在
# 檢查方法
python -c "
from api.indicators import debug_company
debug_company('2330.TW')  
# 會列出所有 6 個指標的資料來源與缺漏狀態
"
```

**陷阱 2：重算後某公司評級大幅波動**
```bash
# 原因：補進資料中有異常值（e.g., 負數營收、極高負債率）
# 檢查方法
python scripts/audit_company_metrics.py 2330.TW 2026-06
# 列出該月該公司的原始財務數據與計算過程
```

**陷阱 3：前端仍顯示舊快照**
```bash
# 原因：快照檔名變更或前端快取未清理
# 解決方法
1. 確認新快照確實在 snapshots/latest/ 目錄
2. 前端 Chrome DevTools 清理 IndexedDB / LocalStorage
3. 確認 API endpoint 指向 latest symlink（非硬編碼路徑）
```

### 效能考量

| 場景 | 重算公司數 | 預期時間 | CPU / RAM |
|-----|---------|--------|---------|
| 小補進（< 5 家） | < 5 | 15 秒 | 2–3 核 / 512 MB |
| 月度常規補進 | 10–30 | 45 秒 | 4–6 核 / 1 GB |
| 季度大補單 | 50–100 | 2–3 分鐘 | 8 核 / 2 GB |
| 完整重跑（全 1247 家） | 1247 | 8–10 分鐘 | 16 核 / 4 GB |

---

## 參考資源

- **腳本路徑**：`~/mops_dbs/rev_webui/backend/scripts/refresh_indicators_incremental.py`
- **相關 skill**：
  - `stock-fundamentals-grading`（六大指標定義）
  - `stock-data-gap-diagnose`（單股缺漏診斷）
- **前端快照查詢**：`/api/indicators/snapshot?universe=all&latest=true`
- **監控看板**：Grafana `stock-grading-pipeline`（重算耗時、公司處理進度）