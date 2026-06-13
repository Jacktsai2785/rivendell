---
name: 1. **taiwan-news-multiday-digest**
description: >
  把過去 N 天（5–8 天）的單日新聞分類結果，彙整成「多日摘要 + 高頻標題」格式。每天一段，列出當日主題（5–8 個關鍵詞），最後附跨日高頻標題排行。輸出格式固定：`【每日摘要與主題】` + `YYYY-MM-DD | 主題：A、B、C | 一句話總結`，後接 `【高頻標題】` 區塊。可選輸入：N 天的單日分類結果（即 `taiwan-news-classifier` 的輸出累積）。
  TRIGGER when: 使用者說「過去 N 天台灣產業新聞摘要」「週度新聞摘要」「多日 digest」「高頻標題」「news-{industry}.md 累積」「digest 5 days」「跨日彙整」。
when_to_use: 使用者說「過去 N 天台灣產業新聞摘要」「週度新聞摘要」「多日 digest」「高頻標題」「news-{industry}.md 累積」「digest 5 days」「跨日彙整」。
version: 1.0.0
tags: [workflow/]
languages: all
source: harvest-auto
---

# 1. **taiwan-news-multiday-digest**

## Overview

把過去 N 天（5–8 天）的單日新聞分類結果，彙整成「多日摘要 + 高頻標題」格式。每天一段，列出當日主題（5–8 個關鍵詞），最後附跨日高頻標題排行。輸出格式固定：`【每日摘要與主題】` + `YYYY-MM-DD | 主題：A、B、C | 一句話總結`，後接 `【高頻標題】` 區塊。可選輸入：N 天的單日分類結果（即 `taiwan-news-classifier` 的輸出累積）。

## When to Use

使用者說「過去 N 天台灣產業新聞摘要」「週度新聞摘要」「多日 digest」「高頻標題」「news-{industry}.md 累積」「digest 5 days」「跨日彙整」。

## Background

From session harvest analysis:

本批 23 個 session 中有 **11 個**是這種多日摘要格式（涵蓋 5 個產業 × 各自 5–8 天區間），是出現頻率最高的單一輸出形態。既有 `taiwan-news-classifier` 只處理**單日**清單，沒有覆蓋「跨多日彙整 + 高頻標題抽取」。也是 `jk_nb/wiki/news/<industry>.md` 累積頁面的天然上游（每天的 `## YYYY-MM-DD` 節需要這種格式）。

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
