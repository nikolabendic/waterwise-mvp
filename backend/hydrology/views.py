from rest_framework import viewsets
from .models import Station
from .serializer import StationSerializer

# Create your views here.

class StationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Station.objects.all()
    serializer_class = StationSerializer

from datetime import timedelta

from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Station  # vec postoji

PERIODS = {
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
}


def error_response(code, message, status, details=None):
    return Response(
        {"error": {"code": code, "message": message, "details": details or {}}},
        status=status,
    )


class HistoryView(APIView):
    def get(self, request):
        station_id = request.query_params.get("station_id")
        period = request.query_params.get("period", "7d")

        if not station_id:
            return error_response(
                "MISSING_STATION_ID", "Query parameter station_id is required.", 400
            )
        if period not in PERIODS:
            return error_response(
                "INVALID_PERIOD",
                "Period must be one of: 24h, 7d, 30d.",
                400,
                {"period": period, "allowed": list(PERIODS)},
            )

        try:
            station = Station.objects.get(id=station_id)
        except Station.DoesNotExist:
            return error_response(
                "STATION_NOT_FOUND", "Station not found.", 404, {"station_id": station_id}
            )

        observations = station.observations.filter(water_level_cm__isnull=False)
        latest = observations.last()

        data = []
        if latest:
            start = latest.timestamp - PERIODS[period]
            data = [
                {
                    "timestamp": o.timestamp.isoformat(),
                    "water_level_cm": o.water_level_cm,
                }
                for o in observations.filter(timestamp__gte=start)
            ]

        levels = [d["water_level_cm"] for d in data]
        summary = {
            "minimum_cm": min(levels) if levels else None,
            "maximum_cm": max(levels) if levels else None,
            "first_cm": levels[0] if levels else None,
            "last_cm": levels[-1] if levels else None,
            "net_change_cm": levels[-1] - levels[0] if levels else None,
        }

        return Response(
            {
                "station_id": station.id,
                "period": period,
                "unit": "cm",
                "resolution": "daily",
                "data": data,
                "summary": summary,
                "source": {
                    "name": station.source_name,
                    "url": station.source_url,
                    "data_type": "observed",
                },
            }
        )