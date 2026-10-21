from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.db.models import Q
from django.utils.dateparse import parse_date
from rest_framework.response import Response
from rest_framework.views import APIView

from hydrology.views import error_response  # kasnije se moze prebaciti u zajednicki modul
from .models import WaterEvent

LOCAL_TZ = ZoneInfo("Europe/Belgrade")
DEFAULT_LIMIT = 20
MAX_LIMIT = 100
VALID_STATUSES = {code for code, _ in WaterEvent.STATUS_CHOICES}


def iso_local(value):
    return value.astimezone(LOCAL_TZ).isoformat() if value else None


def parse_day(value):
    try:
        return parse_date(value)
    except ValueError:
        return None


def event_to_dict(event, detail=False):
    data = {
        "id": event.id,
        "title": event.title,
        "event_type": event.event_type,
        "status": event.status,
        "location": {
            "address": event.address,
            "municipality": event.municipality,
            "latitude": event.latitude,
            "longitude": event.longitude,
            "location_accuracy": event.location_accuracy,
        },
        "start_time": iso_local(event.start_time),
        "expected_end_time": iso_local(event.expected_end_time),
        "actual_end_time": iso_local(event.actual_end_time),
        "source": {
            "name": event.source_name,
            "url": event.source_url,
            "published_at": (
                event.source_published_at.isoformat()
                if event.source_published_at
                else None
            ),
        },
        "data_type": event.data_type,
    }
    if detail:
        data["description"] = event.description
        data["status_verified"] = event.status_verified
        data["location"]["geocoding_method"] = event.geocoding_method
    return data


class EventListView(APIView):
    def get(self, request):
        params = request.query_params
        events = WaterEvent.objects.all()

        status = params.get("status")
        if status:
            if status not in VALID_STATUSES:
                return error_response(
                    "INVALID_STATUS",
                    "Unknown status value.",
                    400,
                    {"status": status, "allowed": sorted(VALID_STATUSES)},
                )
            events = events.filter(status=status)

        event_type = params.get("event_type")
        if event_type:
            events = events.filter(event_type=event_type)

        search = params.get("search")
        if search:
            events = events.filter(
                Q(title__icontains=search)
                | Q(address__icontains=search)
                | Q(municipality__icontains=search)
            )

        date_from = params.get("date_from")
        if date_from:
            day = parse_day(date_from)
            if day is None:
                return error_response(
                    "INVALID_DATE", "date_from must be YYYY-MM-DD.", 400,
                    {"date_from": date_from},
                )
            events = events.filter(
                start_time__gte=datetime.combine(day, time.min, tzinfo=LOCAL_TZ)
            )

        date_to = params.get("date_to")
        if date_to:
            day = parse_day(date_to)
            if day is None:
                return error_response(
                    "INVALID_DATE", "date_to must be YYYY-MM-DD.", 400,
                    {"date_to": date_to},
                )
            events = events.filter(
                start_time__lt=datetime.combine(
                    day + timedelta(days=1), time.min, tzinfo=LOCAL_TZ
                )
            )

        try:
            limit = int(params.get("limit", DEFAULT_LIMIT))
            offset = int(params.get("offset", 0))
        except ValueError:
            return error_response(
                "INVALID_PAGINATION", "limit and offset must be integers.", 400
            )
        if limit < 1 or limit > MAX_LIMIT or offset < 0:
            return error_response(
                "INVALID_PAGINATION",
                "limit must be 1-100 and offset must be 0 or more.",
                400,
                {"limit": limit, "offset": offset, "max_limit": MAX_LIMIT},
            )

        count = events.count()
        page = events[offset : offset + limit]
        return Response(
            {
                "count": count,
                "limit": limit,
                "offset": offset,
                "results": [event_to_dict(e) for e in page],
            }
        )


class EventDetailView(APIView):
    def get(self, request, event_id):
        try:
            event = WaterEvent.objects.get(id=event_id)
        except WaterEvent.DoesNotExist:
            return error_response(
                "EVENT_NOT_FOUND", "Event not found.", 404, {"event_id": event_id}
            )
        return Response(event_to_dict(event, detail=True))