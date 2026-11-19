from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductionOrderViewSet, MaterialDispatchViewSet, FinishedGoodsReceiptViewSet

router = DefaultRouter()
router.register(r'orders', ProductionOrderViewSet, basename='production-order')
router.register(r'dispatches', MaterialDispatchViewSet, basename='production-dispatch')
router.register(r'finished-goods', FinishedGoodsReceiptViewSet, basename='production-finished-good')

urlpatterns = [
    path('', include(router.urls)),
]
