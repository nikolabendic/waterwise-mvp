from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import HistoryView, StationViewSet, LatestView

router = DefaultRouter()
router.register('hydrology/stations', StationViewSet)

urlpatterns = [
    path('hydrology/history/', HistoryView.as_view()),
    path('hydrology/latest/', LatestView.as_view()),
] + router.urls