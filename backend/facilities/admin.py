from django.contrib import admin
from .models import Facility


@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "ownership", "group_id")
    list_filter = ("category", "ownership", "group_id")
    search_fields = ("name", "address")