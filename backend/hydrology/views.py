from rest_framework import viewsets
from .models import Station
from .serializer import StationSerializer

# Create your views here.

class StationViewSet(viewsets.ModelViewSet):
    queryset = Station.objects.all()
    serializer_class = StationSerializer