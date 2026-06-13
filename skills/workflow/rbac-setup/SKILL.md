---
name: rbac-setup
description: >
  在全端 App 中加入角色型存取控制（admin/user、內帳/外帳可見性）
  TRIGGER when: when working with rbac-setup
when_to_use: when working with rbac-setup
version: 1.0.0
tags: [backend / frontend]
languages: all
source: harvest-auto
---

# rbac-setup

## Overview

在全端 App 中加入角色型存取控制（admin/user、內帳/外帳可見性）

## Background

From session harvest analysis:

| Sessions 1-2：Family-Fiscal 花了 430 則訊息實作 `auth-context.tsx`、`auth-guard.tsx`、`admin-only.tsx` + 後端 API 權限過濾，且 RBAC 是幾乎所有多人 App 的必要功能 |
| **與現有 skills 差異** | `oauth-token-vault` 處理 token 儲存；`firebase-backend` 包含 Security Rules；均非通用 RBAC 流程 |
| **弱點** | Family-Fiscal 的實作較 domain-specific（借貸關係），需抽象化才能...

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
