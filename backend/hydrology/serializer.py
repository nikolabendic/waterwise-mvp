from rest_framework import serializers
from .models import Station

class StationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Station
        fields = [
    'id', 'name', 'river', 'latitude', 'longitude',
    'source_name', 'source_url', 'coordinates_verified',
    'available_parameters',
]