from django.db import models


class WaterEvent(models.Model):
    STATUS_CHOICES = [
        ("planned", "planned"),
        ("ongoing", "ongoing"),
        ("completed", "completed"),
        ("cancelled", "cancelled"),
        ("unknown", "unknown"),
    ]

    id = models.CharField(max_length=30, primary_key=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=40)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="unknown")
    status_verified = models.BooleanField(default=False)

    address = models.CharField(max_length=200)
    municipality = models.CharField(max_length=100, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    location_accuracy = models.CharField(max_length=20, default="approximate")
    geocoding_method = models.CharField(max_length=40, blank=True)

    start_time = models.DateTimeField(null=True, blank=True)
    expected_end_time = models.DateTimeField(null=True, blank=True)
    actual_end_time = models.DateTimeField(null=True, blank=True)

    source_name = models.CharField(max_length=100, blank=True)
    source_url = models.URLField(max_length=500, null=True, blank=True)
    source_published_at = models.DateField(null=True, blank=True)
    data_type = models.CharField(max_length=20, default="reported")

    class Meta:
        ordering = ["-start_time"]

    def __str__(self):
        return f"{self.id} {self.title}"