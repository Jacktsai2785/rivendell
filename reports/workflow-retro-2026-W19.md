---
date: 2026-05-10
iso_week: 2026-W19
period: 2026-05-04 to 2026-05-10 (last 7 days)
source: workflow-retro
api_status: OFFLINE — 所有 API 端點（/api/skills/usage、/api/agents、/api/tokens）均無法連線，本報告全部依賴 file-based 來源
---

# Workflow Retro — 2026-W19

## TL;DR

本週最重要的事件是**環境遷移**：系統從 macOS 遷移到 Linux/WSL2，導致四個 launchd agents 全部下線、dashboard API 無法連線、token 資料無從取得。另一方面，skill 庫大幅擴張（92 → 100 個，+8 在 05-10 當天加入，另有 15 個 untracked 目錄尚未提交），其中 `tw-company-pe-memo` 在建立前已被用了 7 次（harvest-05-09）。核心警訊：harvest-05-09 的 23 個 session 中 **skills 呼叫次數為 0**——trigger 語句覆蓋率低，是本週最清楚的可操作訊號。

## 使用度

> Dashboard API 無法連線，無法查詢 `/api/skills/usage`。以下資料來自 harvest 報告的定性觀察。

| Status | Skills |
|--------|--------|
| 高頻 (5+ this week) | `workflow-retro`（05-08 harvest 中 5 個 session 執行）、`investment-research`（04-26~27 多次 Continuous Mode） |
| 低頻 (1-4 this week) | `crm-projection`（04-26~27 例行觸發）、`session-harvest`（05-08~10 每日觸發）、`skill-scout`（05-08 執行 3 次，但全部產出為空） |
| 新建但未驗證觸發 | `tw-company-pe-memo`、`systemd-user-service`、`mops-shareholder-tree` 等 15 個 untracked skill（已建立目錄但尚未有實際觸發記錄） |
| 沉寂 / 無法確認 | API 下線期間無法取得 30 天沉寂清單 |

**Agent 狀態**：四個 launchd agents（maintain、harvest、tester、doctor）連續三天（05-08、05-09、05-10）均回報 `Not loaded in launchd`。test 和 harvest 報告 05-08~10 仍有輸出，表示有手動觸發或其他機制介入，但自動排程已中斷。

**解讀：** skill 庫數量創新高（100 個通過結構驗證），但 0/23 的 routing 率（harvest-05-09）說明「數量多」不等於「被使用」。新建的 15 個 skill 若 trigger 語句沒有覆蓋使用者的慣用語，它們等於不存在。

## 重複痛點

### Theme 1：Skill routing 失效（3+ 次）

- **頻率**：harvest-05-08（skill-scout 3 次空產出）、harvest-05-09（23 sessions、0 skill 呼叫）、harvest-04-29（sessions 使用已有 skill 對應的工作流卻未觸發）
- **類別**：Editorial
- **代表性事件**：harvest-05-09 明確記錄「台灣公司相關工作流程（PE 盡調、股東追蹤）尚未被 `tw-company-lookup` 或 `mops-financial-scraper` 的 trigger 條件覆蓋」
- **建議**：逐一核查 `tw-company-pe-memo`、`mops-shareholder-tree`、`systemd-user-service` 的 trigger 語句，加入使用者的慣用口語（如「做盡調」「PE memo」「開機自動啟動」「設定成 systemd」）

### Theme 2：skill-scout Agent delegation 後無產出（3 次）

- **頻率**：harvest-05-08 session 3、4、7 均以 `Agent×1` 結束，harvest 報告為空（1 行）
- **類別**：Mechanical
- **代表性事件**：harvest-05-08 分析：「skill-scout 流程有產出遺失問題，更應該是修正現有 skill-scout 的 prompt 而非另立新 skill」
- **建議**：`skill-scout-output-fixer` skill 已建立（git status untracked），驗證並啟用；或直接修改 skill-scout 的 Agent delegation prompt，確保產出寫入 harvest 報告

## 集中度

- **Token 集中**：無資料（dashboard API 離線，`/api/tokens` 無法連線）。這是本週第二大架構性問題——W18 發現的 2.8x 費用跳動至今未能確認，本週繼續無法追蹤。

- **失敗集中**：
  - **四個 launchd agents 全數下線**（連續 3 天）。maintain、harvest、tester、doctor 均回報 `Not loaded in launchd`，根因是 WSL2 沒有 launchd。
  - **Dashboard API 無回應**（本 retro 執行時 `curl localhost:8000/api/skills/usage` 失敗）。`dashboard-next/api.log` 和 `web.log` 在 git status 中為 untracked，服務可能根本未啟動。

- **Dashboard 健康**：`reports/watchdog.log` 不存在。推論：watchdog agent 因 launchd 下線而未執行，所以沒有 RESTART 事件記錄，不代表 dashboard 健康——而是根本沒人在監控。

### Structural test 趨勢（W19）

| 日期 | Skill 結構 WARN | Build | Agent FAIL |
|------|----------------|-------|-----------|
| 05-08 | 0 | FAIL（.next lock 衝突） | 4 |
| 05-09 | 0 | SUCCESS | 4 |
| 05-10 | 0（100/100） | SUCCESS | 4 |

WARN 從 W18 的 11 → 本週 0，是 W18 Action 1 的效果（或 WSL2 環境本身不跑 macOS symlink 檢查）。Build failure 05-08 是 `.next` lock 問題，一次性事件。**Agent 4/4 FAIL 是持續問題。**

## 下週 Actions（max 3, prioritized）

### 1. 啟動 WSL2 systemd services，取代 launchd agents
**為什麼現在做：** 四個 agents 全部下線已第三天。`bin/sk-setup-systemd`（untracked）和 `systemd-user-service` skill 均已建立，基礎設施就位，只差執行一次部署。  
**Effort：** 執行 `bin/sk-setup-systemd`，確認 harvest/tester/maintain/doctor 四個服務 active + enabled；再啟動 dashboard-next API 和 web 服務。~30 分鐘。  
**Expected impact：** 自動排程恢復、dashboard API 重新上線、token 追蹤和 skill usage 數據可查。W18 的兩個未完成 action（watchdog 升級、token 查清）也一併解鎖。

### 2. 驗證並上線 `tw-company-pe-memo` 的 trigger 覆蓋
**為什麼現在做：** 7 個 session 使用相同工作流卻沒觸發 skill，在 harvest-05-09 中被識別為 P0。skill 已建立（untracked），但若 trigger 語句不覆蓋「PE 備忘錄」「盡調報告」「DD 研究」等實際用語，等同未建。  
**Effort：** 讀 `skills/workflow/tw-company-pe-memo/SKILL.md`，比對 harvest-05-09 的觸發詞清單，補入缺漏；重複驗證 `mops-shareholder-tree` 和 `systemd-user-service` 的 trigger 語句。~20 分鐘。  
**Expected impact：** 下週 harvest 的 skill routing rate 從 0% 提升到可量化的數字。

### 3. 修復 skill-scout 空產出問題
**為什麼現在做：** 三次空產出已在 harvest-05-08 被明確識別，`skill-scout-output-fixer` skill 也已建立（untracked）。目前不確定問題在 skill-scout 的 Agent prompt 還是 output 寫入邏輯——需要一次真實測試才能確認。  
**Effort：** 執行一次 skill-scout，觀察輸出；若仍為空，對照 `skill-scout-output-fixer/SKILL.md` 修復。~15 分鐘。  
**Expected impact：** harvest 報告品質提升，不再有空白的 skill-scout 產出；meta-skill 生態系自我修復能力恢復。

## 對照上週（W18）

| W18 Action | 完成狀態 | 說明 |
|-----------|---------|------|
| 1. 建 `sk-deploy-symlink-fix` agent（WARN 11→0） | ✅ 完成 | W19 test reports 連續 3 天 0 WARN（vs W18 週均 12）。WSL2 遷移可能也是因素之一，但結果達成。 |
| 2. Watchdog 升級「重複失敗 → deeper recovery」邏輯 | ❓ 未能確認 | launchd 離線、watchdog.log 不存在。無法判斷是否實作，也無法驗證效果。 |
| 3. 查清 token 花費 2.8x 跳動 | ❌ 未完成 | Dashboard API 離線，`/api/tokens` 無法查詢，此問題被環境遷移擱置。 |

**W18 → W19 關鍵指標變化：**
- Structural WARN：11 → **0**（顯著改善）
- Agent 健康率：4/4 → **0/4**（因 WSL2 遷移劣化）
- Skill 數量：92 → **100**（新增 8 個，另有 15 個 untracked）
- Skill routing rate：（W18 未測量）→ **0/23**（harvest-05-09 量化確認）

---

*產生工具：`skills/meta/workflow-retro`（file-based fallback，API OFFLINE）*
