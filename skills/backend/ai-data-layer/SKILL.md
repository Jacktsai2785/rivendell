---
name: ai-data-layer
description: >
  重構後端，將「純資料管理」與「AI / Agentic」邏輯明確分層
  TRIGGER when: when working with ai-data-layer
when_to_use: when working with ai-data-layer
version: 1.0.0
tags: [backend]
languages: all
source: harvest-auto
---

# ai-data-layer

## Overview

重構後端，將「純資料管理」與「AI / Agentic」邏輯明確分層

## Background

From session harvest analysis:

| Sessions 10 & 14：sales-assistant 和 projects 都遇到同樣的 `ai_provider.py` / `agent.py` 與資料層耦合問題，且這是 LLM-based app 的普遍架構問題 |
| **與現有 skills 差異** | `large-file-refactor` 處理檔案拆分；`systematic-debugging` 處理除錯；均未針對 AI/data 分層模式 |

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
