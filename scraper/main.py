"""
CFG Outdoor Events — Race Scraper Orchestrator

Fetches active scraper sources from Supabase, runs each through the
appropriate scraper (static or playwright), normalizes results with Claude,
and upserts to the races table.
"""

import os
import sys
import traceback
from typing import Any

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Validate required env vars
REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY"]
missing = [k for k in REQUIRED_ENV if not os.environ.get(k)]
if missing:
    print(f"[main] Missing required environment variables: {', '.join(missing)}")
    sys.exit(1)

import static_scraper
import playwright_scraper
from normalizer import normalize_races
from supabase_writer import upsert_races, mark_source_run


def get_active_sources() -> list[dict[str, Any]]:
    """Fetch active scraper sources from Supabase."""
    client = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )
    result = client.table("scraper_sources").select("*").eq("active", True).execute()
    return result.data or []


def run_source(source: dict[str, Any]) -> None:
    """Run the scraper pipeline for a single source."""
    source_id = source.get("id", "unknown")
    source_name = source.get("name", "unknown")
    render_method = source.get("render_method", "static")

    print(f"[{source_name}] Starting scrape (method={render_method})")

    try:
        # Step 1: Scrape
        if render_method == "playwright":
            raw_items = playwright_scraper.scrape(source)
        else:
            raw_items = static_scraper.scrape(source)

        print(f"[{source_name}] Scraped {len(raw_items)} raw items")

        if not raw_items:
            mark_source_run(source_id, error=None)
            print(f"[{source_name}] No items scraped — source may have changed")
            return

        # Step 2: Normalize with Claude
        races = normalize_races(raw_items, source)
        print(f"[{source_name}] Normalized to {len(races)} races")

        if not races:
            mark_source_run(source_id, error="No races extracted by normalizer")
            return

        # Step 3: Upsert to Supabase
        counts = upsert_races(races, source)
        print(
            f"[{source_name}] Upserted: "
            f"{counts['inserted']} inserted, "
            f"{counts['updated']} updated, "
            f"{counts['skipped']} skipped"
        )

        mark_source_run(source_id, error=None)

    except Exception as e:
        error_msg = f"{type(e).__name__}: {e}"
        print(f"[{source_name}] ERROR: {error_msg}")
        traceback.print_exc()
        try:
            mark_source_run(source_id, error=error_msg)
        except Exception:
            pass


def main() -> None:
    print("[main] CFG Outdoor Events Scraper starting...")

    # Check if a specific source_id was passed (for manual runs)
    specific_source_id = os.environ.get("SOURCE_ID")

    sources = get_active_sources()
    print(f"[main] Found {len(sources)} active sources")

    if not sources:
        print("[main] No active sources found. Exiting.")
        return

    for source in sources:
        if specific_source_id and source.get("id") != specific_source_id:
            continue
        run_source(source)

    print("[main] Scrape run complete.")


if __name__ == "__main__":
    main()
