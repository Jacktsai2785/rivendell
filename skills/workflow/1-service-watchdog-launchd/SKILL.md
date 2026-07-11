---
name: 1. service-watchdog-launchd
description: >
  為 macOS 上的 HTTP 服務（FastAPI / Next.js / dashboard）建立「HTTP probe + 自動重啟」watchdog，當服務卡住（process 還在但 HTTP 不回應）時自動 kill + restart。
  TRIGGER when: 使用者說「服務又掛了」「自動重啟」「watchdog」「HTTP healthcheck」「launchd 重啟」「dashboard 卡住」。
when_to_use: 使用者說「服務又掛了」「自動重啟」「watchdog」「HTTP healthcheck」「launchd 重啟」「dashboard 卡住」。
version: 1.0.0
tags: [workflow/`（搭配既有 `launchd-agent`）]
languages: all
source: harvest-auto
---

# 1. service-watchdog-launchd

## Overview

為 macOS 上的 HTTP 服務（FastAPI / Next.js / dashboard）建立「HTTP probe + 自動重啟」watchdog，當服務卡住（process 還在但 HTTP 不回應）時自動 kill + restart。

## When to Use

使用者說「服務又掛了」「自動重啟」「watchdog」「HTTP healthcheck」「launchd 重啟」「dashboard 卡住」。

## Background

From session harvest analysis:

- Session 4 (rivendell) 完整實作了這個模式：HTTP 探測 → 判斷 stuck → 觸發 restart，並寫入 `.watchdog-state` 紀錄。Recent commits（`2d6a27d`, `d836a94`）顯示這是新建立、剛驗證過的可重用模式。
  - 既有 `launchd-agent` 只教如何建立 plist；不涵蓋「process alive 但 HTTP 卡死」這個 macOS 上常見的失敗模式。
  - 高再用價值：任何長跑的 dev server 都會用到。
- **驗證**：`grep -r "watchdog" /Users/m...

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
