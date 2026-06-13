---
name: multi-industry-news-pipeline-orchestrator
description: >
  把「4 個固定產業（AI / 前瞻科技 / 綠色永續 / 消費生活）× 兩種輸出（單日分類 / 多日 digest）」串成一次性編排，避免使用者手動逐產業觸發 `taiwan-news-classifier` + `1-taiwan-news-multiday-digest`。
  TRIGGER when: 使用者說「跑今天 4 個產業的新聞」「把這週 4 個產業彙整出來」「news pipeline 一次跑完」「4 industry batch」。
when_to_use: 使用者說「跑今天 4 個產業的新聞」「把這週 4 個產業彙整出來」「news pipeline 一次跑完」「4 industry batch」。
version: 1.0.0
tags: [workflow/]
languages: all
source: harvest-auto
---

# multi-industry-news-pipeline-orchestrator

## Overview

把「4 個固定產業（AI / 前瞻科技 / 綠色永續 / 消費生活）× 兩種輸出（單日分類 / 多日 digest）」串成一次性編排，避免使用者手動逐產業觸發 `taiwan-news-classifier` + `1-taiwan-news-multiday-digest`。

## When to Use

使用者說「跑今天 4 個產業的新聞」「把這週 4 個產業彙整出來」「news pipeline 一次跑完」「4 industry batch」。

## Background

From session harvest analysis:

- 本批 11 個 session 中有 8 個是這 4 個產業的反覆觸發，**4 產業 × 兩種輸出**幾乎是固定組合。
  - 既有 `taiwan-news-classifier`（單日、單產業）與 `1-taiwan-news-multiday-digest`（跨日、單產業）已存在，但沒有**多產業一次跑 + 進度追蹤**的編排層。
  - 可額外帶來：產業 coverage 檢查（今日是否 4 個產業都跑了）、輸出檔案命名一致（`news-{industry}.md`）、避免漏跑。
- **不要重複**：不是再寫一個分類器，是**呼叫已有 skill** 的 orchestrator...

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
