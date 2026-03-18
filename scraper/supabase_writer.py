"""
Upserts normalized race data into Supabase.
Deduplicates by (normalized_name + date) to handle slight name variations
like "OMAR" vs "OMAR Adventure Race".
Computes distance_from_woodstock for each race.
"""

import os
import re
from datetime import datetime, timezone
from typing import Any

from supabase import create_client, Client
from geo_filter import distance_from_woodstock


def get_client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def normalize_name(name: str) -> str:
    """
    Normalize a race name for fuzzy deduplication.
    Lowercases, strips common suffixes, and removes extra whitespace.
    e.g. "OMAR Adventure Race 2026" -> "omar"
         "OMAR" -> "omar"
    """
    name = name.lower().strip()
    # Remove year (4-digit numbers)
    name = re.sub(r"\b\d{4}\b", "", name)
    # Remove common generic suffixes
    suffixes = [
        "adventure race", "adventure run", "trail race", "trail run",
        "ultra marathon", "ultramarathon", "marathon", "half marathon",
        "obstacle course race", "obstacle race", "mud run",
        "endurance race", "endurance run", "race", "run", "event",
    ]
    for suffix in suffixes:
        name = re.sub(rf"\b{re.escape(suffix)}\b", "", name)
    # Collapse whitespace
    name = re.sub(r"\s+", " ", name).strip()
    return name


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

    # Fetch all existing races for this date range to enable fuzzy matching
    existing_races_result = client.table("races").select("id, name, date").execute()
    existing_races = existing_races_result.data or []

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

        # Fuzzy deduplicate: match on same date + normalized name prefix
        norm_new = normalize_name(name)
        matched_id = None
        for existing in existing_races:
            if existing["date"] != date:
                continue
            norm_existing = normalize_name(existing["name"])
            # Match if either normalized name starts with the other
            if norm_new and norm_existing and (
                norm_existing.startswith(norm_new)
                or norm_new.startswith(norm_existing)
                or norm_new == norm_existing
            ):
                matched_id = existing["id"]
                break

        if matched_id:
            client.table("races").update(record).eq("id", matched_id).execute()
            counts["updated"] += 1
        else:
            result = client.table("races").insert(record).execute()
            if result.data:
                existing_races.append({"id": result.data[0]["id"], "name": name, "date": date})
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
