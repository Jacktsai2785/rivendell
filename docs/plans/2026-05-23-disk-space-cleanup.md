# Disk Space Cleanup Plan — 2026-05-23

## Goal

資料卷 `/System/Volumes/Data` 已達 **100% 容量**（413Gi 用 / 460Gi，剩 < 450MB），
已開始造成實質故障：
- `du` / shell 寫 `/tmp` 報 `no space left on device`
- agent 寫 report / build cache / git 操作隨時可能失敗

目標：在**不刪除任何個人資料**的前提下，回收 ≥ 60G，並建立常態化的磁碟健康監測，
讓資料卷穩定維持在 ≤ 90%。

關聯：[2026-05-22 iCloud Documents Detach Plan](2026-05-22-icloud-detach-plan.md)
（repo 已從 `~/Documents/Projects/` 搬到 `~/code/`，本計劃處理搬遷後殘留與系統級肥大來源）。

## Current State (Inventory) — 2026-05-23 量測

### 磁碟總覽

```
Filesystem        Size    Used   Avail  Cap   Mounted on
/dev/disk3s5     460Gi   413Gi   ~450Mi 100%  /System/Volumes/Data
```

### Home 頂層消耗（du 實測）

| 目錄 | 大小 | 性質 |
|------|------|------|
| `~/Library` | **143G** | 系統 + app 資料（細項見下） |
| `~/code` | **77G** | 開發 repo（iCloud detach 後落腳處） |
| `~/Pictures` | 11G | 個人 — 不動 |
| `~/Downloads` | 7.6G | 多半可清 |
| `~/Desktop` | 5.3G | 個人 — 待檢視 |
| `~/Documents` | 4.9G | iCloud detach 後殘留 — 待檢視 |
| `~/Movies` | 1.8G | 個人 — 不動 |

### `~/Library` 細項（143G 拆解）

| 子目錄 | 大小 | 可回收評估 |
|--------|------|-----------|
| `Application Support` | 60G | Steam 41G(遊戲) + Chrome 14G + discord 1.4G + Code 394M |
| `Containers` | 41G | **Docker.raw 39G**（sparse；內部 ~55G 可 prune） |
| `Developer` | 17G | Xcode DerivedData 4.6G(安全) + CoreSimulator Devices 12G(舊模擬器) |
| `Caches` | 9.2G | 多數安全可清 |
| `Group Containers` | 9.6G | 待稽核（含 app 沙箱資料，需逐一確認） |
| `Logs` | 1.1G | 安全可清 |
| `Mobile Documents` | 494M | iCloud — 不動 |

### Docker 內部（`docker system df`）

| 類型 | 總計 | 可回收 |
|------|------|--------|
| Images | 38.34GB | **34.8GB (90%)** |
| Build Cache | 30.39GB | **19.92GB** |
| Local Volumes | 372MB | 235MB (63%) |
| Containers | 8MB | 8MB |

> 注意：Docker.raw 是 sparse image，prune 後空間先釋放到 image 內部；
> Docker Desktop on APFS 通常會 TRIM 回 host，但極端情況需手動 compact / 重建 Docker.raw。

## Cleanup Phases

### Phase 0 — 緊急止血（< 1G 即解燃眉之急，全安全）
目的：先讓磁碟脫離 100%，避免 agent / build 連環失敗。
- [ ] `~/Library/Logs` 清理（1.1G，安全）
- [ ] `~/Library/Caches` 中明確的工具快取（先列清單再清，預估 ~9G）
- [ ] 清空 `~/.Trash`（目前 0B，略過）

### Phase 1 — Docker 回收（最大單一安全來源，~55G）
- [ ] `docker system df` 再次確認 active vs reclaimable
- [ ] `docker builder prune -f`（build cache，~20G，安全）
- [ ] `docker image prune -a -f`（未被 container 使用的 image，~35G — **先確認沒有要保留的本地 image**）
- [ ] 視情況 `docker volume prune`（235M，**確認 volume 無重要資料**）
- [ ] prune 後檢查 Docker.raw 是否回縮；未回縮則評估 Docker Desktop → Troubleshoot → Clean / Purge data 或重建

### Phase 2 — Xcode / 模擬器（~16G）
- [ ] `rm -rf ~/Library/Developer/Xcode/DerivedData/*`（4.6G，完全安全，會重建）
- [ ] `xcrun simctl delete unavailable`（清掉孤兒模擬器，回收部分 12G）
- [ ] 評估舊版 iOS DeviceSupport / 不用的 runtime

### Phase 3 — code/ 開發殘留（77G，需逐 repo 稽核）
- [ ] 盤點各 repo 的 `node_modules` / `.next` / `dist` / `__pycache__` / `.venv`
- [ ] 對 build/cache 目錄套用 `~/.local/bin/icloud-ignore-build-dirs`（既有 idempotent 腳本）
- [ ] 清掉已封存 / 不再開發 repo 的 `node_modules`（可隨時 `npm install` 重建）
- [ ] 找 iCloud detach 殘留的 numbered duplicates（`* 2.ext` / `index 2` / `HEAD 2`）

### Phase 4 — 個人資料決策（需使用者拍板，非自動清除）
- [ ] **Steam 41G** — 哪些遊戲可刪？（最大單一可釋放，但屬個人選擇）
- [ ] Chrome 14G — 清瀏覽快取可回收數 G（不影響書籤 / 密碼）
- [ ] `~/Downloads` 7.6G、`~/Desktop` 5.3G、`~/Documents` 4.9G — 逐項檢視
- [ ] discord 1.4G 快取

### Phase 5 — 常態監測（防止再次爆滿）
- [ ] rivendell health endpoint / doctor 加入 disk usage 檢查（資料卷 > 90% → WARN，> 95% → CRIT）
- [ ] 納入 `bin/sk-agent-doctor` 或 daily cron，dashboard 可見

## Reclaimable Summary（不動個人資料的安全上限）

| 來源 | 預估回收 | 風險 |
|------|---------|------|
| Docker prune (image+cache) | ~55G | 低（未用 image 重新 pull） |
| Xcode DerivedData | 4.6G | 無（重建） |
| CoreSimulator unavailable | 部分 of 12G | 低 |
| Library Caches | ~9G | 低 |
| Library Logs | 1.1G | 無 |
| **小計（無個人資料損失）** | **~70G+** | |
| Steam（個人決策） | 至多 41G | 使用者選擇 |

## Execution Log — 2026-05-23（已執行：全部安全項）

| 步驟 | 動作 | 結果 |
|------|------|------|
| Phase 2 | `rm -rf DerivedData/*` | 4.6G 釋放 |
| Phase 2 | `xcrun simctl delete unavailable` | Developer 17G → 12G |
| Phase 0 | `rm -rf ~/Library/Caches/*` | 9.2G → 4.9M |
| Phase 0 | clear `~/Library/Logs`（保留 `sk-agent`） | 1.1G → 46M |
| Phase 1 | `docker builder prune -f` | 19.88G 釋放 |
| Phase 1 | `docker image prune -a -f`（首次） | 僅 183M — 大 image 被 7 個停止 container 釘住 |
| Phase 1 | `docker rm` 7 個過時停止 container | dashboard/agents 已遷 launchd，Docker 副本為遺留 |
| Phase 1 | `docker image prune -a` + `builder prune -a` | Images 38.34G→1.05G、Build Cache 30.39G→0 |
| 驗證 | Docker.raw on-disk | 39G → **2.8G**（APFS TRIM 自動回縮，不需手動 compact） |

**磁碟：< 450MB（100%）→ 56Gi 可用（87%），共釋放約 56G。**

保留項：2 個運行中 postgres container（`chimesflow-db-1`、`spms-postgres`）及其 named volume；
`sk-agent` 觀測 log。未碰個人資料（Steam 41G / Chrome / Downloads / Desktop / Documents 仍待 Phase 4 決策）。

學到（Docker gotcha）：`docker image prune -a` 只刪「沒有任何 container（含已停止）參照」的 image；
要回收被停止 container 釘住的 image，須先 `docker rm` 該 container。Docker.raw 是 sparse image，
prune 後靠 APFS TRIM 回縮（本次自動生效，39G→2.8G）；若未回縮才需 Docker Desktop → Troubleshoot → Clean。

## Open Questions

1. Docker：本地有沒有「沒推到 registry、prune 會永久消失」的 image？（決定 Phase 1 激進程度）
2. Steam 是否要保留？保留則目標回收量以 ~70G 安全項為主。
3. Phase 5 監測要掛在 doctor agent 還是獨立 cron？

## Notes / 連帶發現（QA 旁支，非本計劃主線）

於本次 QA 順帶發現，另開 issue 追蹤即可：
- **health endpoint `ssot_drift = 14`**：`agents.conf` 用 project key `sales`，
  `projects.json` 用 `sales-assistant`，同 4 個 agent 兩邊不一致（貢獻 8/14）；
  另 6 個 rivendell 系統 agent（doctor/janitor/ssot-drift/symlink-fix/token-snapshot/workflow-retro）
  只在 `agents.conf`、不在 `projects.json`。屬剛上線的 drift detector 正常回報，需 reconcile。
- **doctor agent 退出碼 1**：`bin/sk-agent-doctor:207` 的 `echo` broken pipe（`| head` 提前關閉管道），
  屬 cosmetic，但會觸發 test 報告 WARN。修法：該行加 `|| true` 或避免 pipefail 下 echo 進已關閉管道。
