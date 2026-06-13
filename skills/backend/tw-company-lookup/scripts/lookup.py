#!/usr/bin/env python3
"""
tw-company-lookup: Full findbiz registry lookup with tw-company-identify API layer.

Two-phase pipeline:
  1. API (tw-company-identify) → structured JSON: 統編, 資本, 董監事, 上市狀態, 設立日期
  2. Playwright (findbiz)      → findbiz-only data: 所營事業, 工廠, 經理人, 歷史變更

See SKILL.md for full documentation.
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
FINDBIZ_TABS = ["董監事資料", "經理人資料", "工廠資料", "歷史資料"]


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

def _parse_findbiz_list_candidates(page) -> list[dict]:
    """Extract candidate company rows from findbiz search result list page."""
    candidates: list[dict] = []
    try:
        rows = page.query_selector_all("table tr")
        for row in rows:
            cells = row.query_selector_all("td")
            if len(cells) < 2:
                continue
            cell_texts = [c.inner_text().strip() for c in cells]
            tax_id = next((t for t in cell_texts if re.match(r"^\d{8}$", t)), "")
            name = next(
                (t for t in cell_texts
                 if any(s in t for s in ("股份有限公司", "有限公司", "公司"))
                 and len(t) > 2),
                "",
            )
            if (tax_id or name) and not any(c["tax_id"] == tax_id for c in candidates):
                candidates.append({"tax_id": tax_id, "name": name})
    except Exception:
        pass
    return candidates


def lookup_findbiz(search_term: str) -> dict:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return {"error": "Playwright not installed. Run: pip install playwright && playwright install chromium"}

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
            candidates = _parse_findbiz_list_candidates(page)
            browser.close()
            return {
                "candidates": candidates,
                "total": int(match.group(1)),
                "hint": "找到多筆結果，請用 --tax-id 精確查詢",
            }

        page.click("text=詳細資料")
        page.wait_for_selector("text=統一編號", timeout=15000)

        raw: dict[str, str] = {"basic": page.inner_text("body")}
        for tab in FINDBIZ_TABS:
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
    parser = argparse.ArgumentParser(
        description="Full Taiwan company registry lookup (API + findbiz).",
    )
    src = parser.add_mutually_exclusive_group(required=True)
    src.add_argument("--name", help="Company name (Chinese)")
    src.add_argument("--tax-id", help="統一編號 (8 digits)")

    parser.add_argument("--api-only", action="store_true",
                        help="Only fetch API data, skip Playwright (same as tw-company-identify)")
    parser.add_argument("--findbiz-only", action="store_true",
                        help="Only run findbiz Playwright, skip API layer")
    parser.add_argument("--json-only", action="store_true",
                        help="Only print JSON to stdout (stderr summary suppressed)")
    args = parser.parse_args()

    result: dict = {}
    search_term = args.name or args.tax_id

    if not args.findbiz_only:
        print("[ API ] fetching structured data…", file=sys.stderr)
        api = get_api_data(name=args.name or "", tax_id=args.tax_id or "")
        result["api"] = api
        if api.get("name"):
            search_term = api["name"]

    if not args.api_only:
        print(f"[ Playwright ] searching findbiz: {search_term}", file=sys.stderr)
        result["findbiz"] = lookup_findbiz(search_term)

    print(json.dumps(result, ensure_ascii=False, indent=2))

    if not args.json_only:
        api = result.get("api", {})
        fb = result.get("findbiz", {})
        print(f"\n=== {api.get('name', search_term)} ===", file=sys.stderr)
        if api:
            print(
                f"  統編: {api.get('tax_id')}  上市: {api.get('listing_status')}  "
                f"資本: {api.get('capital', 0):,}",
                file=sys.stderr,
            )
        if fb and not fb.get("error") and not fb.get("candidates"):
            print(
                f"  所營事業: {len(fb.get('business_codes', []))} 項  "
                f"工廠: {len(fb.get('factories', []))} 筆  "
                f"歷史變更: {len(fb.get('history', []))} 筆",
                file=sys.stderr,
            )
        elif fb.get("candidates"):
            print(
                f"  findbiz: 找到 {fb['total']} 筆結果，請用 --tax-id 精確查詢：",
                file=sys.stderr,
            )
            for c in fb["candidates"]:
                print(f"    [{c.get('tax_id', '')}] {c.get('name', '')}", file=sys.stderr)
        elif fb.get("error"):
            print(f"  findbiz: {fb['error']}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
