from django.urls import path
from .views import health, forecast, scenarios, water_balance, compare

urlpatterns = [
    path('health/', health),
    path('water-demand/forecast/', forecast),
    path('water-balance/scenarios/', scenarios),
    path('water-balance/compare/', compare),
    path('water-balance/', water_balance),
]