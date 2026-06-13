---
name: tw-company-pe-memo-trigger-fix
description: >
  tw-company-pe-memo-trigger-fix skill
  TRIGGER when: when working with tw-company-pe-memo-trigger-fix
when_to_use: when working with tw-company-pe-memo-trigger-fix
version: 1.0.0
tags: [workflow]
languages: all
source: harvest-auto
---

# tw-company-pe-memo-trigger-fix

## Overview

Auto-generated skill from session harvest.

## Background

From session harvest analysis:

把現有 `tw-company-pe-memo` 的 placeholder description 改寫成真正可被 router 偵測的 trigger 字串。
prompt 中同時出現「資深私募股權」+「盡職調查」+「統一編號」、或包含「【基本資料】」「【投資要點】」格式段落、或使用 `tw-company-pe-memo` 的標準模板開頭。
meta（修補既有 skill 而不是新增）
30 個 sessions 中有 28 個應該觸發既有 skill 卻沒觸發，這是 ROI 最高的單一改動。應該直接 edit 既有 SKILL.md 的 frontmatter，不需要新 skill。

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
