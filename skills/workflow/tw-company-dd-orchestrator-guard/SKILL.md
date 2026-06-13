---
name: tw-company-dd-orchestrator-guard
description: |
  TRIGGER when: orchestrator 偵測到同一統編 DD pipeline 出現 ≥3 次 stub failure（session 啟動即退出或無有效訊息）時
  WHEN_TO_USE: 防止資源浪費在已知失敗的公司目標上；定期審查隔離名單並決定何時重試
trigger: tw-company-batch-dd-orchestrator
trigger_watch: when batch DD pipeline detects repeated stub failures on same company ID
category: workflow
version: 1.0.0
tags:
  - dd-orchestration
  - circuit-breaker
  - resource-optimization
  - batch-pipeline
  - failure-detection
languages: all
---

## Overview

這個 skill 是 DD batch pipeline 的防護層（circuit breaker），自動偵測並隔離在同一統編連續失敗的公司。當 orchestrator 觀察到同一家公司的 DD session 達到 ≥3 次 stub failure（進程啟動即失敗、單則訊息後退出），會自動將其加入隔離名單，避免持續浪費運算資源。

**核心價值**：
- 減少無謂的重試成本（如宏岳國際連續 7 次失敗的 anti-pattern）
- 保留運算資源給更有成功率的目標
- 提供可審查的隔離日誌，便於後續修正或除名
- 整合到現有 `tw-company-batch-dd-orchestrator` workflow 中

## 何時使用

### 觸發場景
1. **orchestrator 運行期間**：當 batch DD pipeline 開始監控一批公司時，自動追蹤每個統編的 session 結果
2. **累積閾值觸發**：同一統編達成 3 次以上 stub failure 時
3. **新增隔離目標**：自動寫入 `failed-dd-targets.log` 及配置中心，通知 orchestrator

### 判斷何時啟動此防護
- Orchestrator logs 顯示同一統編的連續失敗（如 `company_id: 87654321 — session failed, exit code 1`）
- 需要臨時中止某家公司的重試迴圈，待問題修復後再啟用
- 批次任務運行超過計畫時間，資源耗盡在失敗目標上

## 執行步驟與模式

### Step 1：在 orchestrator 中集成 failure tracking

在 `tw-company-batch-dd-orchestrator` 的主迴圈中新增監控邏輯：

failure_counter = defaultdict(int)
quarantine_list = set()
quarantine_log_path = "failed-dd-targets.log"

for company_id in batch_targets:
  if company_id in quarantine_list:
    logger.info(f"Skipping quarantined: {company_id}")
    continue
  
  session = run_dd_session(company_id)
  
  if session.is_stub_failure():
    failure_counter[company_id] += 1
    logger.warning(f"{company_id}: stub failure #{failure_counter[company_id]}")
    
    if failure_counter[company_id] >= 3:
      quarantine_list.add(company_id)
      write_quarantine_log(
        company_id=company_id,
        failure_count=failure_counter[company_id],
        last_error=session.error_message,
        timestamp=datetime.now()
      )
      logger.critical(f"QUARANTINED: {company_id} (3+ stub failures)")
      send_alert(f"DD Guard: {company_id} quarantined after {failure_counter[company_id]} failures")

### Step 2：隔離日誌格式定義

檔案：`failed-dd-targets.log`

記錄每一行為：
timestamp | company_id | failure_count | failure_type | last_error_snippet | operator | action

2026-06-13T10:45:00Z | 87654321 | 3 | stub_exit | Session exited after 1 message | auto | quarantine
2026-06-13T11:22:15Z | 12345678 | 5 | init_failure | DD handler init error: connection refused | auto | quarantine
2026-06-14T09:15:30Z | 87654321 | 3 | stub_exit | Session exited after 1 message | jack-manual | unquarantine

### Step 3：orchestrator 啟動時載入隔離名單

def load_quarantine_list(quarantine_log_path, retention_days=30):
  quarantine = set()
  cutoff_time = datetime.now() - timedelta(days=retention_days)
  
  if not Path(quarantine_log_path).exists():
    return quarantine
  
  with open(quarantine_log_path) as f:
    for line in f:
      parts = line.strip().split(" | ")
      if len(parts) < 7:
        continue
      
      timestamp_str, company_id, _, _, _, _, action = parts
      timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
      
      if timestamp < cutoff_time:
        continue
      
      if action.strip() == "quarantine":
        quarantine.add(company_id.strip())
      elif action.strip() == "unquarantine":
        quarantine.discard(company_id.strip())
  
  return quarantine

quarantine_list = load_quarantine_list("failed-dd-targets.log")

### Step 4：Stub failure 定義與偵測

def is_stub_failure(session):
  stub_indicators = [
    session.duration_ms < 100,
    session.message_count == 0,
    session.exit_code != 0 and session.duration_ms < 500,
    "initialization error" in session.error_log.lower(),
    "connection refused" in session.error_log.lower(),
  ]
  return any(stub_indicators)

不計入失敗的情況（暫時性問題）：
- Session 執行 >5 秒但失敗（表示有意義進度）
- 超時錯誤（可能是網路抖動，下次重試有機會成功）
- 暫時性資源限制（如 rate limit 429）

### Step 5：隔離管理 CLI 命令

新增到 orchestrator 的命令列工具：

./orchestrator list-quarantine [--days N] [--format json|csv]
  列出現在生效的隔離名單，可篩選最近 N 天內的隔離

./orchestrator unquarantine <company_id>
  手動移除隔離（通常在問題修復後調用）
  自動在隔離日誌中記錄 unquarantine 事件

./orchestrator quarantine <company_id> --reason "custom reason"
  手動隔離某家公司（用於已知無法復原的問題）

./orchestrator quarantine-stats [--format json]
  統計隔離情況：總隔離數、平均失敗次數、最高失敗次數、隔離來源分布

### Step 6：隔離期限與自動解除

default_quarantine_ttl_days = 30

在 load_quarantine_list() 中自動忽略超過 TTL 的隔離記錄，當下次 batch 執行時會重新嘗試該公司。

如需永久隔離，在隔離日誌中標記：
2026-06-13T10:45:00Z | 87654321 | 3 | stub_exit | Manual investigation shows unfixable | jack-manual | quarantine_permanent

### Step 7：監控與告警整合

每當新增隔離時，發送通知：

def send_quarantine_alert(company_id, failure_count, error_snippet):
  msg = f"""
  🛑 DD Pipeline Guard: Quarantine Triggered
  Company ID: {company_id}
  Failures: {failure_count}
  Last Error: {error_snippet[:100]}
  Timestamp: {datetime.now()}
  
  Action: This company has been removed from current batch.
  Next Step: Review logs, fix root cause, run 'orchestrator unquarantine {company_id}'
  """
  logger.critical(msg)
  send_to_slack(msg)  # 或 Telegram bot

## 注意事項

### 已知限制與陷阱

1. **Stub failure 定義需精確**
   區分「真實無法復原的失敗」與「暫時性問題」至關重要，避免誤隔離：
   - ✓ stub failure：session 啟動後立即退出（<100ms）、無任何有效訊息、初始化錯誤
   - ✗ NOT stub failure：網路超時（可能只是一時）、rate limit（下次重試可能成功）、5 秒後的失敗（表示有進度）

2. **N=3 閾值可調**
   預設 N=3，但需根據上下文調整：
   - N=2：若目標清單小且每個都高價值，快速隔離不良目標
   - N=5：若 DD pipeline 本身有自動重試機制，避免過度隔離
   建議在 orchestrator 配置檔中曝露此參數，不硬編碼

3. **與既有重試邏輯的協作**
   - Guard 運行在「批次層」（跨 session），不干預單一 session 的內部重試邏輯
   - Quarantine check 必須在 session 排程前執行，否則會浪費資源
   - 確保 failure_counter 在同一 batch 內累積，不跨越不同 batch

4. **手動隔離與解除的稽核**
   隔離日誌應記錄操作者、時間、理由，便於事後審查：
   operator 欄位必須區分 auto 與手動操作者名稱

5. **隔離日誌檔案管理**
   - 預設保留 30 天，可配置 TTL
   - 定期輪轉日誌（按月或按 5 MB 大小）
   - 保留至少 60 天的歸檔，便於回溯分析
   - 若日誌檔案遺失，quarantine_list 將重置為空

6. **與監控 dashboard 的整合**
   建議在現有 DD pipeline dashboard 上顯示：
   - 目前隔離中的公司數、最長隔離時間
   - 隔離原因分布（stub_exit vs. init_failure vs. manual）
   - 隔離→重試→成功的轉換率（衡量修復有效性）

### 與其他 skill 的整合關係

- 本 skill 是 **`tw-company-batch-dd-orchestrator`** 的內建防護層，不獨立存在
- 共用 `failed-dd-targets.log` 隔離資訊，可被其他監控模組讀取
- 隔離決策應在 orchestrator 層面集中管理，避免分散配置到多個 skill
- 可與 `mops-investee-holdings-debug` 或人工審查流程協作，在 root cause 分析後決定何時解除隔離