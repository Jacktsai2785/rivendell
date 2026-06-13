---
name: cross-device-deploy
description: >
  跨裝置多 project 協調部署：以 rivendell 為核心，讀取 AGENTS.md 定義的部署清單，在不同環境一鍵部署多個相關 projects，支援跨裝置同步與 dashboard 監控。
  TRIGGER when: 需要在新環境 bootstrap 多個 projects；pull rivendell 後一鍵部署整個生態；跨裝置同步並重新部署；多個相關服務需協調部署。
  DO NOT TRIGGER when: 單一服務部署（用 deploy skill）；單一專案初始化（用 init-project skill）；純 CI/CD 配置（用 ci-pipeline skill）。
tags: [deployment, orchestration, multi-service, bootstrap]
version: 1.0.0
languages: all
source: manual
user_invocable: false
---

# cross-device-deploy

跨裝置部署協調器：以 rivendell AGENTS.md 為部署拓撲核心，支援多環境、多 project 的自動化部署與監控。

## Overview

在分佈式開發環境中，開發者常面臨「多個相關服務需在不同環境同步部署」的需求。例如：

- **MOPS cluster**：sales-api、inventory-api、purchase-api 等多個微服務依賴共同資料庫，需協調部署順序
- **跨環境推廣**：development → staging → production，每次部署涉及數個服務，手動逐一部署易出錯
- **新環境 bootstrap**：新測試機或 CI/CD 環境需一鍵啟動整個服務生態
- **跨裝置同步**：主開發機更新代碼，需在遠端測試機立即重現部署狀態

此 skill 解決上述問題，提供：

1. **中央部署拓撲管理**：rivendell 中的 AGENTS.md 定義哪些 projects 要部署、順序、依賴關係、各環境的 port 和路徑映射
2. **多環境支援**：同一份 AGENTS.md 支援 development / staging / production 三個環境的獨立配置
3. **並行或序列部署**：根據依賴關係自動排程，無依賴的服務並行啟動，有依賴的按順序部署
4. **跨裝置同步**：支援 SSH 遠端部署，或本地多個 projects 目錄的協調
5. **實時監控**：Dashboard 整合，通過 AgentCard 視覺化各 project 的部署狀態、health check、日誌

與現有 skills 的差異：

- `deploy`：單一服務的平台選擇與配置生成（Vercel / Fly.io），不涉及多服務協調
- `init-project`：單一專案的 AGENTS.md 和 CLAUDE.md 初始化，不涉及部署
- `cross-device-deploy`：多 project 的部署協調、環境管理、跨裝置同步，是部署編排的上層

## 何時使用

### 場景 1：新環境 bootstrap

開發者在新裝置（測試機、CI/CD runner、臨時開發環境）上首次拉取 rivendell，需要自動化初始化並部署整個 project 生態。

**觸發指令**：

```bash
sk cross-device-deploy --bootstrap --env staging
```

流程：

1. 驗證 git repo 已初始化，rivendell 已拉取最新
2. 驗證 ~/PORTS.md，確認目標環境的 ports 未被佔用
3. 讀取 AGENTS.md `deploymentProjects[staging]` 清單
4. 檢查 postgres / redis 等共同依賴，若不存在提示用戶
5. 依賴順序並行啟動各 project：
   - 進入 project 目錄（如 ~/mops_dbs/sales）
   - 執行 `npm install` / `pip install`（若 package.json / requirements.txt 存在）
   - 執行 `npm start` / `python -m flask run`（根據 start script 定義）
6. 每個 project 啟動後，執行 health check（curl 檢查 /health endpoint）
7. 生成部署摘要報告：各 project 狀態、port 監聽、啟動耗時

### 場景 2：多 service 同步部署

主開發環境更新了多個相關服務的代碼，需要在測試環境重現該部署狀態。

**觸發指令**：

```bash
sk cross-device-deploy --projects sales-api,inventory-api --env staging
```

流程：

1. 讀取 AGENTS.md，篩選 `deploymentProjects[staging]` 中名稱為 sales-api 和 inventory-api 的項目
2. 檢查這兩個服務的共同依賴（如都依賴 postgres），確保依賴可用
3. 並行重啟這兩個 project（停止舊進程、拉取最新代碼、重新啟動）
4. 驗證 health check
5. 報告更新時間和狀態

### 場景 3：跨裝置同步部署

主機 A 更新了代碼和 AGENTS.md 配置，需要在主機 B（遠端測試機、生產環境）上一鍵同步並重新部署。

**觸發指令**：

```bash
sk cross-device-deploy --sync --remote-host deploy-user@staging-api.local --env staging
```

流程：

1. 通過 SSH 連接到遠端主機，驗證 rivendell repo 存在
2. 在遠端執行 `git -C ~/rivendell pull origin main`，同步最新 AGENTS.md
3. 在遠端執行 `sk cross-device-deploy --bootstrap --env staging`，觸發遠端部署
4. 監聽遠端部署進度（通過 SSH 日誌流），實時顯示進度和錯誤

## 執行步驟與模式

### 1. 配置準備：AGENTS.md 中的部署拓撲定義

在 ~/rivendell/AGENTS.md 中定義 `deploymentProjects` 部分，描述各環境的服務清單：

```yaml
# AGENTS.md — 部署拓撲定義

deploymentProjects:
  development:
    - name: sales-api
      path: ~/mops_dbs/sales
      framework: python-fastapi
      port: 8080
      healthCheck: http://localhost:8080/health
      timeout: 30
      depends_on: [postgres]
    - name: inventory-api
      path: ~/mops_dbs/inventory
      framework: python-fastapi
      port: 8081
      healthCheck: http://localhost:8081/health
      timeout: 30
      depends_on: [postgres]
    - name: web-dashboard
      path: ~/rivendell/dashboard-next
      framework: next.js
      port: 3000
      healthCheck: http://localhost:3000
      timeout: 45
      depends_on: []

  staging:
    - name: sales-api
      path: /opt/staging/mops_dbs/sales
      framework: python-fastapi
      port: 8080
      healthCheck: http://staging-internal:8080/health
      timeout: 45
      depends_on: [postgres, redis]
    - name: inventory-api
      path: /opt/staging/mops_dbs/inventory
      framework: python-fastapi
      port: 8081
      healthCheck: http://staging-internal:8081/health
      timeout: 45
      depends_on: [postgres, redis]
    - name: web-dashboard
      path: /opt/staging/rivendell/dashboard-next
      framework: next.js
      port: 3000
      healthCheck: http://staging-web:3000
      timeout: 60
      depends_on: []

sharedDependencies:
  postgres:
    check: "pg_isready -h localhost -p 5432"
    port: 5432
    startScript: "sudo systemctl start postgresql"
    version: "15+"
  redis:
    check: "redis-cli -h localhost ping"
    port: 6379
    startScript: "redis-server --daemonize yes"
    version: "7+"
```

**欄位說明**：

- `name`：project 識別碼（用於 --projects 篩選）
- `path`：project 絕對路徑（開發環境用 ~/ 展開，遠端環境用完整路徑）
- `framework`：框架類型，決定自動 start script 尋找方式（python-fastapi、next.js、node-express、go-fiber 等）
- `port`：服務監聽的本機 port
- `healthCheck`：HTTP GET endpoint，用來驗證服務就緒（可選，若無則跳過檢查）
- `timeout`：health check 的等待時間（秒），預設 30
- `depends_on`：依賴的服務或資源清單，排程時保證先啟動依賴
- `sharedDependencies[<name>]`：全局資源（如 postgres / redis），包含檢查命令、start script、版本需求

### 2. 執行部署：基本指令

#### 完整 bootstrap（新環境初始化）

```bash
sk cross-device-deploy --bootstrap --env staging
```

執行步驟：

1. **驗證基礎環境**：
   - Git repo 已初始化，rivendell 已拉取
   - 確認 ~/PORTS.md 存在（SSOT for port allocation）
   - 驗證目標環境的所有 ports 未被佔用：`lsof -i :8080` 等

2. **讀取配置**：
   - 讀取 AGENTS.md 的 `deploymentProjects[staging]` 和 `sharedDependencies`
   - 按依賴拓撲排序（DFS 或 topological sort）

3. **檢查依賴**：
   - 遍歷 `sharedDependencies`，執行各 check 命令
   - 若 postgres 不可用，詢問用戶是否啟動：`pg_isready -h localhost -p 5432 || sudo systemctl start postgresql`
   - 若依賴無法啟動，終止部署並報告

4. **並行啟動 projects**：
   - 無依賴的 projects（depends_on: []）立即啟動
   - 依賴的 projects 等待依賴完成後啟動
   - 每個 project 在獨立的後台進程啟動，日誌重定向到 ~/rivendell/logs/<name>.log

   啟動邏輯：
   ```bash
   cd ~/mops_dbs/sales
   npm install --ci 2>&1 | tee -a ~/rivendell/logs/sales-api-install.log
   npm start 2>&1 | tee -a ~/rivendell/logs/sales-api.log &
   ```

5. **Health check 與重試**：
   - 啟動後立即開始輪詢 health check endpoint（curl -s $healthCheck）
   - 每 2 秒輪詢一次，最多 30 秒（或 timeout 欄位指定的時間）
   - 若 health check 成功（HTTP 200），標記為 ready
   - 若超時，嘗試重啟（最多 3 次，指數退避：2s、4s、8s 後重試）
   - 若 3 次重試仍失敗，標記為 failed，記錄最後 50 行日誌，繼續部署其他 projects

6. **生成報告**：
   ```
   Bootstrap Report — Staging Environment
   =====================================
   
   Timestamp: 2026-06-13T14:32:15Z
   Environment: staging
   
   ✅ Shared Dependencies
     postgres — ready (pg_isready OK)
     redis — ready (redis-cli ping OK)
   
   ✅ Projects Deployed
     sales-api — ready (8080/health OK, 2.3s)
     inventory-api — ready (8081/health OK, 1.8s)
   
   ⏳ Projects Deploying
     web-dashboard — starting (npm build running, est. 30s)
   
   ❌ Failed Projects
     (none)
   
   Next steps: 
     - View logs: tail -f ~/rivendell/logs/<project>.log
     - Monitor dashboard: http://localhost:3000 (when ready)
     - Check port usage: lsof -i :8000-8089
   ```

#### 選擇性部署（特定 projects）

```bash
sk cross-device-deploy --projects sales-api,inventory-api --env staging
```

只部署 sales-api 和 inventory-api（跳過 web-dashboard）。流程與完整 bootstrap 相同，但僅限於指定的 projects。

#### 跨主機同步部署

```bash
sk cross-device-deploy --sync --remote-host deploy-user@staging-api.local --env staging
```

流程：

1. 驗證 SSH 可連接：`ssh -o ConnectTimeout=5 deploy-user@staging-api.local echo OK`
2. 在遠端執行 git pull：`ssh deploy-user@staging-api.local "cd ~/rivendell && git pull origin main"`
3. 在遠端執行 bootstrap：`ssh deploy-user@staging-api.local "sk cross-device-deploy --bootstrap --env staging"`
4. 實時流式輸出遠端日誌到本機，用戶可即時監控部署進度

#### 依賴順序舉例

假設 AGENTS.md 定義如下：

```yaml
deploymentProjects:
  staging:
    - name: api-1
      depends_on: [postgres]
    - name: api-2
      depends_on: [postgres]
    - name: worker
      depends_on: [api-1, api-2, redis]
    - name: web
      depends_on: []
```

部署順序：

1. **第 1 輪**：postgres、redis 不是 projects，假設已就緒
2. **第 2 輪**：並行啟動 api-1、api-2（都只依賴 postgres，已就緒）、web（無依賴）
3. **第 3 輪**：api-1、api-2、web 都就緒後，啟動 worker（依賴全滿足）

### 3. Dashboard 整合：AgentCard.tsx 實時監控

在 dashboard-next/src/app/deploy/page.tsx 中實現 AgentCard 列表，實時監控各 project 狀態：

```tsx
interface DeploymentProject {
  name: string;
  port: number;
  status: 'idle' | 'starting' | 'ready' | 'failed';
  healthCheckURL: string;
  lastUpdated: ISO8601DateTime;
  logTail?: string[]; // 最後 20 行日誌
}

// 每 3 秒輪詢一次 ~/rivendell/logs/<name>.json（metadata file）
// 或通過 websocket 實時推送
```

AgentCard 展示內容：

```
┌─────────────────────────────────┐
│ sales-api                       │
├─────────────────────────────────┤
│ Status: ✅ Ready                │
│ Port: 8080                      │
│ Uptime: 2h 15m                  │
│ Health: 200 OK (2ms)            │
│ Last Deploy: 2026-06-13 10:30  │
├─────────────────────────────────┤
│ [View Logs] [Restart] [Stop]   │
└─────────────────────────────────┘
```

點擊 "View Logs" 展開側邊欄，顯示最近 100 行日誌；點擊 "Restart" 觸發一鍵重啟（對應 `sk cross-device-deploy --restart sales-api --env staging`）。

### 4. 驗證與故障排查

部署後自動執行：

```bash
# 檢查所有 ports 是否在監聽
for port in 8080 8081 3000; do
  if lsof -i :$port > /dev/null; then
    echo "✅ Port $port is listening"
  else
    echo "❌ Port $port is NOT listening"
  fi
done

# 檢查 health check endpoints
curl -s http://localhost:8080/health | jq .status

# 檢查最後 20 行日誌，搜尋 ERROR / CRITICAL
grep -E 'ERROR|CRITICAL' ~/rivendell/logs/sales-api.log | tail -20
```

若有 project 失敗，自動嘗試重啟：

```bash
# 3 次重試，指數退避（2s、4s、8s）
for i in {1..3}; do
  echo "Retry $i: restarting sales-api..."
  cd ~/mops_dbs/sales && npm start &
  sleep $((2 ** i))  # 2^i 秒
  if curl -s http://localhost:8080/health | jq -e '.status == "ok"' > /dev/null; then
    echo "✅ sales-api recovered"
    break
  fi
done
```

## 注意事項

### 已知限制

1. **高度依賴目錄結構一致性**

   skill 假設 development 環境中 projects 在 ~/mops_dbs/ 下，staging 環境在 /opt/staging/mops_dbs/ 下。若用戶自訂目錄結構，AGENTS.md 中的 path 需手動更新。建議在 CLAUDE.md 中定義全局環境變數：

   ```yaml
   # .claude/CLAUDE.md
   environment:
     DEV_PROJECT_ROOT: ~/mops_dbs
     STAGING_PROJECT_ROOT: /opt/staging/mops_dbs
     PROD_PROJECT_ROOT: /prod/mops_dbs
   ```

   Skill 會自動用 ${ } 展開。

2. **啟動順序不保證 runtime 依賴**

   AGENTS.md 中的 `depends_on` 只控制啟動順序，不能感知「API 2 需等 API 1 初始化資料庫」等 runtime 依賴。建議各 project 在啟動 script 中自行實現 wait-for 邏輯（如 node-dev 的 --wait-on）：

   ```json
   "scripts": {
     "start": "wait-on http://localhost:8080/health && node server.js"
   }
   ```

3. **跨主機部署需預先配置 SSH**

   --sync 和 --remote-host 需要 SSH 密鑰認證已設置，且遠端主機已安裝 Claude Code CLI（sk）。密碼驗證不支援（基於安全和自動化考量）。若未設置，提示用戶：

   ```bash
   sk-setup-ssh deploy-user@staging-api.local
   # 或手動：ssh-copy-id deploy-user@staging-api.local
   ```

4. **Health check 超時設定**

   預設 timeout 30 秒。若服務啟動時間長（冷啟動、編譯），會誤判為失敗。建議：

   - 在 AGENTS.md 中按服務調整 timeout（web-dashboard 可設 60s）
   - 或使用 --health-timeout 全局覆蓋：`sk cross-device-deploy --bootstrap --env staging --health-timeout 60`

5. **Port 衝突檢測不完整**

   Skill 檢查 ~/PORTS.md 和 lsof，但無法檢測虛擬 port（Docker、VM 內部）。跨環境部署時，若主機 A 和主機 B 同時用 localhost:8080，不會檢測到衝突。建議在 AGENTS.md 中明確指定各環境的 port，避免衝突。

### 陷阱與避免方式

**陷阱 1：.env 環境變數未同步**

若各 project 依賴 .env 檔案（如資料庫連線字符串），部署時若 .env 不存在或過期，服務無法啟動。

**避免**：

- 在 AGENTS.md 中新增 `envFile` 欄位，指定每個環境的 .env 範本：
  ```yaml
  - name: sales-api
    envFile: .env.staging  # 會自動複製為 .env 後啟動
  ```
- 或使用 --copy-env 選項，自動尋找 .env.${ENV} 並複製為 .env：
  ```bash
  sk cross-device-deploy --bootstrap --env staging --copy-env
  ```

**陷阱 2：資料庫連接池衝突**

若在 development 部署後立即在 staging 部署，且兩個環境共享 PostgreSQL（不安全），可能因連接池互相干擾導致部署失敗。

**避免**：

- 各環境使用獨立資料庫實例（development 用本地 postgres，staging 用 staging 資料庫服務器）
- 在 AGENTS.md 中明確指定各環境的資料庫 URL
- Health check 包含資料庫連線驗證：`http://localhost:8080/health?db=true`

**陷阱 3：遠端部署日誌難以檢視**

跨主機部署時，日誌存放在遠端，部署失敗時很難排查。

**避免**：

- 使用 --fetch-logs 選項，自動將遠端日誌拉回本機：
  ```bash
  sk cross-device-deploy --sync --remote-host staging-api.local --env staging --fetch-logs
  # 日誌存放在 ~/rivendell/logs/remote-staging-<timestamp>/
  ```
- 或在 Dashboard 中新增「遠端日誌查看器」，通過 SSH 實時流式顯示

**陷阱 4：部分 project 失敗但其他 project 已啟動**

若 api-2 啟動失敗但 api-1 已成功，整體部署是「部分成功」狀態。用戶可能誤認為部署完全成功。

**避免**：

- 部署報告中明確標記失敗的 projects，用 ❌ 符號突出
- 支援 --fail-fast 選項，發現任何 project 失敗立即停止（默認不啟用，因為部分啟動有時可接受）
- Dashboard 醒目顯示失敗 projects，並提供一鍵重試按鈕

**陷阱 5：Port 已被舊進程佔用**

若上一次部署的進程沒有完全停止，新部署嘗試綁定同一 port 會失敗。

**避免**：

- 部署前自動停止舊進程：`lsof -i :8080 | grep -v COMMAND | awk '{print $2}' | xargs kill -9`
- 在 AGENTS.md 中新增 `gracefulShutdownTimeout`，部署前先嘗試 graceful shutdown（發送 SIGTERM），若超時再強制殺死
- 使用 systemd service 管理各 project（比單純的 npm start 更穩定）

### 長期運維建議

1. **集中日誌管理**：將 ~/rivendell/logs/<project>.log 上傳到中央日誌服務（ELK / Datadog），便於跨主機查詢
2. **自動化健康檢查**：定期執行 health check（systemd timer 每 5 分鐘檢查一次），若有 project 宕機自動重啟或告警
3. **部署版本控制**：記錄每次部署的 AGENTS.md commit hash、部署耗時、失敗原因，建立部署歷史庫
4. **藍綠部署**：支援 --blue-green 選項，同時運行舊版本和新版本，部署驗證後切流量，支援快速回滾
5. **監控與告警**：集成 Prometheus / Grafana，監控各 project 的啟動時間、健康狀態、資源使用，異常時發送告警（Slack / PagerDuty）
