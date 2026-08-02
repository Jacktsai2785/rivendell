---
date: 2026-07-26
iso_week: 2026-W30
period: 2026-07-20 to 2026-07-26 (last 7 days)
source: workflow-retro
---

# Workflow Retro — 2026-W30

## TL;DR

本週活動量不低（8 次 harvest 執行、累計約 139 個 session 視窗，多數是 `collab-dual-brain` 引擎自己的內部子呼叫），但 dashboard API 三端點（`/api/skills/usage`、`/api/agents`、`/api/tokens`）仍全部連線失敗——這是 W28 retro 標記的 Action #1，**兩週過去仍未修復**，本週使用度與集中度兩軸只能靠檔案重建。比對 W28 的三個 action，僅 tester 排程算是恢復（部分進展），skill-audit 與 watchdog 仍是殭屍。本週新發現：`workflow-retro` 自己的 cron 在 W29（07-19）悄悄跳過一次，且 crontab 裡新增的 3 個 agent（token-snapshot / ssot-drift / disk-monitor）從掛號那天起就從未真正排程——顯示「新增 agent 忘記接進 crontab」是一個會反覆發生的模式，不是單一事故。此外 harvest 報告連續兩週（07-24、07-25）標記 `pe-dd-taiwan` 與 `tw-pe-due-diligence` 是同義空殼 skill，根因可回溯到 4 月底同一週被連續誤 accept 兩次——這是本週最乾淨、最容易關掉的一項。

## 使用度

> ⚠️ `/api/skills/usage`、`/api/agents` 均連線失敗（`curl` 回傳 `HTTP:000`，連線被拒），本節數據完全來自 harvest 報告的 session 內容重建與 crontab / doctor 日誌的排程稽核，非精確計數。

| Status | Skills | Agents |
|--------|--------|--------|
| 高頻 (5+ this week) | `collab-dual-brain`（jackskill，07-24/07-25 兩份 harvest 顯示 24/30、18/30 session 是其內部 proposer/reviewer/judge/synthesizer 子呼叫，引擎運作正常）；`/code-review xhigh`（staged-only + CONFIRMED-only 慣用參數，07-23 八次 + 07-25 兩次，共 10+ 次） | `sk-harvest-cron`（本週觸發 8 次，皆完成）、`sk-tester-cron`（07-23、07-24 兩次皆 105/105 通過）、`sk-agent-doctor`（每日跑，皆回報 Healthy 6） |
| 低頻 (1-4 this week) | `tw-industry-news-classify`（尚未成 skill，僅 prompt 管線，07-22、07-24 各 3 個結構相同的 session）；PE DD 手動流程（07-25，4 個 session，套用的正是下面提到的空殼 skill）；claude-codex-orchestrator 設計文件迭代（07-22 單一 session 119 則訊息）；`statusline-setup` agent（1 次） | `sk-maintain-cron`（每日跑，symlink OK，但 `maintain-cron.log` 本體是空的——各日獨立 log 檔正常，彙總 log 沒被寫入，屬次要瑕疵） |
| 沉寂 (30+ days) | `skill-audit`（最後產出 2026-05-04，**crontab 裡完全沒有這個 entry**——不是掉線是從未搬進新排程）；`service-watchdog`（`reports/watchdog.log` 不存在，doctor log 從 07-03 起持續回報 `com.sk.dashboard.watchdog not in crontab`） | `token-snapshot` / `ssot-drift` / `disk-monitor`（doctor log 顯示這三個從 07-13 起就出現在檢查清單，但**從未進 crontab**——生下來就沒排程過）；`news_stock.*` / `sales.*` 系列 agent（crm-projection、material-health、subsidy-scraper、tender-scraper、research-agent）——整份 doctor log 期間（07-03～07-26）全部 `not in crontab`，跨專案殭屍 |

**解讀**：核心 7 個 rivendell agent（harvest/maintain/tester/doctor/symlink-fix/workflow-retro/janitor）確實在 crontab 裡且運作良好；但 agents.conf 或 doctor 清單裡列出的其他 agent（skill-audit、watchdog、token-snapshot、ssot-drift、disk-monitor、跨專案 sales/news_stock 系列）只存在於文件或檢查清單上，crontab 從未真的排進去。這不是「壞掉」而是「從沒接上」——比失敗更容易被忽略，因為 doctor 只把它們列為 warning 略過，不算失敗。

## 重複痛點

### Theme 1：`pe-dd-taiwan` / `tw-pe-due-diligence` 同義空殼 skill
- **頻率**: 3+（`.harvest-decisions.json` 顯示 2026-04-30 與 2026-05-01 兩天內連續 `accepted` 兩個幾乎同名候選；harvest-2026-07-24、harvest-2026-07-25 兩份報告本週再次獨立標記為需合併的 Moderate 候選）
- **類別**: **Editorial** — 兩個 skill 目錄（`skills/workflow/pe-dd-taiwan`、`skills/workflow/tw-pe-due-diligence`）確實都存在且都是 `source: harvest-auto` 產生的空殼，只有 TODO，無實際 checklist。
- **代表性事件**: 07-25 harvest 報告：「這不是發現新模式而是既有骨架未填肉……更該做的是把 session 1 的實際做法填進其中一個，刪除另一個重複空殼」。
- **建議**: 保留 `tw-pe-due-diligence`（名稱較完整），刪除 `pe-dd-taiwan`，用 07-25 harvest 找到的實際案例（統編查核 + WebSearch/WebFetch 公開資訊）把內容填進去。

### Theme 2：`/code-review xhigh` staged-only + CONFIRMED-only 手動長參數
- **頻率**: 3+（07-23 報告：5 次 staged-only + 3 次 pre-push range，共 8 次幾乎逐字重複的長參數；07-25 報告：再 2 次同一模式）
- **類別**: **Mechanical**（參數固定化本身很簡單），但決策層面是 **Editorial**——07-23 報告建議立 `review-staged`/`review-prepush` skill（🟢 Strong），07-25 報告對同一模式改口「不必新增 skill，存成慣用語即可」（🟢 Weak）。兩份報告對同一訊號給出矛盾建議，本身就是訊號：harvest 的判斷標準在這個案例上不穩定。
- **代表性事件**: 兩份報告相隔 2 天，結論從「建 skill」翻成「別建 skill」。
- **建議**: 採用 07-25 的結論（成本較低）——把「只審 staged diff、只列 CONFIRMED 高信心 correctness」這句固定 prompt 存進 memory 或該專案 `CLAUDE.md`，不必開新 skill 檔案。同時，這提醒未來 harvest 報告在給 Strong/Weak 判斷時，應註明「若已有更早期報告對同一模式給過相反判斷，需先說明分歧原因」。

### Theme 3：新 agent 掛號後忘記接進 crontab
- **頻率**: 3+（W28 retro 已把 skill-audit/watchdog 排程斷點列為 Action #3；本週 crontab 現況顯示兩者依舊未接上；另外本週新發現 `token-snapshot`/`ssot-drift`/`disk-monitor` 三個 07-13 才出現在 doctor 清單的新 agent，同樣從未進 crontab）
- **類別**: **Architectural** — 目前「新增 agent」的流程裡，doctor 清單登記與 crontab 實際排程是兩件分開的事，沒有一道硬性檢查會擋下「登記了但沒排程」的狀態，doctor 只把它當 warning 略過。
- **代表性事件**: `doctor-cron.log` 從 2026-07-13 起，每次執行都列出同一組 3 個新 agent「not in crontab — skipping」，連續 5 次檢查（07-13、07-15、07-23、07-24、07-26）都沒變化。
- **建議**: 在 `sk-setup-agents` 或 doctor 腳本加一個硬性檢查：agents.conf 有登記、crontab 沒有對應項 → 直接判定失敗（而非目前的略過式 warning），逼新 agent 上線當天就要處理，而不是靠每週 retro 人工翻 log 才發現。

## 集中度

- **Token 集中**: **無法計算** — `/api/tokens`、`/api/tokens/filtered` 均連線失敗（`curl -m 5` 回傳 `HTTP:000`，連線被拒）。本地唯一可能的替代數據源 `bin/sk-token-snapshot` 也從未被排進 crontab（見 Theme 3），完全沒有 fallback。這是本週集中度唯一但最關鍵的發現：**dashboard API 全滅已持續兩週（W28→W30），且沒有任何本地替代數據源在補位**。
- **失敗集中**: 本週有實際執行紀錄的 agent（harvest ×8、maintain ×7、tester ×2、doctor ×5）全部正常完成，無非 0 exit。失敗集中反而落在「登記了但從未執行」的殭屍 agent（skill-audit、watchdog、token-snapshot、ssot-drift、disk-monitor、news_stock/sales 系列），而非「執行後失敗」——這類問題不會出現在傳統的 exit-code 監控裡。
- **Dashboard 健康**: `reports/watchdog.log` 不存在（watchdog 從未在 WSL 部署，非「零重啟的健康週」）。`ss -tlnp` 確認 port 3000（dashboard web，`next-server`）有 process 在跑，但 port 8000（dashboard API）完全沒有 listener——不是重啟事件，是 API 服務本身長期沒有被啟動，且 crontab 裡也找不到任何啟動 dashboard-api/web 的排程項，代表這兩個服務目前可能仰賴手動啟動、沒有開機自啟機制。

## 下週 Actions (max 3, prioritized)

1. **復活 dashboard API（port 8000）** — Why now: 這是 W28 Action #1，兩週未完成，是本週唯一持續存在且影響最大的盲點（使用度、集中度兩軸全靠人工重建檔案）。Est. effort: 1–2 hr（確認 rivendell-api 目前怎麼啟動、crontab/systemd 裡完全沒有對應項，需要補一個開機自啟動或至少排程重啟項）。Expected impact: W31 retro 可恢復真實使用度與 token 數據，不用再靠 harvest 報告重建。
2. **合併 `pe-dd-taiwan` 與 `tw-pe-due-diligence`** — Why now: 已被連續兩份 harvest 報告（07-24、07-25）標記，根因明確（4 月底同一週誤連續 accept 兩次），是本週最容易一次關掉、不會再有第三次重複標記的項目。Est. effort: ~30 分鐘（比對 frontmatter、保留 `tw-pe-due-diligence`、刪除 `pe-dd-taiwan`、用 07-25 harvest 找到的實際案例填內容）。Expected impact: 下次 harvest 不會再標記同一件事第三次；`reports/` 的 skill 候選訊噪比提升。
3. **幫 skill-audit 補回 crontab（或正式退役），並把 token-snapshot / ssot-drift / disk-monitor 一併納入這次盤點** — Why now: W28 Action #3 兩週未執行，殭屍狀態持續污染 reports/ 可信度；本週新發現的 3 個從未排程的 agent 顯示這是會反覆發生的模式，一次盤點比每週各修一點更划算。Est. effort: ~1.5 hr。Expected impact: `doctor-cron.log` 不再有長期不變的「not in crontab」清單；順便把 Theme 3 的架構性問題（agent 登記與排程脫鉤）在治理層面解決一半。

## 對照上週

> 上一份存在的報告是 W28（2026-07-12）；W29（2026-07-19）**沒有產出**——本週稽核發現 `workflow-retro-cron.log` 最後一筆紀錄停在 07-12，代表 workflow-retro 自己的 cron 在 W29 悄悄跳過了一次。W28 才剛把「retro 斷更 9 週」列為最重要的 meta 發現，這週退化成「斷更 1 週」——問題性質相同（排程沒被信任地執行），只是嚴重度降低，不算真正解決。

- **上週（W28）actions 完成度: 0.5 / 3**
  - 🟡 **部分完成** 恢復 dashboard 資料鏈路 — dashboard API 仍全滅（0% 完成），但 `tester` 已在 WSL 恢復每日排程並穩定產出（W28 沒明確要求但屬同一問題的旁支修復，算意外的部分進展）。
  - ❌ 建 `skill-catalog-drift-sync` skill — 於 `skills/` 目錄搜尋無此 skill，未建立。
  - ❌ 裁決 tester / skill-audit / watchdog fleet 去留 — tester 子項已解決（恢復排程），但 skill-audit 仍完全沒有 crontab entry、watchdog 仍未部署，三分之二未處理，且本週新增了 3 個同類殭屍 agent（token-snapshot/ssot-drift/disk-monitor），問題規模不減反增。
- **指標變化**:
  - Session 量：W28 為單次 harvest（17 sessions / 349 訊息）；W30 本週 8 次 harvest 執行、累計約 139 個 session 視窗（多數是 `collab-dual-brain` 內部子呼叫）——活動量顯著上升，但主要是既有 skill 的引擎內部消耗，非新任務類型成長。
  - Token / 集中度：W18 曾有 66% 集中度數據，W28 起因 API 全滅已無法計算，W30 依舊無法計算——這條指標已經連續 3 份報告掛零。
  - 排程斷點：W28 標記 skill-audit/watchdog 為斷點，W30 確認兩者狀態不變，且新增 3 個同類個案——斷點數量從 2 增加到 5。
