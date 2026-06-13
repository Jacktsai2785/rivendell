---
name: 2. financial-indicators-from-statements
description: >
  從原始月/季財報資料（MOPS 三表）反推「6 大基本面指標」（營收成長性、營業利益率、稅後淨利 YoY、累積 EPS、存貨周轉率、FCF）的計算規則與 SQL/Python 實作。
  TRIGGER when: 使用者說「6 大指標」「基本面評分」「fundamentals grading」「自己算 ROE/EPS」「從月報算年化指標」。
when_to_use: 使用者說「6 大指標」「基本面評分」「fundamentals grading」「自己算 ROE/EPS」「從月報算年化指標」。
version: 1.0.0
tags: [backend/`（鄰接 `mops-financial-scraper`）]
languages: all
source: harvest-auto
---

# 2. financial-indicators-from-statements

## Overview

從原始月/季財報資料（MOPS 三表）反推「6 大基本面指標」（營收成長性、營業利益率、稅後淨利 YoY、累積 EPS、存貨周轉率、FCF）的計算規則與 SQL/Python 實作。

## When to Use

使用者說「6 大指標」「基本面評分」「fundamentals grading」「自己算 ROE/EPS」「從月報算年化指標」。

## Background

From session harvest analysis:

- Session 3 投入 659 訊息、`fundamentals_grading.py` 為核心產物；公式邏輯（如「累積 EPS = 過去 4 季合計」「FCF = 營業現金流 − CapEx」）是高度可重用的領域知識。
  - 既有 `mops-financial-scraper` 只負責抓 + 落地原始三表；不涵蓋指標計算層。`investment-research` 是策略層，也不在這個層級。
  - 中度推薦：強依賴 news-stock 專案 schema，要設計成獨立 skill 需抽象化資料表結構，否則只是把該專案的程式碼搬出來。
- **建議**：若要做，定位成 `mop...

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
