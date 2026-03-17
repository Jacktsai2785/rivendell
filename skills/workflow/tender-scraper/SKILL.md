---
name: tender-scraper
description: "Automated government tender scraper — fetches public tender listings from Taiwan's government procurement portal (via g0v API), filters for open tenders within bidding period, writes/archives case files, and regenerates INDEX.md. Fully local, no DB dependency."
tags: [automation, tenders, scraping, sales-enablement, local]
version: 1
source: manual
user_invocable: true
when_to_use: "TRIGGER when: user says /tender-scraper, 'scrape tenders', '更新標案', '爬標案', or this skill is invoked by a headless agent on schedule. DO NOT TRIGGER when: user is manually researching a single tender."
allowed-tools:
  - WebFetch
  - WebSearch
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Tender Scraper

Automated scraper that fetches government tender listings and maintains `materials/tenders/` as a local knowledge base. **No DB dependency** — markdown files are the single source of truth.

## Architecture

```
g0v API → Filter 公開徵求 → Dedup vs existing .md files → Write/Archive → Regenerate INDEX
```

### Data Flow

```
WebFetch pcc-api.openfun.app
    ↓
Filter brief.type = 公開徵求
    ↓
Read materials/tenders/cases/*.md frontmatter (dedup)
    ↓
New → Write cases/{job_number}-{slug}.md
Deadline passed → Move to cases/archived/
    ↓
Regenerate INDEX.md + by-category/*.md
```

## Data Source

| Source | URL | Frequency | source_id |
|--------|-----|-----------|-----------|
| g0v 政府採購 API | https://pcc-api.openfun.app | daily | pcc_g0v |
| 政府電子採購網 (fallback) | https://web.pcc.gov.tw | fallback only | pcc_web |

### API Endpoints

- `GET /api/listbydate?date=YYYYMMDD` — list all announcements for a date (100-200/page, `page` param)
- `GET /api/tender?unit_id=XXX&job_number=YYY` — tender detail (contains 招標方式, 截止投標, 預算金額)

### Important: Filtering

`brief.type` is always `"公開招標公告"` for all public tenders — **cannot** filter by 招標方式 at listing level. Must fetch detail and check `招標資料.招標方式 == "公開徵求"`.

## Workflow

Read [scraper.md](scraper.md) for the complete scraping workflow.

### Quick Reference

1. **Fetch** — WebFetch g0v API for today's listings (paginate all pages)
2. **Dedup** — Glob `materials/tenders/cases/*.md`, read frontmatter, match by `job_number`
3. **Detail + Filter** — For new tenders, fetch detail API; keep only `招標資料.招標方式 == "公開徵求"`
4. **Screenshot Parse** — Playwright captures tender page screenshots → AI vision extracts scope, qualification, evaluation method
5. **Create** — New tenders → write `cases/{job_number}-{slug}.md` with frontmatter + parsed detail
6. **Archive** — Deadline passed → move to `cases/archived/`, set status: archived
7. **Regenerate** — Rebuild `INDEX.md` and `by-category/*.md` from all active case files

## Case File Format

Each tender is a markdown file at `materials/tenders/cases/{job_number}-{slug}.md`:

```yaml
---
name: "OO機關XX系統建置案"
job_number: "LP5-114001"
agency: "經濟部"
category: "勞務"
tender_type: "公開徵求"
publish_date: "2026-03-17"
deadline: "2026-03-31"
budget_amount: "5,000,000"
reference_url: "https://web.pcc.gov.tw/..."
source_id: pcc_g0v
last_scraped: "2026-03-17"
status: active
---
```

## Category Mapping

Classify each tender based on procurement category:

| API category | category tag | by-category file |
|-------------|-------------|------------------|
| 勞務 | 勞務 | services.md |
| 財物 | 財物 | goods.md |
| 工程 | 工程 | engineering.md |

## Date Handling

- Deadline determines active/archived status
- `deadline >= today` → active
- `deadline < today` → archived (move to `cases/archived/`)

Taiwan government sites use ROC calendar (民國):
- 民國年 + 1911 = 西元年
- Example: 115年3月 = 2026年3月

## Headless Execution

Runs as headless agent via LaunchAgent `com.sk.agent.sales.tender-scraper`.
Schedule: Daily 08:30.
Runner: `scripts/tender-scraper.sh`

## Screenshot Detail Parsing

For each new tender, Playwright captures the detail page and AI vision extracts:
- Scope/requirements summary (需求規格)
- Qualification requirements (資格條件)
- Evaluation method (評選方式)
- Contract period (履約期限)

**Tool**: `services/nexus/tender_detail_parser.py`
- `capture_tender_screenshots(unit_id, job_number)` → list of PNG paths
- `build_vision_prompt()` → prompt for AI vision parsing
- Screenshots stored in `materials/tenders/screenshots/` (ephemeral)

See [scraper.md](scraper.md) Phase 3.5 for detailed workflow.

## Key Paths

- `materials/tenders/cases/*.md` — Individual tender files (SSOT)
- `materials/tenders/cases/archived/*.md` — Past-deadline tenders
- `materials/tenders/screenshots/` — Ephemeral screenshots for AI parsing
- `materials/tenders/INDEX.md` — Auto-generated active summary
- `materials/tenders/by-category/*.md` — Per-category views
