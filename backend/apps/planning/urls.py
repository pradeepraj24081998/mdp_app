from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaterialPlanViewSet

router = DefaultRouter()
router.register(r'planning', MaterialPlanViewSet, basename='planning')

urlpatterns = [
    path('', include(router.urls)),
]
