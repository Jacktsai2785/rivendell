---
date: 2026-05-14
batch: 3
sessions: 30
messages: ~425
projects: [rivendell, file-diff-app, taiwan-company]
---

# Harvest Report — 2026-05-14 (Batch 3)

## Session Summary

- **Sessions reviewed**: 30 (~425 messages)
- **Projects**: `-home-jacktsai`, `-home-jacktsai-file-diff-app`, `-home-jacktsai-taiwan-company`
- **Top tools**: Bash (112)、WebSearch (96)、Edit (61)、Read (39)、WebFetch (30)、ToolSearch (18)、TodoWrite (16)
- **Cost**: 全部 $0.00（多為 headless agent / 本地 prompt）

### 活動主題分佈

| 主題 | Session 數 | 備註 |
|---|---|---|
| 台灣公司 PE 盡職調查備忘錄（資深 PE 投資人視角） | 17 (#7, 9, 10, 11, 13–25) | 已有 [`tw-company-pe-memo`](../skills/workflow/tw-company-pe-memo/SKILL.md) 對應 |
| 文件差異分析（公司章程，empty JSON 排查 / PDF OCR） | 7 (#1–6, 27) | 既有 [`file-diff-agent`](../skills/workflow/file-diff-agent/SKILL.md) 偏架構，未覆蓋 PDF OCR 路由 |
| Port 統一規劃與服務重啟 | 3 (#26, 28, 30) | 既有 [`dev-port-conflict-fix`](../skills/workflow/dev-port-conflict-fix/SKILL.md) 偏單一衝突修復 |
| Patent scraper 回歸修復 | 1 (#8) | 一次性 bug + CLAUDE.md 註記 |
| 外部 GitHub Skill 安裝 | 1 (#29) | 從 `everything-claude-code` 倉庫拉取 skill 並安裝到全域 |
| 公司資料庫資料夾清理 | 1 (#26) | 一次性 |
| 台灣產業新聞多日彙整（循環經濟） | 1 (#12) | 已有 [`1-taiwan-news-multiday-digest`](../skills/workflow/1-taiwan-news-multiday-digest/SKILL.md) |

---

## Skill Candidates

### 1. `pdf-ocr-routing` — **Strong**

- **Name**: `pdf-ocr-routing`（或 `pdf-text-vs-scanned-detector`）
- **Purpose**: 差異分析／文字抽取 pipeline 在處理 PDF 前，**自動偵測 PDF 是 text-based 還是 scanned (圖檔)**，並決定要走 `pypdf` 直讀路線還是 OCR (`tesseract` / `paddleocr`) 路線。處理「pdftotext 抽出空字串、但 PDF 內其實有掃描內容」的 silent-fail 案例。
- **Trigger**: 使用者說「PDF 抽不到文字」「OCR 抓不到」「diff 結果是空陣列」「掃描檔差異」「PDF 類型偵測」。
- **Category**: `backend`
- **Rationale**:
  - Session #27 的關鍵 user feedback：「一個完整的差異分析服務本來就應該**自動偵測 PDF 類型**並決定要不要走 OCR，而不是把問題丟回給使用者判斷」+ 「沒道理啊? OCR抓不到文字?」。
  - Sessions #1–6 全部都遇到 **`差異分析報告（共 0 筆）`** 的空陣列輸出 — 這是同一個根因（沒做 PDF 類型偵測就走 text-extraction 路線）反覆出現的徵兆。
  - 既有 `file-diff-agent` 是「以 Claude CLI 為後端建構差異服務」的 scaffolding，**並未覆蓋 PDF 類型分流邏輯**；`office-pdf` 是通用 PDF 操作 SDK，無偵測啟發式。
  - 包含的核心 know-how：(a) 用 `pdftotext` 抽文字後判斷字數門檻；(b) 用 `pdfimages` 或 `pypdf` 偵測 page 內是否只有 image；(c) 對 scanned PDF 走 OCR；(d) 對 hybrid PDF（部分頁文字、部分頁掃描）做 per-page 路由；(e) 將偵測結果寫進 diff JSON 的 metadata，避免空結果回到 LLM 又被當成「無差異」。

---

### 2. `multi-project-port-replan` — **Strong**

- **Name**: `multi-project-port-replan`
- **Purpose**: 對「機器上所有本地專案」做一次性 port 盤點與重新規劃，輸出 SSOT（如 `~/PORTS.md`）並同步更新各專案 `.env`、`Makefile`、`vite.config`、`docker-compose.yml`。和 `dev-port-conflict-fix`（單一衝突修復）互補。
- **Trigger**: 使用者說「梳理目前專案的 port 佔用」「重新規劃 port」「port 全盤檢查」「PORTS.md 更新」「所有 dev server 一次重啟」。
- **Category**: `workflow`
- **Rationale**:
  - Session #28（94 msgs，最大）核心指令是「請一次性幫我梳理目前的專案的port佔用情況並重新規劃 → 全部專案 restart」。動作橫跨 5 個檔案（`.env.example`, `CLAUDE.md`, `Dockerfile`, `Makefile`, `PORTS.md`），34 次 Bash + 23 次 Edit。
  - Session #26 又問「companies 這個 folder 是幹麻的 → company_db 是什麼?」，可見**多專案 port + 資料庫 inventory 盤點**是反覆出現的需求。
  - 使用者全域 CLAUDE.md 明確說「本機所有 web / dev 服務的 port 分配集中在 `~/PORTS.md`（SSOT）」，但目前**沒有任何 skill 把這個 SSOT 寫入流程自動化**。
  - 既有 `dev-port-conflict-fix` 只處理「兩個服務撞 port」的點狀修復，不會做全機盤點和分段制（5432 / 8080–8089 / 8000–8009 / 8500–8509 / 3000–3009 / 5170–5179）的重新分配。

---

### 3. `vscode-wsl-port-forwarding-debug` — **Moderate**

- **Name**: `vscode-wsl-port-forwarding-debug`
- **Purpose**: 排查為何 VS Code 在 WSL 環境下「PORTS 面板」只顯示部分 forwarded ports、其餘服務雖然在 listening 卻沒出現。涵蓋 VS Code remote.WSL.localhostForwarding、`code-server` autoForward 設定、`wsl.conf` 的 `[boot]` 與 `[network]` 段、`netsh portproxy` 規則交互。
- **Trigger**: 使用者說「VSCode 的 port 顯示太少」「WSL forward 不出來」「VSCode PORTS 沒看到我的服務」「remote 端 port 看不到」。
- **Category**: `workflow`
- **Rationale**:
  - Session #28 末段使用者問「為什麼我的 VScode 顯示的 port 這麼少?」，反映 WSL + VS Code 環境下這是個 recurring blocker。
  - 使用者環境（Linux 6.6.87.2-microsoft-standard-WSL2 + VS Code Remote）會持續遇到。
  - 既有 skills 無對應；`dev-port-conflict-fix` 是 listening 衝突，這是 forwarding 可見性問題，根因不同。
  - **降級為 Moderate 而非 Strong** 是因為單一 session 觸發、且解法相對 mechanical（一旦寫過一次就可貼方案），可考慮直接 codify 成 `reports/` 下的故障排除筆記而非完整 skill。

---

### 4. `github-skill-installer` — **Moderate**

- **Name**: `github-skill-installer`（或 `gh-to-skills`）
- **Purpose**: 從第三方 GitHub 倉庫的 `skills/<name>/` 子目錄拉取單一 skill，安裝到本地 rivendell skills 庫（或全域 `~/.claude/skills/`），自動處理 frontmatter normalize、依賴腳本下載、permissions/hooks 註冊。
- **Trigger**: 使用者貼 GitHub URL（特別是 `*/skills/*` 路徑）+「下載並安裝」「安裝這個 skill」「全域使用」「import 這個 skill」。
- **Category**: `meta`
- **Rationale**:
  - Session #29：使用者貼 `https://github.com/affaan-m/everything-claude-code/blob/main/skills/continuous-learning-v2` 並要求「下載並安裝 skill 給全域專案使用」，涉及 `SKILL.md`, `config.json`, `observer-loop.sh`, `start-observer.sh`, `settings.json` 多檔協同安裝。
  - 既有 `gdrive-to-skills` 是 Google Drive → skills 路徑；**沒有 GitHub → skills 的對等 skill**。
  - 但目前只觀察到 1 session 觸發，加上動作可被 `Bash + Read + Edit` 直覺組合完成，所以列為 Moderate 而非 Strong。如果出現第 2、3 次同類請求，應升格為 Strong。

---

### 5. `scraper-ground-truth-verifier` — **Weak**

- **Name**: `scraper-ground-truth-verifier`
- **Purpose**: 對 scraper 輸出做「對照已知 ground truth 數量」的回歸驗證 — 例如「衛波科技應有 M642211 + M642212 兩份專利，scraper 抓到 0 份 → 報錯並列出缺漏」+ 自動把 ground truth 寫進 `CLAUDE.md` 或 test fixture 避免再犯。
- **Trigger**: 使用者說「scraper 抓不到 X」「應該有 25 筆但只有 N 筆」「驗證爬蟲完整性」「regression test for scraper」「避免同樣問題再次發生」。
- **Category**: `quality`
- **Rationale**:
  - Session #8：使用者指出「衛波科技有 M642211 和 M642212 這兩份專利, 但你生成出來的資料並沒有 → 我更新了但沒有看到 25 筆 → 請幫我把這個註也修進去, 避免同樣問題再次發生」。25 次 Bash + 12 次 Edit + 4 次 Read 涵蓋 `CLAUDE.md` + `patent_scraper.py`。
  - 動作模式是通用的：(1) 使用者提供 ground truth → (2) scraper 重跑 → (3) 比對 → (4) 修 scraper → (5) 把 ground truth 寫成永久 fixture/註解。
  - **降為 Weak** 因為（a）僅單一 session 觸發；（b）和既有 `qa-testing` / `repro-exam` 有部分重疊；（c）「把 ground truth 寫進 CLAUDE.md 防回歸」這個動作其實是 `self-improving-agent` 的範疇。建議**先記成 `self-improving-agent` 的延伸 pattern**，等再次出現時再考慮獨立 skill。

---

## Cross-Cutting Observations

### 觀察 1：PE DD memo 使用密度極高（17/30 sessions），但 skill 已存在
- 建議：把 `tw-company-pe-memo` 列為候選**優化目標**（不是新 skill）。可考慮：(a) 評估 trigger description 精準度（為何 17 個 session 都從 raw prompt 開始而非從 `/tw-company-pe-memo` 呼叫？）；(b) 是否需要 batch mode（同時對 10 家公司並行跑 DD）。

### 觀察 2：「empty diff JSON」silent fail 是 file-diff-app 的系統性問題
- 6 個 session（#1–6）都陷在「為什麼是空陣列」的循環中，最後 #27 才從架構層面修正（PDF 類型偵測）。
- 建議：除了 `pdf-ocr-routing` skill 外，**file-diff-app 的 system prompt 應該在收到 0-element diff JSON 時主動 challenge「會不會是 OCR 沒跑」**，而不是被動回答「文件相同」。這是一個應該寫入 `file-diff-agent` SKILL.md 的 know-how，不一定要新 skill。

### 觀察 3：Port + 服務啟動的痛點集中
- Sessions #26, #27, #28, #30 都和「打開/重啟前後端」或 port 規劃有關，4/30 sessions 是 infra 性質。
- 既有 skills：`dev-server-restart-verify`、`dev-port-conflict-fix`、`env-doctor`、`launchd-agent`、`systemd-user-service`。**覆蓋已充分**，缺的是上層的「multi-project port replan」這一塊。

---

## Recommended Next Actions

1. **建立** `pdf-ocr-routing` skill（**Strong**，跨 7 sessions 反覆出現）。
2. **建立** `multi-project-port-replan` skill（**Strong**，session #28 是當週最大規模 session）。
3. **延伸** `file-diff-agent` SKILL.md：加入「empty diff JSON challenge」段落 + 連結到新建的 `pdf-ocr-routing`。
4. **評估** `tw-company-pe-memo` 的 trigger / batch 能力 — 為何 17 sessions 沒有自動觸發。
5. **延後** `vscode-wsl-port-forwarding-debug` 和 `github-skill-installer` — 等第 2 次出現再升格。
6. **不建立** `scraper-ground-truth-verifier` — 改寫入 `self-improving-agent` 範例。
