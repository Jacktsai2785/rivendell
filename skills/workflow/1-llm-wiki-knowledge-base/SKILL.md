---
name: 1-llm-wiki-knowledge-base
description: >
  依 Karpathy 的 LLM Wiki / Append-and-Review 模式，從零建立個人知識庫。包含資料夾結構（`raw/` 投擲區、`wiki/` 編譯區、`inbox.md` 即時 append）、四個 agent 動詞（`consume` / `link` / `lint` / `digest`）、VSCode + Foam 配置、以及把 Claude Code 設定為自動載入
  TRIGGER when: 使用者說「建知識庫」「LLM Wiki」「Karpathy 筆記法」「Append and Review」「個人 wiki」「Obsidian + Claude Code」「raw to wiki pipeline」「knowledge vault」。
when_to_use: 使用者說「建知識庫」「LLM Wiki」「Karpathy 筆記法」「Append and Review」「個人 wiki」「Obsidian + Claude Code」「raw to wiki pipeline」「knowledge vault」。
version: 1.0.0
tags: [workflow/`（或 `backend/`，因為涉及目錄 schema 設計）]
languages: all
source: harvest-auto
---

# 1. **llm-wiki-knowledge-base**

## Overview

依 Karpathy 的 LLM Wiki / Append-and-Review 模式，從零建立個人知識庫。包含資料夾結構（`raw/` 投擲區、`wiki/` 編譯區、`inbox.md` 即時 append）、四個 agent 動詞（`consume` / `link` / `lint` / `digest`）、VSCode + Foam 配置、以及把 Claude Code 設定為自動載入 `CLAUDE.md` 的 vault-aware 模式。

## When to Use

使用者說「建知識庫」「LLM Wiki」「Karpathy 筆記法」「Append and Review」「個人 wiki」「Obsidian + Claude Code」「raw to wiki pipeline」「knowledge vault」。

## Background

From session harvest analysis:

Session [13] 花了 227 則訊息建構這個系統，產出 6 份 HOWTO 文件、CLAUDE.md、tools/ 結構，是極度可重用的高價值 pattern。目前 `markdown-file-ssot` 只覆蓋 SSOT 查詢用途，沒有任何 skill 處理「個人知識庫 + Karpathy 動詞 + Foam 整合」這條路線。

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
