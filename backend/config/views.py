from datetime import timedelta

from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse

from events.models import WaterEvent
from hydrology.models import Observation, Station
from pathlib import Path
from django.conf import settings
from collections import Counter
from zoneinfo import ZoneInfo
from .weather import get_weather

from facilities.models import Facility

# Vreme preuzimanja OSM snimka (iz fajla). Menja se kad se ponovo preuzme.
FACILITIES_SNAPSHOT = "2026-10-21T13:07:25Z"

OUTDATED_AFTER = timedelta(days=3)  # TODO: dogovoriti
BELGRADE = ZoneInfo("Europe/Belgrade")


def iso(value):
    return value.isoformat() if value else None

class DashboardSummaryView(APIView):
    def get(self, request):
        # Hidrologija: zadnje mjerenje + promjena u odnosu na ~24 h ranije
        last = (Observation.objects
                .filter(station_id="RHMZ-NS", water_level_cm__isnull=False)
                .order_by("-timestamp").first())
        hydrology = {
            "station_id": "RHMZ-NS",
            "water_level_cm": None,
            "water_level_change_24h_cm": None,
            "measurement_time": None,
            "data_type": "observed",
            "availability": "unavailable",
        }
        if last:
            prev = (Observation.objects
                    .filter(station_id="RHMZ-NS", water_level_cm__isnull=False,
                            timestamp__lte=last.timestamp - timedelta(hours=24),
                            timestamp__gte=last.timestamp - timedelta(hours=36))
                    .order_by("-timestamp").first())
            hydrology.update({
                "water_level_cm": last.water_level_cm,
                "water_level_change_24h_cm": (last.water_level_cm - prev.water_level_cm) if prev else None,
                "measurement_time": last.timestamp.astimezone(BELGRADE).isoformat(timespec="seconds"),
                "availability": "outdated" if timezone.now() - last.timestamp > OUTDATED_AFTER else "available",
            })

        w = get_weather()
        weather = {
            "air_temperature_c": w["air_temperature_c"] if w else None,
            "precipitation_7d_mm": w["precipitation_7d_mm"] if w else None,
            "source_name": "Open-Meteo (weather model data)" if w else None,
            "data_type": "estimated" if w else None,
            "availability": "available" if w else "unavailable",
            "measurement_time": w["measurement_time"] if w else None,
        }

        # Događaji po statusu
        counts = Counter(WaterEvent.objects.values_list("status", flat=True))
        events = {
            "total": sum(counts.values()),
            "planned": counts.get("planned", 0),
            "ongoing": counts.get("ongoing", 0),
            "completed": counts.get("completed", 0),
            "cancelled": counts.get("cancelled", 0),
            "unknown": counts.get("unknown", 0),
        }

        # Status izvora: isti izvori kao u /data-sources/, plus AI prognoza (sintetička)
        sources = DataSourcesView().get(request).data["sources"]
        sources.append({"id": "ai_forecast", "data_type": "synthetic", "availability": "available"})
        live = [s for s in sources if s["availability"] != "unavailable"]
        kinds = Counter(s["data_type"] for s in live)
        if not kinds:
            mode = "unavailable"
        elif len(kinds) == 1:
            mode = next(iter(kinds))
        else:
            mode = "mixed"

        return Response({
            "city": "Novi Sad",
            "hydrology": hydrology,
            "weather": weather,
            "events": events,
            "environmental_outlook": {"status": "not_assessed", "methodology_available": False},
            "data_status": {
                "overall_mode": mode,
                "observed_sources": kinds.get("observed", 0),
                "reported_sources": kinds.get("reported", 0),
                "estimated_sources": kinds.get("estimated", 0),
                "synthetic_sources": kinds.get("synthetic", 0),
                "unavailable_sources": len(sources) - len(live),
            },
            "generated_at": timezone.now().astimezone(BELGRADE).isoformat(timespec="seconds"),
        })

class DataSourcesView(APIView):
    def get(self, request):
        sources = []

        # Hidrologija
        station = Station.objects.filter(id="RHMZ-NS").first()
        last_obs = Observation.objects.order_by("-timestamp").first()
        if last_obs is None:
            availability = "unavailable"
        elif timezone.now() - last_obs.timestamp > OUTDATED_AFTER:
            availability = "outdated"
        else:
            availability = "available"
        sources.append({
            "id": "hydrology",
            "name": "Hydrological measurements",
            "provider": "RHMZ",
            "source_url": station.source_url if station else None,
            "data_type": "observed",
            "availability": availability,
            "last_updated": iso(last_obs.timestamp) if last_obs else None,
            "update_method": "automatic",
        })

        # Događaji
        last_event = (
            WaterEvent.objects.exclude(source_published_at=None)
            .order_by("-source_published_at")
            .first()
        )
        sources.append({
            "id": "events",
            "name": "Water supply disruption notices",
            "provider": "JKP Vodovod i kanalizacija Novi Sad",
            "source_url": "https://www.vikns.rs/najava-radova-sr/",
            "data_type": "reported",
            "availability": "available" if WaterEvent.objects.exists() else "unavailable",
            "last_updated": iso(last_event.source_published_at) if last_event else None,
            "update_method": "manual",
        })

                # Ustanove (OpenStreetMap)
        sources.append({
            "id": "facilities",
            "name": "Critical facilities",
            "provider": "OpenStreetMap contributors (ODbL)",
            "source_url": "https://www.openstreetmap.org/copyright",
            "data_type": "reported",
            "availability": "available" if Facility.objects.exists() else "unavailable",
            "last_updated": FACILITIES_SNAPSHOT,
            "update_method": "manual",
            "limitations": [
                "Volunteer-edited map data; coverage is incomplete.",
                "Points are building centres, not entrances.",
                "Private health facilities are excluded by project rule.",
                "Entries outside the city (e.g. Beocin, Sremski Karlovci) are not filtered out.",
            ],
        })

        # Populacija (WorldPop)
        pop_available = Path(settings.POPULATION_CELLS_FILE).is_file()
        sources.append({
            "id": "population",
            "name": "Population grid",
            "provider": "WorldPop, University of Southampton",
            "source_url": "https://hub.worldpop.org/geodata/summary?id=75323",
            "data_type": "estimated",
            "availability": "available" if pop_available else "unavailable",
            "last_updated": "2025-09-01",
            "update_method": "manual",
            "limitations": [
                "Modelled estimate for 2021 (R2025A v1, alpha version), not a census count.",
                "100 m grid cells; a cell is counted fully if its centre is inside the zone.",
                "License CC BY 4.0, DOI 10.5258/SOTON/WP00839.",
            ],
        })

                # Vrieme (Open-Meteo)
        weather_ok = get_weather() is not None
        sources.append({
            "id": "weather",
            "name": "Weather data",
            "provider": "Open-Meteo (CC BY 4.0)",
            "source_url": "https://open-meteo.com/",
            "data_type": "estimated" if weather_ok else None,
            "availability": "available" if weather_ok else "unavailable",
            "last_updated": None,
            "update_method": "automatic",
            "limitations": [
                "Model-based data for the city centre, not a measurement at a weather station.",
                "Cached for 30 minutes.",
            ],
        })

        return Response({"sources": sources})

ROUTES = [
    ("Hidrologija", [
        ("/api/v1/hydrology/stations/", "Lista stanica"),
        ("/api/v1/hydrology/latest/?station_id=RHMZ-NS", "Zadnje merenje, nivo, temperatura, protok"),
        ("/api/v1/hydrology/history/?station_id=RHMZ-NS&period=7d", "Istorija (24h, 7d, 30d)"),
    ]),
    ("Događaji", [
        ("/api/v1/events/", "Lista događaja (filteri: status, event_type, search, date_from, date_to, limit, offset)"),
        ("/api/v1/events/?status=planned", "Primer: samo planirani"),
    ]),
    ("Objekti", [
        ("/api/v1/facilities/", "Kritični objekti (OSM)"),
        ("/api/v1/facilities/?category=hospital", "Primer: samo bolnice"),
    ]),
    ("AI prognoza i scenariji (sintetički podaci)", [
        ("/api/v1/water-demand/forecast/", "Prognoza za 7 dana"),
        ("/api/v1/water-balance/scenarios/", "Definicije 4 scenarija"),
        ("/api/v1/water-balance/?scenario=normal&period=7d", "Bilans: normal"),
        ("/api/v1/water-balance/?scenario=peak&period=7d", "Bilans: peak"),
        ("/api/v1/water-balance/?scenario=reduced&period=7d", "Bilans: reduced"),
        ("/api/v1/water-balance/?scenario=combined&period=7d", "Bilans: combined"),
        ("/api/v1/water-balance/compare/", "Poređenje rezerve za sva 4 scenarija"),
        ("/api/v1/health/", "Provera da je prognoza dostupna"),
    ]),
    ("Izvori podataka", [
        ("/api/v1/data-sources/", "Dostupnost i ograničenja svakog izvora"),
        ("/api/v1/dashboard/summary/", "Sažetak za Dashboard"),
    ]),
]


def api_index(request):
    html = ["<!doctype html><html><head><meta charset='utf-8'>",
            "<title>WaterWise API</title>",
            "<style>body{font-family:system-ui,sans-serif;max-width:860px;margin:32px auto;padding:0 16px;color:#0f172a}",
            "h1{margin-bottom:4px}h2{margin-top:28px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}",
            "li{margin:8px 0}a{color:#0369a1;font-family:ui-monospace,monospace}span{color:#475569}</style></head><body>",
            "<h1>WaterWise API v1</h1><p>Klikni na rutu da vidiš JSON odgovor.</p>"]
    for title, items in ROUTES:
        html.append(f"<h2>{title}</h2><ul>")
        for url, desc in items:
            html.append(f"<li><a href='{url}'>{url}</a><br><span>{desc}</span></li>")
        html.append("</ul>")
    html.append(
        "<h2>Izloženost (POST, ne otvara se klikom)</h2><ul><li>"
        "<code>POST /api/v1/exposure/analyze/</code><br>"
        "<span>Zona analize, procena stanovništva (WorldPop 2021) i objekti u krugu</span>"
        "<pre>{\"event_id\": \"EVT-001\", \"radius_m\": 500}</pre></li></ul>"
    )
    html.append("</body></html>")
    return HttpResponse("".join(html))