---
name: client-kickoff-docs
description: >
  新客戶 kickoff 時（NDA 簽過、首次討論前），讀客戶提供的 homework 檔 → 建立 `scope.md` + `deadline.md` + `MEMORY.md` + `README.md` 四件套。
  TRIGGER when: "新客戶 kickoff", "NDA 簽完準備討論", "讀 homework 建專案檔", "建立客戶專案初始檔"
when_to_use: "新客戶 kickoff", "NDA 簽完準備討論", "讀 homework 建專案檔", "建立客戶專案初始檔"
version: 1.0.0
tags: [workflow]
languages: all
source: harvest-auto
---

# client-kickoff-docs

## Overview

新客戶 kickoff 時（NDA 簽過、首次討論前），讀客戶提供的 homework 檔 → 建立 `scope.md` + `deadline.md` + `MEMORY.md` + `README.md` 四件套。

## When to Use

"新客戶 kickoff", "NDA 簽完準備討論", "讀 homework 建專案檔", "建立客戶專案初始檔"

## Background

From session harvest analysis:

- 已在 0418 harvest 觀察到（ChimesAI 腳手架）、0420 harvest 再度出現（力成 PTI）— **兩個不同客戶同樣 pattern**
- 與 0418 harvest 的 `new-client-scaffolding` 候選高度重疊，建議合併為單一候選
- 現有 `init-project` 只建立 CLAUDE.md/AGENTS.md，不涵蓋商務專案的 scope/deadline/memory 三件套
- **結論**: 若下一次新客戶再出現（3rd occurrence）即升級為 Strong 並建立。目前保持 Moderate 但可以先動手寫 SK...

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
