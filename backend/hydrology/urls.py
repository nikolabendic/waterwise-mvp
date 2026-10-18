from rest_framework.routers import DefaultRouter
from .views import StationViewSet

router = DefaultRouter()
router.register('hydrology/stations', StationViewSet)

urlpatterns = router.urls