---
name: pe-memo-already-generated-guard
version: 1.0.0
description: 在啟動 PE memo workflow 前檢查目標公司是否已有完整的 memo 文件，防止無謂覆蓋。TRIGGER when: 使用者或 workflow 需要決定是否生成新的 PE memo。when_to_use: PE memo workflow 的前置守衛、整批 dispatch 前的去重檢查。
languages: all
tags:
  - pe-memo
  - guard
  - workflow
  - check-before-run
---

## Overview

本 skill 作為 PE memo workflow 的前置守衛，在啟動 memo 生成前檢查目標公司是否已有完整的 memo 文件。

**背景**：過往存在 memo 重複生成或無謂覆蓋的情況（如玩艸植造、律果科技被 dispatch 6 次，部分有效 memo 仍被覆蓋）。本 skill 通過檢查存量 artifact，提供清晰的決策依據：
- 若已有 memo，回報路徑與上次生成時間
- 詢問使用者是否要重新生成
- 若未有 memo，直接通知可進行生成

相比 `batch-dd-dedup-guard`（只防「最近 N 小時內的失敗」去重），本 skill 針對「output artifact 是否已存在」的實際需求。

## 何時使用

### 觸發場景
- 使用者啟動 PE memo workflow 前，需要確認目標公司是否已有 memo
- pe-memo-generator skill 的前置檢查步驟
- 整批 dispatch PE memo 生成前的去重檢查（防止覆蓋已有的完整 memo）

### 輸入參數
- `company_ubn`（必填）：目標公司的統一編號，長度 8 位數字
- `check_db`（可選，預設 false）：是否同時檢查 DB 紀錄（若 DB 同步延遲，可設為 true）

## 執行步驟與模式

### 基本邏輯流程

1. 驗證 UBN 格式（8 位數字）
2. 構建預期的 memo 檔案路徑 → `reports/pe-memo/{ubn}.md`
3. 檢查檔案是否存在
4. 若存在：
   - 讀取檔案 mtime（修改時間）
   - 讀取檔案內 frontmatter 的 `generated_at`（若存在）
   - 取較晚的時間戳為「上次生成時間」
   - 構建回報：`{ exists: true, path: "...", last_generated: "2026-06-13T14:30:00Z", file_size: 1234 }`
   - 詢問使用者：「檔案已存在於 {path}，最後生成於 {time}，要重新生成嗎？(Y/n)」
5. 若不存在：
   - 回報：`{ exists: false, path: "...", message: "檔案不存在，可進行生成" }`
6. 若 `check_db=true`，同時查詢 DB memo 表格確認狀況

### 實現細節

#### Python 實現範例

```python
import os
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any

def check_pe_memo_exists(company_ubn: str, check_db: bool = False) -> Dict[str, Any]:
    """
    檢查 PE memo 是否已存在
    
    Args:
        company_ubn: 公司統一編號 (8 位)
        check_db: 是否同時檢查 DB 紀錄
    
    Returns:
        {
            'exists': bool,
            'path': str,
            'last_generated': str (ISO 8601) or None,
            'file_size': int or None,
            'db_record': dict or None,
            'action_needed': str  # 使用者應採取的動作
        }
    """
    
    # 驗證 UBN
    if not company_ubn.isdigit() or len(company_ubn) != 8:
        return {
            'error': 'Invalid UBN format. Must be 8 digits.',
            'exists': None
        }
    
    # 構建檔案路徑
    memo_dir = Path('reports/pe-memo')
    memo_file = memo_dir / f'{company_ubn}.md'
    
    result = {
        'company_ubn': company_ubn,
        'path': str(memo_file.absolute()),
        'exists': memo_file.exists(),
        'last_generated': None,
        'file_size': None,
        'db_record': None
    }
    
    if memo_file.exists():
        # 讀取檔案統計資訊
        stat = memo_file.stat()
        mtime = datetime.fromtimestamp(stat.st_mtime).isoformat()
        result['file_size'] = stat.st_size
        result['last_generated'] = mtime
        result['action_needed'] = f"檔案已存在，最後生成於 {mtime}，若要重新生成請帶 force_regenerate=True"
        
        # 試圖從 frontmatter 讀取 generated_at（若存在）
        try:
            with open(memo_file, 'r', encoding='utf-8') as f:
                content = f.read()
                if content.startswith('---'):
                    fm_end = content.find('---', 3)
                    if fm_end > 0:
                        import yaml
                        frontmatter = yaml.safe_load(content[3:fm_end])
                        if frontmatter and 'generated_at' in frontmatter:
                            result['last_generated'] = frontmatter['generated_at']
        except Exception:
            pass
    else:
        result['action_needed'] = f"檔案不存在，可直接生成"
    
    # 若需要檢查 DB
    if check_db:
        db_record = query_pe_memo_from_db(company_ubn)
        result['db_record'] = db_record
        if db_record and result['exists']:
            result['action_needed'] += "（檔案與 DB 記錄均存在）"
    
    return result
```

#### 在 workflow 中使用

假設在 `pe-memo-generator` skill 中作為前置步驟：

```python
def generate_pe_memo_workflow(
    company_ubn: str, 
    force_regenerate: bool = False
) -> Dict[str, Any]:
    """PE memo 生成 workflow，包含前置守衛檢查"""
    
    # 第一步：前置檢查
    guard_result = check_pe_memo_exists(company_ubn)
    
    if guard_result.get('error'):
        return {'error': guard_result['error'], 'status': 'failed'}
    
    # 第二步：根據檢查結果決策
    if guard_result['exists'] and not force_regenerate:
        return {
            'status': 'skipped',
            'reason': 'memo_already_exists',
            'existing_memo': guard_result['path'],
            'last_generated': guard_result['last_generated'],
            'message': f"PE memo 已存在。若要重新生成，請帶 force_regenerate=True 參數。"
        }
    
    # 第三步：進行實際的 memo 生成
    memo_content = generate_memo_content(company_ubn)
    
    # 第四步：寫入檔案
    memo_file = Path('reports/pe-memo') / f'{company_ubn}.md'
    memo_file.parent.mkdir(parents=True, exist_ok=True)
    memo_file.write_text(memo_content, encoding='utf-8')
    
    return {
        'status': 'success',
        'memo_path': str(memo_file.absolute()),
        'generated_at': datetime.now().isoformat()
    }
```

#### 批量去重場景

針對整批 dispatch PE memo 生成（多個公司）的情況：

```python
def batch_generate_pe_memos(
    company_ubns: list,
    skip_existing: bool = True,
    check_db: bool = False
) -> Dict[str, Any]:
    """批量檢查與生成 PE memo"""
    
    to_generate = []
    skipped = []
    errors = []
    
    for ubn in company_ubns:
        check = check_pe_memo_exists(ubn, check_db=check_db)
        
        if check.get('error'):
            errors.append({'ubn': ubn, 'error': check['error']})
        elif check['exists'] and skip_existing:
            skipped.append({
                'ubn': ubn,
                'path': check['path'],
                'last_generated': check['last_generated']
            })
        else:
            to_generate.append(ubn)
    
    results = {
        'total': len(company_ubns),
        'to_generate': len(to_generate),
        'skipped': len(skipped),
        'errors': len(errors),
        'skipped_list': skipped,
        'error_list': errors,
        'message': f"準備生成 {len(to_generate)} 個 memo，跳過 {len(skipped)} 個已存在的，{len(errors)} 個發生錯誤"
    }
    
    # 進行實際生成
    for ubn in to_generate:
        try:
            generate_pe_memo_workflow(ubn)
        except Exception as e:
            results['error_list'].append({'ubn': ubn, 'error': str(e)})
    
    return results
```

## 注意事項

### 檔案與 DB 同步問題
- 檔案系統的 memo 檔案與 DB 記錄可能不同步
- 若發現「檔案存在但 DB 無記錄」，表示手動修改或 DB 同步有延遲
- 建議 `check_db=true` 時，對檢查結果取並集：若檔案或 DB 任一有記錄，都應視為「已存在」
- 在批量 dispatch 前，應先執行 `batch_generate_pe_memos(skip_existing=true)` 進行全量檢查

### 檔案路徑與權限
- 預設檢查路徑為 `reports/pe-memo/{ubn}.md`（相對於專案根目錄）
- 確保運行環境對該路徑有讀取權限（workflow 運行的帳戶通常有足夠權限）
- 若檔案為軟連結或符號連結，應正常遵循

### 損壞或不完整的 memo
- 本 skill 只檢查「檔案是否存在」，不驗證檔案內容的完整性
- 若需要檢查「memo 是否生成完整」，可擴展 `check_db=true` 並在 DB 中查詢 `status` 欄位
- 建議：若檔案大小異常小（< 100 bytes），可提示「檔案可能不完整」

### 時間戳記精度
- `mtime` 精度取決於檔案系統，通常為秒級
- Frontmatter 內的 `generated_at` 可提供納秒或毫秒級精度
- 若兩者都存在，優先使用 frontmatter 的 `generated_at`

### 與 batch-dd-dedup-guard 的互補
- `batch-dd-dedup-guard` 防止「最近 N 小時內失敗」的重試
- 本 skill 防止「已有完整 output」的覆蓋
- 兩者應搭配使用：先過 dedup-guard（防 retry 風暴），再過本 guard（防無謂覆蓋）

### 監控與日誌
- 在批量 dispatch 前後，應記錄「已跳過 N 個」、「新生成 M 個」，供監控和事後分析
- 若發現某家公司被 dispatch 多次卻仍無 memo，應檢查是否有前置檢查失敗的情況