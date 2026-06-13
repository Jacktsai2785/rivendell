---
date: 2026-06-10
iso_week: 2026-W24
period: 2026-06-03 to 2026-06-10 (last 7 days)
source: workflow-retro
api_status: OFFLINE — com.sk.dashboard.api.service 顯示 active running，但 :8000 / :8001 均無 HTTP 回應。全報告改用純檔案 fallback（harvest-*.md, test-*.md, systemctl）。API 離線本身列為集中度 findings。
---

# Workflow Retro — 2026-W24

## TL;DR

W23 三個行動**全未完成**（0/3）。`tw-company-pe-memo` stub 進入**第 5 週 carry-over**，這週的 harvest 仍每天撞到它：06-04 batch 60% silent-fail、dedup guard 完全沒攔住（和展綠能 ×10、時刻科技 ×9）。好消息：harvest 本週**跨出 PE DD 領域**，冒出 4 個正交強候選（`stock-data-gap-diagnose`、`mops-cluster-master-alignment-audit`、`post-backfill-indicator-recompute`、`mops-notes-structured-extractor`），skill 總數從 173 升到 **180**。但好消息被三個 agent 全 FAILED、dashboard API 死鎖、06-10 harvest 觸碰 usage cap 三件事蓋掉。最需要面對的事只有一件：`tw-company-pe-memo` 再不補就是主動選擇繼續燒錢。

---

## 使用度

> **資料來源**：`systemctl --user list-units 'com.sk.*'`、`reports/harvest-2026-06-03~10.md`、`reports/test-2026-06-10.md`。API 離線，無數值計數。

| Status | Skills（觀察到的觸發） | Agents（systemd） |
|--------|--------|------------------|
| 高頻 (5+ this week) | `tw-company-pe-memo`（每日 harvest 均覆蓋，trigger 失效但 prompt 直接走）、`taiwan-news-classifier`（06-06, 07, 08）、`jk-nb` 三件套（06-04, 05, 07）、`code-review`（06-07, 08） | `harvest`（running）、`workflow-retro`（running） |
| 低頻 / 新增 (1-4 this week) | `mops-cluster-master-alignment-audit`（本週新建 + 確認觸發）、`company-deck-ingestion`（06-05 多場）、`tw-company-website-finder`（06-05）、`taiwan-industry-classifier`（06-05）、`2-jk-nb-consume`（06-04, 05） | `dashboard.api`（running）、`dashboard.web`（running） |
| 失敗 | — | `janitor`、`maintain`、`tester`（全 FAILED） |
| 沉寂 (30+ days) | API 離線，無法查——本週略過 | — |

**Skill 總數**：180（+7 vs W23 的 173）。

**解讀**：
- 高頻中真正「走 skill」的比例仍低：`tw-company-pe-memo` 在 harvest 中每天出現，但 trigger 匹配失效——大量 PE DD session 是裸 prompt 直接跑而非走 skill。
- 本週出現**非 PE DD 領域**的 Strong harvest 候選，是近幾週最健康的多樣化訊號。
- `workflow-retro` 本週排程觸發後 W24 檔案 0 bytes（usage cap 或 port 問題）——retro 自身健康問題持續（W23 Action 1 未完成的直接後果）。

---

## 重複痛點

### 1. PE DD silent-fail + dedup guard 形同虛設

- **頻率**：本週 4 次（06-03, 06-04, 06-05, 06-09 均有記錄）
- **類別**：Architectural
- **代表性事件**：
  - 06-03 batch2：30 session 中 7 個 1-msg 0-tool silent-fail（23%），共宅一生 ×6 重複 retry
  - 06-04：28 個 DD session 中約 17 個 silent-fail（~60%），和展綠能 ×10、時刻科技 ×9，「dedup guard 顯然沒在入口生效」
  - 06-05：報告渲染層出現空白佔位段落（有標題無內容）
  - 06-09：session 1 前端「資料不足」未觸發 `stock-data-gap-diagnose` stub
- **建議**：這條痛點的根因在 `tw-company-pe-memo` 沒有實作——trigger 失效導致裸跑、裸跑沒有 guard、guard 沒有 skip-already-generated 邏輯。不是三個平行問題，是一個根節點。補 `tw-company-pe-memo` 主體（source-first + trigger + dedup 入口呼叫）= 一次打掉整條鏈。

### 2. tw-company-pe-memo stub 第 5 週 carry-over

- **頻率**：W21 / W22 / W23 / W24 retro 均列為 Action 1 或痛點，未完成
- **類別**：Editorial（需要寫實作）+ Architectural（缺口造成下游失敗連鎖）
- **代表性事件**：06-04 harvest「近 6 成沒走 skill 也沒跑工具，先確認 tw-company-pe-memo trigger 是否真的匹配」
- **建議**：Action 1 就是它。如果下週 retro 它還是 stub，這條痛點本身要停止記錄——記錄無效才是真正的問題。

> **本週觀察但未達門檻**：TWstock-invest「資料不足診斷」跨 06-06/08/09 三份 harvest 出現，對應 `stock-data-gap-diagnose` stub 存在但未觸發。若下週再現，升格為痛點。

---

## 集中度

- **Token 集中**：API 離線，無成本數據。**本週集中度盲區**本身是問題——整週燒了多少錢完全看不見。06-10 harvest 的「You've hit your session limit」是唯一間接訊號（週三下午即觸頂，暗示前半週已大量使用）。上週（W23）記錄 taiwan-company 佔 30 天成本 48%，無法本週更新。

- **失敗集中**：`janitor`、`maintain`、`tester` 三個 systemd unit 全部 FAILED。`test-2026-06-10.md` 顯示 Agent Health Check 0/4，原因「Not loaded in launchd」——但 systemctl 明確顯示 harvest 是 running。這是**假陽性**：tester 腳本仍使用 `launchctl` 語法在 Linux/systemd 環境下做健康檢查，macOS→Linux 遷移後的殘留。真失敗（janitor/maintain）被假失敗（harvest 其實活著）混淆，admin 無從分辨。

- **Dashboard 健康**：`reports/watchdog.log` **不存在**（HTTP-probe watchdog 仍未部署，見 MEMORY 中「watchdog 部署缺口」）。`com.sk.dashboard.api.service` 顯示 active running，但 curl :8000 / :8001 均無 HTTP 回應——服務活著、HTTP 死鎖，watchdog 正是為此而設計但沒跑。Dashboard Build 本週 FAILED（`.next/lock` 被另一 next build process 占住）。

---

## 下週 Actions（max 3，排序）

1. **真正實作 `tw-company-pe-memo` SKILL.md（第 5 週，不可再 carry）**
   - *為什麼是現在*：已是第五週。每多一週，PE DD pipeline 繼續以 23–60% silent-fail 率跑，dedup guard 繼續空轉，成本繼續往 taiwan-company 集中。這是整條鏈的根節點。
   - *具體做什麼*：真實 TRIGGER（「幫我做這家公司的 PE memo」「DD memo」「初步盡調」）+ 4 步主體（source-first: tw-company-identify → lookup → news-evidence-search → memo 輸出）+ silent-fail guard + 呼叫 batch-dd-dedup-guard 入口。
   - *Effort*：~30–45 分鐘。
   - *驗證*：SKILL.md 不含 `auto-generated` / `## TODO`；下週 harvest silent-fail < 20%；同一公司不再重複 retry 5+ 次。

2. **修 dashboard API HTTP 死鎖（讓成本觀測回來）**
   - *為什麼是現在*：API 死鎖 = 整週成本盲區。06-10 usage cap 是危險訊號，但沒有 API 數據無從判斷集中在哪。
   - *具體做什麼*：`systemctl --user status com.sk.dashboard.api.service` 看 stderr；試 `curl -v http://localhost:8001/health`；若需要，restart + 確認 port binding（RUN.md 記載 :8001 但可能又漂移）。順便解 `.next/lock`（`rm dashboard-next/.next/lock`）。
   - *Effort*：~20 分鐘診斷 + 修復。
   - *驗證*：`curl http://localhost:8001/api/skills/usage` 回 JSON；test build 通過。

3. **修 tester 的 launchd → systemd 適配（還原 agent 健康可觀測性）**
   - *為什麼是現在*：假陽性 FAIL 把真失敗（janitor/maintain）跟假失敗（harvest 其實活著）混在一起，admin 無法分辨。W23 Action 3 只做了一半。
   - *具體做什麼*：找 tester 腳本的 agent health check 邏輯，把 `launchctl list` 改為 `systemctl --user is-active com.sk.agent.rivendell.<name>.service`，讓 harvest / workflow-retro 回 PASS，janitor / maintain 回 FAIL（真失敗才排除）。
   - *Effort*：~15 分鐘定位 + 改腳本。
   - *驗證*：test report 顯示 harvest=PASS、workflow-retro=PASS、janitor=FAIL（真）、maintain=FAIL（真）；不再出現 launchd 字眼。

---

## 對照上週（W23）

| W23 Action | 完成狀態 | 說明 |
|-----------|---------|------|
| 1. 修 retro 自身：port 8000→8001 + retry/idempotency guard | ❌ 未完成 | W24 scheduled retro 產出 0 bytes；dashboard API 本週雙埠均無回應，問題比埠號更深。 |
| 2. 實作 `tw-company-pe-memo` SKILL.md | ❌ 未完成（第 5 週） | 本週 harvest 每天仍撞到 trigger 失效與 silent-fail；stub 狀態未變。 |
| 3. 分流 3 個失敗 unit（tester 假 exit-1 → 還原可觀測性） | ⚠️ 部分完成 | Skill 驗證從 173 升到 180，但 agent health check 仍全 FAIL（launchd 殘留）；janitor/maintain 真失敗根因未分類。 |

**完成率：0/3**（W21: 0.5/2；W22: 損毀；W23: 0/3）——連續三週 retro actions 完成率為零。**這是本週最重要的 meta 發現**：retro 每週產出行動項，但沒有任何機制確保有人去執行，包括 retro 排程自己。

**W23 → W24 關鍵指標：**

| 指標 | W23 | W24 | 趨勢 |
|------|-----|-----|------|
| Dashboard API | ONLINE @ :8001 | ❌ 無回應（8000/8001 均死） | ↓ 退步 |
| Skill 結構驗證 | 173/173 PASS | **180/180 PASS** | ↑ +7 技能 |
| Dashboard Build | BUILD SUCCESS | BUILD FAILED（.next lock） | ↓ 退步 |
| Agent 健康（真實） | janitor/maintain/tester FAIL | 同上 + tester 假陽性混淆 | → 持續 |
| PE DD silent-fail | ~33%（06-01 基準） | 06-04 批次 ~60% | ↓ 惡化 |
| `tw-company-pe-memo` 實作 | stub 第 4 週 | stub 第 5 週 | ↓ 持續 |
| Harvest 多樣性 | 集中 PE DD | 出現 TWstock + mops-notes 新領域 | ↑ 改善 |
| Token 集中 | taiwan-company 48% / 30d | 不知道（API 死） | — 盲區 |
| Retro 自身（scheduled） | retry storm → 壞檔 W22 | W24 scheduled 0 bytes | ⚠️ 持續 |
