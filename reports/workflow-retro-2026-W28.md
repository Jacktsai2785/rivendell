---
date: 2026-07-12
iso_week: 2026-W28
period: 2026-07-06 to 2026-07-12 (last 7 days)
source: workflow-retro
---

# Workflow Retro — 2026-W28

## TL;DR

本週是 rivendell 從 macOS/launchd 遷移到 WSL2/systemd（`~/skill-lab/rivendell`）後第一個完整運轉週，也是距上次 retro（W18，2026-05-03）**相隔 10 週**的第一份報告——retro 斷更本身就是本週最重要的 meta 發現。活動量正常（17 sessions、約 349 則訊息），但觀測基礎設施只搬了一半：dashboard API 三個端點全部失聯（port 8000 已被另一專案「台灣產業商情平台」佔用），tester / skill-audit / watchdog 自 5 月初後未再排程，本週可信的數據來源只剩 harvest、maintain 與 session 檔案。本週最大工時痛點是 skill 目錄搬遷後的前端資料漂移（98 則訊息人工修復），與 `.learnings/` 既有的三條搬遷殘留教訓同構——漂移偵測值得升級為 skill。

## 使用度

> ⚠️ `/api/skills/usage` 失聯（見「集中度」），本節僅能從 harvest-2026-07-12 的 session 敘事重建，無法給出完整 per-skill 計數，「沉寂 30+ 天」欄位本週無法判定。

| Status | Skills | Agents |
|--------|--------|--------|
| 高頻 (5+ this week) | `/engineering:code-review`（7 次，sessions 2–7、17，rivendell 前端迭代審查） | — |
| 低頻 (1-4 this week) | `task-brief`（含 2 次被質問未調用後強制化）、`mockup`、`1-repo-cold-start`（第二台裝置重建環境） | `harvest` ✅（07-03、07-12 各成功一輪）、`maintain` ✅（每日 exit 0、symlinks OK）、`workflow-retro` 本次首次在 WSL 跑成 |
| 沉寂 (30+ days) | 無法判定（usage 數據源斷） | `tester` / `skill-audit` / `watchdog` — 最後產出 2026-05-04（檔案 mtime 07-11 為搬遷複製），在 WSL 環境**從未排程** |

**解讀**：agent fleet 呈現「一半活著、一半殭屍」——harvest/maintain 的 cron 有跟著遷移走，tester/audit/watchdog 沒有。reports/ 目錄裡 5 月的舊報告會讓人誤以為它們還在跑，這種假象比單純沒有報告更危險。

## 重複痛點

### Theme 1：repo/skill 搬遷後的路徑與資料漂移
- **頻率**: 4+ 次跨 sources（`.learnings/` 2026-05-22 undeploy orphan symlinks、05-23 sk-setup-agents 硬編碼路徑、05-26 gstack relink dangling；本週 harvest sessions 8–9 共 98 則訊息人工修復 `playbook-data.ts` 與磁碟目錄不符）
- **類別**: **Mechanical** — 每次都是「比對實際目錄 vs 衍生資料/symlink → 逐一修正」的人工迴圈，完全可自動化。
- **代表性事件**: gstack 搬進 skill-lab 後，前端顯示的 skill 路徑全面失真，session 8+9 用 66 次 Bash 手工比對修完。
- **建議**: 建 `skill-catalog-drift-sync`（harvest 已列 Strong #1）——skill-lab 架構下目錄還會再搬，這是結構性復發。

### Theme 2：平台遷移（macOS→WSL）後的服務韌性缺口
- **頻率**: 3+ 次（harvest session 10「rivendell 整個壞掉了」救援並產出 `rivendell-systemd-services.md`；watchdog skill 明確綁 launchd、WSL 無對應物；port 8000 被「台灣產業商情平台」佔用導致 dashboard API 全滅）
- **類別**: **Architectural** — KeepAlive/watchdog/port 治理整套韌性設計都是 launchd 語彙，沒有翻譯到 systemd。
- **代表性事件**: 本次 retro 實測 `GET /api/skills/usage` → 404，port 8000 上跑的是 uvicorn 別專案。
- **建議**: 建 `service-watchdog-systemd`（harvest Strong #2，素材 `rivendell-systemd-services.md` 現成）＋ 重新分配 port（`.learnings/` 2026-04-01 早有「先查 port map 再啟服務」的教訓，這次是反向被別人佔）。

### Theme 3：task-brief gate 遵守度
- **頻率**: 3 次相關痕跡同週出現（sessions 9、11 兩度被使用者質問「你有先調用 task-brief 嗎」；隨後 gate 寫死進 `~/.claude/CLAUDE.md` 並存入 memory）
- **類別**: **Editorial** — 規則存在但執行不穩，屬流程紀律而非工具缺口。
- **代表性事件**: session 11（twstock 開工）被質問後才補跑 gate。
- **建議**: 不新建 skill（harvest 對 `gate-compliance-retro` 的結論相同）——在 workflow-retro / session-harvest 加一個「gate 遵守度」檢查項即可，下週 retro 直接回報質問次數是否歸零。

## 集中度

- **Token 集中**: **無法計算** — `/api/tokens` 失聯。此即本週最大集中度發現：**dashboard API 整組不在了**。port 8000 現由「台灣產業商情平台」（uvicorn，pid 283）佔用；systemd user units 裡雖有 `rivendell-api.service`，但 rivendell 端點全部 404。retro 三軸中兩軸（usage、tokens）目前全盲，且會持續盲到 port 衝突解決為止。
- **失敗集中**: 本週有紀錄的 cron 全部 exit 0（harvest ×2、maintain 每日）。tester / skill-audit / watchdog 是「未跑」而非「失敗」——排程斷點在 2026-05-04，狀態上比失敗更該處理。
- **Dashboard 健康**: `watchdog.log` 不存在 = watchdog **未部署**，不能解讀為「零重啟的健康週」。

## 下週 Actions (max 3, prioritized)

1. **恢復 dashboard 資料鏈路（port 重配 + rivendell-api 復活）** — Why now: retro 三軸兩軸盲，usage/token 所有觀測都建立在這上面；再拖一週，下次 retro 還是只能講故事不能看數。Est. effort: 1–2 hr（確認台灣產業商情平台與 rivendell-api 的 port 分配、改 systemd unit、驗證三端點 200）。Expected impact: W29 retro 恢復完整三軸數據。
2. **建 `skill-catalog-drift-sync` skill** — Why now: 本週 98 則訊息的人工版剛發生、`.learnings/` 三條同構教訓在案，harvest 已排第一優先；skill-lab 目錄整併還在進行中，必然再犯。Est. effort: ~2 hr。Expected impact: 下次搬目錄從 98 則訊息降到一次 skill 調用。
3. **裁決 tester / skill-audit / watchdog fleet 的去留** — Why now: 殭屍狀態（舊報告在、排程不在）會持續污染 reports/ 的可信度。要嘛以 systemd timer 重排（可與 `service-watchdog-systemd` 一起做），要嘛正式退役並把 5 月舊報告歸檔到 `reports/archive/`。Est. effort: ~1 hr。Expected impact: reports/ 目錄恢復「有檔案 = 有在跑」的語意。

## 對照上週

> 上一份是 W18（2026-05-03），相隔 10 週——嚴格說不是「上週」。**retro 排程沒有跟著環境遷移走，斷更 9 週**，是本節最重要的事實；本次 cron 已在 WSL 首跑成功，算是斷點修復的第一步。

- **上週（W18）actions 完成度: 1 / 3**
  - ✅ `start-web.sh` sentinel build 偵測 — 已實作（`start-web.sh:18` 有 `.next/.build-complete`）
  - ❌ `presales-pipeline` README 補「通路商」段落 — skill 目錄內 grep 無任何「通路」字樣
  - ❌ `knowledge-graph` description 對齊檢查 — frontmatter 原封不動（v1.0.0），無改寫或退役痕跡
- **指標變化**: watchdog 事件數（W18: 6 次）與 token 集中度（W18: 66%）本週皆無數據可比——數據源斷裂本身取代了指標。W29 若 Action 1 完成，才能重建趨勢線。
