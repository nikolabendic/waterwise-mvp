from rest_framework.response import Response
from rest_framework.views import APIView

from hydrology.views import error_response
from .models import Facility

VALID_CATEGORIES = {code for code, _ in Facility.CATEGORY_CHOICES}


def facility_to_dict(f):
    return {
        "id": f.id,
        "name": f.name,
        "category": f.category,
        "address": f.address,
        "latitude": f.latitude,
        "longitude": f.longitude,
        "location_accuracy": f.location_accuracy,
        "ownership": f.ownership,
        "group_id": f.group_id,
        "source_name": f.source_name,
        "data_type": f.data_type,
    }


class FacilityListView(APIView):
    def get(self, request):
        facilities = Facility.objects.all()
        category = request.query_params.get("category")
        if category:
            if category not in VALID_CATEGORIES:
                return error_response(
                    "INVALID_CATEGORY", "Unknown category.", 400,
                    {"category": category, "allowed": sorted(VALID_CATEGORIES)},
                )
            facilities = facilities.filter(category=category)
        results = [facility_to_dict(f) for f in facilities]
        return Response({"count": len(results), "results": results})