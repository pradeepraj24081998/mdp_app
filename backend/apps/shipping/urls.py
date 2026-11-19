from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .serializers import ShipmentViewSet

router = DefaultRouter()
router.register(r'shipments', ShipmentViewSet, basename='shipment')

urlpatterns = [
    path('', include(router.urls)),
]
