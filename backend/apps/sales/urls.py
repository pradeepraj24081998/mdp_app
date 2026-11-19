from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalesOrderViewSet, InvoiceViewSet, SalesReturnViewSet

router = DefaultRouter()
router.register(r'orders', SalesOrderViewSet, basename='sales-order')
router.register(r'invoices', InvoiceViewSet, basename='sales-invoice')
router.register(r'returns', SalesReturnViewSet, basename='sales-return')

urlpatterns = [
    path('', include(router.urls)),
]
