---
name: mops-business-description-scraper
description: >
  從 MOPS 網站 `t05st03` 頁面爬取台灣上市/櫃/興櫃公司的「主要業務」（主營業務描述），支援單公司查詢與批次查詢，結果存入本機資料庫或回傳 JSON。
  TRIGGER when: - 使用者說「查公司業務描述」「從 MOPS 抓主營業務」「t05st03」
when_to_use: - 使用者說「查公司業務描述」「從 MOPS 抓主營業務」「t05st03」
version: 1.0.0
tags: [backend/]
languages: all
source: harvest-auto
---

# mops-business-description-scraper

## Overview

從 MOPS 網站 `t05st03` 頁面爬取台灣上市/櫃/興櫃公司的「主要業務」（主營業務描述），支援單公司查詢與批次查詢，結果存入本機資料庫或回傳 JSON。

## When to Use

- 使用者說「查公司業務描述」「從 MOPS 抓主營業務」「t05st03」

## Background

From session harvest analysis:

- Session 11 中大量 Bash 操作嘗試對 `https://mopsov.twse.com.tw/mops/web/t05st03` 進行爬蟲，花費相當時間在解析 HTML 格式、處理 encoding、batch 策略
- 與現有 `mops-rev-scraper`（月營收）、`mops-financial-scraper`（財務報表）明顯不同：此為「公司基本資料」類別，尤其是業務描述欄位
- `tw-company-lookup` 提供查詢介面但不包含爬蟲邏輯
- 爬蟲細節（URL pattern、表格 XPath、encoding 坑）值得固化，避免每次重新摸索

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
