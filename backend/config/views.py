from datetime import timedelta

from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

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