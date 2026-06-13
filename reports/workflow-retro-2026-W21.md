---
date: 2026-05-24
iso_week: 2026-W21
period: 2026-05-18 to 2026-05-24 (last 7 days)
source: workflow-retro
api_status: OFFLINE — 第 3 週連線拒絕（127.0.0.1:8000）
---

# Workflow Retro — 2026-W21

## TL;DR

本週 meta 信號蓋過任何單一指標：**W19、W20 列出的相同 3 條 Action 已連續第 3 週原地踏步**——systemd 遷移未上線、`tw-company-pe-memo` 仍是 stub、`.next/lock` 仍偶發。同期 PE DD 量產規模再翻倍（本週共 37 個 PE memo session），但 routing rate 從 W20 的 29% 退到 **11%**，等於每多一輪批次就是一次未被 skill router 收編的工作流。本週實際完成的 5 個 commit 全是「新增 skill / 註解 docs」（`doc-coauthoring`、`internal-comms` 從 anthropic/skills 移植；skill-scout 強化），方向偏「新增」而非「修舊」。**最重要的發現是 retro 自己**——當行動清單連 3 週被忽略，繼續列同 3 條就是讓 retro 變噪音，這週改規則。

## 使用度

> Dashboard API 第 3 週連線拒絕，下表來自 7 份 harvest 報告（05-18、05-19、05-22、05-23、05-24、05-24-batch3）+ 7 份 test 報告。05-20 因撞用量上限無 harvest，05-21 無 harvest。

| Status | Skills |
|--------|--------|
| 觸發頻率最高 | `tw-company-pe-memo`（4 hits / 37 PE DD session = **11%**，集中於 05-19 session 3 + 05-22 session 8 + 05-24-batch3 #6 #23）|
| 自動化呼叫但不過 router | `taiwan-news-classifier`、`1-taiwan-news-multiday-digest`、`5-taiwan-news-weekly-digest`、`taiwan-industry-classifier`、`tw-company-website-finder`（headless agent 用結構化 prompt 直接呼叫，無 Skill tool call，運作正常） |
| 本週新增 | 144 → 148（+4）：`doc-coauthoring`、`internal-comms`（0b334bd 移植自 anthropic/skills）、其餘 2 個來自 untracked 提交 |
| 沉寂 / 無法量化 | dashboard API 離線第 3 週，30 天沉寂清單無從查詢 |

**Agent 狀態：**

- launchd 健康指標連續 7 天 0/4 FAIL，**第 3 週的 wolf-crying**（agent 透過 cron / 其他通道仍在跑，但 tester 還在用 launchd 量）
- harvest agent 本週實際產出 6 份報告，分析 ~98 個 session
- doctor agent log 連續第 9 天空白
- watchdog log（`reports/watchdog.log`）仍不存在
- `dashboard-next/api.log` 顯示 API 曾正常服務（`/api/agents` 200），最後一行為 `Shutting down ... Finished server process [17701]`——啟動過、再關閉、未再開

**解讀：** Skill 庫數量持續微增（+4），但「被 Skill router 觸發」的比率不升反降。新增的 `doc-coauthoring` / `internal-comms` 是港口式移植，不是被使用驅動。

## 重複痛點

### Theme 1：`tw-company-pe-memo` trigger + 主體 stub 仍未修（連續第 3 週）

- **頻率**：W19 → W20 → W21 連續三週均為 P1；本週 4 份 harvest（05-18、05-19、05-22、05-24-batch3）都點到此問題；routing rate 0%→29%→**11%**（退步）
- **類別**：Editorial + Architectural
- **代表性事件**：harvest-05-24-batch3 量化 18/20 PE DD session 繞過 skill；TRIGGER 條件 `when working with tw-company-pe-memo` 在真實 prompt 中永遠不會自然出現——真實開頭是「你是一位在台灣有豐富經驗的資深私募股權（PE）投資人...」
- **建議**：重寫 SKILL.md 的 TRIGGER 為使用者實際語句（「資深 PE」「初步盡職調查」「Due Diligence」「投資備忘錄」「DD memo」）+ 填入主體流程（ToolSearch → WebSearch 4–10 → WebFetch 2–7 → 結構化輸出）

### Theme 2：批次 DD 缺去重（連續第 2 週）

- **頻率**：W20 加合科技 ×5；W21 又見「羅賓斯科技 ×2」（05-24-batch3 #3、#18）、「日目視覺藝術 ×2」（#12、#24）、加合 ×5（05-18）
- **類別**：Mechanical
- **代表性事件**：兩週合計浪費 ~10 次重複 PE DD ≈ 100 次冗餘 API call（每次 6 WebSearch + 4 WebFetch）
- **建議**：W20 已建議在批次排程腳本前置 dedup，或在 `tw-company-dd-pipeline` SKILL.md 加 dedup checklist。本週仍無動作

### Theme 3：Dashboard build 不穩（2 種失敗模式）

- **頻率**：W20 `.next/lock` 3/7；W21 `.next/lock` 1/7（05-24）+ Next.js Geist font / turbopack 模組找不到 1/7（05-22，新失敗模式）
- **類別**：Mechanical（lock 殘留）+ Architectural（turbopack 字型）
- **代表性事件**：test-2026-05-22 失敗於 `[next]/internal/font/google/geist_a71539c9.module.css` `Module not found: @vercel/turbopack-next/internal/font/google/font`；test-2026-05-24 完全重現 W20 的 `Unable to acquire lock at .next/lock`
- **建議**：lock 一行修（tester build step 前 `rm -f dashboard-next/.next/lock`）；turbopack 字型需獨立 debug（pin Next.js 版本或關 turbopack flag）

### Meta-Theme：行動清單第 3 週原地踏步

- **頻率**：W19、W20、W21 = 3 週同 3 條 Action，0/3 → 0/3 → 0/3
- **類別**：Architectural（執行通道斷掉，不是技術阻塞）
- **代表性事件**：W20 Action 1 systemd / Action 2 tw-company trigger / Action 3 `.next/lock`，本週完成 0 條；同期實際完成的 5 個 commit 全在「新增 skill / docs」軌道
- **建議**：retro 自己改規則（下文 Actions §2）

## 集中度

- **Token 集中**：第 3 週無 API 數據，但 **05-20 出現 `You're out of extra usage · resets 10:20pm`**（harvest 報告檔內容只有這一行）——本月**首次明確撞用量上限**。taiwan-company 專案（本週 ~60 個 session、37 次 PE DD，每次 6–10 WebSearch + 3–7 WebFetch）是月成本主力，這是 3 週來第一個天然量化 marker。
- **失敗集中**：
  - PE DD routing miss rate **89%**（33/37 未經 skill router）
  - Build 失敗率 2/7 = 29%（從 W20 的 43% 略降，但根因未修）
- **Dashboard 健康**：API 第 3 週 OFFLINE；watchdog 第 3 週未上線；api.log 顯示曾跑過再關閉，未再開
- **執行集中**：本週 5 個 commit 全為「新增 skill / docs」（`doc-coauthoring`、`internal-comms`、skill-scout 強化、workflow-map 註解、learnings 排隊 slide-office-hours + cost-aware-model-routing），**0 個處理 W19/W20 行動項**——這就是 Meta-Theme 的因果證據

## 下週 Actions

> **本週改規則：只列 1 條必做、1 條改 retro 自身運作的元行動、1 條備忘。** 連續 3 週重複列同 3 條等於把 retro 變成噪音。

### 1. 修 `tw-company-pe-memo`（trigger + 主體），一次到位

**為什麼是這個：** 是唯一同時擁有「量化證據」（37 個 session、11% routing rate、最高頻工作流）、「一次性修復」（單一 SKILL.md 檔，無 systemd 那種跨機器依賴）、「立即驗證指標」（下週 routing hit rate 自動產出）的項目。systemd 與 `.next/lock` 連 3 週未動可能有別的卡點；這條的卡點純粹是文件編輯，無藉口。  
**Effort：** ~30 分鐘。重寫 TRIGGER 段為使用者實際語句 + 填入 4 步驟主體（ToolSearch → WebSearch → WebFetch → 結構化輸出）。  
**驗證：** 下週 harvest 報告 PE memo routing hit rate 需 **≥ 50%**。若仍 < 30%，問題不是 skill 本身而是 routing 機制，升級為 Architectural 調查。

### 2. （元行動）把 systemd 遷移 + `.next/lock` 移出 retro，改放 `FEATURE_REQUESTS.md`

**為什麼：** Retro 連續 3 週把同 actions 列出無人執行，代表 retro 不是這些工作的有效驅動通道。繼續列只是把 retro 自己變噪音。改派到 `.learnings/FEATURE_REQUESTS.md` 或使用者直接管理的通道後，retro 下週起只追新發現。  
**Effort：** ~10 分鐘。把兩條附本週證據 append 到 FEATURE_REQUESTS.md，retro 不再列。  
**驗證：** 下週 W22 retro 不再列這兩條；使用者明確標示是否認可這個改派。

### 3. （備忘，不行動）05-20 usage cap 是 token 集中的第一個硬證據

**為什麼：** 3 週 API offline 讓 token 量化困難，但 05-20 撞 cap 是天然 marker——`taiwan-company` / PE DD pipeline 是月成本主力。若下週 API 仍未上線，建議改用 `~/.claude/projects/` session 計數作 fallback metric。本週不行動，僅留紀錄。

## 對照上週（W20）

| W20 Action | 完成狀態 | 說明 |
|-----------|---------|------|
| 1. 完成 systemd 遷移，讓 dashboard API 重新上線 | ❌ 未完成（連續第 3 週） | API 第 3 週 OFFLINE（W19→W20→W21）；`bin/sk-setup-systemd` 仍 untracked；tester 4/4 FAIL 持續 |
| 2. 補齊 `tw-company-pe-memo` + `tw-company-website-finder` 實作 + trigger | ❌ 未完成（且退步） | routing rate 29% → **11%**；SKILL.md 仍為 TODO stub；trigger 未改 |
| 3. 修復 `.next/lock` 間歇性 build 失敗 | ❌ 未完成 | 05-24 完全重現 `Unable to acquire lock at .next/lock`；另新增 05-22 Next.js Geist font / turbopack 失敗 |

**W20 → W21 關鍵指標：**

| 指標 | W20 | W21 | 趨勢 |
|------|-----|-----|------|
| Skill 驗證數量 | 144 | 147–148 | ↑ +3–4（`doc-coauthoring`、`internal-comms`、其他 2） |
| Structural WARN | 0 | 0 | → |
| Build 成功率 | 4/7 (57%) | 5/7 (71%) | ↑ 但根因未修 |
| Dashboard API | OFFLINE | OFFLINE | → 第 3 週 |
| PE memo routing rate | ~29% (4/14) | ~11% (4/37) | ↓ 顯著退步 |
| 批次 DD sessions / 高峰日 | 30 | 33（05-24 兩份 harvest）| ↑ |
| Token / usage cap | 無資料 | 05-20 hit cap | ⚠️ 首次量化信號 |
| W19/W20 actions 完成率 | 0 / 3 | 0 / 3（沿用同 3 條）| → 連續 3 週 0% |

---

*產生工具：`skills/meta/workflow-retro`（file-based fallback，API OFFLINE 第 3 週）*
