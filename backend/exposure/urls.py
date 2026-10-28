from django.urls import path
from .views import AnalyzeView

urlpatterns = [
    path('exposure/analyze/', AnalyzeView.as_view()),
]