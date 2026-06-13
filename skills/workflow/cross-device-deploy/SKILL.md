---
name: cross-device-deploy
description: >
  以 rivendell 為核心，設計其他裝置 pull 後一鍵部署多個 projects 的機制
  TRIGGER when: when working with cross-device-deploy
when_to_use: when working with cross-device-deploy
version: 1.0.0
tags: [meta / workflow]
languages: all
source: harvest-auto
---

# cross-device-deploy

## Overview

以 rivendell 為核心，設計其他裝置 pull 後一鍵部署多個 projects 的機制

## Background

From session harvest analysis:

| Session 13（638 則，最大量的 session）：設計了跨裝置 bootstrap 流程、AGENTS.md 結構、AgentCard.tsx dashboard 整合 |
| **與現有 skills 差異** | `deploy` 針對單一服務部署；`init-project` 初始化單一專案；均無「多 project 協調」概念 |
| **弱點** | 高度依賴使用者的 projects 目錄結構，通用性需驗證 |

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
