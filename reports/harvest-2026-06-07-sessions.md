# Session Harvest — 2026-06-07（13-session digest）

## Session 摘要

- **彙整日期**：2026-06-07
- **涵蓋專案**：`TWstock-invest`（4 場）、`jk-nb`（3 場）、`mops-dbs`（4 場）、`rivendell`（2 場）
- **Session 數**：13 | **訊息數**：約 557 | **成本**：$0.00（digest 未含計費）
- **主要工具**：Bash(226)、Edit(115)、Read(84)、Write(25)、TodoWrite(23)、Agent(10)、AskUserQuestion(9)、Skill(6)、ToolSearch(5)
- **已調用 skill**：`jk-nb-consume`、`jk-nb-digest`、`3-jk-nb-lint`、`mops-filer-list-reconcile`、`workflow-retro`（共 6 次跨 5、6、7、10、13 場）

### 各 session 活動

| # | 專案 | 訊息 | 活動 | 對應的現有 skill |
|---|---|---|---|---|
| 1 | TWstock-invest | 82 | 前端：新增「單股評價」分頁（搜尋頁＋絕對/相對並陳結果頁＋peer 編輯器）、6 大指標個股列加「看評價」按鈕 | 部分對應：`react-fab-search-pattern`、`frontend-design` |
| 2 | TWstock-invest | 22 | `/code-review` high-effort（recall-biased）於 `peers.py`/`relative.py` | ✅ built-in `code-review`（已調用） |
| 3 | TWstock-invest | 40 | `/code-review xhigh` → 直接提交 main | ✅ built-in `code-review`（已調用）／見候選 2 |
| 4 | TWstock-invest | 16 | 改 `CLAUDE.md`：commit+push 前一律先跑 `/code-review xhigh`；釐清 xhigh 是否為官方 effort 級別 | 部分對應：`update-config`／見候選 2 |
| 5 | jk-nb | 44 | 跑 `consume`，把 raw/ 新內容編進 wiki/（≤5 頁） | ✅ `jk-nb-consume`（已調用） |
| 6 | jk-nb | 8 | 跑 `digest` 整理 inbox.md → promote → 刪除線 → 清舊 | ✅ `jk-nb-digest`（已調用） |
| 7 | jk-nb | 19 | 跑 `lint` 產 `_lint-report.md`（矛盾/重複/dead link/stub） | ✅ `3-jk-nb-lint`（已調用） |
| 8 | mops-dbs | 37 | systemd timer 遷移：修 `WorkingDirectory=` 指向 rename 前舊路徑的 unit、crontab→timer | 部分對應：`repo-rename`、`systemd-user-service` |
| 9 | mops-dbs | 23 | `/code-review xhigh` 於 `run_master_chain.sh` | ✅ built-in `code-review`（已調用） |
| 10 | mops-dbs | 36 | 把各 db 名單跟 `mops_master` 對標 | 部分對應：`mops-filer-list-reconcile`（不同軸，見候選 1） |
| 11 | mops-dbs | 97 | 全盤檢查 mops_rev/pl/bs/cf/notes/price 是否都對齊 `mops_master` ＋ 驗證排程順序（master 先跑、下游後跑） | 部分對應：`mops-filer-list-reconcile`（見候選 1） |
| 12 | rivendell | 106 | 診斷「skill 仍是 mac 架構、且不會被全域呼叫」→ 修 launchd→systemd、解全域遮蔽 | 部分對應：`skill-scout`、`anthropic-skills-bulk-port`、`repo-rename`（見候選 3） |
| 13 | rivendell | 27 | 跑 `workflow-retro` 週度回顧 | ✅ `workflow-retro`（已調用） |

## 結論

13 場中 **8 場已被現有 skill 完整覆蓋**（jk-nb 三件套全部直接調用、code-review 三場走 built-in、workflow-retro 一場）。剩下浮現三個值得評估的新訊號，依強度排序如下。

---

## Skill 候選

### 1. `mops-cluster-master-alignment-audit` — **Strong**

- **Purpose**：把 mops 叢集的**下游 DB**（`mops_rev`/`pl`/`bs`/`cf`/`notes`/`price`）名單與**上游 `mops_master`** 對帳（master 為權威來源，缺漏者標記 backfill、多餘者標記待清），並**一併稽核排程依賴順序**——確認 `mops_master` 每晚最先跑、下游 consumer 都排在其後，避免下游讀到當日尚未更新的 master。輸出一份「各 DB × 對齊狀態 × 排程位置」對帳表。
- **Trigger**：使用者說「所有 db 名單跟 mops_master 對齊」「全盤檢查 rev/pl/bs/cf/notes/price 是否對標 master」「檢查 schedule 順序對不對」「master 是不是最先跑」「下游 db 漏抓」。
- **Category**：`workflow`
- **Rationale**：跨 **2 場**（session 10、11，合計 133 則訊息、Bash 76）反覆出現，且軸向與既有 `mops-filer-list-reconcile` **正交**——後者是 master ⟷ TWSE/OTC/ROTC 權威名單（找下市公司），本候選是 **下游 6 個 DB ⟷ master**（找跨庫漏抓）＋ **排程拓樸驗證**（既有 skill 完全沒涵蓋）。這正是 MEMORY 裡 `dashboard-api-port-8001` 教訓的同類風險（排程/順序寫死導致假 outage）。建議獨立成案；若想省維護成本，次選是於 `mops-filer-list-reconcile` 增補「下游叢集對齊＋排程順序」一節，但兩者觸發語境差異大，傾向獨立。

### 2. `pre-commit-code-review-gate` — **Moderate**

- **Purpose**：把 built-in `/code-review`（high/xhigh effort）固化成「commit+push 前的自動把關」——在專案 `CLAUDE.md` 寫入一條規約：任何 commit/push 前先跑一次 review、確認無 bug 才上傳；並內含 effort 級別的正確用法備忘（**`xhigh` 並非官方 effort 級別**，官方為 low/medium/high；session 4 使用者因外站文章誤以為有 xhigh，需釐清對應到 high→max）。
- **Trigger**：使用者說「commit/push 前先幫我 code-review」「上傳前先檢查有沒有 bug」「把 review 設成提交前必跑」「xhigh 是什麼級別」。
- **Category**：`meta`
- **Rationale**：相關語境跨 **4 場**（session 2、3、4、9）密集出現，且 session 4 使用者**明確要求把它寫進 CLAUDE.md** ——是真實、重複的流程意圖。但 reviewing 本身已由 built-in `/code-review` 完整覆蓋，本候選的**唯一新增價值是「gate 接線 + effort 級別正名」**這層薄配置。建議**併入 `update-config`**（它本就負責「from now on before X」這類 hook/規約寫入），新增一段 recipe 範本即可；不另立獨立 skill，以免與 built-in review 疊床架屋。

### 3. `rivendell-global-skill-shadow-fix` — **Moderate**

- **Purpose**：診斷並修復「rivendell 的 skill 已複製到全域卻無法被呼叫」這類問題。核心兩個失效模式：(a) **全域化遮蔽陷阱**——本地 repo 內的 skill 副本遮蔽了全域 `~/.claude/skills/` 的版本（或反之），導致改了沒生效；(b) **跨平台殘留**——skill 仍寫死 macOS `launchd`/`~/Library/...` 路徑，在 Linux/WSL2 不可用，需 port 成 `systemd --user`。產出「哪些 skill 全域可見 / 被遮蔽 / 仍是 mac 架構」清單與修復步驟。
- **Trigger**：使用者說「skill 不會全域被呼叫」「之前要求複製到全域卻沒生效」「skill 還是 mac 架構」「全域遮蔽」「launchd 改 systemd」「為什麼這個 skill 沒反應」。
- **Category**：`meta`
- **Rationale**：session 12 單場 **106 則訊息、Edit 41**，是本批最重的單一除錯任務，且其結論已沉澱進 MEMORY（`rivendell-systemd-not-launchd`：全域化遮蔽陷阱＋watchdog 部署缺口）。現有 `skill-scout`（外部移植）、`anthropic-skills-bulk-port`（批次安裝）、`repo-rename`（rename 後引用稽核）都**沾邊但不正中**——沒有一個專門處理「本地 vs 全域遮蔽 + mac→linux 殘留」的診斷。只出現 1 次故評 Moderate；若此類「改了 skill 卻沒生效」再現 1–2 次，建議升格獨立 `meta/` skill，並把 MEMORY 教訓收斂進 SKILL.md。

---

## 未成案項目（已被現有 skill 覆蓋，僅記錄不新增）

- **jk-nb `consume` / `digest` / `lint`** → `jk-nb-consume`、`jk-nb-digest`、`3-jk-nb-lint`（session 5/6/7 皆已直接調用）
- **diff code review（high/xhigh effort）** → built-in `/code-review`（session 2/3/9 已調用）
- **週度系統回顧** → `workflow-retro`（session 13 已調用）
- **master ⟷ TWSE/OTC/ROTC 名單對帳、找下市公司** → `mops-filer-list-reconcile`（session 10 已調用；本批新軸見候選 1）
- **repo rename 後 systemd unit `WorkingDirectory=` 指向舊路徑** → `repo-rename` + `systemd-user-service`（session 8，屬已知範式組合，不另立）
- **React 前端：單股評價搜尋頁 + FAB + 結果頁** → `react-fab-search-pattern`、`frontend-design`（session 1）
