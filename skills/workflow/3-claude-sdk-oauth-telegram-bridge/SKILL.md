---
name: 3-claude-sdk-oauth-telegram-bridge
description: >
  把「Claude Agent SDK（OAuth 模式）」+ 「Telegram bot」+ 「地端 web app」三者組合起來：使用者透過 Telegram 上傳檔案 → 後端用 Claude OAuth token 呼叫模型做辨識 → 結果回 Telegram 並寫入地端 DB。涵蓋 OAuth scope、token 儲存（Fernet）、Telegram file_id → bytes、
  TRIGGER when: 使用者說「Claude SDK + Telegram」「OAuth 串接 Telegram 辨識」「Telegram 上傳辨識公司名稱」「local 不上網但要用 Claude」。
when_to_use: 使用者說「Claude SDK + Telegram」「OAuth 串接 Telegram 辨識」「Telegram 上傳辨識公司名稱」「local 不上網但要用 Claude」。
version: 1.0.0
tags: [backend/`（鄰接 `oauth-token-vault` 與 `claude-to-telegram`）]
languages: all
source: harvest-auto
---

# 3. claude-sdk-oauth-telegram-bridge

## Overview

把「Claude Agent SDK（OAuth 模式）」+ 「Telegram bot」+ 「地端 web app」三者組合起來：使用者透過 Telegram 上傳檔案 → 後端用 Claude OAuth token 呼叫模型做辨識 → 結果回 Telegram 並寫入地端 DB。涵蓋 OAuth scope、token 儲存（Fernet）、Telegram file_id → bytes、長任務的 ack 模式。

## When to Use

使用者說「Claude SDK + Telegram」「OAuth 串接 Telegram 辨識」「Telegram 上傳辨識公司名稱」「local 不上網但要用 Claude」。

## Background

From session harvest analysis:

- Session 2 的需求文件明確列出這個三層組合（"3. 用 claude sdk oauth 串接到 telegram 進行辨識"）。
  - 現有 `claude-to-telegram` 是「遠端控制 Claude Code session」(雙向 chat bridge)，不是「Telegram → Claude SDK → 自有 web app」。`oauth-token-vault` 與 `telegram-bot` 各自存在但**沒有 skill 把它們縫起來**。
  - 中度推薦：模式清楚但只看到 1 個專案有此需求，先觀察是否會在其他客戶/專案重複出現。

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
