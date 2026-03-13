"""
Playwright async scraper for JavaScript-heavy race event websites.
Same interface as static_scraper.
"""

import asyncio
from typing import Any

try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

from bs4 import BeautifulSoup


async def _async_scrape(source: dict[str, Any]) -> list[dict[str, Any]]:
    """Internal async scrape implementation."""
    if not PLAYWRIGHT_AVAILABLE:
        raise RuntimeError("Playwright is not installed. Run: pip install playwright && playwright install chromium")

    url = source.get("url", "")
    if not url:
        raise ValueError("Source must have a URL")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox"],
        )
        page = await browser.new_page(
            user_agent="Mozilla/5.0 (compatible; CFGRaceScraper/1.0; +https://cfgevents.app)"
        )

        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
            # Extra wait for dynamic content
            await page.wait_for_timeout(2000)
            html = await page.content()
        finally:
            await browser.close()

    soup = BeautifulSoup(html, "lxml")
    field_map: dict[str, str] | None = source.get("field_map")

    if field_map and "container" in field_map:
        return _extract_with_field_map(soup, field_map, source)
    else:
        return _extract_raw(soup, source)


def scrape(source: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Synchronous entry point for Playwright scraping.
    Runs the async scraper in an event loop.
    """
    return asyncio.run(_async_scrape(source))


def _extract_with_field_map(
    soup: BeautifulSoup,
    field_map: dict[str, str],
    source: dict[str, Any],
) -> list[dict[str, Any]]:
    container_selector = field_map.get("container", "")
    if not container_selector:
        return _extract_raw(soup, source)

    containers = soup.select(container_selector)
    results = []

    for container in containers:
        item: dict[str, Any] = {
            "_source": source.get("name", ""),
            "_url": source.get("url", ""),
        }
        for field, selector in field_map.items():
            if field == "container":
                continue
            el = container.select_one(selector)
            if el:
                if el.name == "a" or field.endswith("_url"):
                    item[field] = el.get("href", el.get_text(strip=True))
                else:
                    item[field] = el.get_text(strip=True)
            else:
                item[field] = None
        results.append(item)

    return results


def _extract_raw(
    soup: BeautifulSoup,
    source: dict[str, Any],
) -> list[dict[str, Any]]:
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()

    main = (
        soup.find("main")
        or soup.find(id="content")
        or soup.find(class_="content")
        or soup.body
    )

    text_blocks = []
    if main:
        for el in main.find_all(
            ["div", "li", "tr", "article", "section"], recursive=False
        ):
            text = el.get_text(separator=" ", strip=True)
            if len(text) > 20:
                text_blocks.append(text)

        if not text_blocks:
            text_blocks = [main.get_text(separator="\n", strip=True)]

    return [
        {
            "_source": source.get("name", ""),
            "_url": source.get("url", ""),
            "_raw_text": "\n".join(text_blocks[:200]),
        }
    ]
