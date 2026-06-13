---
name: tech-evaluation-doc
description: >
  客戶提出模糊需求時（例如「補習班進出紀錄」），產出三件套決策文件：`tech-stack.md`（2-3 個技術路徑比較）、`cost-estimate.md`（硬體 / 軟體 / 人月明細）、`X-explained.md`（向客戶解釋技術權衡的白話文）。在 RFQ 之前用來幫客戶決定方向。
  TRIGGER when: 「技術選型比較」「給客戶看的技術方案」「成本拆解」「QR code vs 臉部辨識怎麼選」「報價前先做評估」「pre-RFQ 評估」。
when_to_use: 「技術選型比較」「給客戶看的技術方案」「成本拆解」「QR code vs 臉部辨識怎麼選」「報價前先做評估」「pre-RFQ 評估」。
version: 1.0.0
tags: [workflow/]
languages: all
source: harvest-auto
---

# tech-evaluation-doc

## Overview

客戶提出模糊需求時（例如「補習班進出紀錄」），產出三件套決策文件：`tech-stack.md`（2-3 個技術路徑比較）、`cost-estimate.md`（硬體 / 軟體 / 人月明細）、`X-explained.md`（向客戶解釋技術權衡的白話文）。在 RFQ 之前用來幫客戶決定方向。

## When to Use

「技術選型比較」「給客戶看的技術方案」「成本拆解」「QR code vs 臉部辨識怎麼選」「報價前先做評估」「pre-RFQ 評估」。

## Background

From session harvest analysis:

- Session 3 產出 `cost-estimate.md` / `face-cost-explained.md` / `face-tech-stack.md` — 這個三件套是 RFQ 前的中間產物。
  - 現有 `rfq-writer` 是已決定方向後的正式報價、`client-kickoff-docs` 是 NDA 後的 scope 文件、`sow-writer` 是更後段的合約 SOW — **「客戶還沒決定怎麼做、需要被教育與比較」這個前置步驟沒有 skill**。
  - 為何只給 Moderate：樣本只有一個 session（91 msgs），需要再觀察 1-2 個類似...

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
