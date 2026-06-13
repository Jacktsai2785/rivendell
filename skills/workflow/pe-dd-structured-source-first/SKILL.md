---
name: pe-dd-structured-source-first
description: >
  pe-dd-structured-source-first skill
  TRIGGER when: when working with pe-dd-structured-source-first
when_to_use: when working with pe-dd-structured-source-first
version: 1.0.0
tags: [workflow]
languages: all
source: harvest-auto
---

# pe-dd-structured-source-first

## Overview

Auto-generated skill from session harvest.

## Background

From session harvest analysis:

規範 PE DD 流程的「結構化資料優先」順序：先 `tw-company-identify` → `tw-company-lookup` → MOPS DB 查詢（被投資揭露 / 月營收 / 損益）→ 才補 WebSearch / WebFetch。每個 session 至少省 5-8 次 WebSearch，並把財務數字錨定在官方資料而不是新聞稿。
使用者提供統編、要求做 DD 或投資備忘錄。
workflow
30 個 sessions 平均花 16 次 web 呼叫卻沒查 MOPS，是明顯的「沒用對工具」。但這可能已隱含在 `pe-memo-deep-research` 中，需先 au...

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
