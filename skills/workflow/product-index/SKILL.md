---
name: product-index
description: |
  為多產品線/solution 組織建立 markdown 索引結構，含 frontmatter 分類、定期更新機制、AI 生成內容審核閘門。
  TRIGGER when: 用戶提到「建產品索引」「product catalog」「solution 整理」「產品線管理」「多產品索引」
when_to_use: |
  當組織內有多個產品線、服務線或 solution 需要統一索引、分類和定期維護時。特別適合涉及 AI 生成內容且需要人工審核的場景。
version: 1.0.0
tags:
  - workflow
  - knowledge-management
  - catalog
  - structure
languages: all
---

## Overview

product-index skill 幫助你為跨多個產品線或 solution 的組織建立統一的 markdown 索引系統。

它融合三個核心功能：
1. **索引結構化**：使用 YAML frontmatter 為產品/解決方案分類（領域、版本、所有者、狀態等）
2. **定期同步機制**：自動或手動更新索引，保持 catalog 與實際產品線狀態同步
3. **AI 生成內容審核**：建立人工審核閘門，確保自動生成的產品描述、功能列表或更新摘要符合品牌標準

典型使用場景包括：
- 企業 SaaS 多條產品線的統一 catalog
- 工程組織多個工具/平台的內部知識索引
- 應對廠務、工安等多個垂直業務領域的統一管理頁面

## 何時使用

### 初始化新的產品索引
當組織內有 2+ 個產品線或 solution，目前缺乏統一的索引結構時：
- 廠務平台 + 工安平台 + 其他業務系統 → 需要統一 catalog
- 內部工具分散在不同文檔 → 需要一個入口點
- 多個獨立團隊各自維護文檔 → 需要統一的 frontmatter 規範

### 定期更新產品信息
每月、季度或特定產品發布時，需要同步索引：
- 產品狀態變更（beta → GA、計畫中 → 棄用）
- 功能更新、API 版本變更
- 所有者、聯絡方式、文檔連結更新
- 價格、配額、支援等級調整

### 管理 AI 生成的產品內容
當使用 AI 自動生成產品描述、特性總結或更新摘要時：
- 生成初稿後需要人工審核確認
- 建立質量閘門，避免不準確或過時的信息發佈
- 追蹤哪些內容是自動生成、哪些是人工編輯

## 執行步驟

### 1. 初始化索引結構

在您的知識庫根目錄（如 `products/` 或 `catalog/`) 建立主索引文件 `INDEX.md`：

---
title: 產品線索引
version: 1.0.0
last_updated: 2026-06-13
maintainer: [Your Team]
categories:
  - platform
  - tools
  - service
---

# 產品線索引

此文件為組織內所有產品線和解決方案的統一入口。各產品詳細資訊見對應文件。

**更新頻率**：每月中旬更新，由各產品所有者維護 frontmatter。

### 2. 定義產品/Solution 的 Frontmatter 規範

每個產品對應一個 markdown 文件（如 `products/factory-management.md`)，使用統一的 frontmatter：

---
product_name: 廠務管理平台
slug: factory-management
category: platform
status: ga
version: 2.1.0
owner: 廠務中心
owner_email: factory-team@example.com
launch_date: 2024-01-15
docs_url: https://docs.example.com/factory-mgmt
api_status: stable
support_level: standard
tags:
  - production
  - manufacturing
  - erp-integration
ai_generated_content: false
last_reviewed: 2026-06-13
reviewed_by: 
  - alice-pm
---

# 廠務管理平台

[產品詳細說明、功能列表、API 文檔等]

**關鍵 frontmatter 欄位說明**：
- `status`：ga（生產）、beta（測試）、alpha（內部）、eol（已下線）、planned（計畫中）
- `owner_email`：定期同步時用於聯絡
- `ai_generated_content`：若為 true，表示部分內容由 AI 生成，需要特別審核
- `reviewed_by`：最後一次人工審核者清單，用於追蹤問責

### 3. 建立定期同步機制

設置每月同步流程（使用 schedule skill）：

使用 schedule 建立月度同步任務的文本：

每月初（如 1 號），觸發同步檢查清單：
- [ ] 掃描所有產品文件，驗證 frontmatter 完整性
- [ ] 與各產品所有者確認狀態是否有變更
- [ ] 檢查新增/棄用的產品線
- [ ] 驗證 owner 與聯絡方式是否最新
- [ ] 更新 API 文檔、支援頁面的有效性
- [ ] 刷新 version 欄位（如有重大更新）
- [ ] 重新產生主索引 INDEX.md（按 category 和 status 彙總）
- [ ] 提交 git commit，主題：「chore: monthly product index sync」

具體執行命令範例：

```
# 1. 掃描並驗證所有產品文件
python scripts/validate-product-frontmatter.py --input products/ --check-missing-fields

# 2. 自動產生新的主索引（按 category 分組，按 status 排序）
python scripts/generate-product-index.py --input products/ --output products/INDEX.md

# 3. 提交變更
git add products/
git commit -m "chore: monthly product index sync — $(date +%Y-%m-%d)"
```

### 4. 建立 AI 生成內容的審核流程

當使用 AI 生成產品描述、功能列表或變更摘要時，遵循此流程：

**階段 1：AI 生成初稿**
- 使用 AI 生成產品特性摘要、更新摘要或新描述
- 結果寫入草稿文件（如 `products/_drafts/factory-management-features-draft.md`）
- 在草稿頭部標記：

---
draft_status: pending_review
generated_by: claude-sonnet-4-6
generated_date: 2026-06-13
source_prompt: |
  [複製用於生成此內容的完整 prompt]
---

**階段 2：人工審核**
至少 1 名產品經理或領域專家 review。審核檢查點：
- [ ] 技術準確性：API 端點、版本號、功能名稱是否正確
- [ ] 是否與現狀同步：最近 1-2 週有無產品變更
- [ ] 語調和品牌一致性：用詞、示例風格是否符合既有文檔
- [ ] 無死連結或過期引用
- [ ] 無機密信息或敏感內容洩露

**階段 3：標記與發佈**
審核通過後，執行：

```
# 1. 複製經批准的內容至正式文件
cp products/_drafts/factory-management-features-draft.md products/factory-management.md

# 2. 在 frontmatter 中更新審核信息
# 修改 frontmatter 中的以下欄位：
#   ai_generated_content: true  （標記此內容由 AI 生成）
#   last_reviewed: 2026-06-13   （記錄審核日期）
#   reviewed_by: [alice-pm, bob-tech]  （添加審核者）

# 3. 提交 git 提交（帶完整 commit message）
git add products/factory-management.md
git commit -m "feat: update factory-management features (AI-generated, reviewed by alice-pm)"
```

Commit message 應包含：
- 變更內容簡述
- 審核者名單
- 若涉及敏感審核，可附註「reviewed」以供日後追蹤

**階段 4：監控與維護**
- 超過 6 個月未審核的 AI 生成內容應被標記為「待重審」
- 若發現錯誤或過時信息，立即 amend 並更新 `reviewed_by` 和 `last_reviewed` 欄位

### 5. 自動化索引生成

建立腳本 `scripts/generate-product-index.py` 用於自動彙總：

```python
#!/usr/bin/env python3
import os
import yaml
from pathlib import Path
from collections import defaultdict

def extract_frontmatter(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    if lines[0].strip() != '---':
        return None
    
    end_idx = None
    for i in range(1, len(lines)):
        if lines[i].strip() == '---':
            end_idx = i
            break
    
    if end_idx is None:
        return None
    
    frontmatter_str = ''.join(lines[1:end_idx])
    return yaml.safe_load(frontmatter_str)

def generate_index(input_dir, output_file):
    products = []
    
    for md_file in Path(input_dir).glob('*.md'):
        if md_file.name.startswith('_'):
            continue
        
        fm = extract_frontmatter(md_file)
        if fm and 'product_name' in fm:
            fm['file'] = md_file.name
            products.append(fm)
    
    # 按 category 分組，按 status 排序
    by_category = defaultdict(list)
    for p in products:
        by_category[p.get('category', 'other')].append(p)
    
    # 生成 INDEX.md
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('# 產品線索引\n\n')
        f.write('> 最後更新：' + str(Path(output_file).stat().st_mtime) + '\n\n')
        
        for category in sorted(by_category.keys()):
            f.write(f'## {category.title()}\n\n')
            f.write('| 產品名稱 | 狀態 | 版本 | 所有者 | 文檔 |\n')
            f.write('|---------|-----|------|--------|------|\n')
            
            for p in sorted(by_category[category], key=lambda x: x.get('status', '')):
                name = p.get('product_name', 'N/A')
                status = p.get('status', 'N/A')
                version = p.get('version', 'N/A')
                owner = p.get('owner', 'N/A')
                docs_url = p.get('docs_url', '#')
                file_name = p.get('file', '#')
                
                f.write(f'| [{name}]({file_name}) | {status} | {version} | {owner} | [Link]({docs_url}) |\n')
            
            f.write('\n')

if __name__ == '__main__':
    import sys
    input_dir = sys.argv[1] if len(sys.argv) > 1 else 'products'
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'products/INDEX.md'
    generate_index(input_dir, output_file)
    print(f'Generated {output_file}')
```

執行此腳本後會自動產生彙總表格，避免手動維護。

## 注意事項

### 與其他 Skill 的區別

**markdown-file-ssot vs product-index**
- `markdown-file-ssot`：專注於單一 domain（如單一產品）的 YAML 結構化 + markdown 維護
- `product-index`：上層流程，管理*多個*產品/solution 的統一索引與分類

使用建議：每個產品文件可用 `markdown-file-ssot` 內部維護，product-index 負責跨產品的索引與審核

**crm-projection vs product-index**
- `crm-projection`：客戶/機會索引，以客戶關係為中心
- `product-index`：產品/解決方案索引，以產品線為中心

兩者可結合使用，但維度不同。

### 內容審核的質量控制

- **AI 生成內容必須由領域專家審核**。不要跳過審核，即使 AI 輸出看起來完整
- **版本控制很重要**：frontmatter 中明確標記 `ai_generated_content` 和 `reviewed_by`，便於後續追溯和修訂
- **定期衰減檢查**：超過 6 個月未審核的 AI 生成內容應被標記為「待重審」，並在下一輪同步時重新驗證

### 定期同步的頻率建議

- 快速變化的領域（新創、快速迭代）：**每週** 
- 中等變化（成熟產品線）：**每月**（推薦）
- 穩定領域（基礎設施、核心系統）：**每季度**

根據組織規模和產品線數量調整。超過 50 個產品時，考慮分組維護（如按 BU 或領域），避免單一檔案過大。

### 常見陷阱

1. **索引與實際狀態漂移**：若定期同步流程缺乏可執行性（無明確所有者、無時間表），索引會逐漸過期。建議用 schedule skill 強制週期化，並在 CLAUDE.md 中設定 hook 自動提醒
2. **AI 生成內容品質下降**：未建立明確審核標準，導致不準確的產品描述流向用戶。務必設定檢查清單並由領域專家逐項確認
3. **過度自動化**：完全自動生成索引而無人工介入，容易遺漏業務邏輯變更（如產品線調整、併購、策略轉向等）。保留人工 review 的必要性，尤其是 frontmatter 中的 status 和 owner 欄位
4. **frontmatter 不統一**：不同編寫者可能使用不同的 status 值或日期格式。在專案開始時明確定義規範，並在 CI 中加入驗證

### 擴展建議

組織規模大時，考慮：
- **分層結構**：若有 50+ 產品，按 BU 或領域分層（如 `products/manufacturing/`, `products/operations/`），每層維持各自的 INDEX.md
- **版本控制與發佈**：使用 git tag 為每月同步建立快照（`product-catalog-2026-06`），便於追蹤歷史變更
- **通知機制**：在同步完成後，透過 Slack 或郵件通知相關團隊，確保索引更新被感知
- 結合 schedule skill 或 launchd-agent 實現完全自動化的月度同步，減少人工介入頻率