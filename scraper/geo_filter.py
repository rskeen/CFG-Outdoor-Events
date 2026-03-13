"""
Geo filtering utilities for CFG race scraper.
Reference point: Woodstock, GA (34.1015, -84.5194)
"""

import math

WOODSTOCK_LAT = 34.1015
WOODSTOCK_LNG = -84.5194
EARTH_RADIUS_MILES = 3958.8


def haversine_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate the great-circle distance in miles between two points
    using the haversine formula.
    """
    lat1_r = math.radians(lat1)
    lat2_r = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    return EARTH_RADIUS_MILES * c


def distance_from_woodstock(lat: float, lng: float) -> float:
    """Return distance in miles from Woodstock, GA."""
    return haversine_miles(WOODSTOCK_LAT, WOODSTOCK_LNG, lat, lng)


def is_within_range(lat: float, lng: float, max_miles: float = 500) -> bool:
    """Return True if the coordinates are within max_miles of Woodstock, GA."""
    return distance_from_woodstock(lat, lng) <= max_miles


if __name__ == "__main__":
    # Quick test
    print(f"Atlanta to Woodstock: {distance_from_woodstock(33.749, -84.388):.1f} mi")
    print(f"Nashville to Woodstock: {distance_from_woodstock(36.162, -86.781):.1f} mi")
    print(f"Miami to Woodstock: {distance_from_woodstock(25.775, -80.209):.1f} mi")
