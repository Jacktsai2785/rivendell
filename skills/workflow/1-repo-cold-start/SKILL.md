---
name: 1. repo-cold-start
description: >
  拿到一個沒看過的 GitHub repo，要在本地把它跑起來「看到畫面」。流程：clone → 偵測 stack（package.json / pyproject.toml / Dockerfile）→ 安裝依賴 → 補 `.env.local`/`.env` → 啟動前後端 → 驗證 port 是否 listening → 開瀏覽器確認，並針對常見「failed to fetch」（CORS /
  TRIGGER when: 使用者說「幫我跑這個 repo」「clone 這個然後讓我看畫面」「啟動讓我看畫面」「failed to fetch」「這個 repo 怎麼跑起來」、貼上 GitHub URL 後接「跑跑看」。
when_to_use: 使用者說「幫我跑這個 repo」「clone 這個然後讓我看畫面」「啟動讓我看畫面」「failed to fetch」「這個 repo 怎麼跑起來」、貼上 GitHub URL 後接「跑跑看」。
version: 1.0.0
tags: [workflow/]
languages: all
source: harvest-auto
---

# 1. repo-cold-start

## Overview

拿到一個沒看過的 GitHub repo，要在本地把它跑起來「看到畫面」。流程：clone → 偵測 stack（package.json / pyproject.toml / Dockerfile）→ 安裝依賴 → 補 `.env.local`/`.env` → 啟動前後端 → 驗證 port 是否 listening → 開瀏覽器確認，並針對常見「failed to fetch」（CORS / proxy / 前後端 port 對應錯誤 / API base URL）給出固定排查步驟。

## When to Use

使用者說「幫我跑這個 repo」「clone 這個然後讓我看畫面」「啟動讓我看畫面」「failed to fetch」「這個 repo 怎麼跑起來」、貼上 GitHub URL 後接「跑跑看」。

## Background

From session harvest analysis:

- Session 7 投入 75 訊息、61 個 Bash 呼叫處理一個明確流程：fetch 失敗 → 給 port（3100/8100）→ 補 `.env.local` → 啟動 → 驗證。這正是「拿到別人的 repo」的固定痛點。
  - 既有 skill 有缺口：`init-project` 是建立**自己的**新專案；`env-doctor` 檢查環境**可重現性**；`gstack-investigate` 是 root cause 模式；`docker-compose-setup` 是出**新的** compose 檔。**沒有 skill 處理「外來 repo 第一次跑」**。...

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
