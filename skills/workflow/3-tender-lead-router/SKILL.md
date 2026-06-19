---
name: 3-tender-lead-router
description: >
  政府標案 → 銷售線索的轉換工作流：搜尋符合特定客戶能力的標案 → 取得原始公告網址 → 在 `nx_deal` / 客戶資料夾新增 deal/saleing 條目。
  TRIGGER when: 使用者說「幫我查 X 部會的標案」「在 Y 公司加一個 deal」「這案的網址給我」「標案配對客戶」。
when_to_use: 使用者說「幫我查 X 部會的標案」「在 Y 公司加一個 deal」「這案的網址給我」「標案配對客戶」。
version: 1.0.0
tags: [workflow/]
languages: all
source: harvest-auto
---

# 3. tender-lead-router

## Overview

政府標案 → 銷售線索的轉換工作流：搜尋符合特定客戶能力的標案 → 取得原始公告網址 → 在 `nx_deal` / 客戶資料夾新增 deal/saleing 條目。

## When to Use

使用者說「幫我查 X 部會的標案」「在 Y 公司加一個 deal」「這案的網址給我」「標案配對客戶」。

## Background

From session harvest analysis:

- Session 6 顯示這是固定流程：`tender-scraper` 結果 → 過濾關鍵字 → 人工挑選 → 寫入特定客戶的 saleing 段落 → 抓原始 g0v / 採購網連結。
  - 既有：`tender-scraper`（只抓）+ `crm-projection`（只投影 nx_client/nx_deal）+ `sales-material`（產 PPTX）。**中間「配對 + 寫入 deal」這段沒有 skill**。
  - 中度推薦：流程明確但只觀察到 1 個 session，再看 1–2 次重複出現再決定是否抽出。

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
