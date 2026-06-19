---
name: 4-windows-clipper-to-wsl
description: >
  在 Windows 端建立瀏覽器書籤、PowerShell handler、URL scheme（`nbsend://`），把網頁文章/YouTube/截圖透過 bookmarklet → PowerShell → WSL `raw/` 落地。包含 web-clipper template（general / youtube）、PowerShell registration、`register-n
  TRIGGER when: 使用者說「Windows 抓網頁」「bookmarklet 存筆記」「web clipper WSL」「browser to vault」「URL scheme handler」。
when_to_use: 使用者說「Windows 抓網頁」「bookmarklet 存筆記」「web clipper WSL」「browser to vault」「URL scheme handler」。
version: 1.0.0
tags: [workflow/`（或新增 `windows/` 分類）]
languages: all
source: harvest-auto
---

# 4. **windows-clipper-to-wsl**

## Overview

在 Windows 端建立瀏覽器書籤、PowerShell handler、URL scheme（`nbsend://`），把網頁文章/YouTube/截圖透過 bookmarklet → PowerShell → WSL `raw/` 落地。包含 web-clipper template（general / youtube）、PowerShell registration、`register-nbsend.ps1` 安裝流程。

## When to Use

使用者說「Windows 抓網頁」「bookmarklet 存筆記」「web clipper WSL」「browser to vault」「URL scheme handler」。

## Background

From session harvest analysis:

Session [13] 明確要求「會開在 Windows 端」+「自動觸發」，產出 `tools/windows/` 一整套 PowerShell + bookmarklet 配置。跨 OS 整合的場景在現有 skills 中沒有覆蓋。但用戶族群可能較窄（WSL + Windows 雙開使用者），故定 Moderate。

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
