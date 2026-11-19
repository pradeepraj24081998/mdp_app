from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StockBalanceViewSet, StockTransactionViewSet,
    OpeningStockViewSet, StockAdjustmentViewSet, StockTransferViewSet
)

router = DefaultRouter()
router.register(r'balances', StockBalanceViewSet, basename='stock-balance')
router.register(r'transactions', StockTransactionViewSet, basename='stock-transaction')
router.register(r'opening-stock', OpeningStockViewSet, basename='opening-stock')
router.register(r'adjustments', StockAdjustmentViewSet, basename='stock-adjustment')
router.register(r'transfers', StockTransferViewSet, basename='stock-transfer')

urlpatterns = [
    path('', include(router.urls)),
]
