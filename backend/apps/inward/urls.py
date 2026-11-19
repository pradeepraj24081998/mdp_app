from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InwardReceiptViewSet, DamagedMaterialReturnViewSet

router = DefaultRouter()
router.register(r'inwards', InwardReceiptViewSet, basename='inward')
router.register(r'damaged-returns', DamagedMaterialReturnViewSet, basename='damaged-return')

urlpatterns = [
    path('', include(router.urls)),
]
