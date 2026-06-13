---
date: 2026-06-07
iso_week: 2026-W23
period: 2026-05-31 to 2026-06-07 (last 7 days)
source: workflow-retro
api_status: ONLINE — 修正連線埠後恢復。dashboard API 實際跑在 :8001（見 RUN.md / PORTS.md），skill 與排程寫死的 :8000 才是 W19–W21「3 週 OFFLINE」的真因
---

# Workflow Retro — 2026-W23

## TL;DR

**過去 3 週的「API OFFLINE」是假的。** dashboard API 一直好好地跑在 `:8001`（uvicorn PID 303，RUN.md / PORTS.md 都明載已遷埠），是 retro skill 自己寫死 `curl :8000` 才連不上——W19/W20/W21 連報三週的 outage 是 retro 在罵自己。改連 8001 後資料全回來了。同時挖出更嚴重的一件事：**workflow-retro agent 自己進入 retry storm**——06-06 觸發 **159 次**、05-28 觸發 153 次，把用量打爆，導致 W22 retro 檔變成一行 `You're out of extra usage`、W23 原檔 0 bytes。换句話說，本週「最不健康的 agent」就是 retro 本身。實質工作面：token 高度集中在 PE DD（`taiwan-company` 佔 30 天成本 48%），而那條 pipeline 的核心 `tw-company-pe-memo` SKILL.md **連續第 4 週仍是 auto-generated stub**，卻已是第二高頻 skill（7 天 34 次）。

## 使用度

資料來源：`GET :8001/api/skills/usage`（7 天窗 = 05-31~06-07）、`systemctl --user list-units 'com.sk.*'`。

| Status | Skills | Agents (systemd) |
|--------|--------|------------------|
| 高頻 (5+ this week) | `workflow-retro` (164 ⚠️), `tw-company-pe-memo` (34), `taiwan-news-classifier` (8) | `workflow-retro`（running）|
| 低頻 (1-4 this week) | 24 個長尾：`jk-nb-digest`(4)、`2-jk-nb-consume`(4)、`user-flow`(4)、`findbiz`(3)、`tw-company-website-finder`(2)、`repo-rename`(2)、`session-harvest`(1)… | `harvest`、`symlink-fix`（inactive，timer waiting）|
| 沉寂 (30+ days) | 無（usage 端點追蹤到的 141 個 skill 全部 30 天內都觸發過）| — |
| 失敗 | — | `janitor`、`maintain`、`tester`（全 exit-code 1）|

**解讀：**
- `workflow-retro` 的 164 不是健康訊號，是病徵——其中 06-06 單日 159 次、05-28 單日 153 次（其餘日都是 1–7 次）。這是 retry storm，不是真實使用，見「集中度」。扣掉它，本週真實高頻只有 PE memo 與新聞分類兩支。
- `tw-company-pe-memo` 7 天 34 次、躍居第二高頻，但 SKILL.md 仍是 22 行 stub（`TRIGGER when: when working with tw-company-pe-memo` + `## TODO This skill was auto-generated`）。高使用 × 零實作，是本週最大的「該補沒補」。
- 長尾 24 支健康，無沉寂可退役項目。
- Agent 面：`tester` unit 報 exit-1，但它產出的 `test-2026-06-07.md` 其實是 **173/173 pass、BUILD SUCCESS**——work 成功、exit code 騙人。`maintain`/`janitor` 則是真失敗。三者一起讓 `/api/agents` 回傳空（`total:0`），dashboard 的 agent 健康面板等於瞎的。

## 重複痛點

### 1. PE DD 領域過度 skill 化（harvest 一直說「別建，併進去」）
- **頻率**：6+ 次跨 harvest（05-28、05-29、06-01、06-03-batch2、06-04、06-05、06-06）
- **類別**：Editorial / Architectural
- **代表性事件**：06-03-batch2 直言「現有 18+ 個 `tw-company-*` / `pe-*` skill 已涵蓋 identify→lookup→news→DD→batch→silent-fail-recovery 完整 pipeline，無新 Strong 候選」；多份報告反覆建議「併入既有、勿獨立」。
- **建議**：這不是要再建 skill，反而是訊號——PE DD pipeline 已飽和。下一步該做的是把那個還是 stub 的核心節點 `tw-company-pe-memo` 補實，而不是在周邊再長新 skill。

### 2. PE memo silent-fail / retry storm（燒 token 的真正破口）
- **頻率**：3+ 次（06-01：30 session 中 33% silent-fail；06-03：同一目標公司 retry 6 次；06-05：簡報抽取成功但 render 出空白段落）
- **類別**：Architectural
- **代表性事件**：06-01 harvest 把「30 session 33% silent-fail」正式列為要建 `pe-memo-silent-fail-rate-alert` 的理由——agent 在第一個 tool call 前就死，retry 重跑整條 pipeline。
- **建議**：與痛點 1 同源、同解——`tw-company-pe-memo` 補上 source-first + silent-fail guard 主體即可同時收斂兩者。已有 `pe-memo-silent-fail-recovery` / `-rate-alert` 候選在排隊，但核心節點不補，候選只是補丁。

> 註：TWstock-invest「資料不足／industry 標籤對不上明細」在 06-06 多份 harvest 出現，但集中在單日、未達「3 週為一 pattern」門檻，本週僅記錄、不升級為痛點。

## 集中度

- **Token 集中**：`/api/tokens/filtered` 回傳窗其實是 ~30 天（05-08~06-07，`days=7` 參數被忽略）。該窗總成本 **$10,540**，其中 `taiwan-company` 專案 **$5,097 = 48%**（>40% 門檻），`rivendell` 次之 $1,063。模型面 opus-4-8 ($4,582) + opus-4-7 ($3,974) 為主力。最近 7 天實際成本約 **$3,804**，兩個尖峰：06-06 **$1,237**、05-30 $1,306。
- **06-06 尖峰 = retry storm 的代價**：當天 $1,237 與 `workflow-retro` 觸發 159 次高度吻合——retro 自我重試把錢燒掉，產出卻是壞檔 W22。
- **失敗集中**：`janitor` / `maintain` / `tester` 三個 unit 全 exit-1；`/api/agents` 因此回空，agent 健康無法經 dashboard 觀測。
- **Dashboard 健康**：`reports/watchdog.log` **不存在**——HTTP-probe watchdog 連續多週仍未部署（與既有 memory「watchdog 部署缺口」一致）。本週若有 watchdog，理應在 API 連不上 :8000 時就示警，而非讓假 outage 連報 3 週。
- **元發現（最重要）**：retro 連續 3 週把「API OFFLINE」當天大發現寫進報告，沒人能修，因為**那個發現本身是錯的**——埠號漂移（8000→8001）從未被 retro 自己察覺。一個會持續產生錯誤發現、又把自己跑到爆量的觀測工具，是本週系統裡信噪比最差的元件。

## 下週 Actions (max 3, prioritized)

1. **修 retro 自身：連線埠 8000→8001 + 加 retry/idempotency guard**
   *為什麼是現在*：一條修兩個連 3 週的爛瘡——8000→8001 直接讓 API 資料回歸、終結假 outage；retry guard 擋掉 159 次/日的自我轟炸（那正是 W22 壞檔與 06-06 $1,237 的元兇）。卡點純粹是 `SKILL.md` 裡寫死的 URL + 排程缺鎖，無跨機器依賴。
   *Effort*：~30 分鐘（改 3 處 `:8000`、最好改成讀 PORTS.md/RUN.md；service 加單例鎖或「同 ISO 週已產出則 skip」）。
   *驗證*：下週 retro `workflow-retro` 觸發數 < 10、API 區塊有真實數據、無壞檔。

2. **真正實作 `tw-company-pe-memo` SKILL.md（已 carry 第 4 週）**
   *為什麼是現在*：它是第二高頻 skill（34/7d）、又坐落在唯一的 token 集中點（taiwan-company 48%）與兩條重複痛點的交會處，卻還是 auto-generated stub。補它 = 一次打到成本集中 + silent-fail + 過度 skill 化三個問題。這是 W21 Action 1 沒做完的延續，不是新項。
   *Effort*：~30–45 分鐘。寫真實 TRIGGER（使用者實際語句）+ 4 步主體（source-first：ToolSearch/identify → 結構化資料 → 證據搜尋 → memo 輸出）+ silent-fail guard。
   *驗證*：SKILL.md 不再含 `auto-generated` / `## TODO`；下週 harvest 的 PE memo silent-fail 比例 < 33%。

3. **分流 3 個失敗 unit：先把 `tester` 的假 exit-1 修掉，再判 `maintain`/`janitor` 是真死還是噪音**
   *為什麼是現在*：`tester` 產出的報告是 173/173 pass，但 unit 報 exit-1——這種「成功卻回非零」的噪音讓 `/api/agents` 全空、把真正在壞的 `maintain`/`janitor` 一起埋掉。先還原可觀測性，才知道後兩者要不要修。
   *Effort*：~20 分鐘分流（看 wrapper script 結尾為何回非零；多半是 5 個 symlink WARN 或 git 步驟被當失敗）。
   *驗證*：`tester` unit 回 exit-0、`/api/agents` 不再 `total:0`；`maintain`/`janitor` 失敗根因被分類為 mechanical / architectural。

## 對照上週

W22 retro 已損毀（內容僅 `You're out of extra usage`，即 retry storm 的直接證據），故以 **W21（最後一份完整 retro）** 為對照基準。

| W21 Action | 完成狀態 | 說明 |
|-----------|---------|------|
| 1. 修 `tw-company-pe-memo`（trigger + 主體）一次到位 | ❌ 未完成（第 4 週） | SKILL.md 仍 22 行 stub、TRIGGER 仍是 `when working with...`、`## TODO auto-generated` 仍在。但使用量逆勢上升（4/37 → 34/7d），代表需求真實、缺的就是實作 |
| 2.（元行動）把 systemd/`.next` 移出 retro 改放 `FEATURE_REQUESTS.md` | ✅ 大致完成 | `.learnings/FEATURE_REQUESTS.md` 存在且在用（近期 commit 已 queue `slide-office-hours`、`cost-aware-model-routing`）；retro 本週起確實不再列那兩條 |
| 3.（備忘）05-20 usage cap 是 token 集中首個硬證據 | ✅ 已量化 | 本週 API 回歸後證實：taiwan-company 佔 30 天成本 48%、PE DD 為月成本主力，與當時推測一致 |

**完成率**：可行動項 0.5 / 2（Action 2 完成、Action 1 第 4 週未動；Action 3 為備忘非行動）。

**W21 → W23 關鍵指標：**

| 指標 | W21 | W23 | 趨勢 |
|------|-----|-----|------|
| Dashboard API | OFFLINE（自報第 3 週）| **其實一直 ONLINE @ :8001**（埠漂移誤報） | ✅ 真因找到 |
| Skill 結構驗證 | 147–148 | 173/173 pass、BUILD SUCCESS | ↑ |
| Structural WARN | 0 | 5（皆 symlink missing in ~/.claude/skills/）| ↓ 退步，symlink-fix 待跑 |
| `tw-company-pe-memo` 使用 | 4/37（routing 11%）| 34/7d（第二高頻）| ↑ 需求漲、實作仍 0 |
| Token / 集中 | 僅 05-20 撞 cap | $10.5k/30d，taiwan-company 48% | ⚠️ 量化確立 |
| Retro 自身健康 | 連報假 outage | retry storm 159×/日 + 壞檔 W22 | ⚠️⚠️ retro 是本週最不健康元件 |
| 失敗 agent | tester FAIL | janitor + maintain + tester FAIL | → 持續 |
