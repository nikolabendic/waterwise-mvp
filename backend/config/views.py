from datetime import timedelta

from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse

from events.models import WaterEvent
from hydrology.models import Observation, Station

from facilities.models import Facility

# Vreme preuzimanja OSM snimka (iz fajla). Menja se kad se ponovo preuzme.
FACILITIES_SNAPSHOT = "2026-10-21T13:07:25Z"

OUTDATED_AFTER = timedelta(days=3)  # TODO: dogovoriti


def iso(value):
    return value.isoformat() if value else None


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

        # Izvori koje jos nemamo. Kad ih dodamo, ovde se menjaju.
        for source_id, name in [
            ("population", "Population grid"),
            ("weather", "Weather data"),
        ]:
            sources.append({
                "id": source_id,
                "name": name,
                "provider": "To be confirmed",
                "source_url": None,
                "data_type": None,
                "availability": "unavailable",
                "last_updated": None,
                "update_method": None,
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
    html.append("</body></html>")
    return HttpResponse("".join(html))