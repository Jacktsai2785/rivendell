---
name: mops-filer-list-reconcile
description: >
  把本地 `mops_master.filers` 名單與權威來源（TWSE 上市 / OTC 上櫃 / ROTC 興櫃 / 公發 四份 opendata CSV）對帳，找出「已不在任何權威名單中」的公司（＝已下市/下櫃/下興櫃/被併/測試垃圾），經人工確認後跨 6 個子庫依 FK 順序安全刪除；同時涵蓋反向情境——master 首見新公司的 backfill 同步（沿用既有的 `sync_new_filers.sh`）。
  TRIGGER when: 使用者說「確認 mops_master 跟 TWSE 名單一致」「找出下市/下櫃公司」「對帳 filer 名單」「清掉已下市的公司」「同步新上市公司財報」。
when_to_use: 使用者說「確認 mops_master 跟 TWSE 名單一致」「找出下市/下櫃公司」「對帳 filer 名單」「清掉已下市的公司」「同步新上市公司財報」。
version: 1.1.0
tags: [workflow, mops]
languages: all
source: harvest-auto
---

# mops-filer-list-reconcile

## Overview

mops 叢集的 company universe 是「以 `mops_master.filers` 為單一權威，子庫 follow」的單向 sync。
`master sync-filers` 是 **upsert-only、永不刪除**，所以下市公司會一直留著——這個 skill 補上
缺的另一半：**對帳權威名單 → 找退場公司 → 人工確認 → 跨庫安全刪除**。

實作已落地為兩個檔（不要臨場重寫，直接呼叫）：

| 檔案 | 角色 |
|---|---|
| `~/mops_dbs/reconcile_filers.sh` | 主工具：偵測（預設、read-only）/ 刪除（`--purge`） |
| `~/mops_dbs/_reconcile_purge.py` | 各子庫由葉到根的 FK 順序刪除器（由上面那支呼叫） |

## When to Use

使用者說「確認 mops_master 跟 TWSE 名單一致」「找出下市/下櫃公司」「對帳 filer 名單」
「清掉已下市的公司」「同步新上市公司財報」。

## 執行流程（三步，刪除前一定要過人工 gate）

### Step 1 — 偵測（read-only，先載 .env 拿 PG 密碼）

```bash
cd ~/mops_dbs && set -a && . .env && set +a
bash reconcile_filers.sh
```

輸出兩類候選：

- **退場候選**（master 有、不在四名單）→ 退場候選 id 會寫到 `logs/reconcile_candidates.txt`。
  每筆標「近 6 月是否仍在報月營收」：
  - `停更` = 真正可清（已下市/下櫃/被併/測試垃圾）。
  - `⚠️ 仍在報` = 名單外仍活躍（如某些公發券商）→ **預設不要刪**，刪了下次 refresh 可能復活。
- **新增候選**（權威有、master 無）→ 這是 forward 同步，**交給 `sync_new_filers.sh`，本 skill 不處理刪除以外的事**。

> 內建安全閥：四份 CSV 任一份抓失敗或筆數低於下限（tse 800 / otc 600 / rotc 250 / pub 200），
> 腳本直接 `ABORT`，**不會**把殘缺名單的差集當下市去刪。

### Step 2 — 人工確認（AskUserQuestion gate）

把退場候選清單呈給使用者，**用 AskUserQuestion 讓他逐一/批次圈選真正要刪的 id**。
判準「停更 + 不在四名單」：排除所有標『仍在報』的；保留歷史股價/歷史財報需求者也應排除。
**絕不**把整份偵測差集直接送進刪除。

### Step 3 — 刪除（只刪人工圈定的 id）

```bash
cd ~/mops_dbs && set -a && . .env && set +a
bash reconcile_filers.sh --purge 2856 test998      # ← 只列使用者確認過的 id
```

跨 6 庫（rev/pl/bs/cf/notes 子庫 + master）依 FK 由葉到根刪、每庫單一 transaction、
已刪 id 記入 `logs/reconcile_purged.txt` 稽核軌跡。重跑同組 id 只刪到 0 筆（冪等）。

## FK 刪除順序（叢集內所有 filer FK 皆無 ON DELETE CASCADE，故須手動依序）

| 庫 | 關聯欄 | 由葉到根的刪除順序 |
|---|---|---|
| mops_rev | `company_id` | `monthly_revenues` → `companies` |
| mops_pl | `filer_id` | `pl_facts`(經 filing) → `quarantine` → `filings` → `filers` |
| mops_bs | `filer_id` | `bs_facts`(經 filing) → `quarantine` → `filings` → `filers` |
| mops_cf | `filer_id` | `cf_facts`(經 filing) → `quarantine` → `filings` → `filers` |
| mops_notes | `filer_id`/`co_id` | `dimensional_facts`(經 filing) → `note_sections` → `note_references` → `quarantine` → `filings` → `filers` |
| mops_master | `filer_id` | `filers`（無其他表參照） |

## 反向：master 首見新公司

不在本 skill 重做。直接：

```bash
cd ~/mops_dbs && bash sync_new_filers.sh        # 自動偵測首見新公司 → backfill pl/bs/cf/notes
```

## 設計決策（為什麼這樣做，勿改方向）

- **保持本地副本，不改 fdw**：真 FK / 大表 join 效能 / ingest 不依賴 master 在線 /
  notes investee 的刻意 universe 分歧——這四項都靠本地副本，fdw 會一次打壞。
- **刪除手動、不入每日 chain**：自動跑「刪除 + FK 串聯傳播」風險大於它解決的 staleness——
  某天 CSV 抓取殘缺就可能 cascade 誤刪真公司橫跨 4 庫 facts。故刻意只做 on-demand + 人工 gate。
- **被投資（notes investee）不對齊 master**：被投資公司是揭露的受詞、非申報人，
  本來就大量在 master 之外（境外控股/未上市），不在本 skill 的清理範圍。

相關：機制文件 `~/.claude/.../memory/project_filer_sync_mechanism.md`、`sync_new_filers.sh`。
