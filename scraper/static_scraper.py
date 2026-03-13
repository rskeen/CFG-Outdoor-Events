"""
Static (BeautifulSoup) scraper for race event websites.
Returns raw text/data for normalization by the Claude normalizer.
"""

from typing import Any
import requests
from bs4 import BeautifulSoup

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; CFGRaceScraper/1.0; +https://cfgevents.app)"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}
REQUEST_TIMEOUT = 20


def scrape(source: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Scrape a source using requests + BeautifulSoup.

    Args:
        source: ScraperSource config dict with keys:
            - url: str
            - field_map: dict mapping field name -> CSS selector (optional)
            - race_type: str (optional)

    Returns:
        List of raw dicts with extracted text. If field_map is provided,
        keys match the field names. Otherwise returns raw text blocks.
    """
    url = source.get("url", "")
    if not url:
        raise ValueError("Source must have a URL")

    response = requests.get(url, headers=DEFAULT_HEADERS, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    response.encoding = response.apparent_encoding

    soup = BeautifulSoup(response.text, "lxml")

    field_map: dict[str, str] | None = source.get("field_map")

    if field_map:
        return _extract_with_field_map(soup, field_map, source)
    else:
        return _extract_raw(soup, source)


def _extract_with_field_map(
    soup: BeautifulSoup,
    field_map: dict[str, str],
    source: dict[str, Any],
) -> list[dict[str, Any]]:
    """Use CSS selectors from field_map to extract structured data."""
    # Expect a 'container' selector to define the list of race items
    container_selector = field_map.get("container", "")
    if not container_selector:
        # Fall back to raw extraction
        return _extract_raw(soup, source)

    containers = soup.select(container_selector)
    results = []

    for container in containers:
        item: dict[str, Any] = {"_source": source.get("name", ""), "_url": source.get("url", "")}
        for field, selector in field_map.items():
            if field == "container":
                continue
            el = container.select_one(selector)
            if el:
                # Extract href for link fields
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
    """Extract all meaningful text blocks from the page for Claude normalization."""
    # Remove scripts, styles, nav, footer
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()

    # Try to find the main content area
    main = soup.find("main") or soup.find(id="content") or soup.find(class_="content") or soup.body

    text_blocks = []
    if main:
        # Extract text in chunks by block-level elements
        for el in main.find_all(["div", "li", "tr", "article", "section"], recursive=False):
            text = el.get_text(separator=" ", strip=True)
            if len(text) > 20:  # Skip tiny fragments
                text_blocks.append(text)

        # If no block-level children, just use full text
        if not text_blocks:
            text_blocks = [main.get_text(separator="\n", strip=True)]

    return [
        {
            "_source": source.get("name", ""),
            "_url": source.get("url", ""),
            "_raw_text": "\n".join(text_blocks[:200]),  # Cap to avoid huge payloads
        }
    ]
