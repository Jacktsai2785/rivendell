---
name: mops-individual-financial-report
description: >
  為現有 MOPS 財務爬蟲增加個體財報（非合併）抓取支援
  TRIGGER when: 「抓個體財報」「非合併財報」「個別財報 PDF」「pdf_individual」「個體 vs 合併」「需要公司本體的持股明細」
when_to_use: 「抓個體財報」「非合併財報」「個別財報 PDF」「pdf_individual」「個體 vs 合併」「需要公司本體的持股明細」
version: 1.0.0
tags: [workflow/`（或擴充現有 `mops-financial-scraper`）]
languages: all
source: harvest-auto
---

# mops-individual-financial-report

## Overview

為現有 MOPS 財務爬蟲增加個體財報（非合併）抓取支援

## When to Use

「抓個體財報」「非合併財報」「個別財報 PDF」「pdf_individual」「個體 vs 合併」「需要公司本體的持股明細」

## Background

From session harvest analysis:

- Session 4（294 則）的核心工程工作：系統原本只有合併財報，需要新建 `pdf_individual.py`、更新 `filing.py` 的分派邏輯、更新 `mops_index.py` 的查詢條件、新增 migration。
- 這套工作流程有清楚的重複模式：①確認現有 schema 是否有 `report_type` 欄位 → ②找 MOPS 個體財報 PDF 下載端點 → ③實作分離的 PDF parser → ④更新 filing dispatcher → ⑤跑 migration。
- 與現有 `mops-financial-scraper` 的差異：後者描述為「歷史...

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
