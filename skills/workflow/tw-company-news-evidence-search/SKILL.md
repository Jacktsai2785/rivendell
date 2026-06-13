---
name: tw-company-news-evidence-search
description: 給定公司名稱，搜尋並彙整媒體曝光（報導、入選、獲獎、創辦人專訪），輸出結構化證據清單。| TRIGGER when: 「查 X 公司的媒體報導」、「有沒有得獎紀錄」、「創辦人專訪」、「media coverage」、「X 入選 OR 獲獎」
trigger_when:
  - 查公司的媒體報導或新聞
  - 有沒有得獎或入選紀錄
  - 創辦人專訪或演講
  - 公司融資宣布
  - media coverage
  - award 或 press mention
when_to_use: 寫提案／融資資料時快速驗證公司媒體聲量；或作為 PE memo 初稿的背景蒐集步驟；投資決策初期進行 public signal 驗證
version: 1.0.0
tags:
  - tw-company
  - news-research
  - evidence-gathering
  - due-diligence
  - media-coverage
languages: all
---

## Overview

此 skill 針對台灣公司進行結構化的媒體搜尋，蒐集報導、獲獎紀錄、創辦人專訪、融資宣布等 public visibility 信號。輸出內容為結構化證據清單，包含：
- 報導標題 + 來源媒體
- 發表日期
- 原文摘要（50–100 字）
- 正式 URL 與媒體驗證

此 skill 可獨立使用（例如撰寫提案前快速驗證公司媒體聲量），也可整合入 PE memo 或公司 DD 流程。根據 sessions #4–#11 的實踐經驗，此步驟是公司背景研究的高頻子任務。

## 何時使用

### 獨立使用場景
- **提案／融資資料撰寫前**：快速查公司的公開成就、入選紀錄、創辦人曝光，做背景驗證
- **投資決策初稿**：收集「為什麼這家公司值得投資」的公開訊號（media signal）
- **客戶 pitch 準備**：驗證投資組合公司的媒體能見度與品牌信度
- **競業分析**：對標企業的媒體表現與業界地位

### 與其他 skill 組合
- 作為 `tw-company-pe-memo-refine` 內部步驟 1：在產出完整 memo 前先蒐集背景證據
- 前置於 `tw-company-batch-dd-pipeline`：作為初期 signal 驗證環節

## 執行步驟

### 步驟 1：準備搜尋關鍵詞組

給定公司名稱後，立即生成以下搜尋詞清單：

基礎詞：
- {公司名} 報導
- {公司名} 新聞
- {公司名} 融資
- {公司名} 獲獎

擴展詞（如已知或可推測）：
- {創辦人姓名} 專訪
- {公司名} 入選
- {公司名} 榮獲
- {公司名} 加速器/孵化器
- {公司英文名} + 關鍵詞（同上）

### 步驟 2：並行網路搜尋

對每個關鍵詞進行 WebSearch，設定參數：
- 地域限制：台灣優先
- 排序：時間逆序（最新優先）
- 篩選條件：排除重複、廣告、官網自宣

優先媒體來源（信度高）：
- 傳統媒體：聯合新聞網、經濟日報、商業周刊、天下雜誌
- 科技媒體：科技新報、數位時代、TechOrange
- 財經媒體：鉅亨網、經商網、MoneyDJ

可接納：部落格、Medium、LinkedIn 官方貼文（來自公司或創辦人認證帳號）

應排除：業配、純商業軟文、未註明出處

### 步驟 3：驗證 + 逐一讀取

對每筆搜尋結果：

1. 檢查 URL 可達性與媒體信度
2. 用 WebFetch 或 Read 工具讀取完整內容
3. 驗證文章日期、出版媒體、內容真實性
4. 提取：標題、媒體名、日期、核心摘要（1–2 句）、URL

若遇付費牆（如聯合、商周訂閱版）：記錄標題、日期、媒體名，標註 [paywall]

### 步驟 4：分類彙整

將蒐集到的証據按以下類別分組：

**報導 / Featured Articles** 
- 新聞導讀、深度特寫、人物故事
- 公司經營、產品、策略相關報導

**獲獎 / Awards & Recognition**
- 業界獎項（如年度最佳、創新獎等）
- 競賽入選、評比排名
- 政府補助認可

**創辦人曝光 / Founder Visibility**
- 一對一或群體專訪
- 演講、座談出現
- 出版著作、文章發表
- LinkedIn 或部落格專欄

**融資 / Funding News**
- 融資宣布（金額、輪次、投資者）
- 上市/IPO 相關新聞

**其他榮譽 / Other Mentions**
- 合作宣布、大客戶簽約
- 入選加速器、孵化器計畫
- 媒體 100 大、新創榜單入選

### 步驟 5：結構化輸出

輸出格式：JSON（推薦）或 Markdown table

**JSON 格式** (標準輸出)：

{
  "company": "公司名",
  "company_en": "Company Name",
  "search_date": "2026-06-13",
  "evidence_count": 12,
  "data_quality": "complete",
  "categories": {
    "articles": [
      {
        "title": "報導標題",
        "source": "媒體名",
        "source_type": "traditional_media|tech_media|founder_channel",
        "date": "2026-06-10",
        "summary": "摘要（核心 1–2 句，50–100 字）",
        "url": "https://...",
        "status": "accessible|paywall|archived"
      }
    ],
    "awards": [
      {
        "award_name": "獎項名稱",
        "category": "組別/類別",
        "year": 2026,
        "organizer": "頒獎單位",
        "summary": "簡述",
        "url": "https://..."
      }
    ],
    "founder_visibility": [
      {
        "type": "interview|speaking|publication|profile",
        "title": "標題",
        "founder_name": "創辦人名",
        "date": "2026-06-10",
        "source": "媒體/平台",
        "url": "https://...",
        "summary": "簡述"
      }
    ],
    "funding": [
      {
        "announcement_date": "2026-06-10",
        "round": "Series A|B|C|others",
        "amount_usd": 5000000,
        "investors": ["投資方 A", "投資方 B"],
        "source": "媒體或公司公告",
        "url": "https://..."
      }
    ],
    "other": [
      {
        "type": "partnership|ranking|selection",
        "title": "標題",
        "date": "2026-06-10",
        "summary": "簡述",
        "url": "https://..."
      }
    ]
  },
  "notes": "資料不足或特殊情況之說明"
}

**Markdown table 格式** (簡化版)：

| 日期 | 類別 | 標題 | 媒體 | 摘要 | URL |
|------|------|------|------|------|-----|
| 2026-06-10 | 獲獎 | Appworks 獲 Forbes Asia Startup Enabler 獎 | 科技新報 | Appworks 宣布獲得 Forbes Asia 評選為亞洲領先加速器 | https://... |
| 2026-05-20 | 專訪 | 林之晨談新創生態 | 商周 | 創辦人分享... | https://... |

## 注意事項

### 搜尋範圍與準確度

- **台灣媒體優先**：搜尋結果預設以台灣為主要市場。國際媒體若有專文提及台灣公司，亦可納入（例如 TechCrunch Asia、VentureBeat 報導台灣新創）
- **時間跨度**：建議蒐集最近 3–5 年的報導。更早期的資訊（創業故事、初期融資）若仍被廣泛引用或具代表性，也可包含
- **假新聞 / 軟文風險**：篩選時優先納入知名媒體（聯合、經濟日報、天下、科技新報等），標註資料來源信度，避免純商業推廣內容誤當新聞
- **去重複**：同一事件多家媒體報導時，保留最早發布版本 + 最權威媒體版本，明確記錄來源

### 資料不足的情況

- **結果 < 3 筆**：報告格式改為：「未發現足夠公開媒體紀錄。可能原因：(1) 早期階段，(2) 低調運營，(3) 媒體覆蓋有限。建議補充調查私下信號（業內人脈、投資人反饋）」
- **0 筆結果**：不應虛構或推測不存在的報導，而應明確標註「No public media coverage found」
- **信度不確定**：對來源模糊或內容有疑問的報導，標註 [unverified] 或 [需驗證]

### 與 PE memo 的協作

- **充分報導（10+ 筆）**：可直接提煉成 memo 的「Media Coverage」或「Market Visibility」背景段落
- **適中報導（3–9 筆）**：作為支持故事背景，但須認知「媒體能見度中等」
- **稀少報導（< 3 筆）**：在 memo 中明確標註「市場能見度有限」作為投資評估之參考信號，勿誇大

### 已知限制與陷阱

- **網路依賴**：需要穩定網路連線與搜尋工具可用（WebSearch、WebFetch）
- **付費牆問題**：部分內容（如聯合新聞網、商業周刊付費版）可能無法完整讀取；此時記錄摘要、標題 + 來源與 [paywall] 標記即可，勿跳過
- **地域偏差**：搜尋引擎仍可能有地域偏差；若發現國際報導更豐富，應同時納入但分類標註
- **時間延遲**：剛成立或最近發生的事件可能搜尋不到；可改用官方新聞稿、LinkedIn 或投資人交流補充
- **一次性搜尋**：此步驟輸出之報導清單為執行當日時點之快照，後續若需最新信息應重新執行搜尋

## 範例運行

**輸入**：查 Appworks（應科）的媒體報導與獲獎紀錄

**步驟 1 生成關鍵詞**：
- Appworks 報導
- Appworks 融資
- Appworks 獲獎
- 林之晨 專訪
- Appworks Accelerator 入選
- Appworks 年度成果

**步驟 2–3 搜尋 + 讀取** (節錄執行結果)

發現 12 筆結果，包括：
- 科技新報：Appworks 2026 年度投資 120 家新創
- Forbes Asia：Forbes Asia 100 to Watch 名單入選
- 商業周刊：林之晨談台灣新創未來
- Appworks 官網新聞：Series D 融資宣布（$30M）

**步驟 4–5 最終輸出**：

{
  "company": "Appworks",
  "company_en": "Appworks Inc.",
  "search_date": "2026-06-13",
  "evidence_count": 12,
  "data_quality": "complete",
  "categories": {
    "articles": [
      {
        "title": "Appworks 2026 年度成果：扶植 120 家新創，累積投資破百億",
        "source": "科技新報",
        "source_type": "tech_media",
        "date": "2026-06-10",
        "summary": "Appworks 公布 2026 年度 Demo Day，宣布扶植 120 家早期新創，累積投資金額超過 100 億台幣...",
        "url": "https://technews.tw/...",
        "status": "accessible"
      }
    ],
    "awards": [
      {
        "award_name": "Forbes Asia 100 To Watch",
        "category": "Startup Ecosystem",
        "year": 2026,
        "organizer": "Forbes Asia",
        "summary": "Forbes Asia 評選 Appworks 為亞洲最具影響力的加速器之一",
        "url": "https://forbes.com/asia/..."
      }
    ],
    "founder_visibility": [
      {
        "type": "interview",
        "title": "林之晨談台灣新創的國際競爭力與投資機會",
        "founder_name": "林之晨",
        "date": "2026-05-15",
        "source": "商業周刊",
        "url": "https://bwnet.com.tw/...",
        "summary": "Appworks 創辦人林之晨分享觀點，認為台灣新創在特定垂直領域具全球競爭力..."
      }
    ],
    "funding": [
      {
        "announcement_date": "2026-03-20",
        "round": "Series D",
        "amount_usd": 30000000,
        "investors": ["TBVentures", "CDIB Capital"],
        "source": "Appworks 官方公告",
        "url": "https://appworks.tw/news/..."
      }
    ],
    "other": []
  },
  "notes": "資料齊全，媒體覆蓋度高，可直接作為 PE memo 背景使用"
}