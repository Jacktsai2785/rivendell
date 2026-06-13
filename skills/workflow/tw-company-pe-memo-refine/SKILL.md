---
name: tw-company-pe-memo-refine
description: >
  對 `tw-company-pe-memo` 產出的初版備忘錄，執行第二輪「補充搜尋 → 證據抓取 → 修訂」迴圈，加入媒體報導、獲獎入選、創辦人背景、競品分析等深度訊息。
  TRIGGER when: 使用者貼上既有 PE 備忘錄並說「深度補充搜尋並修訂備忘錄」、「補強這份 memo」、「加入媒體/報導內容」、「revise memo」、「v2 of memo」。
when_to_use: 使用者貼上既有 PE 備忘錄並說「深度補充搜尋並修訂備忘錄」、「補強這份 memo」、「加入媒體/報導內容」、「revise memo」、「v2 of memo」。
version: 1.0.0
tags: [workflow]
languages: all
source: harvest-auto
---

# tw-company-pe-memo-refine

## Overview

對 `tw-company-pe-memo` 產出的初版備忘錄，執行第二輪「補充搜尋 → 證據抓取 → 修訂」迴圈，加入媒體報導、獲獎入選、創辦人背景、競品分析等深度訊息。

## When to Use

使用者貼上既有 PE 備忘錄並說「深度補充搜尋並修訂備忘錄」、「補強這份 memo」、「加入媒體/報導內容」、「revise memo」、「v2 of memo」。

## Background

From session harvest analysis:

- Sessions #4, #5, #6, #10, #11 **5 個 sessions** 使用完全相同的 prompt 模板：「步驟 1：用 WebSearch 搜尋『公司名 報導 OR 新聞 OR 採訪 OR 入選 OR 獲獎 OR 媒體 OR 創業』」
  - 是 `tw-company-pe-memo` 之後的後續迴圈，不是同一個動作
  - 工具用量集中在 WebSearch (2–9 次/session) + WebFetch (0–6 次/session)，模式高度一致
  - 目前每次使用者要手動貼整套 prompt 模板，封裝成 skill 可顯著降低 token + ...

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
