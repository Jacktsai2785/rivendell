---
name: pe-memo-deep-research
description: >
  在初步 PE 備忘錄產出後，針對特定疑點或待驗證聲明進行深度網路研究（WebSearch + WebFetch），補充產品線、客戶名單、競爭者、媒體報導等資訊並更新備忘錄
  TRIGGER when: 使用者提供既有 PE memo 並要求「補充」、「驗證」、「深挖」；或 pe-memo pipeline 的第二階段呼叫
when_to_use: 使用者提供既有 PE memo 並要求「補充」、「驗證」、「深挖」；或 pe-memo pipeline 的第二階段呼叫
version: 1.0.0
tags: [Workflow]
languages: all
source: harvest-auto
---

# pe-memo-deep-research

## Overview

在初步 PE 備忘錄產出後，針對特定疑點或待驗證聲明進行深度網路研究（WebSearch + WebFetch），補充產品線、客戶名單、競爭者、媒體報導等資訊並更新備忘錄

## When to Use

使用者提供既有 PE memo 並要求「補充」、「驗證」、「深挖」；或 pe-memo pipeline 的第二階段呼叫

## Background

From session harvest analysis:

| Session 8（康斯特科技）與 Session 13（盛特材料）呈現相同模式：提供初步備忘錄 → WebSearch(3-4) + WebFetch(3-4) → 補充資訊。兩次均未觸發任何 Skill，代表工作流程缺少對應進入點。可考慮作為獨立 skill 或擴充現有 skill 的 Phase 2。 |
| **風險** | 若擴充 `tw-company-pe-memo`，需確保 Phase 1（初步生成）與 Phase 2（深度驗證）的觸發條件可區分，避免每次都做完整流程而過度消耗 token。 |

## TODO

This skill was auto-generated from a harvest candidate.
Fill in the implementation details, patterns, and examples.
