---
name: tw-company-lookup
description: >
  Full registry deep-dive for a single known Taiwan company: business activity
  codes (所營事業), factory registrations (工廠登記), manager list (經理人),
  and change history (歷史變更) — data that is only available via the findbiz
  web UI, not any open API. Always calls tw-company-identify first to get the
  structured API data (統編, 資本額, 上市狀態, 董監事), then supplements with
  the findbiz-only fields.
  TRIGGER when: user needs 所營事業代碼, 工廠登記, 經理人到職日期, or 歷史變更
  for a specific Taiwan company, or says "查findbiz", "工廠資料", "歷史變更",
  "所營事業", "完整登記資料".
  DO NOT TRIGGER when: user only needs basic company data or listing status
  (use tw-company-identify instead — it's faster and API-based).
tags: [backend, taiwan]
version: 3
source: manual
user_invocable: true
---

# Taiwan Company Lookup

Full registry deep-dive via 經濟部商工登記公示資料查詢服務 (findbiz.nat.gov.tw).

## Skill Split

| 資料類型 | 取得方式 | Skill |
|---------|---------|-------|
| 統編、資本額、代表人、地址、董監事、上市狀態、設立日期 | GCIS / g0v API (JSON) | **tw-company-identify** |
| 所營事業代碼、工廠登記、經理人、歷史變更 | findbiz 網頁 (Playwright) | **tw-company-lookup** (本 skill) |

本 skill 腳本先呼叫 `tw-company-identify` 取得 API 資料，再啟動 Playwright 補齊 findbiz 獨有欄位，最後合併輸出。

## Setup

```bash
# Playwright (Chromium)
pip install playwright
playwright install chromium

# tw-company-identify (API layer)
pip install -r ~/.claude/skills/tw-company-identify/scripts/requirements.txt
```

## Usage

```bash
# by company name
python ~/.claude/skills/tw-company-lookup/scripts/lookup.py --name "台積電股份有限公司"

# by 統一編號 (fastest — skips name-search in identify)
python ~/.claude/skills/tw-company-lookup/scripts/lookup.py --tax-id 22099131

# skip Playwright, only get API data (same as tw-company-identify --name)
python ~/.claude/skills/tw-company-lookup/scripts/lookup.py --name "台積電股份有限公司" --api-only

# skip API layer, only run Playwright (faster if you already have API data)
python ~/.claude/skills/tw-company-lookup/scripts/lookup.py --name "台積電股份有限公司" --findbiz-only
```

## Output Schema

```json
{
  "api": {
    "name": "台灣積體電路製造股份有限公司",
    "tax_id": "22099131",
    "listing_status": "上市",
    "representative": "魏哲家",
    "capital": 259325245210,
    "authorized_capital": 280500000000,
    "address": "新竹科學園區新竹市力行六路8號",
    "setup_date": "20021008",
    "last_change_date": "20250101",
    "register_org": "經濟部",
    "par_value": 10,
    "total_shares": 25932524521,
    "directors": [{"name": "...", "title": "...", "shares": 0, "ratio": 0.0}]
  },
  "findbiz": {
    "business_codes": [{"code": "A101010", "name": "..."}],
    "managers": [{"name": "...", "date": "..."}],
    "factories": [{"registration_no": "...", "name": "...", "status": "..."}],
    "history": [{"date": "...", "content": "..."}]
  }
}
```

## Script

```python
#!/usr/bin/env python3
"""
tw-company-lookup: Full findbiz registry lookup with tw-company-identify API layer.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

FINDBIZ_URL = "https://findbiz.nat.gov.tw/fts/query/QueryBar/queryInit.do"
IDENTIFY_SCRIPT = Path.home() / ".claude/skills/tw-company-identify/scripts/identify.py"
BROWSER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
TABS = ["董監事資料", "經理人資料", "工廠資料", "歷史資料"]


# ── API layer (tw-company-identify) ──────────────────────────────────────────

def get_api_data(name: str = "", tax_id: str = "") -> dict:
    if not IDENTIFY_SCRIPT.exists():
        print(f"[warn] identify script not found: {IDENTIFY_SCRIPT}", file=sys.stderr)
        return {}
    flag = ["--tax-id", tax_id] if tax_id else ["--name", name]
    result = subprocess.run(
        [sys.executable, str(IDENTIFY_SCRIPT), *flag, "--json-only"],
        capture_output=True, text=True, timeout=60,
    )
    if result.returncode != 0:
        print(f"[warn] identify failed: {result.stderr[:200]}", file=sys.stderr)
        return {}
    try:
        data = json.loads(result.stdout)
        valid = data.get("valid", [])
        return valid[0] if valid else {}
    except Exception:
        return {}


# ── Playwright layer (findbiz) ────────────────────────────────────────────────

def lookup_findbiz(search_term: str) -> dict:
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent=BROWSER_UA,
            viewport={"width": 1280, "height": 900},
            locale="zh-TW",
        )
        page = ctx.new_page()
        page.goto(FINDBIZ_URL, wait_until="networkidle", timeout=30000)
        page.wait_for_selector('input[name="qryCond"]', timeout=10000)
        page.fill('input[name="qryCond"]', search_term)
        page.click('input[type="submit"], button:has-text("查詢")')
        page.wait_for_selector("text=/共.*筆/, text=詳細資料, text=查無資料", timeout=15000)

        body = page.inner_text("body")
        if "查無資料" in body or not re.search(r"共\s*\d+\s*筆", body):
            browser.close()
            return {"error": f"No results for: {search_term}"}

        match = re.search(r"共\s*(\d+)\s*筆", body)
        if match and int(match.group(1)) > 1:
            browser.close()
            return {"error": f"Multiple results ({match.group(1)}). Use 統一編號 for exact match."}

        page.click("text=詳細資料")
        page.wait_for_selector("text=統一編號", timeout=15000)

        raw: dict[str, str] = {"basic": page.inner_text("body")}
        for tab in TABS:
            try:
                page.click(f"text={tab}")
                page.wait_for_selector("table, text=/無.*資料/, text=/序號/", timeout=10000)
                page.wait_for_timeout(500)
                raw[tab] = page.inner_text("body")
            except Exception as e:
                raw[tab] = f"Error: {e}"

        browser.close()

    return {
        "business_codes": _parse_business_codes(raw.get("basic", "")),
        "managers": _parse_managers(raw.get("經理人資料", "")),
        "factories": _parse_factories(raw.get("工廠資料", "")),
        "history": _parse_history(raw.get("歷史資料", "")),
    }


def _parse_business_codes(text: str) -> list[dict]:
    matches = re.findall(r"([A-Z]\d{6})\s+(.+?)$", text, re.MULTILINE)
    return [{"code": code, "name": name.strip()} for code, name in matches]


def _parse_managers(text: str) -> list[dict]:
    matches = re.findall(r"\d{4}\s+(\S+)\s+(\d{4}/\d{2}/\d{2})", text)
    return [{"name": name, "date": date} for name, date in matches]


def _parse_factories(text: str) -> list[dict]:
    factories = []
    for line in text.split("\n"):
        if re.match(r"^\d+\s+\d{8}", line.strip()):
            parts = line.strip().split("\t")
            if len(parts) >= 3:
                factories.append({
                    "registration_no": parts[1] if len(parts) > 1 else "",
                    "name": parts[2] if len(parts) > 2 else "",
                    "status": parts[3] if len(parts) > 3 else "",
                })
    return factories


def _parse_history(text: str) -> list[dict]:
    matches = re.findall(r"(\d{3}/\d{2}/\d{2}|\d{4}/\d{2}/\d{2})\s+(.+?)$", text, re.MULTILINE)
    return [{"date": d, "content": c.strip()} for d, c in matches]


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description="Full Taiwan company registry lookup.")
    src = parser.add_mutually_exclusive_group(required=True)
    src.add_argument("--name", help="Company name")
    src.add_argument("--tax-id", help="統一編號 (8 digits)")

    parser.add_argument("--api-only", action="store_true",
                        help="Only fetch API data (tw-company-identify), skip Playwright")
    parser.add_argument("--findbiz-only", action="store_true",
                        help="Only run Playwright on findbiz, skip API layer")
    parser.add_argument("--json-only", action="store_true",
                        help="Only print JSON to stdout")
    args = parser.parse_args()

    result: dict = {}

    search_term = args.name or args.tax_id

    if not args.findbiz_only:
        print("[ API ] fetching structured data…", file=sys.stderr)
        result["api"] = get_api_data(
            name=args.name or "",
            tax_id=args.tax_id or "",
        )
        # Use official name from API for Playwright search (more reliable)
        if result["api"].get("name"):
            search_term = result["api"]["name"]

    if not args.api_only:
        print(f"[ Playwright ] searching findbiz for: {search_term}", file=sys.stderr)
        result["findbiz"] = lookup_findbiz(search_term)

    print(json.dumps(result, ensure_ascii=False, indent=2))

    if not args.json_only:
        api = result.get("api", {})
        fb = result.get("findbiz", {})
        print(f"\n=== {api.get('name', search_term)} ===", file=sys.stderr)
        if api:
            print(f"  統編: {api.get('tax_id')}  上市: {api.get('listing_status')}  "
                  f"資本: {api.get('capital', 0):,}", file=sys.stderr)
        if fb and not fb.get("error"):
            print(f"  所營事業: {len(fb.get('business_codes', []))} 項  "
                  f"工廠: {len(fb.get('factories', []))} 筆  "
                  f"歷史變更: {len(fb.get('history', []))} 筆", file=sys.stderr)
        elif fb.get("error"):
            print(f"  findbiz: {fb['error']}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## Troubleshooting

| 問題 | 解法 |
|------|------|
| identify script not found | `pip install -r ~/.claude/skills/tw-company-identify/scripts/requirements.txt` |
| findbiz 多筆命中 | 改用 `--tax-id` 取代名稱搜尋 |
| Playwright 未安裝 | `pip install playwright && playwright install chromium` |
| findbiz timeout | 網路問題；加 `--api-only` 先取 API 資料 |
| 工廠/歷史欄位空白 | 該公司確實無此資料（findbiz 顯示「無資料」）|

## ROC Calendar

findbiz 顯示民國年（ROC）。轉換：ROC 年 + 1911 = 西元年。
例：114/07/18 = 2025/07/18

## Related Skills

- **tw-company-identify** — 本 skill 的 API layer 來源；可單獨使用取得快速基本資料
- **customer-intel** — B2B 銷售報告；lookup 跑完後接 customer-intel 寫完整客戶情蒐
