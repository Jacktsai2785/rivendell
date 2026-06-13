---
date: 2026-05-17
iso_week: 2026-W20
period: 2026-05-11 to 2026-05-17 (last 7 days)
source: workflow-retro
api_status: OFFLINE — dashboard API (port 8000) 連線拒絕，本報告全部依賴 file-based 來源（同 W19）
---

# Workflow Retro — 2026-W20

## TL;DR

本週最顯著的事件是 **skill 庫大爆炸**：驗證通過數從 105 跳至 144（+39，05-15 當天），目前還有 56 個 untracked 目錄尚未提交。同時，**台灣公司 DD pipeline** 已從實驗進入量產——05-16 單日 30 個 sessions 跑批次盡調（名稱萃取 → 官網搜尋 → PE 備忘錄），這是 rivendell skill 庫第一次被真實批次作業大量驅動。但 W19 的 Action 1（systemd 取代 launchd）第二週仍未完成，dashboard API 繼續離線，token 追蹤和 skill usage 量化數據依然空白。tw-company skill stubs 的 trigger miss rate 從 0% 降至 71%，有進步但仍是主要摩擦點。

## 使用度

> Dashboard API 連線拒絕（Connection refused: 127.0.0.1:8000），無法查詢 `/api/skills/usage`。以下資料來自 harvest 報告的定性觀察。

| Status | Skills |
|--------|--------|
| 高頻 (5+ this week) | （無可量化數據；批次 DD pipeline 的 WebSearch/WebFetch 不經 skill router） |
| 低頻（有觸發記錄） | `tw-company-pe-memo`（4 次 / 14 次 PE 盡調，harvest-05-16）、`tw-company-lookup`（1 次，harvest-05-11 session 3）、`workflow-retro`（1 次，05-15 session 1） |
| 新建但未觸發 | 本週新增 39 個 skills（105→144），其中大量屬於 `tw-company-*`、`mops-*`、`headless-agent-*` 系列；另有 56 個 untracked 目錄尚未提交 |
| 沉寂 / 無法確認 | dashboard API 離線，30 天沉寂清單無從查詢 |

**Agent 狀態：**
- tester 報告每日顯示「Not loaded in launchd」（連續 7 天），但 maintain（05-16、05-17 有 log）和 harvest（05-11、05-15、05-16 有報告）仍在執行——代表 agents 透過非 launchd 機制在運作（可能是 WSL2 cron 或 systemd user service），但 tester 的健康檢查仍以 launchd 為準，導致每天報 4/4 FAIL。
- **doctor agent**：05-16、05-17 log 均為空——doctor 可能已停止執行或沒有可診斷的項目。
- maintain log 本週僅顯示前兩個步驟（Deploy Check + Permissions Sync），未見 [3/4]、[4/4]，疑似在 permissions sync 後截斷。

**解讀：** 驅動力已清楚——批次 DD pipeline 是本週唯一真實的高流量工作負載，但其工具使用以 WebSearch/WebFetch 直呼為主，不過 skill router。Skill 庫數量飆升到 144，但使用中的不超過 3 個。「數量多」與「被使用」的差距持續擴大。

## 重複痛點

### Theme 1：tw-company skill stubs 覆蓋不足（3+ 次）

- **頻率**：harvest-05-11（session 3 只有 1 次 tw-company-lookup）、harvest-05-15（sessions 2–10 共 9 次相同搜尋完全未呼叫 tw-company-website-finder）、harvest-05-16（14 次 PE 盡調中只有 4 次觸發 tw-company-pe-memo，miss rate 71%）
- **類別**：Editorial
- **代表性事件**：harvest-05-16 明確記錄 trigger 語句 `when working with tw-company-pe-memo` 幾乎不會自然出現在使用者請求中，真實觸發詞是「PE 備忘錄」「盡調報告」「DD 研究」「給我一份投資備忘錄」
- **建議**：直接修改 `tw-company-pe-memo` 和 `tw-company-website-finder` 兩個 SKILL.md 的 TRIGGER 段落，加入使用者慣用的正體中文觸發詞；同步補入實作細節（目前兩者均為 TODO stub）

### Theme 2：批次 pipeline 去重缺失（2 次）

- **頻率**：harvest-05-15（同一家公司「光寶科技」被 headless agent 搜尋 9 次）、harvest-05-16（pipeline 架構已確認：名稱萃取 → 網站搜尋 → PE 備忘錄，但各步驟是否去重不明）
- **類別**：Mechanical
- **代表性事件**：harvest-05-15 記錄「上游批次排程在發送 job 前未做去重（dedup），導致相同輸入被重複處理」
- **建議**：在批次排程腳本加入 dedup 邏輯，或在 `headless-agent` SKILL.md 加入「批次前先對輸入清單去重」的 checklist 項目（harvest-05-15 已建議後者，本週未見執行）

### Theme 3：`.next` 鎖定造成間歇性 build 失敗（3 次）

- **頻率**：05-13、05-15、05-17 各 1 次，共 3 次，均為同一錯誤：「Unable to acquire lock at .next/lock, is another instance of next build running?」
- **類別**：Mechanical
- **代表性事件**：呈現隔日交替的規律（FAIL-SUCCESS-FAIL-SUCCESS-FAIL），暗示 lock 從前一次 build 執行殘留
- **建議**：在 tester 的 build step 前加入 `rm -f dashboard-next/.next/lock 2>/dev/null || true`，一行修復

## 集中度

- **Token 集中**：無資料（dashboard API 離線，`/api/tokens` 無法連線）。這是**連續第 2 週**無法追蹤 token 成本。05-16 的 30 個 sessions（14 次 PE DD 各含 WebSearch×7 + WebFetch×5）代表本週費用集中在 taiwan-company 專案，但無法量化。

- **失敗集中**：
  - **launchd 健康檢查誤報**：tester 的 agent 健康指標對 WSL2 環境已無意義，每天 4/4 FAIL 是誤報。真實情況是 agents 透過其他機制仍在運作，但健康指標沒更新，產生持續的「wolf crying」問題。
  - **.next lock**：7 天中 3 天 build FAIL（43%），可一行修復。

- **Dashboard 健康**：`reports/watchdog.log` 不存在，同 W19。watchdog 未執行，dashboard 健康未受監控。Dashboard API 本身 offline 是根本原因。

## 下週 Actions (max 3, prioritized)

### 1. 完成 systemd 遷移，讓 dashboard API 重新上線
**為什麼現在做：** 這是第二週被列為 Action 1。Dashboard API 離線意味著 skill usage 追蹤、token 成本、agent run history 全部空白——讓 workflow-retro 每週都是半盲的。`bin/sk-setup-systemd` 已存在（untracked），只差執行一次。同時更新 tester 的健康檢查從 launchd → systemd，消除 4/4 FAIL 誤報。  
**Effort：** ~45 分鐘。  
**Expected impact：** W21 retro 可以用真實 API 數據；tester 誤報消失；token 追蹤恢復。

### 2. 補齊 tw-company-pe-memo 和 tw-company-website-finder 實作，修正 trigger 覆蓋
**為什麼現在做：** Harvest-05-16 量化了問題——14 次 PE 盡調只有 4 次命中（71% miss）。批次 pipeline 已上量產規模，每次 miss 就是一次未被 skill routing 強化的工作流。觸發詞（「PE 備忘錄」「盡調報告」「投資備忘錄」「找官網」）來自 harvest 觀察，可直接填入 SKILL.md。  
**Effort：** ~30 分鐘。  
**Expected impact：** PE memo routing rate 從 29% 提升到 80%+；官網搜尋開始被 skill 路由。

### 3. 修復 .next lock 間歇性 build 失敗
**為什麼現在做：** 7 天 3 次 build 失敗（43%），每次都是同一個原因（lock 殘留）且可一行修復。它讓 tester 報告出現雜訊，掩蓋真正需要關注的問題。  
**Effort：** ~5 分鐘。  
**Expected impact：** Build 成功率從 57% 提升到接近 100%。

## 對照上週（W19）

| W19 Action | 完成狀態 | 說明 |
|-----------|---------|------|
| 1. 啟動 WSL2 systemd services，取代 launchd agents | ❌ 未完成 | Tester 報告連續 7 天 4/4 FAIL（launchd）；dashboard API 第 2 週離線；`bin/sk-setup-systemd` 仍為 untracked。Agents 有在運作（maintain/harvest 有 log），但健康指標未更新為 systemd。 |
| 2. 驗證並上線 tw-company-pe-memo trigger 覆蓋 | ⚠️ 部分完成 | Routing rate 從 0% 升至 ~29%（4/14，harvest-05-16），有進步，但 TRIGGER 語句仍未覆蓋主要中文觸發詞，miss rate 仍 71%。兩個 skill 均為 TODO stub。 |
| 3. 修復 skill-scout 空產出問題 | ❓ 無紀錄 | 本週 harvest 未見 skill-scout 相關 session，無法判斷是否修復。 |

**W19 → W20 關鍵指標：**

| 指標 | W19 | W20 | 趨勢 |
|------|-----|-----|------|
| Skill 驗證數量 | 100 | 144 | ↑ +44% |
| Structural WARN | 0 | 0 | → |
| Agent 健康（tester 誤報） | 0/4 | 0/4 | → 持平（誤報） |
| Dashboard API | OFFLINE | OFFLINE | → 第 2 週 |
| PE memo routing rate | 0% | ~29% | ↑ 但仍低 |
| Build 成功率 | 71% | 57% | ↓ .next lock |
| 批次 DD sessions / 高峰日 | 23 | 30 | ↑ 量產規模 |

---

*產生工具：`skills/meta/workflow-retro`（file-based fallback，API OFFLINE 第 2 週）*
