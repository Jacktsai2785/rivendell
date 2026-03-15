---
name: web-scraper
description: >
  Playwright-based web scraping fallback for when WebFetch fails due to anti-scraping
  protections (Cloudflare, JS-rendered pages, bot detection). Launches headless Chromium
  with realistic browser context, supports text extraction, screenshots, and form interaction.
  TRIGGER when: WebFetch returns empty/blocked content, need to scrape JS-rendered pages,
  or interact with web forms programmatically.
  DO NOT TRIGGER when: WebFetch works fine, building MCP servers (use mcp-builder),
  or testing web apps (use webapp-testing).
tags: [backend, scraping]
version: 1
source: manual
user_invocable: false
---

# Web Scraper

Playwright headless browser fallback for when WebFetch fails. Handles anti-scraping protections, JS-rendered content, and form interactions.

## When to Use

- WebFetch returns empty HTML (`<html><head></head><body></body></html>`)
- WebFetch returns a Cloudflare challenge page
- Page content is rendered by JavaScript (SPA, React, etc.)
- Need to fill forms and click buttons to access data
- Need to take screenshots for visual analysis

## Core Pattern

```python
from playwright.sync_api import sync_playwright
import time

def scrape_page(url: str, wait_for: str = 'networkidle') -> dict:
    """
    Scrape a page using headless Chromium.

    Returns:
        dict with keys: text, html, title, url (final after redirects)
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                       'AppleWebKit/537.36 (KHTML, like Gecko) '
                       'Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 900},
            locale='zh-TW',
        )
        page = ctx.new_page()

        try:
            page.goto(url, wait_until=wait_for, timeout=20000)
            time.sleep(2)  # Allow late JS rendering

            result = {
                'text': page.inner_text('body'),
                'html': page.content(),
                'title': page.title(),
                'url': page.url,  # Final URL after redirects
            }
        except Exception as e:
            result = {'error': str(e)}
        finally:
            browser.close()

        return result
```

## Screenshot Pattern

```python
def screenshot_page(url: str, output_path: str = '/tmp/page.png') -> str:
    """Take a full-page screenshot. Returns the file path."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                       'AppleWebKit/537.36 (KHTML, like Gecko) '
                       'Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 900},
        )
        page = ctx.new_page()
        page.goto(url, wait_until='networkidle', timeout=20000)
        time.sleep(2)
        page.screenshot(path=output_path, full_page=True)
        browser.close()
        return output_path
```

## Form Interaction Pattern

```python
def fill_and_submit(url: str, fields: dict, submit_selector: str) -> str:
    """
    Navigate to URL, fill form fields, submit, return resulting page text.

    Args:
        fields: dict of {selector: value} pairs
        submit_selector: CSS selector or text for submit button
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                       'AppleWebKit/537.36 (KHTML, like Gecko) '
                       'Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 900},
        )
        page = ctx.new_page()
        page.goto(url, wait_until='networkidle', timeout=20000)
        time.sleep(1)

        for selector, value in fields.items():
            page.fill(selector, value)
            time.sleep(0.3)

        page.click(submit_selector)
        time.sleep(3)

        text = page.inner_text('body')
        browser.close()
        return text
```

## Tab Navigation Pattern

For sites with tabbed content (like government registries):

```python
def scrape_tabs(url: str, tab_labels: list[str]) -> dict[str, str]:
    """Navigate to URL, click through tabs, collect text from each."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                       'AppleWebKit/537.36 (KHTML, like Gecko) '
                       'Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 900},
        )
        page = ctx.new_page()
        page.goto(url, wait_until='networkidle', timeout=20000)
        time.sleep(2)

        results = {'_initial': page.inner_text('body')}

        for label in tab_labels:
            try:
                page.click(f'text={label}')
                time.sleep(2)
                results[label] = page.inner_text('body')
            except Exception as e:
                results[label] = f'Error: {e}'

        browser.close()
        return results
```

## Anti-Detection Tips

1. **Always set realistic user_agent** — default Playwright UA is detectable
2. **Add viewport** — headless without viewport is a bot signal
3. **Use `time.sleep()`** — immediate page reads often get empty content
4. **Set locale** — `zh-TW` for Taiwan sites, matches expected visitor profile
5. **Try `wait_until='domcontentloaded'`** if `'networkidle'` times out
6. **Some sites block headless entirely** — if blank after all attempts, inform user and suggest manual check

## Limitations

- Cannot bypass CAPTCHA (inform user if encountered)
- Cannot handle sites requiring login (inform user)
- Playwright must be installed: `pip install playwright && playwright install chromium`
- Each browser launch takes ~1-2 seconds overhead
