from django.db import models

# Create your models here.

class Station(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100)
    river = models.CharField(max_length=100)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    source_name = models.CharField(max_length=100, blank=True)
    source_url = models.URLField(blank=True, null=True)
    coordinates_verified = models.BooleanField(default=False)
    available_parameters = models.JSONField(blank=True, default=list)

    def __str__(self):
        return self.name

class Observation(models.Model):
    station = models.ForeignKey(
        Station, on_delete=models.CASCADE, related_name="observations"
    )
    timestamp = models.DateTimeField()
    water_level_cm = models.IntegerField(null=True, blank=True)
    water_temperature_c = models.FloatField(null=True, blank=True)
    flow_m3_s = models.FloatField(null=True, blank=True)
    data_type = models.CharField(max_length=20, default="observed")

    class Meta:
        ordering = ["timestamp"]
        constraints = [
            models.UniqueConstraint(
                fields=["station", "timestamp"], name="unique_station_timestamp"
            )
        ]

    def __str__(self):
        return f"{self.station_id} {self.timestamp:%Y-%m-%d}"