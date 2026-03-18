"""
Normalizes raw scraped data into structured race objects using Claude.
"""

import json
import os
from datetime import date
from typing import Any

import anthropic

SYSTEM_PROMPT = """You are a data extraction specialist for an outdoor endurance racing database.

Given raw text or semi-structured data scraped from race event websites, extract races and normalize them into structured JSON.

Return ONLY a valid JSON array of race objects. Each race object should have these fields (use null for missing values):
- name: string (required - the race/event name)
- date: string (YYYY-MM-DD format, required)
- end_date: string | null (YYYY-MM-DD, for multi-day events)
- location_name: string | null (venue/park name)
- location_city: string | null
- location_state: string | null (2-letter abbreviation, e.g. "GA")
- lat: number | null (decimal degrees)
- lng: number | null (decimal degrees)
- race_type: string | null (one of: trail, ultra, ocr, adventure, orienteering, mtb, gravel, other)
- description: string | null (brief description, max 500 chars)
- summary: string | null (1-sentence summary covering race style, approximate distance/duration, and team structure if known. Example: "A 10-mile solo trail race through mountain terrain with optional relay divisions.")
- registration_url: string | null (full URL)
- race_url: string | null (full URL to race details)
- cost_min: number | null (minimum registration cost in USD)
- cost_max: number | null (maximum registration cost in USD)

Rules:
- If you cannot determine a required field (name, date), omit that race entirely
- Infer lat/lng from city/state only if very confident
- Normalize dates to YYYY-MM-DD even if given in other formats
- Use the page context (e.g. "2025-2026 Schedule" header) to assign the correct year to undated events
- SKIP any event whose date is before TODAY'S DATE (provided in the user prompt) — only return future/upcoming events
- For race_type, infer from event name/description if not explicit
- Return [] if no valid races found
- Do NOT include markdown, only raw JSON"""


def normalize_races(
    raw_items: list[dict[str, Any]],
    source: dict[str, Any],
) -> list[dict[str, Any]]:
    """
    Call Claude API to normalize raw scraped items into race dicts.

    Args:
        raw_items: List of raw dicts from the scraper
        source: ScraperSource config dict

    Returns:
        List of normalized race dicts matching the races table schema
    """
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    # Build a compact text representation of the raw data
    if not raw_items:
        return []

    # Prefer raw text if available
    raw_text = ""
    if "_raw_text" in raw_items[0]:
        raw_text = raw_items[0]["_raw_text"]
    else:
        # Serialize structured items
        raw_text = json.dumps(raw_items, indent=2)[:8000]

    source_name = source.get("name", "Unknown")
    source_url = source.get("url", "")
    default_type = source.get("race_type", "")

    today = date.today().isoformat()  # e.g. "2026-03-17"
    user_prompt = (
        f"Source: {source_name}\n"
        f"Source URL: {source_url}\n"
        f"Default race type hint: {default_type or 'not specified'}\n"
        f"TODAY'S DATE: {today} — skip any event with a date before this\n\n"
        f"Raw scraped content:\n{raw_text}"
    )

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    response_text = message.content[0].text.strip()

    # Strip markdown code fences if present
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        # Remove first and last fence lines
        response_text = "\n".join(lines[1:-1])

    try:
        races = json.loads(response_text)
        if not isinstance(races, list):
            return []
        return [r for r in races if isinstance(r, dict) and r.get("name") and r.get("date")]
    except json.JSONDecodeError:
        print(f"[normalizer] Failed to parse Claude response as JSON: {response_text[:200]}")
        return []
