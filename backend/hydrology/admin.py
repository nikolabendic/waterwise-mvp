from django.contrib import admin
from .models import Station, Observation


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "river", "coordinates_verified")


@admin.register(Observation)
class ObservationAdmin(admin.ModelAdmin):
    list_display = ("station", "timestamp", "water_level_cm", "water_temperature_c", "flow_m3_s")
    list_filter = ("station",)
    date_hierarchy = "timestamp"