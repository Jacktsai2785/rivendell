---
name: llm-field-regenerate-ux
description: >
  整合 LLM 重新生成既有 DB 欄位（公司簡介、職缺描述、案件摘要等）的端對端 UX flow——按鈕觸發 → 動畫 loading → preview + diff 標示 → 確認覆蓋
  TRIGGER when: 使用者說「用 LLM 重生公司簡介」「重新生成這個欄位」「AI 整理一遍」「掃描簡報後產生欄位內容」「diff 標示我看不到」「loading 動畫呈現」
when_to_use: 使用者說「用 LLM 重生公司簡介」「重新生成這個欄位」「AI 整理一遍」「掃描簡報後產生欄位內容」「diff 標示我看不到」「loading 動畫呈現」
version: 1.0.0
tags: [frontend`（橫跨 `frontend` + `backend`）]
languages: all
source: harvest-auto
---

# llm-field-regenerate-ux

## Overview

整合 LLM 重新生成既有 DB 欄位（公司簡介、職缺描述、案件摘要等）的端對端 UX flow——按鈕觸發 → 動畫 loading → preview + diff 標示 → 確認覆蓋

## When to Use

使用者說「用 LLM 重生公司簡介」「重新生成這個欄位」「AI 整理一遍」「掃描簡報後產生欄位內容」「diff 標示我看不到」「loading 動畫呈現」

## Background

From session harvest analysis:

- Session 16 一個 session 就累積 141 msgs / 33 次 Edit / 40 次 Bash，且使用者在過程中多次給出**重要的 UX 修正**（「動畫呈現」、「diff 在哪？」、「不直覺，請正式覆蓋」），這些反饋是高價值知識
  - 此模式可重用於其他「LLM 重生欄位」場景：候選人摘要、客戶 RFQ 草稿、會議備忘錄整理
  - 既有 `frontend-design`、`ui-ux-pro-max` 不夠具體；`mockup` 只到視覺，不涵蓋 LLM 整合與覆蓋流程
- **核心要點**（從 session 16 抽出）：
  1. 後端 endpoint...

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
