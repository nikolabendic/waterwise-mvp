from datetime import datetime
from zoneinfo import ZoneInfo

from rest_framework.response import Response
from rest_framework.views import APIView

from events.models import WaterEvent
from facilities.models import Facility
from hydrology.views import error_response
from . import services

DEFAULT_CATEGORIES = ["school", "kindergarten", "hospital", "health_center", "social_care"]
MIN_RADIUS_M, MAX_RADIUS_M = 50, 2000


class AnalyzeView(APIView):
    def post(self, request):
        event_id = request.data.get("event_id")
        radius = request.data.get("radius_m")

        if not isinstance(event_id, str) or not event_id:
            return error_response("invalid_request", "event_id is required.", 400)
        if (isinstance(radius, bool) or not isinstance(radius, (int, float))
                or not MIN_RADIUS_M <= radius <= MAX_RADIUS_M):
            return error_response("invalid_radius", "radius_m is out of range.", 400,
                                  {"min": MIN_RADIUS_M, "max": MAX_RADIUS_M})

        event = WaterEvent.objects.filter(pk=event_id).first()
        if event is None:
            return error_response("event_not_found", "Unknown event_id.", 404)
        if event.latitude is None or event.longitude is None:
            return error_response("event_without_coordinates",
                                  "This event has no coordinates, so it cannot be analysed.", 422)

        lat, lon = float(event.latitude), float(event.longitude)

        # Population
        if services.in_coverage(lat, lon):
            total = round(services.population_within(lat, lon, radius), -1)  # nearest 10
            total, reason = int(total), None
        else:
            total, reason = None, "Event is outside the area covered by the population grid."

        # Facilities
        items = []
        by_category = {c: 0 for c in DEFAULT_CATEGORIES}
        for f in Facility.objects.exclude(latitude__isnull=True).exclude(longitude__isnull=True):
            d = services.distance_m(lat, lon, float(f.latitude), float(f.longitude))
            if d <= radius:
                items.append({
                    "id": f.id, "name": f.name, "category": f.category,
                    "distance_m": round(d), "inside_zone": True,
                    "latitude": float(f.latitude), "longitude": float(f.longitude),
                })
                by_category[f.category] = by_category.get(f.category, 0) + 1
        items.sort(key=lambda i: i["distance_m"])

        return Response({
            "analysis_id": f"EXP-{event.id}-{int(radius)}",
            "event_id": event.id,
            "radius_m": radius,
            "center": {"latitude": lat, "longitude": lon,
                       "location_accuracy": event.location_accuracy},
            "population": {
                "estimated_total": total,
                "unit": "persons",
                "method": "cell_centroid_sum",
                "grid_resolution_m": 100,
                "data_type": "estimated",
                "is_synthetic": False,
                "reason_unavailable": reason,
                "source": {
                    "name": "WorldPop, Constrained estimates 2021 (R2025A v1, alpha)",
                    "doi": "10.5258/SOTON/WP00839",
                    "license": "CC BY 4.0",
                },
            },
            "facilities": {
                "total_in_zone": len(items),
                "by_category": by_category,
                "items": items,
                "source": "OpenStreetMap contributors (ODbL)",
            },
            "analysis_zone": {
                "type": "Feature",
                "properties": {"radius_m": radius},
                "geometry": services.circle_polygon(lat, lon, radius),
            },
            "methodology": {
                "population_method": "cell_centroid_sum",
                "facility_method": "distance_to_centre_within_radius",
                "distance_method": "haversine",
                "limitations": [
                    "The buffer is not a confirmed water outage zone.",
                    "Population is a modelled estimate (alpha dataset), not a census count.",
                    "A 100 m grid cell is counted fully if its centre lies inside the buffer.",
                    "Estimate is rounded to the nearest 10 persons.",
                ],
            },
            "generated_at": datetime.now(ZoneInfo("Europe/Belgrade")).isoformat(timespec="seconds"),
        })