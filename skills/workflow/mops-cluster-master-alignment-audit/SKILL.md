---
name: mops-cluster-master-alignment-audit
description: >
  稽核 mops 叢集下游 DB（mops_rev/pl/bs/cf/notes/price）與上游 mops_master 的公司名單對齊狀態及排程拓樸。
  TRIGGER when: 「所有 db 名單跟 mops_master 對齊」「檢查 rev/pl/bs/cf/notes/price 是否對標 master」「檢查 schedule 順序對不對」「master 是不是最先跑」「下游 db 漏抓」
when_to_use: |
  - 定期全盤檢查跨庫一致性（每月或版本發布前）
  - 發現某下游 DB 缺少部分公司或包含冗餘資料
  - 懷疑排程順序導致下游讀到陳舊 master 資料
  - 新增下游 DB 後需驗證納入排程順序
version: 1.0.0
tags:
  - mops
  - data-integrity
  - scheduling
  - audit
languages: all
---

## Overview

本 skill 對帳 mops 叢集的拓樸一致性：
1. **公司名單層面**——驗證 mops_master（權威來源）的完整公司名單是否在各下游 DB（mops_rev、pl、bs、cf、notes、price）中完整對映，標記缺漏（backfill）與冗餘（待清）
2. **排程拓樸層面**——驗證 mops_master 每晚最先執行，所有下游 consumer 排序都在 master 之後，避免下游讀到當日未更新的過期資料

本 skill 特別針對跨 6 個下游 DB 的漏抓場景，以及排程順序寫死導致假 outage 的風險（如歷史教訓 `dashboard-api-port-8001`），提供系統化的驗證與修復路徑。

## 何時使用

- **定期稽核**：每月或新上線功能前進行全盤檢查
- **緊急診斷**：某下游 DB 資料異常（缺少公司、計算結果偏差）
- **排程維護**：編輯排程設置後驗證依賴順序的正確性
- **版本發布**：新增下游 DB 或修改 master 納入邏輯前確認一致性

## 執行步驟

### 1. 讀取 mops_master 的權威公司名單

```bash
# 進入 mops_dbs 專案根目錄
cd ~/mops_dbs

# 查看 master DB 的結構與公司名單
sqlite3 data/mops_master.db "SELECT company_id, company_name, listing_status FROM companies ORDER BY company_id;" | head -20

# 計算 master 的總公司數
sqlite3 data/mops_master.db "SELECT COUNT(*) as total FROM companies;" 
```

### 2. 逐一掃描下游 DB 的公司覆蓋率

執行以下指令組合，針對 6 個下游 DB（mops_rev、pl、bs、cf、notes、price）：

```bash
# 定義下游 DB 清單
DOWNSTREAM_DBS=("mops_rev" "pl" "bs" "cf" "notes" "price")

# 對每個下游 DB，計算公司數並比對 master
for db in "${DOWNSTREAM_DBS[@]}"; do
  echo "=== $db ==="
  TOTAL=$(sqlite3 data/${db}.db "SELECT COUNT(DISTINCT company_id) FROM revenue;" 2>/dev/null)
  if [ -z "$TOTAL" ]; then
    TOTAL=$(sqlite3 data/${db}.db "SELECT COUNT(DISTINCT company_id) FROM statement;" 2>/dev/null)
  fi
  echo "公司數: $TOTAL"
  
  # 列出 master 有但該 DB 缺少的公司（backfill 候選）
  sqlite3 data/mops_master.db data/${db}.db "
    SELECT m.company_id, m.company_name 
    FROM companies m 
    LEFT JOIN (SELECT DISTINCT company_id FROM revenue) d ON m.company_id = d.company_id
    WHERE d.company_id IS NULL
    LIMIT 5;" 2>/dev/null
done
```

### 3. 生成完整對帳表

使用以下 Python 指令碼遍歷所有下游 DB 並生成對帳表：

```bash
cd ~/mops_dbs

cat > /tmp/audit_alignment.py << 'PYEOF'
import sqlite3
import json
from pathlib import Path

master_db = sqlite3.connect("data/mops_master.db")
master_cursor = master_db.cursor()

# 讀取 master 的公司名單（權威來源）
master_cursor.execute("SELECT company_id FROM companies")
master_companies = set(row[0] for row in master_cursor.fetchall())

downstream_dbs = ["mops_rev", "pl", "bs", "cf", "notes", "price"]
audit_results = {}

for db_name in downstream_dbs:
    db_path = f"data/{db_name}.db"
    if not Path(db_path).exists():
        audit_results[db_name] = {"status": "missing", "total": 0}
        continue
    
    db = sqlite3.connect(db_path)
    cursor = db.cursor()
    
    # 查詢該 DB 的公司名單（假設存在 revenue 或 statement 表）
    try:
        cursor.execute("SELECT DISTINCT company_id FROM revenue")
        db_companies = set(row[0] for row in cursor.fetchall())
    except:
        try:
            cursor.execute("SELECT DISTINCT company_id FROM statement")
            db_companies = set(row[0] for row in cursor.fetchall())
        except:
            db_companies = set()
    
    missing = master_companies - db_companies
    extra = db_companies - master_companies
    aligned = db_companies & master_companies
    
    audit_results[db_name] = {
        "status": "aligned" if not missing and not extra else "misaligned",
        "total": len(db_companies),
        "aligned_count": len(aligned),
        "missing_count": len(missing),
        "extra_count": len(extra),
        "missing_ids": sorted(list(missing))[:10],
        "extra_ids": sorted(list(extra))[:10]
    }
    
    db.close()

# 打印結果
print("\n=== MOPS Cluster Alignment Audit ===\n")
for db_name, result in audit_results.items():
    print(f"DB: {db_name}")
    print(f"  Status: {result['status']}")
    print(f"  Total: {result['total']} | Aligned: {result['aligned_count']} | Missing: {result['missing_count']} | Extra: {result['extra_count']}")
    if result['missing_ids']:
        print(f"  Backfill candidates (first 10): {result['missing_ids']}")
    if result['extra_ids']:
        print(f"  Cleanup candidates (first 10): {result['extra_ids']}")
    print()

master_db.close()
PYEOF

python /tmp/audit_alignment.py
```

### 4. 驗證排程拓樸與執行順序

檢查 mops_dbs 專案的排程器配置（若使用 systemd 或 cron）：

```bash
# 查看 systemd 排程（若已部署）
systemctl list-timers | grep mops

# 或查看中央排程設定檔
cat ~/mops_dbs/.env | grep -i schedule
cat ~/mops_dbs/scheduler/config.json 2>/dev/null | jq '.jobs | sort_by(.order) | .[] | {name, schedule, order, depends_on}'

# 查看排程日誌驗證 master 最先執行
journalctl -u mops-master --since "1 day ago" | head -20
for db in mops_rev pl bs cf notes price; do
  journalctl -u mops-${db} --since "1 day ago" | head -5
done
```

### 5. 驗證 master 最先執行、下游延遲啟動

```bash
# 檢查排程檔案中的相對執行時間
grep -E '(mops-master|mops-(rev|pl|bs|cf|notes|price))' ~/mops_dbs/scheduler/crontab 2>/dev/null || \
grep -E '(mops-master|mops-(rev|pl|bs|cf|notes|price))' /etc/cron.d/* 2>/dev/null

# 驗證 master 有 OnCalendar 的時間早於下游（systemd timer 例）
for timer in /etc/systemd/system/mops-*.timer; do
  echo "=== $(basename $timer) ==="
  grep -E "^OnCalendar=" "$timer"
done
```

### 6. 生成稽核報告

將上述結果彙整成對帳表：

```bash
cat > /tmp/generate_report.sh << 'BASHEOF'
#!/bin/bash

echo "# MOPS Cluster Master Alignment Audit Report"
echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

echo "## Master Authority"
MASTER_TOTAL=$(sqlite3 ~/mops_dbs/data/mops_master.db "SELECT COUNT(*) FROM companies;")
echo "- Total companies in mops_master: $MASTER_TOTAL"
echo ""

echo "## Downstream DB Alignment Status"
echo "| DB | Total | Aligned | Missing | Extra | Status |"
echo "|:---|:---:|:---:|:---:|:---:|:---|"

for db in mops_rev pl bs cf notes price; do
  if [ -f "~/mops_dbs/data/${db}.db" ]; then
    TOTAL=$(sqlite3 ~/mops_dbs/data/${db}.db "SELECT COUNT(DISTINCT company_id) FROM revenue UNION ALL SELECT COUNT(DISTINCT company_id) FROM statement;" 2>/dev/null | head -1)
    ALIGNED=$(sqlite3 ~/mops_dbs/data/${db}.db "SELECT COUNT(*) FROM (SELECT m.company_id FROM companies m INNER JOIN revenue d ON m.company_id = d.company_id);" 2>/dev/null)
    MISSING=$((MASTER_TOTAL - ALIGNED))
    EXTRA=$((TOTAL - ALIGNED))
    STATUS="aligned"
    [ $MISSING -gt 0 ] && STATUS="⚠️ backfill-needed"
    [ $EXTRA -gt 0 ] && STATUS="⚠️ cleanup-needed"
    echo "| $db | $TOTAL | $ALIGNED | $MISSING | $EXTRA | $STATUS |"
  fi
done
echo ""

echo "## Scheduling Topology"
echo "- mops_master should execute first (e.g., 02:00 UTC)"
echo "- Downstream consumers should start after master completes (e.g., 02:30 UTC or later)"
echo ""
echo "Current scheduling:"
grep -h "OnCalendar\|schedule" ~/mops_dbs/.env 2>/dev/null || echo "(No schedule config found in .env)"

BASHEOF

bash /tmp/generate_report.sh
```

## 注意事項

1. **DB 結構差異**：不同下游 DB 可能有不同的表名（revenue vs statement）；上述指令假設常見的表結構，實際執行時需確認各 DB 的表名
2. **排程檢查前提**：排程驗證需要存取 systemd timer 或 cron 配置；若無相應權限，建議聯繫系統管理員或查看 `~/.env` 的排程設定
3. **缺漏 vs 冗餘的修復方向**：
   - **缺漏（missing）**：通常需要上游 master 新增公司或重新 ETL；下游無法自行補齊
   - **冗餘（extra）**：通常是歷史資料或下游的本地邏輯新增；需逐案評估是清除還是保留
4. **排程順序與延遲**：建議下游 consumer 在 master 完成後 **至少間隔 5–15 分鐘** 再啟動，避免時差導致讀到陳舊資料
5. **定期檢查頻率**：建議與 master 版本更新同步或每月定期執行，特別是新上線下游 DB 時