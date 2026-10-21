from django.contrib import admin
from .models import WaterEvent


@admin.register(WaterEvent)
class WaterEventAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "event_type", "status", "start_time")
    list_filter = ("status", "event_type")