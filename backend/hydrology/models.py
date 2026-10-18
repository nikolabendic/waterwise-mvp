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