---
name: 2. dev-server-restart-verify
description: >
  重啟 monorepo 的 frontend + backend dev server，並在回報前 **先驗證 port 真的在 listening**（避免「啟動完成但其實 crash」的假陽性）。流程：讀 AGENTS.md 找啟動指令 → 殺 stale process（lsof + kill）→ 在背景啟動 → `lsof -i :PORT` 或 `curl /health` 驗證 → 才
  TRIGGER when: 使用者說「重啟 dev server」「frontend backend 都重開」「servers are down」「restart and verify」。
when_to_use: 使用者說「重啟 dev server」「frontend backend 都重開」「servers are down」「restart and verify」。
version: 1.0.0
tags: [workflow/]
languages: all
source: harvest-auto
---

# 2. dev-server-restart-verify

## Overview

重啟 monorepo 的 frontend + backend dev server，並在回報前 **先驗證 port 真的在 listening**（避免「啟動完成但其實 crash」的假陽性）。流程：讀 AGENTS.md 找啟動指令 → 殺 stale process（lsof + kill）→ 在背景啟動 → `lsof -i :PORT` 或 `curl /health` 驗證 → 才回報「已啟動」。

## When to Use

使用者說「重啟 dev server」「frontend backend 都重開」「servers are down」「restart and verify」。

## Background

From session harvest analysis:

- Session 6 有明確「先讀 AGENTS.md → 再驗證 ports listening before reporting」的 prompt，且這是 sales-assistant 反覆會遇到的狀態。
  - 與全域 CLAUDE.md 的「No completion claims without running verification commands first」原則一致——這個 skill 把「驗證」標準化。
  - 既有 `agent-observability` 是 dashboard log 整合；`launchd-agent` 是 macOS plist 管理；都不...

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
