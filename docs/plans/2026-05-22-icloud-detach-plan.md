# iCloud Documents Detach Plan — 2026-05-22

## Goal

把所有開發 repo 從 `~/Documents/Projects/` 搬離 iCloud Drive 同步監管範圍，
徹底斷掉 `~/Documents/Desktop & Documents Folders` 的 iCloud Drive sync，
根治：
- git fsync 在 iCloud cloud-only stub 下永遠不返回（2026-05-14 learning）
- SQLite 在 iCloud dataless 狀態下的 silent data loss（2026-05-14 learning）
- 跨機器同步衝突產生 `index 2` / `HEAD 2` 等 numbered duplicates

## Current State (Inventory)

### 17 個 git repo 在 `~/Documents/Projects/`

```
ChimesFlow      Family-Fiscal   MingOS          TailTrack
curia           gstack          news_stock      綻放計畫
Edict           lorien          odb-dfm         rivendell
                Marketing-Pal   rakucamp        sales-assistant
                                resume-pool     RTK
```

### 其他需處理

| 路徑 | 內容 | 處置 |
|------|------|------|
| `~/Documents/Peter` | Peter vault（Obsidian + git） | 待決定（separate ship） |
| `~/Documents/3DGS` `_archive` `company-proflie` | 非 git 的工作檔案 | 待決定 |
| `~/Documents/League of Legends` `Paradox Interactive` | 遊戲 save | 留 Documents（不影響 dev） |

### Path references 要更新（已知的）

| 來源 | 引用方式 | 影響面 |
|------|---------|--------|
| `~/Library/LaunchAgents/com.sk.*.plist`（10+ 個） | hardcoded `/Users/manibari/Documents/Projects/<repo>/bin/...` | 所有 cron agents |
| `~/.claude/projects.json` | 每個 project 的 `repo` 欄位是絕對路徑 | dashboard 顯示、agent enrichment |
| `~/.claude/skills/gstack` symlink | → `~/Documents/Projects/gstack` | gstack-* skills 全套 |
| `rivendell/bin/sk` `PROJECTS_DIR` | `$HOME/Documents/Projects` (估計) | profile / bootstrap |
| `rivendell/profiles/profiles.conf` `LOCAL_DIR` | 相對 `~/Documents/Projects/` | bootstrap clone |
| 各 repo 的 `.env` / docker-compose `volumes:` | 視 repo 而定 | 各自 service |
| 各 repo 內 `cwd hint` / hardcoded path（**未稽核**） | 可能藏在 Python `Path(__file__).parent.parent` 或 README | 風險區 |

### iCloud sync 現況

- `brctl status ~/Documents` 回 `Client zone not found` — 表示目前可能 sync **已部分停用** 或處於奇怪狀態
- `brctl monitor` 顯示 `.claude` `.localized` `.obsidian` 等仍有 `☁` 標記 — 部分仍 cloud-only
- 結論：iCloud 已半同步狀態，更危險（不知道哪些是 stub）

## Destination Decision

**建議：`~/code/`**（不在 `~/Documents/` 下，跳脫 iCloud 監管範圍）

| Option | Pros | Cons |
|--------|------|------|
| `~/code/` ★ 推薦 | 短、業界常見、不會跟 `~/Documents/Projects/` 名稱混淆 | 需習慣新路徑 |
| `~/Projects/` | 直觀 | 跟 `~/Documents/Projects/` 命名相似，遷移中容易 typo |
| `~/dev/` | 短 | 個人偏好差異大 |

最終結構：
```
~/code/
├── chimesflow/       (←rename to lowercase 或保留？決定一次)
├── rivendell/
├── gstack/
├── news_stock/
├── ... (17 repos total)
└── Peter/            (vault, separate phase)
```

## Risk Register

| Risk | Severity | Mitigation |
|------|----------|-----------|
| 遷移中 launchd agents 持續嘗試執行舊路徑 → 大量 error log | High | Phase 2 全 bootout，遷移完才 bootstrap |
| Cloud-only stubs 在 `mv` 時下載失敗或卡住 | High | Phase 0 `brctl download` 強制全部下載 |
| `mv` 中斷導致 repo 一半在舊路徑一半在新路徑 | Medium | 用 `rsync -a --remove-source-files`（atomic per file），不是 `mv -R` |
| 各 repo 內藏的絕對路徑 reference 沒抓出 | Medium | Phase 4 全文 grep `Documents/Projects` |
| dashboard-next 重啟時 `.next/` 在 iCloud 殘留 stub | Medium | rivendell 搬完先 `rm -rf .next/`，再 launchctl bootstrap |
| gstack symlink 斷裂 → 所有 /gstack-* 失效 | Medium | Phase 4 重建 symlink，先驗證 `ls ~/.claude/skills/gstack/` 再進 Phase 5 |
| System Settings 關閉時誤選「Keep in iCloud Only」→ 本地檔變 stub | High | Phase 5 前確認 Documents 已空（repo 都搬走），勾選時對話框看清楚 |
| Peter vault 移動破壞 Obsidian 索引 | Low | Peter 不在這個 plan 範圍，後續 separate ship |

## Phases

### Phase 0: Pre-flight Audit
1. **Force-download 所有 cloud-only stubs**
   ```bash
   brctl download ~/Documents
   ```
2. **Full path-reference scan**（找所有 hardcoded `~/Documents/Projects` 或 `/Users/manibari/Documents/Projects`）
   ```bash
   grep -rln "/Users/manibari/Documents/Projects" \
     ~/Documents/Projects ~/.claude ~/Library/LaunchAgents \
     2>/dev/null | grep -v ".git/" | sort -u
   ```
3. **Snapshot list of git repos** + 確認每個都 commit/push 乾淨（沒 uncommitted = 安全搬）
   ```bash
   for d in ~/Documents/Projects/*/; do
     [ -d "$d/.git" ] && echo "=== $d ===" && \
       git -C "$d" status --short 2>&1 | head -5
   done
   ```
4. **Inventory launchd plist 路徑**
   ```bash
   grep -l "Documents/Projects" ~/Library/LaunchAgents/*.plist | \
     xargs -I {} sh -c 'echo "{}:" && grep "Documents/Projects" {}'
   ```

**Exit criteria**: 知道所有要改的地方、所有 repo 沒 dirty state、所有 stub 已下載。

### Phase 1: 建立 destination + dry-run
1. `mkdir -p ~/code`
2. Dry-run 一個小 repo（建議 `resume-pool` 或 `Edict` — 沒 launchd 依賴）：
   ```bash
   rsync -an ~/Documents/Projects/Edict/ ~/code/Edict/    # dry-run
   ```
3. 真實搬一個小 repo + 在新位置 `git status` 確認正常
4. 確認 disk space 夠

**Exit criteria**: 至少一個 repo 確認能在新位置正常 git 操作。

### Phase 2: Pause launchd services
**重要**：rivendell 是 launchd-managed，遷移中不能讓 agent 拚命 retry 舊路徑。

```bash
# Bootout 所有 com.sk.* services + agents
for p in ~/Library/LaunchAgents/com.sk.*.plist; do
  launchctl bootout gui/$(id -u) "$p" 2>/dev/null
done
launchctl list | grep com.sk      # 應該空
```

**Exit criteria**: `launchctl list | grep com.sk` 沒輸出。

### Phase 3: Migrate repos (one batch)
按依賴順序搬（被依賴的先搬）：

1. **gstack 先搬**（被 `~/.claude/skills/gstack` symlink 指）：
   ```bash
   rsync -a --remove-source-files ~/Documents/Projects/gstack/ ~/code/gstack/
   rmdir ~/Documents/Projects/gstack
   # 重建 symlink
   rm ~/.claude/skills/gstack && ln -s ~/code/gstack ~/.claude/skills/gstack
   # 驗證
   ls ~/.claude/skills/gstack/SKILL.md 2>&1 || echo "FAIL"
   ```

2. **rivendell 搬**（launchd / dashboard 主幹）：
   ```bash
   rsync -a --remove-source-files ~/Documents/Projects/rivendell/ ~/code/rivendell/
   rmdir ~/Documents/Projects/rivendell
   # Clean stale state
   rm -rf ~/code/rivendell/dashboard-next/.next
   ```

3. **其他 15 個 repo** — 按字母順序或專案重要性搬：
   ```bash
   for repo in ChimesFlow Family-Fiscal MingOS TailTrack curia news_stock \
               Edict lorien odb-dfm Marketing-Pal rakucamp \
               sales-assistant resume-pool RTK 綻放計畫; do
     echo "=== $repo ==="
     rsync -a --remove-source-files \
       ~/Documents/Projects/"$repo"/ ~/code/"$repo"/
     rmdir ~/Documents/Projects/"$repo" 2>/dev/null
   done
   ```

**Exit criteria**: `ls ~/Documents/Projects/` 為空（或只剩非 git 雜物），`ls ~/code/` 有全部 17 repo。

### Phase 4: Update path references

1. **`~/.claude/projects.json` 全文替換**：
   ```bash
   cp ~/.claude/projects.json ~/.claude/projects.json.bak
   sed -i '' 's|/Users/manibari/Documents/Projects|/Users/manibari/code|g' \
     ~/.claude/projects.json
   jq . ~/.claude/projects.json > /dev/null && echo "JSON OK"
   ```

2. **launchd plist 全文替換**：
   ```bash
   for p in ~/Library/LaunchAgents/com.sk.*.plist; do
     sed -i '' 's|/Users/manibari/Documents/Projects|/Users/manibari/code|g' "$p"
   done
   ```

3. **rivendell `bin/sk` / `profiles.conf` 內的硬編路徑**：
   ```bash
   grep -rln "Documents/Projects" ~/code/rivendell/bin ~/code/rivendell/profiles
   # 然後手動 / sed 改
   ```

4. **各 repo 內藏的硬編路徑**（Python `__file__` 推導通常不用改；但 `.env` / docker `volumes:` 要看）：
   ```bash
   grep -rln "/Users/manibari/Documents/Projects" ~/code/ \
     --include="*.env*" --include="*.yml" --include="*.yaml" \
     --include="*.json" --include="*.toml" --include="*.py" \
     --include="*.sh" --include="*.md" 2>/dev/null
   ```
   每個都 review + sed 改。

**Exit criteria**: `grep -rl Documents/Projects ~/code ~/.claude ~/Library/LaunchAgents` 為空（或只剩備份檔 `.bak`）。

### Phase 5: Re-bootstrap launchd + smoke test
1. 重新 install 所有 plist：
   ```bash
   for p in ~/Library/LaunchAgents/com.sk.*.plist; do
     launchctl bootstrap gui/$(id -u) "$p"
   done
   launchctl list | grep com.sk | wc -l    # 應該回 12+
   ```

2. Smoke test dashboard：
   ```bash
   sleep 30        # 等 web rebuild
   curl -s http://localhost:8000/api/health | python3 -m json.tool
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
   ```

3. Smoke test 一個 agent：
   ```bash
   tail -f ~/Library/Logs/sk-agent/com.sk.agent.rivendell.harvest-stderr.log
   # 等下次排程或手動觸發
   ```

**Exit criteria**: dashboard 跑得起來、`/api/health` 回 200、`launchctl list | grep com.sk` 數量正確。

### Phase 6: Disable iCloud Documents sync
**這是 point of no return — 前面所有 phase 都驗證完才動。**

1. **再次確認 `~/Documents/Projects/` 已淨空**（防止 iCloud 把殘留 repo 變 stub）：
   ```bash
   find ~/Documents/Projects -maxdepth 2 -name ".git" 2>/dev/null    # 應該空
   ```

2. **GUI 操作**：
   - System Settings → Apple ID → iCloud → iCloud Drive
   - 右上 `Sync this Mac` → `Options`
   - 取消勾選 `Desktop & Documents Folders`
   - 對話框跳出時 **選 "Keep a Local Copy"**（千萬不要選 Keep in iCloud Only）

3. **驗證**：
   ```bash
   ls ~/Documents/    # 應該還是有遊戲資料夾、Peter vault 等
   brctl status ~/Documents 2>&1 | grep -i "syncing\|monitor"   # 不應該 actively syncing
   ```

**Exit criteria**: `~/Documents/` 內容齊全（含遊戲、Peter），但不再 sync iCloud。

### Phase 7: Cleanup + observation
1. **24 小時觀察期** — 跑一晚看 launchd cron logs 是否乾淨
2. **Remove `.bak` files** if all OK
3. **Update CLAUDE.md** with new path convention（projects 現在在 `~/code/` 不是 `~/Documents/Projects/`）
4. **Update README.md / SETUP.md** 同樣
5. **Record learning** to `~/.claude/learnings/LEARNINGS.md`（n=2 證實 iCloud trap，可 promote 規則）

## Rollback

如果 Phase 5 smoke test 失敗：
1. `launchctl bootout` 全部
2. `rsync -a --remove-source-files ~/code/<repo>/ ~/Documents/Projects/<repo>/`（反向搬）
3. `sed` 反向替換 `.claude/projects.json` + plists
4. `launchctl bootstrap` 全部
5. 找出失敗原因再重來

最壞情境：30 分鐘可回到原狀。

## Non-Goals
- 不處理 `~/Documents/Peter` vault（separate ship — Obsidian vault 遷移要單獨計畫）
- 不重新命名 repo（保留現有大小寫）
- 不順手 refactor 內藏路徑 helper（只做最小 sed 替換）
- 不換 git remote（push 路徑不變）
- 不動 game saves / `~/Documents/League of Legends` / `~/Documents/Paradox Interactive`

## Estimated Effort
- Phase 0: 15 min
- Phase 1: 10 min
- Phase 2: 5 min
- Phase 3: 30-60 min（disk speed dependent，17 個 repo + node_modules / .next 之類大檔）
- Phase 4: 20 min
- Phase 5: 10 min
- Phase 6: 5 min
- Phase 7: ongoing

**Total active time: ~2-3 小時**（可分兩個 session：Phase 0-2 一個 session、Phase 3-7 一個 session）

## Recommended Next Step

先做 **Phase 0 only** — 不動任何東西，只盤點：

1. `brctl download ~/Documents`（強制下載所有 cloud-only stubs）
2. Full path-reference scan（grep）
3. 各 repo `git status` 確認都 clean

完成後評估：
- 有多少路徑要改？（決定 Phase 4 規模）
- 有沒有 cloud-only stub 下載失敗的？（決定 Phase 3 風險）
- 有沒有 uncommitted changes？（決定 Phase 3 前要不要先 commit/stash）

Phase 0 結果再來談要不要進 Phase 1。
