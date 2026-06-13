# Rivendell Dashboard 啟動指南

| 服務 | Port | URL |
|------|------|-----|
| API (FastAPI) | 8001 | http://localhost:8001 |
| 前端 (Next.js) | 3001 | http://localhost:3001 |

> **前後端已設定為 systemd user service，開機自動啟動、crash 自動重啟。**
> 正常情況下不需要手動操作。

---

## 服務管理（systemd）

```bash
# 狀態
systemctl --user status com.sk.dashboard.api com.sk.dashboard.web

# 重啟
systemctl --user restart com.sk.dashboard.api
systemctl --user restart com.sk.dashboard.web

# 停止
systemctl --user stop com.sk.dashboard.api com.sk.dashboard.web

# 重新安裝所有 rivendell 服務（agents + dashboard）
bash /home/jacktsai/rivendell/bin/sk-setup-systemd
```

## 確認是否正常

```bash
ss -tlnp | grep -E ":(3001|8001)"
# 應看到兩行 LISTEN
```

## 查看 log

```bash
# systemd journal（最即時）
journalctl --user -u com.sk.dashboard.api -f
journalctl --user -u com.sk.dashboard.web -f

# 檔案 log
tail -f /home/jacktsai/rivendell/logs/api.log
tail -f /home/jacktsai/rivendell/logs/web.log
```

## 注意事項

- API 綁定 `0.0.0.0:8001`，Windows 瀏覽器才連得到（WSL2 loopback 不會自動 forward）
- CORS 設定在 `api/server.py`，允許來源為 `http://localhost:3001`
- 前端首次啟動或程式碼有改動時 `start-web.sh` 會自動 rebuild（約 30 秒）
