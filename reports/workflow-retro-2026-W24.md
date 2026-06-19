---
date: 2026-06-14
iso_week: 2026-W24
period: 2026-06-08 to 2026-06-14 (last 7 days)
source: workflow-retro
api_status: ONLINE @ :8001 — 直連可用（首探 000 為 cold-start 暫態，重試即 200）。注意 retro skill 的 SKILL.md 第 53/84 行仍寫死 :8000，假 outage 的引信還埋著，沒拆。
---

# Workflow Retro — 2026-W24

## TL;DR

**本週工作重心整個換軌，而上週點名的系統爛瘡一個都沒修。** W23 還是 PE DD 主場（`tw-company-pe-memo` 第二高頻、token 集中 taiwan-company 48%），本週 PE 幾乎清零——核心 stub `tw-company-pe-memo` **不是被實作，是被整個刪掉**（最後使用停在 06-03），工作流轉向 MOPS 叢集（filer 對帳、universe remediation、ingest、notes backfill）＋ jk-nb vault ＋ `code-review`(8 次，commit 把關常態化)。成本同步腰斬：上週 $3,598 → 本週 **$1,645**。好消息是 **retry storm 退燒**——`workflow-retro` 從 W23 的 164 次降到 12 次、無單日破百尖峰。壞消息是 **W23 三條 action 完成度僅 0.5/3**：retro 自己的 `:8000` 埠號仍寫死、`tw-company-pe-memo` 沒補反刪（周邊還增生 3 支新 stub，正是上週警告的「過度 skill 化」成真）、三個失敗 agent（`janitor`/`maintain`/`tester`）連同 `/api/agents` 回空、watchdog 未部署——全部原地踏步。**本週最重要的發現是元層級的：retro 連續兩週指出同一批爛瘡，沒人修，報告本身的信噪比正在被自己拖低。**

## 使用度

資料來源：`GET :8001/api/skills/usage`（7 天窗 = 06-08~06-14）、`systemctl --user list-units 'com.sk.*'` + 每 unit `show -p Result`。

| Status | Skills | Agents (systemd) |
|--------|--------|------------------|
| 高頻 (5+ this week) | `workflow-retro` (12 ↓), `code-review` (8), `2-jk-nb-consume` (5) | `dashboard.api`、`dashboard.web`、`workflow-retro`（running）|
| 低頻 (1-4 this week) | 22 支長尾：`jk-nb-digest`(4)、`mops-filer-list-reconcile`(3)、`skill-creator`(2)、`mops-universe-remediation`(2)、`deploy`(2)、`tw-company-pe-memo-refine`(1)、`task-brief`(1)、`requirement`(1)… | `harvest`（inactive，exit 0 正常收工）、`symlink-fix`（inactive）|
| 沉寂 (30+ days) | 無（端點追蹤的 109 支 skill，30 天內全部觸發過）| — |
| 失敗 (exit-1) | — | `janitor`、`maintain`、`tester`（全 exit-code 1，連 2+ 週）|

**解讀：**
- `workflow-retro` 仍是本週最高頻（12），但這次是**真實使用**不是 retry storm——扣掉 06-13 的 7 次，其餘日都 1–2 次，無 153/159 那種轟炸。W23 Action 1 的 retry guard 看來生效了（埠號卻沒一起修，見下）。
- `code-review` 8 次躍上高頻，反映 commit-before-push 把關已成常態，是健康訊號。
- **PE DD 從主場變冷板凳**：整個 `tw-company-pe-memo*` / `pe-memo-*` 家族本週合計只觸發 1 次（`-refine` 06-13）。核心 skill `tw-company-pe-memo` 目錄已不存在（git 最後身影在 `d4ca980 snapshot`）。需求沒消失（06-13 harvest 記到「同一 PE DD 任務跑 3 趟全斷尾」），但承接它的核心節點被刪了。
- 長尾健康、無沉寂可退役。
- **Agent 面零進展**：`tester` 產出的 `test-2026-06-14.md` 是 144/144 結構 pass + BUILD SUCCESS（work 成功），unit 卻仍 exit-1；`janitor`/`maintain` 真失敗。三者讓 `/api/agents` 持續回 `total:0`，dashboard 的 agent 健康面板等於全盲——與 W23 完全相同。

## 重複痛點

### 1. PE DD 過度 skill 化——核心被刪、周邊增生 stub
- **頻率**：harvest 06-11 / 06-12 / 06-13 連三天 + W23 carryover；本週 PE 家族現存 5 支衛星（`-refine`、`-deep-research`、`-silent-fail-rate-alert`、`-trigger-fix`、`-already-generated-guard`），其中 **3 支仍是 auto-generated stub**（`-deep-research`、`-refine`、`-trigger-fix`），另含一個空殼 `pe-dd-structured-source-first`（31 行、`TRIGGER when: when working with...`）。
- **類別**：Architectural
- **代表性事件**：06-12 harvest 還在喊「緊急：修復 `tw-company-pe-memo` 觸發規則 + 填充 stub」；06-13 harvest 直指空殼 `pe-dd-structured-source-first`「名字像主流程卻沒內容，**遮蔽路由**，建議重寫或刪除」。結果到 06-14，核心節點被**刪掉**、周邊 stub 仍在——正好是 W23 警告「別在周邊長新 skill」的反向實現。
- **建議**：PE pipeline 不缺 skill、缺一個有內容的入口。下週要嘛重建**一支**真實 `tw-company-pe-memo`（source-first + silent-fail guard，已有 `-silent-fail-rate-alert`/`-already-generated-guard` 兩支真 skill 可掛），要嘛把 3 支 stub + 空殼 `pe-dd-structured-source-first` 直接退役，別讓它們繼續遮蔽路由。

### 2. harvest 連週結論「別建、維護既有」，但維護從沒發生
- **頻率**：6 份本週 harvest（06-08「併入既有 audit，不獨立」、06-09「補現有 stub 而非新建」、06-11「擴充現有技能而非新建」×3、06-12「不建立新 skill，先修 stub」、06-13「非新增，重寫或刪空殼」、06-14「本批不建議新增任何 skill，價值全在維護既有三支」）。
- **類別**：Editorial
- **代表性事件**：06-14 harvest 標題即「這是一次幾乎全重複的收割」——主導形態已被 `1-taiwan-news-multiday-digest` 完整覆蓋，真正價值是把現有 skill 的 description/trigger 從「5–8 天」拓寬到「數日至 5 週」、把 orchestrator 的固定 4 產業改成可帶參數。
- **建議**：harvest 已把「拓寬 vs 新建」判斷得很準，瓶頸在**沒有把這些 editorial 微調落地**。這類「改 description / 加 trigger / 加參數」是 5–15 分鐘的機械活，適合排一個小批次一次清掉（`1-taiwan-news-multiday-digest` 拓寬天數、`multi-industry-news-pipeline-orchestrator` 產業參數化），而不是每週 harvest 再記一次。

### 3.（元）W23 的爛瘡清單原封不動搬到 W24
- **頻率**：3 條 W23 action 對應的病徵本週全數複現——retro 自身 `:8000`（SKILL.md 53/84 行未改）、`tw-company-pe-memo` 未補（反刪）、三失敗 agent + `/api/agents:0` + watchdog 缺席。
- **類別**：Architectural（兼 process）
- **代表性事件**：`test-2026-06-14.md` 的 Agent Health Check 仍寫「Not loaded in **launchd**」——這台是 **systemd**，tester 還在查一個不存在的 init 系統，所以 4 個 agent 全被誤判「未載入」。這是 retro 指出過、但連檢測器本身都還沒移植的證據。
- **建議**：見「下週 Actions」——這三條不能再 carry 第三週，否則 retro 的可信度本身就是下一個要退役的東西。

## 集中度

- **Token 集中**：`/api/tokens/filtered` **不提供 project 維度**（`by_project` 缺、daily 無 project 欄位），無法照 skill 模板做「>40% 專案」判斷——這是 API 的能力缺口，記為發現。退而求其次看 model：32 天窗 $9,851 中 `claude-opus-4-8` **$5,738（58%）**為絕對主力，`sonnet-4-6` $1,975、`opus-4-7` $1,824。本週（06-08~14）實際成本 **$1,645，較上週 $3,598 砍半**，與 PE DD 退場、改跑成本較低的 MOPS/vault 任務一致。另：base 端點 `/api/tokens`（非 filtered）回傳**全 0**，已壞，dashboard 若有頁面讀它會顯示空白。
- **失敗集中**：`janitor` / `maintain` / `tester` 三 unit 全 exit-1（exit 時間皆為 06-14 當天排程），`/api/agents` 因此回 `total:0`，agent 健康無法經 dashboard 觀測——與 W23 同一組、無變化。
- **Dashboard 健康**：`reports/watchdog.log` **仍不存在**，`.watchdog-state` 也沒有——HTTP-probe watchdog 連續多週未部署（呼應既有 memory 的「watchdog 部署缺口」）。本週 API 首探 000、重試才 200，正是 watchdog 該補的盲區，但它還沒上線。

## 下週 Actions (max 3, prioritized)

1. **拆掉 retro 自己的引信：SKILL.md `:8000` → `:8001`（或改讀 PORTS.md）**
   *為什麼是現在*：這是全清單最低成本、最高槓桿的一條。只要兩行（第 53、84 行）還寫 `:8000`，每一次手動或排程跑 retro 都會先撞 000、然後可能誤判 outage——W19–21 連報三週假 outage 的引信至今沒拆，本週我也是靠記憶手動轉 8001 才拿到資料。
   *Effort*：~5 分鐘（改 2 處字串；理想是改成讀 `~/PORTS.md` 的 `8001 rivendell dashboard-next API` 列）。
   *驗證*：grep SKILL.md 無 `:8000`；下週 retro 直連即拿到資料、API 區塊無「重試才通」字樣。

2. **一次修好 agent 可觀測性：tester 的 launchd→systemd 移植 + janitor/maintain 真失敗根因**
   *為什麼是現在*：W23 Action 3 完全沒動、第 3 週。`tester` 的健康檢查還在查 launchd（這台是 systemd），把 4 個 agent 全誤判「未載入」；同時 `janitor`/`maintain` 是真 exit-1。兩者疊加讓 `/api/agents` 回 `total:0`，整個 agent 面板瞎掉。先把檢測器換成 `systemctl --user is-active/show -p Result`，再分流兩個真失敗，才能還原可觀測性。
   *Effort*：~30 分鐘（檢測器改 systemctl + 看兩個 wrapper script 結尾為何回非零，多半是 git/symlink 步驟被當失敗）。
   *驗證*：`test-*.md` 的 Agent Health Check 用 systemd 語彙、回報實際載入數；`/api/agents` 不再 `total:0`。

3. **了結 PE constellation：重建一支真 `tw-company-pe-memo` 或退役 3 支 stub + 空殼**
   *為什麼是現在*：核心節點已刪、整個家族本週只用 1 次，卻留著 3 支 auto-generated stub（`-deep-research`/`-refine`/`-trigger-fix`）＋空殼 `pe-dd-structured-source-first` 在遮蔽路由。harvest 連三天點名。要嘛補一個真入口（掛現成的 `-silent-fail-rate-alert`/`-already-generated-guard`），要嘛刪乾淨——不要維持「半個 pipeline」這種最差狀態。
   *Effort*：~30–45 分鐘（二選一：寫一支真 SKILL.md，或 `git rm` 4 個空殼並同步 README）。
   *驗證*：`grep -rl 'when working with' skills/workflow/*pe*` 歸零；下週 harvest 不再出現「空殼遮蔽路由」觀察。

## 對照上週

W23 三條 action 完成度 **0.5 / 3**（可行動項，watchdog 為 carry 備忘未計入分母）：

| W23 Action | 完成狀態 | 說明 |
|-----------|---------|------|
| 1. 修 retro 自身：`:8000`→`:8001` + retry guard | ⚠️ 半完成（0.5） | **retry guard ✅**：`workflow-retro` 164→12、無單日破百尖峰。**埠號 ❌**：SKILL.md 53/84 行仍寫死 `:8000`，引信沒拆 |
| 2. 實作 `tw-company-pe-memo` SKILL.md | ❌ 比沒做更糟（0） | 核心非但沒補，**整個目錄被刪**（最後使用 06-03）；周邊反增生 3 支新 stub——W23 警告的「過度 skill 化」成真 |
| 3. 分流 3 失敗 unit（tester 假 exit-1 先修）| ❌ 未動（0） | `tester`/`janitor`/`maintain` 仍 exit-1，`/api/agents` 仍 `total:0`，tester 健康檢查仍查 launchd（這台是 systemd）|

**W23 → W24 關鍵指標：**

| 指標 | W23 | W24 | 趨勢 |
|------|-----|-----|------|
| Dashboard API | ONLINE @ :8001（修埠後恢復）| ONLINE @ :8001（skill 仍寫死 :8000）| → 服務穩、文件未修 |
| `workflow-retro` 觸發 | 164（retry storm）| 12（真實使用）| ✅ 退燒 |
| 本週成本 | ~$3,598 | ~$1,645 | ↓ 腰斬（PE 退場）|
| 高頻工作領域 | PE DD（taiwan-company 48%）| MOPS 叢集 + jk-nb vault + code-review | → 換軌 |
| `tw-company-pe-memo` | 34/7d 第二高頻、stub | **目錄已刪**、家族 1/7d | ↓↓ 從主力到清零 |
| Skill 結構驗證 | 173/173 pass | 144/144 pass（16 通用 skill 已移出）| → 數量變、健康度同 |
| 失敗 agent | janitor+maintain+tester | janitor+maintain+tester | → 第 2+ 週原地 |
| `/api/agents` | total:0（瞎）| total:0（瞎）| → 無改善 |
| watchdog | 未部署 | 未部署 | → 無改善 |
