"""Current weather from Open-Meteo (model data), cached so we don't call the API on every request."""
import requests
from django.core.cache import cache

URL = "https://api.open-meteo.com/v1/forecast"
PARAMS = {
    "latitude": 45.2671,
    "longitude": 19.8335,
    "current": "temperature_2m",
    "daily": "precipitation_sum",
    "past_days": 7,
    "forecast_days": 1,
    "timezone": "Europe/Belgrade",
}
CACHE_KEY = "weather_novi_sad"
CACHE_SECONDS = 30 * 60


def get_weather():
    """Returns a dict with temperature and 7-day precipitation, or None if the source is unreachable."""
    cached = cache.get(CACHE_KEY)
    if cached is not None:
        return cached
    try:
        r = requests.get(URL, params=PARAMS, timeout=5)
        r.raise_for_status()
        data = r.json()
        past = data["daily"]["precipitation_sum"][:7]  # the 7 full days before today
        result = {
            "air_temperature_c": data["current"]["temperature_2m"],
            "precipitation_7d_mm": round(sum(v for v in past if v is not None), 1),
            "measurement_time": data["current"]["time"],
        }
    except (requests.RequestException, KeyError, ValueError, TypeError):
        return None
    cache.set(CACHE_KEY, result, CACHE_SECONDS)
    return result