---
name: stock-fundamentals-grading
description: >
  將 MOPS 月營收 / 季財報原始資料計算成六大指標（營收成長性、營業利益率、稅後淨利年增率、累積 EPS、存貨周轉率、FCF），並依 rubric 給出 A/B/C 評等。提供 grading 演算法、資料模型、backfill 排程、Vue dashboard 元件與 PPTX 報告 builder 的完整 reference 實作。
  TRIGGER when: 「六大指標」「股票基本面評等」「fundamentals grading」「月營收評分」「TEJ 風格評等」「FCF 排名」。
when_to_use: 「六大指標」「股票基本面評等」「fundamentals grading」「月營收評分」「TEJ 風格評等」「FCF 排名」。
version: 1.0.0
tags: [workflow/]
languages: all
source: harvest-auto
---

# stock-fundamentals-grading

## Overview

將 MOPS 月營收 / 季財報原始資料計算成六大指標（營收成長性、營業利益率、稅後淨利年增率、累積 EPS、存貨周轉率、FCF），並依 rubric 給出 A/B/C 評等。提供 grading 演算法、資料模型、backfill 排程、Vue dashboard 元件與 PPTX 報告 builder 的完整 reference 實作。

## When to Use

「六大指標」「股票基本面評等」「fundamentals grading」「月營收評分」「TEJ 風格評等」「FCF 排名」。

## Background

From session harvest analysis:

- Session 7 長達 374 訊息、Bash(192) + Edit(56) + Write(27)，產出 `auto_rerun_grading.sh` / `backfill_progress.sh` / `build_six_indicators_pptx.py` / `FundamentalsPanel.vue` / `SixIndicatorsView.vue`，是清楚成形的完整 pipeline。
  - 既有 `mops-financial-scraper` 只做「資料抓取」、`investment-research` 只做「portfolio 決策」，**中間的「指標計...

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
