from rest_framework.routers import DefaultRouter
from .views import StationViewSet

router = DefaultRouter()
router.register('stations', StationViewSet)

urlpatterns = router.urls