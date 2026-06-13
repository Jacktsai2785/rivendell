---
name: mops-notes-backfill-monitor
description: >
  監控與管理 mops_notes 大型批次附註抽取回填作業
  TRIGGER when: when working with mops-notes-backfill-monitor
when_to_use: when working with mops-notes-backfill-monitor
version: 1.0.0
tags: [workflow]
languages: all
source: harvest-auto
---

# mops-notes-backfill-monitor

## Overview

監控與管理 mops_notes 大型批次附註抽取回填作業

## Background

From session harvest analysis:

Session 18 是 124 msg、工具密集（Bash×58, Monitor×4, ScheduleWakeup×5）的複雜監控流程。核心模式是：

1. **啟動** `pdf_notes_refresh.py` 批次抽取腳本（Bash）
2. **開 terminal 即時監督**：用 Monitor 串流 stdout，讓使用者即時看進度
3. **ScheduleWakeup** 每隔固定時間回來確認進度不卡住
4. **封鎖偵測**：判斷哪些公司因 PDF 格式問題、OCR 失敗而跳過
5. **補跑失敗 subset**，再次驗證完整度

這個「啟動 → 即時監督 → 週期...

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
