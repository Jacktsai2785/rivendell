---
name: customer-intel
description: >
  B2B customer intelligence: company name → structured web research → actionable
  sales report. Uses WebSearch + Playwright (findbiz.nat.gov.tw for TW companies)
  to gather company overview, leadership, financials, competitors, pain points,
  and sales strategy. Outputs markdown report + saves to reports/customer-intel/.
  TRIGGER when: user asks to research a company, prepare for a client meeting,
  gather customer intelligence, or says "客戶調查" / "公司調查" / "會前準備" / "情蒐".
  DO NOT TRIGGER when: researching stocks or investments (use investment-research),
  debugging code (use systematic-debugging), or reviewing code (use code-reviewer).
tags: [workflow, sales]
version: 1
source: manual
user_invocable: true
---

# Customer Intelligence

Structured B2B customer research workflow. Input a company name, get an actionable intel report for sales meeting prep.

## Goals

1. **Know the customer** — company background, leadership, financials, market position
2. **Find entry points** — pain points, challenges, and how our capabilities map to their needs
3. **Prepare for the meeting** — talking points, topics to avoid, risk assessment

## Research Workflow

```
1. Input & Disambiguation  →  2. Official Registry   →  3. Company Overview
   (confirm identity)          (findbiz / gov data)      (WebSearch + WebFetch)

4. Deep Intel Collection   →  5. Pain Points Analysis →  6. Report Output
   (news, people, finance)     (challenges + our fit)     (markdown + file save)
```

---

## Step 1: Input & Disambiguation

Accept: `company_name` (required), `industry` / `region` (optional)

### Disambiguation Strategy

```
WebSearch: "[company_name] company"
WebSearch: "[company_name] [industry] [region]"   # if hints provided
```

- If results are ambiguous (multiple companies with same name), ask the user
- Once confirmed, record: official name, English name, official website URL
- **Language detection**: TW/Chinese company → bilingual search; international → English-primary

### For Taiwan Companies: Use `tw-company-lookup` Skill (Mandatory)

Use the **tw-company-lookup** skill to query findbiz.nat.gov.tw (official government registry). This retrieves:
- 統一編號, 公司名稱, 代表人, 資本總額, 實收資本額
- 登記現況, 設立日期, 最後變更日期
- 所營事業資料 (all business categories)
- 董監事名單 + 持股
- 經理人名單
- 工廠登記 + 狀態
- 歷史變更紀錄 (ownership changes, capital changes)

**Reliability**: findbiz data = `[confirmed]` (government source)

---

## Step 2: Company Overview (WebSearch + WebFetch)

```
WebSearch: "[company_name] about company products services"
WebSearch: "[company_name] 公司 產品 服務"          # for TW companies
WebSearch: "[company_name] revenue employees size"
WebSearch: "[company_name] Wikipedia"
WebFetch: [official about page]
```

If WebFetch fails (anti-scraping), use the **web-scraper** skill as fallback.

**Collect:**
- Official name / English name
- Founded year
- HQ location + factory locations
- Employee count
- Main products/services
- B2B/B2C orientation
- Group/parent company affiliation

---

## Step 3: Deep Intel Collection

### 3a. Recent News (past 6-12 months)

```
WebSearch: "[company_name] news 2026"
WebSearch: "[company_name] 新聞 2025 2026"          # TW companies
WebSearch: "[company_name] press release"
```

WebFetch notable articles for details.

### 3b. Key Leadership & Decision Makers

```
WebSearch: "[company_name] CEO CTO leadership team"
WebSearch: "[company_name] 董事長 總經理 管理層"     # TW companies
WebSearch: "[company_name] [representative_name]"   # from findbiz
```

### 3c. Financial Status

```
WebSearch: "[company_name] revenue funding financial"
WebSearch: "[company_name] 營收 資本額 財報"         # TW companies
WebSearch: "[company_name] crunchbase"               # for startups
```

For TW listed companies: check 公開資訊觀測站 (MOPS).

### 3d. Industry Position & Competitors

```
WebSearch: "[company_name] competitors market share"
WebSearch: "[company_name] vs [known_competitor]"
WebSearch: "[industry] 台灣 市場 主要廠商"           # TW market context
```

### 3e. Technology Stack (optional, from job postings & tech blogs)

```
WebSearch: "[company_name] engineering blog technology stack"
WebSearch: "[company_name] jobs software engineer"
```

---

## Step 4: Pain Points & Opportunity Analysis

```
WebSearch: "[company_name] challenges problems"
WebSearch: "[company_name] digital transformation"
WebSearch: "[industry] trends challenges 2026"
```

**Analysis angles:**
- Challenges inferred from news
- Tech gaps inferred from job postings
- Industry pressure from market trends
- Mapping pain points → our capabilities

---

## Step 5: Report Output

Output the report to terminal AND save to file:

```
~/Documents/Projects/reports/customer-intel/[company_name]_[YYYY-MM-DD].md
```

Create the directory if it doesn't exist.

---

## Reliability Indicators

Every finding MUST be tagged:

| Indicator | Tag | Definition |
|-----------|-----|-----------|
| Confirmed | `[confirmed]` | Official source (government registry, annual report, official website) |
| Corroborated | `[corroborated]` | Multiple independent sources agree |
| Unverified snippet | `[unverified-snippet]` | From WebSearch summary only, page not fetched |
| Single source | `[single-source]` | Only one non-official source |
| Inferred | `[inferred]` | Deduced from indirect evidence (e.g., tech stack from job posts) |
| Outdated | `[outdated]` | Source is >12 months old |

**Critical rule**: WebSearch summaries of company registration data (e.g., representative name) MUST be `[unverified-snippet]` until verified via findbiz or user confirmation. Search engine snippets may contain outdated cached data.

---

## Report Template

```markdown
# 客戶情報報告 — [公司名稱]
> 調查日期：[YYYY-MM-DD]
> 調查方式：customer-intel skill

---

## 一、公司概覽

| 項目 | 內容 | 可靠度 |
|------|------|--------|
| 正式名稱 | | |
| 英文名 | | |
| 統一編號 | | |
| 成立年份 | | |
| 總部 | | |
| 員工規模 | | |
| 資本額 | | |
| 代表人 | | |
| 官方網站 | | |

### 營業項目
(from findbiz)

### 主要產品/服務
(from web research)

### 核心定位
> One-paragraph summary of what makes this company distinctive.

---

## 二、近期動態

| 日期 | 事件 | 影響 | 可靠度 | 來源 |
|------|------|------|--------|------|
| | | | | |

---

## 三、關鍵人物

| 姓名 | 職稱 | 備註 | 可靠度 |
|------|------|------|--------|
| | | | |

---

## 四、財務狀況

- **資本額**：
- **營收**：
- **財務健康度**：
- 可靠度：

---

## 五、產業定位與競爭

### 市場定位
### 主要競爭者
### 產業趨勢

---

## 六、痛點與挑戰

| 痛點 | 證據 | 我方可能對應能力 | 可靠度 |
|------|------|-----------------|--------|
| | | | |

---

## 七、技術棧

| 類別 | 技術 | 來源 | 可靠度 |
|------|------|------|--------|
| | | | |

---

## 八、業務策略建議

### 切入點
1.
2.
3.

### 會議準備要點
- **可提及的話題**：
- **應避免的話題**：
- **建議開場**：

### 風險評估
| 風險類型 | 評估 | 說明 |
|---------|------|------|
| 預算風險 | | |
| 決策流程 | | |
| 競爭風險 | | |

---

## 資訊缺口（待面談確認）

1.
2.
3.

---

_Generated by customer-intel skill on [date]_

Sources:
- [source links]
```

---

## Adaptive Strategy: Small vs Large Companies

Information depth varies dramatically by company size. Adapt expectations:

### Small Companies (capital < NT$50M, employees < 50)

- **News**: Likely none. Skip if first search returns nothing.
- **Leadership**: Only 負責人 from findbiz. No media interviews.
- **Financials**: Only registered capital. No revenue data.
- **Competitors**: Infer from industry + region.
- **Pain points**: Heavily rely on inference from industry trends, website quality, and job postings.
- **Strategy**: Focus on what IS available — official registry, website analysis, industry context.

### Large Companies (capital > NT$100M, employees > 100)

- **News**: Multiple sources. Prioritize business media (今周刊, 天下, 商周, HBR Taiwan).
- **Leadership**: Full board from findbiz + media profiles.
- **Financials**: Listed companies → MOPS; unlisted → infer from news, investments, expansion.
- **Competitors**: Named in industry reports.
- **Pain points**: Directly mentioned in interviews or analyst reports.
- **Strategy**: Go deeper — read the actual articles via WebFetch for nuance.

---

## nx_intel JSON Format (Optional)

When user requests sales-assistant integration, output compatible JSON:

```json
{
  "role": "client",
  "company_name": "[正式名稱]",
  "industry": "[industry_code]",
  "industry_label": "[產業中文名]",
  "pain_points": ["[pain1]", "[pain2]"],
  "contact_name": "[key_contact]",
  "contact_title": "[title]",
  "decision_maker": "[decision_maker]",
  "competitors": "[competitor1, competitor2]",
  "_customer_intel": {
    "report_date": "[YYYY-MM-DD]",
    "company_overview": "[summary]",
    "revenue": "[if known]",
    "employee_count": "[if known]",
    "recent_news": [{"date": "", "event": "", "reliability": ""}],
    "key_people": [{"name": "", "title": "", "reliability": ""}],
    "sales_strategy": {
      "entry_points": [],
      "risks": [],
      "meeting_talking_points": []
    }
  }
}
```

Top-level fields follow `INTEL_PARSE_PROMPT` schema for materialize compatibility.
Extended data in `_customer_intel` sub-object (underscore prefix avoids schema conflicts).
