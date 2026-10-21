from django.urls import path

from .views import EventDetailView, EventListView

urlpatterns = [
    path("events/", EventListView.as_view()),
    path("events/<str:event_id>/", EventDetailView.as_view()),
]