---
name: pe-memo-silent-fail-rate-alert
description: "監測每日 PE memo 派送的 silent-fail 比例，超過 20% 閾值時發送 Telegram 告警。TRIGGER: 每日 dispatcher 派送 PE memo 任務完成時調用，追蹤派送成功率與 failure recovery 漏網狀態。"
when_to_use: |
  - 定期監測 PE memo 派送的健康度指標（每日或每個 batch）
  - 需要量化「silent-fail 是否成為系統性問題」
  - 要與 pe-memo-silent-fail-recovery 配搭形成「警告 + 補救」雙層機制
  - 當 PE memo 派送異常（例如 33% silent-fail）時，快速感知並告警而非埋沒
version: 1.0.0
tags:
  - pe-memo
  - observability
  - alert
  - dispatcher
  - silent-fail
languages: all
---

## Overview

**pe-memo-silent-fail-rate-alert** 將「silent-fail 比例」轉換為可觀測的系統健康度指標。

與現有 `pe-memo-silent-fail-recovery` 不同之處：recovery skill 專注事後補救（re-trigger 失敗任務），本 skill 專注於**結構性訊號浮上水面**——即時感知失敗率異常、防止沉默的系統性故障。

與 `agent-observability` / `headless-agent-monitor` 的差異：通用監控無法領會 PE memo dispatch 的領域語義；本 skill 嵌入 PE memo 的工作流特性，包括：
- 派送隊列完整性校驗
- Silent-fail 與 explicit failure 的區別判定
- PE memo 特定的告警規則（>20% 閾值）
- Telegram + dashboard badge 的多元告警管道

## 何時使用

**每日觸發場景：**
- dispatcher 完成日間 PE memo 任務派送後（通常每早 07:00-09:00 或批次完成時）
- 蒐集該日的派送統計、計算 silent-fail 比例
- 若 silent-fail 率 ≥ 20%，立即發送 Telegram 告警

**臨時診斷場景：**
- 懷疑 PE memo dispatcher 健康度下降
- 需要快速確認「最近 silent-fail 的 pattern 是什麼」
- 要在 dashboard 上掛一個 badge 供 oncall 與產品方監看

## 執行步驟

### 1. 蒐集日間派送統計

查詢 dispatcher 派送日誌（通常在 `mops_dbs/scheduler` 或 `mops_dbs/memo_dispatcher` 的 `dispatch_log` 或 `task_state` 表）：

```sql
SELECT 
  DATE(dispatched_at) AS dispatch_date,
  status,
  COUNT(*) AS count
FROM dispatch_log
WHERE task_type = 'pe-memo'
  AND DATE(dispatched_at) = CURRENT_DATE
GROUP BY dispatch_date, status;
```

預期結果列（status 分類）：
- `success`: 派送成功、target 已收到任務
- `explicit_failure`: 派送失敗、error log 可追蹤原因
- `silent_fail`: 派送返回 200、但 target 無確認信號或隨後未執行

### 2. 計算 silent-fail 比例

```
silent_fail_rate = silent_fail_count / total_dispatched_count
```

若當日總派送數為 100，silent_fail 為 33，則比例為 33%。

### 3. 判定告警條件

```
if silent_fail_rate >= 0.20:
    trigger_alert()
```

告警閾值：**20%（0.20）**。本次 batch 達 33% 為警告線上方。

### 4. 發送 Telegram 告警

使用現有的 `claude-to-telegram` 或 `telegram-bot` skill 發送訊息格式：

```
🚨 PE Memo Silent-Fail Alert
日期: 2026-06-13
Silent-Fail 比例: 33% (33/100)
狀態: 超過閾值 (>20%)

✓ Success: 50
✗ Explicit Failure: 17
⚠ Silent Fail: 33

建議行動:
1. 檢查 dispatcher 目標服務（scheduler、memo-dispatch-queue）
2. 調用 pe-memo-silent-fail-recovery 進行 re-trigger
3. 查詢 PE memo 最近的執行日誌確認失敗模式
```

### 5. Dashboard Badge 更新

若有 dashboard（例如 `dashboard-next` 或專用監控面板），更新健康度 badge：

- **Green**: silent-fail 率 < 10%
- **Yellow**: 10% ≤ 率 < 20%
- **Red**: 率 ≥ 20%

badge 同時顯示百分比與絕對數值（例如「33% (33/100)」）。

### 6. 整合 cron 排程

將本 skill 綁定為 cron job（使用 `/schedule` 或 systemd timer）：

```bash
# 每日 09:30 執行一次
0 9 * * * /usr/bin/claude-agent run-skill pe-memo-silent-fail-rate-alert
```

或於 `.claude/settings.json` 中配置 hook：

```json
{
  "hooks": {
    "after-pe-memo-dispatcher-complete": {
      "run": "skill pe-memo-silent-fail-rate-alert"
    }
  }
}
```

## 注意事項

### Silent-Fail 定義的精確性

本 skill 依賴上游系統（dispatcher、target 服務）的完整、正確的 log 記錄。若 dispatcher 本身未能區分「成功派送但 target 失效」vs「派送失敗但未記錄」，silent-fail 比例的計算會偏差。

**應對方式：**
- 確認 dispatcher 的 ACK/confirmation 邏輯已實裝（target 應返回 received=true 的信號）
- 若無 confirmation，改為以「派送後 24h 內未見執行結果」作為 silent-fail 的定義
- 與 `pe-memo-silent-fail-recovery` 配搭使用，recovery 失敗的任務才計入真正的 silent-fail

### 告警洪泛問題

若每日都觸發告警（因為 baseline 本身就是 >20%），會造成 Telegram 告警疲勞。

**應對方式：**
- 前期可調整閾值為 35-40% 以觀察基線
- 平行追蹤「silent-fail 趨勢」（周比、月比）而非僅看單日率
- 若 silent-fail 持續 3 日以上 >20%，升級為「critical alert」通知 oncall

### 與其他 skill 的協作邊界

- **pe-memo-silent-fail-recovery**: 本 skill 發告警 → recovery skill 執行 re-trigger（兩者可自動串聯或手動觸發）
- **pe-memo-already-generated-guard**: 若 guard 發現已生成的 memo 被重複派送，可能導致誤計算；建議先過濾去重後再計算失敗率
- **pe-memo-deep-research**: 若 deep-research 執行失敗進而導致派送 memo 失敗，本 alert 可追蹤到「PE memo 端的失敗」而非上游 research 端；需協同溝通根本原因

### Dashboard Badge 與 Telegram 的同步

若同時使用 dashboard badge 與 Telegram 告警，確保兩端的資料來源與計算邏輯一致（例如都使用同一個 SQL query），否則會造成誤導性不一致。