"""
Upserts normalized race data into Supabase.
Deduplicates by (name + date).
Computes distance_from_woodstock for each race.
"""

import os
from datetime import datetime, timezone
from typing import Any

from supabase import create_client, Client
from geo_filter import distance_from_woodstock


def get_client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def upsert_races(
    races: list[dict[str, Any]],
    source: dict[str, Any],
) -> dict[str, int]:
    """
    Upsert races into the database.

    Args:
        races: List of normalized race dicts
        source: ScraperSource config dict (must have 'id' key)

    Returns:
        Dict with 'inserted', 'updated', 'skipped' counts
    """
    client = get_client()
    source_id = source.get("id")
    counts = {"inserted": 0, "updated": 0, "skipped": 0}

    for race in races:
        name = race.get("name", "").strip()
        date = race.get("date", "").strip()

        if not name or not date:
            counts["skipped"] += 1
            continue

        # Compute distance from Woodstock if coords available
        lat = race.get("lat")
        lng = race.get("lng")
        dist = None
        if lat is not None and lng is not None:
            try:
                dist = round(distance_from_woodstock(float(lat), float(lng)), 2)
            except (ValueError, TypeError):
                pass

        # Check if geo filter applies
        if source.get("geo_filter") and dist is not None and dist > 500:
            counts["skipped"] += 1
            continue

        # Build the race record
        record: dict[str, Any] = {
            "name": name,
            "date": date,
            "end_date": race.get("end_date"),
            "location_name": race.get("location_name"),
            "location_city": race.get("location_city"),
            "location_state": race.get("location_state"),
            "lat": lat,
            "lng": lng,
            "distance_miles_from_woodstock": dist,
            "race_type": race.get("race_type") or source.get("race_type"),
            "description": race.get("description"),
            "registration_url": race.get("registration_url"),
            "race_url": race.get("race_url"),
            "cost_min": race.get("cost_min"),
            "cost_max": race.get("cost_max"),
            "source_id": source_id,
            "is_active": True,
            "manually_added": False,
        }

        # Check for existing race by name + date
        existing = (
            client.table("races")
            .select("id")
            .eq("name", name)
            .eq("date", date)
            .execute()
        )

        if existing.data:
            # Update existing
            race_id = existing.data[0]["id"]
            client.table("races").update(record).eq("id", race_id).execute()
            counts["updated"] += 1
        else:
            # Insert new
            client.table("races").insert(record).execute()
            counts["inserted"] += 1

    return counts


def mark_source_run(source_id: str, error: str | None = None) -> None:
    """Update last_run_at (and optionally last_error) for a scraper source."""
    client = get_client()
    update_data: dict[str, Any] = {
        "last_run_at": datetime.now(timezone.utc).isoformat(),
    }
    if error is not None:
        update_data["last_error"] = error
    else:
        update_data["last_error"] = None

    client.table("scraper_sources").update(update_data).eq("id", source_id).execute()
