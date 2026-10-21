from django.db import models


class Facility(models.Model):
    CATEGORY_CHOICES = [
        ("hospital", "hospital"),
        ("health_center", "health_center"),
        ("school", "school"),
        ("kindergarten", "kindergarten"),
        ("social_care", "social_care"),
    ]
    OWNERSHIP_CHOICES = [
        ("public", "public"),
        ("private", "private"),
        ("unknown", "unknown"),
    ]

    id = models.CharField(max_length=60, primary_key=True)
    osm_id = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=200, null=True, blank=True)
    name_original = models.CharField(max_length=200, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    address = models.CharField(max_length=200, blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    location_accuracy = models.CharField(max_length=20, default="approximate")
    ownership = models.CharField(max_length=10, choices=OWNERSHIP_CHOICES, default="unknown")
    group_id = models.CharField(max_length=20, null=True, blank=True)
    source_name = models.CharField(max_length=100, default="OpenStreetMap contributors")
    data_type = models.CharField(max_length=20, default="reported")

    class Meta:
        ordering = ["category", "name"]

    def __str__(self):
        return f"{self.id} {self.name or '(bez imena)'}"