# User Flow: Projects HQ

**Feature:** Git-native repo health on Projects page
**Date:** 2026-04-02

## Happy Path

```mermaid
flowchart TD
    A[開啟 rivendell\nlocalhost:3000] --> B[總覽頁\n看到 agents 狀態 + metrics]
    B --> C[點 Projects 導覽]
    C --> D[Projects 列表頁\n每張卡片含 git health]
    D --> E{有問題的 repo?}
    E -->|有 — 紅燈 / behind origin| F[點擊專案卡片]
    E -->|全部正常 — 綠燈| G[確認無礙\n出任務前對齊完成]
    F --> H[專案詳頁\ngit log + agent 清單]
    H --> I{需要處理?}
    I -->|是 — push / fix| J[跳到 terminal\n處理後回來刷新]
    I -->|否 — 只是查看| K[返回列表]
    J --> K
    K --> G
    G --> Z((✅ 出發))
```

## Error & Edge Branches

```mermaid
flowchart TD
    D[Projects 列表頁] --> E{repo 路徑存在?}
    E -->|否| F[卡片顯示 ⚪ not found]
    E -->|是但非 git| G[卡片顯示 ⚪ no git]
    E -->|是且有 git| H[顯示 git health]
    H --> I{git 指令超時 >3s}
    I -->|是| J[顯示 ⏱ timeout]
    I -->|否| K[完整顯示]
    K --> L{API 失敗}
    L -->|是| M[Error 訊息]
    L -->|否| N[正常渲染]
```

## Screen Inventory

| # | 畫面 | 目的 | 關鍵元素 |
|---|------|------|---------|
| 1 | Projects 列表 | 全局 repo 健康 | 卡片 grid、git badge、agent 計數 |
| 2 | GitStatusBadge | repo 現況 | branch、ahead/behind、last commit、recent files |
| 3 | 專案詳頁 | 深入查看 | agent 清單、recent commits（10 條） |

## GitStatusBadge 顏色邏輯

| 狀態 | 顏色 | 觸發條件 |
|------|------|---------|
| ✓ synced | 綠色 | ahead=0, behind=0 |
| ↑N unpushed | 琥珀色 | ahead > 0 |
| ↓N behind | 紅色 | behind > 0 |
| ⏱ timeout | 灰色 | git >3s |
| ⚪ no git | 灰色 | 路徑不存在 or 非 git repo |
