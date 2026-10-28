"""Population within a radius, from WorldPop 2021 grid cells (100 m)."""
import csv
import math
from functools import lru_cache
from pathlib import Path

from django.conf import settings

EARTH_RADIUS_M = 6371000.0

# Area covered by the clipped raster (Novi Sad and surroundings).
COVERAGE = {"lon_min": 19.50, "lon_max": 20.20, "lat_min": 45.10, "lat_max": 45.45}


@lru_cache(maxsize=1)
def load_cells():
    """Read the cells once per process: list of (lon, lat, people)."""
    path = Path(settings.POPULATION_CELLS_FILE)
    cells = []
    with open(path, "rt", encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            cells.append((float(row["lon"]), float(row["lat"]), float(row["pop"])))
    return cells


def in_coverage(lat, lon):
    c = COVERAGE
    return c["lat_min"] <= lat <= c["lat_max"] and c["lon_min"] <= lon <= c["lon_max"]


def distance_m(lat1, lon1, lat2, lon2):
    """Haversine distance in metres."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = p2 - p1
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def population_within(lat, lon, radius_m):
    """Sum of people in cells whose centre lies within radius_m of (lat, lon)."""
    dlat = math.degrees(radius_m / EARTH_RADIUS_M)
    dlon = dlat / math.cos(math.radians(lat))
    total = 0.0
    for clon, clat, pop in load_cells():
        if abs(clat - lat) > dlat or abs(clon - lon) > dlon:
            continue  # cheap bounding-box pre-filter
        if distance_m(lat, lon, clat, clon) <= radius_m:
            total += pop
    return total

def circle_polygon(lat, lon, radius_m, points=64):
    """GeoJSON Polygon approximating a geodesic circle (coordinates are [lon, lat])."""
    lat1, lon1 = math.radians(lat), math.radians(lon)
    ang = radius_m / EARTH_RADIUS_M
    ring = []
    for i in range(points):
        brg = 2 * math.pi * i / points
        lat2 = math.asin(math.sin(lat1) * math.cos(ang) + math.cos(lat1) * math.sin(ang) * math.cos(brg))
        lon2 = lon1 + math.atan2(math.sin(brg) * math.sin(ang) * math.cos(lat1),
                                 math.cos(ang) - math.sin(lat1) * math.sin(lat2))
        ring.append([round(math.degrees(lon2), 6), round(math.degrees(lat2), 6)])
    ring.append(ring[0])  # a GeoJSON ring must be closed
    return {"type": "Polygon", "coordinates": [ring]}