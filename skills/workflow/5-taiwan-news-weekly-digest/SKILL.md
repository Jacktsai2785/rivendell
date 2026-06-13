---
name: 5. **taiwan-news-weekly-digest**
description: >
  把過去 5-7 天的台灣產業新聞清單，彙整成「每日主題 + 高頻標題」週度摘要報告。輸出格式：`2026-05-04 | 主題：X、Y、Z | 高頻標題：...`。
  TRIGGER when: 使用者說「本週產業新聞摘要」「過去 7 天高頻標題」「每日主題」「週度產業 digest」。
when_to_use: 使用者說「本週產業新聞摘要」「過去 7 天高頻標題」「每日主題」「週度產業 digest」。
version: 1.0.0
tags: [workflow/]
languages: all
source: harvest-auto
---

# 5. **taiwan-news-weekly-digest**

## Overview

把過去 5-7 天的台灣產業新聞清單，彙整成「每日主題 + 高頻標題」週度摘要報告。輸出格式：`2026-05-04 | 主題：X、Y、Z | 高頻標題：...`。

## When to Use

使用者說「本週產業新聞摘要」「過去 7 天高頻標題」「每日主題」「週度產業 digest」。

## Background

From session harvest analysis:

Session [4][7][9][10][11] 共 5 次出現相同的「過去 N 天每日摘要 + 高頻標題」結構。現有 `taiwan-news-classifier` 只負責**單日**分類（相關/不相關 + 子類別），週度彙整是不同的輸出契約。建議作為 `taiwan-news-classifier` 的姐妹 skill 或合併進去成為第二個 mode。

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
