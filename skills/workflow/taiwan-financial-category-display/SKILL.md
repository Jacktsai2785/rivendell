---
name: taiwan-financial-category-display
description: 將 MOPS/XBRL 財務資產類別代碼正規化為台灣 GAAP/IFRS 標準名稱，並處理持股比例 → 數量的 fallback 邏輯。TRIGGER when: 「財報資產類別怎麼顯示」「FVOCI 是什麼」「持股比例沒資料時怎麼辦」「財務資產分類顯示錯誤」
when_to_use: 前端/報表需要將金融資產分類代碼展示為使用者友善的名稱、或需要決定在持股比例缺失時改為顯示持股數量
version: 1.0.0
tags: [financial-reporting, ifrs, gaap, xbrl, mops, asset-classification, fallback-logic]
languages: all
---

## Overview

台灣上市櫃公司在 MOPS（台灣證券交易所財務資訊系統）和 XBRL 申報中，金融資產根據台灣 IFRS 分為四大類：

1. **FVTPL**（公允價值衡量且其變動透過損益認列）— 交易目的或指定
2. **FVOCI**（公允價值衡量且其變動透過其他綜合損益認列）— 策略性持股、長期投資
3. **AC/HTM**（按攤銷後成本衡量 / 持有至到期）— 債權投資
4. **權益法**（using equity method）— 重大影響或聯營企業

前端常見的問題：
- MOPS/XBRL 中儲存的是代碼或英文縮寫（如 `FVOCI`、`AC`），但報表需要展示完整的中文名稱
- 前端會把所有非主流分類籠統地顯示為「其他長期股權」，遺漏了原本在財報上的精確分類
- 持股比例（ownership %）在某些子公司或少數持股場景下缺失，但持股數量（shares held）有資料，需要提供優先順序

本 skill 提供：
1. **分類對應表**：MOPS/XBRL 代碼 → 台灣 GAAP/IFRS 標準中文名稱
2. **Fallback 邏輯**：決定何時用持股數量代替持股比例
3. **前端實裝建議**：如何在報表、持股明細、資產負債表中應用

## 何時使用

### 場景 1：財務報表展示分類名稱
你的報表或前端頁面需要展示金融資產的分類（例如持股明細表的「資產類別」欄位），但後端傳來的是代碼或縮寫。
- 示例：MOPS API 返回 `assetClass: "FVOCI"`，前端需要顯示「透過其他綜合損益按公允價值衡量之金融資產」

### 場景 2：持股比例缺失時的 fallback
你的前端或報表提供「持股比例」欄位，但某些投資標的（尤其是子公司或少數持股）沒有比例資料，只有持股數量。
- 示例：張家輪業持股東陞 2,590 千股，但比例為 null；此時應改顯示「2,590 千股」而非空白或 N/A

### 場景 3：資產分類顯示錯誤
使用者在報表上看到「其他長期股權」但知道應該是特定的 IFRS 分類（FVOCI、權益法等），需要確認正確的分類邏輯。
- 示例：偉康科技在原相個體財報中持有的股票應為 FVOCI，但被誤分類為通用的「長期投資」

## 執行步驟

### 1. 分類代碼對應表（核心參考）

以下是 MOPS/XBRL 中常見的資產類別代碼及其台灣 IFRS 標準名稱：

| MOPS/XBRL 代碼 | 台灣 IFRS 標準名稱（完整） | 簡稱 | 特性 |
|---|---|---|---|
| FVTPL | 透過損益按公允價值衡量之金融資產 | 公允價值（損益） | 短期交易、衍生工具 |
| FVOCI | 透過其他綜合損益按公允價值衡量之金融資產 | 公允價值（OCI） | 策略性股權、長期投資 |
| AC | 按攤銷後成本衡量之金融資產 | 攤銷後成本 | 貸款、應收款 |
| HTM | 持有至到期投資 | 持有至到期 | 債券、固定收益 |
| Equity Method | 採權益法評價之投資 | 權益法 | 聯營企業、關聯企業 |
| Other LT Investment | 其他長期投資 | 其他長期 | MOPS 泛稱，不應在報表中使用 |

### 2. 前端實裝：分類名稱映射函式

```javascript
// 在前端專案中建立此映射（例如 utils/financialClassification.ts）
const ASSET_CLASS_NAMES = {
  FVTPL: '透過損益按公允價值衡量之金融資產',
  FVOCI: '透過其他綜合損益按公允價值衡量之金融資產',
  AC: '按攤銷後成本衡量之金融資產',
  HTM: '持有至到期投資',
  'Equity Method': '採權益法評價之投資',
};

function getAssetClassName(code) {
  return ASSET_CLASS_NAMES[code] || code;
}

// React 元件中使用
<span className="asset-class">{getAssetClassName(investment.assetClass)}</span>
```

### 3. Fallback 邏輯：持股比例 → 持股數量

當持股比例（`ownershipRatio` 或 `ownershipPercentage`）為 null/undefined 時，改為顯示持股數量（`sharesHeld` 或 `quantity`）：

```javascript
// utils/shareholding.ts
function getShareholdingDisplay(investment) {
  const { ownershipRatio, sharesHeld, shareUnit = '千股' } = investment;
  
  // 優先級 1：持股比例存在且有效（>= 0）
  if (ownershipRatio !== null && ownershipRatio !== undefined && ownershipRatio >= 0) {
    return `${ownershipRatio.toFixed(2)}%`;
  }
  
  // 優先級 2：持股數量存在
  if (sharesHeld !== null && sharesHeld !== undefined) {
    return `${sharesHeld}${shareUnit}`;
  }
  
  // 優先級 3：都沒有
  return 'N/A';
}

<td>{getShareholdingDisplay(investment)}</td>
```

### 4. 後端驗證：確保數據品質

在後端 API 層（mops_dbs 的 API 或 transform pipeline），驗證返回的分類代碼：

```python
VALID_ASSET_CLASSES = {'FVTPL', 'FVOCI', 'AC', 'HTM', 'Equity Method'}

def normalize_asset_class(code):
    """將 MOPS 代碼正規化為標準值"""
    code_upper = str(code).strip().upper() if code else ''
    
    # 精確匹配
    if code_upper in VALID_ASSET_CLASSES:
        return code_upper
    
    # 模糊匹配（MOPS 有時用不同格式）
    if code_upper in ('FV_OCI', 'FV-OCI'):
        return 'FVOCI'
    if code_upper in ('FV_TPL', 'FV-TPL'):
        return 'FVTPL'
    if code_upper in ('AMORTIZED_COST', 'AMORT_COST'):
        return 'AC'
    
    # 未知代碼：返回原值，前端 fallback 使用
    return code_upper
```

### 5. 報表應用案例

#### 持股明細表
| 投資企業 | 被投資企業 | 資產類別 | 持股情形 | 取得成本 |
|---|---|---|---|---|
| A 公司 | B 公司 | 採權益法評價之投資 | 25% | $500M |
| A 公司 | C 公司 | 透過其他綜合損益按公允價值衡量之金融資產 | 1,234 千股 | $200M |
| A 公司 | D 公司 | 按攤銷後成本衡量之金融資產 | 5% | $100M |

#### 資產負債表（金融資產段）
- 流動資產
  - 透過損益按公允價值衡量之金融資產（短期）：$XXX
  - 其他流動資產（應收款）：$XXX
- 非流動資產
  - 透過其他綜合損益按公允價值衡量之金融資產：$XXX
  - 採權益法評價之投資：$XXX
  - 按攤銷後成本衡量之金融資產（長期）：$XXX

## 注意事項

### 1. MOPS 代碼的區域化問題
MOPS 有時將同一分類用不同代碼表示（如 `FVOCI`、`FV_OCI`、`FV-OCI`），尤其在 XBRL 轉換時容易發生。**建立正規化函式確保所有代碼在前端到達前統一化**。

### 2. 持股比例與數量的共存性
在某些投資場景（尤其是少數持股或未上市子公司），財務部門可能只提供持股數量而非比例。**不要假設兩者都存在**。Fallback 邏輯應是「優先比例，無則用數量」，而非兩者並顯。

### 3. 不同軟體/系統間的分類差異
不同版本的 MOPS、XBRL 申報系統，或不同的 ERP/會計軟體（SAP、用友等），可能使用不同的代碼或名稱。**在與外部系統集成時，先確認代碼映射表是否需要調整**。

### 4. 舊資料的向後相容性
如果歷史資料使用了已停用的分類代碼（例如 IFRS 9 前的「可供出售金融資產」AFS），前端應有 fallback 或特殊處理，而非直接拋錯。

### 5. 權益法投資的特殊性
採權益法評價之投資（聯營、合資）通常**不會**有持股比例的「百分比」顯示，而是僅顯示比例（25%、50% 等）或甚至只有帳面值。不要試圖在權益法投資上應用持股數量的 fallback 邏輯。

### 6. 台灣 GAAP vs IFRS 的命名差異
部分舊資料可能使用台灣 GAAP（民國會計）的名稱，如「長期股權投資」、「可供出售金融資產」。現行應採台灣 IFRS 名稱（如上表所示）。在資料轉換時要留意此差異。