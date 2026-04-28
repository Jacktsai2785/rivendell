---
date: 2026-04-28
iso_week: 2026-W18
period: 2026-04-21 to 2026-04-27 (last 7 days)
source: workflow-retro
---

# Workflow Retro — 2026-W18

## TL;DR

本週最重要的事件是 04-27 出現 **80 分鐘的 watchdog 死循環**：watchdog 連續觸發 27 次 `kickstart -k` 重啟 web service，每 3 分鐘一輪，但都修不好（根因是 `.next` 半損 build，重啟救不了，需要 `rm -rf .next && npm run build`）。Watchdog 抓到了症狀，卻沒有「重啟多次仍失敗 → 升級為 deeper recovery」的能力。這是本週真正值得做的下一步。其他面向：skill 使用量健康（28 種 skill 觸發、長尾合理）、agent 排程零失敗、structural WARN 數穩定下降中（13→11）。

## 使用度

| 分類 | 數量 | 代表 |
|------|------|------|
| 高頻 (5+ this week) | 2 | crm-projection (6x), planning-with-files (5x) |
| 低頻 (1-4 this week) | 26 | requirement, office-pptx, investment-research 各 4x |
| 沉寂 (30+ days) | 12 | 多為外部/實驗性 skills（claude-automation-recommender、playground、dcg 等） |

**解讀：** 高頻 skill 都是 sales-assistant / news-stock / 規劃類的核心工作流，與 daily commit history 一致。沉寂 skill 大多是早期匯入的外部/示範品，不是 rivendell 自己的 skill — 不需要本週處理，但下次該加個 filter 區分「自家 skill」vs「外部/示範」。session-harvest 本週 1x，verify 自身 skill（workflow-retro）尚未首次觸發，預期下週會出現。

## 重複痛點

### Theme 1: launchd / TCC / macOS process boundary（3+ 次）

- **頻率**: 3 條 .learnings 條目（2026-03-18 repo rename、2026-03-24 TCC blocks /bin/bash、2026-04-26 KeepAlive 限制）
- **類別**: Architectural
- **代表性事件**: KeepAlive 不抓 hung process、TCC 阻擋 launchd 讀 ~/Documents/、process 邊界導致路徑/環境變數不一致
- **建議**: 已部分自我緩解（`sk-agent-run` C wrapper、watchdog skill）。下一步 candidate 是寫一個 `launchd-troubleshoot.md` ref 文件聚合這三個教訓，未來踩坑時 1 個 grep 找得到。

### Theme 2: Build artifact / cache 半損狀態（2 次，未過 3 門檻但近期度高）

- **頻率**: 2 條 .learnings 條目（2026-04-23 stale Docker container、2026-04-27 .next half-built）— 本週 watchdog log 80 分鐘死循環是同一類問題的延伸
- **類別**: Architectural
- **代表性事件**: 半完成的 build / 過時的 daemon listener 被誤認為 healthy、自動 recovery 機制無法處理
- **建議**: 下次再撞到就升級為 Theme 1 等級的「重複痛點」。本週的 sentinel-file fix（`d836a94`）是 `.next` 這個案例的特定解，不是通用解。

**3+ 門檻外的 .learnings 條目（單次出現，列出供下週對照）：** auto-stage 風險、git pipefail 陷阱、g0v API field name、settings 一次性權限污染。

## 集中度

- **Token / cost**: 過去 7 天 dashboard 累計 ≈ **USD 9,024**（188 sessions、26K messages、18.5M tokens）。`/api/tokens/filtered` 沒回傳 per-project 拆解，但比對 04-25 audit 報的 7 日花費 USD 3,252 — **本週是上週的 ~2.8x**，需要查清是真實使用增長還是計費 / 抓取問題。**這是本週唯一未解的可量化異常。**
- **失敗集中**: 本週所有 launchd agent 排程執行 0 次非 0 退出（過濾後 list 空）。Agent 層健康。
- **Dashboard 健康**: 04-27 watchdog log 顯示 **27 次 RESTART 在 80 分鐘內**，全部都是同一個 root cause（`.next` 半損）。Restart event 過去 24h 已經結束 — 但這代表 watchdog 沒有「重複失敗 → 升級 recovery」邏輯。

### Structural WARN 趨勢（test 報告）

| 日期 | WARN 數 |
|------|---------|
| 04-21 | 13 |
| 04-22 | 12 |
| 04-23 | 13 |
| 04-24 | 12 |
| 04-25 | 13 |
| 04-26 | 12 |
| 04-27 | **11** |

11 個是 symlink missing — `./bin/sk deploy` 已經會修，只是沒人定期跑。

### Skill audit 待解 issue

| 日期 | issues |
|------|--------|
| 04-22 | 29 |
| 04-23 | 30 |
| 04-24 | 29 |
| 04-25 | 30 |
| 04-26 | 29 |

數字平的 — 沒人在處理。

## 下週 Actions（max 3, prioritized）

### 1. 建 `sk-deploy-symlink-fix` agent（daily）— 砍掉 11 個 WARN
**為什麼現在做：** test report 連續 7 天紅 11 個 WARN，全是 symlink 缺失。`./bin/sk deploy` 一個指令就修完。  
**Effort:** ~30 行 bash + 一條 agents.conf row。  
**Expected impact:** structural WARN 從 11 → 0，未來 audit / test 報告更乾淨，真正異常不會被淹沒。

### 2. Watchdog 升級「重複失敗 → deeper recovery」邏輯
**為什麼現在做：** 04-27 的 80 分鐘死循環是 watchdog 的設計盲點 — 連續 N 次 kickstart 都失敗時，目前還是繼續 kickstart。應該在第 N 次（例如 5 次）後升級到 deeper recovery（對 web 是 `rm -rf .next && npm run build`、對 api 可能是其他動作）。  
**Effort:** ~20 行 bash 加進 `bin/sk-watchdog`，state file 多紀錄一個 `total_restarts_today` 欄位。  
**Expected impact:** 下次撞到任何半損 build / 半損 cache 類問題不需要人工介入。  
**Tradeoff:** 自動 rebuild 成本高（30-60 秒 + 阻斷服務），不能太積極 — N 設大一點（例如 ≥5 次連續失敗才升級）。

### 3. 查清 token 花費 2.8x 跳動
**為什麼現在做：** 一週 USD 9k 是不小的數字，如果是真實工作量，當參考點；如果是抓取或計費 bug，會誤導未來決策。  
**Effort:** 開 dashboard `/tokens` 頁面、看哪天 / 哪 project 暴漲。15 分鐘以內。  
**Expected impact:** 未來成本對話有正確基線。

## 對照上週

第一次 retro，無上週對照。下週 retro 時應該驗證：

- [ ] Action 1（symlink-fix agent）— WARN 數應該降到 0
- [ ] Action 2（watchdog 升級）— 不會再看到 27x 同一日 restart loop
- [ ] Action 3（token 花費調查）— 知道 9k 是真實還是異常

---

*產生工具：`skills/meta/workflow-retro` v1.0.0（首次執行）*
