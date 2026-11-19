from django.urls import path
from .views import DashboardMetricsView, InventoryReportView, PurchaseReportView, SalesReportView

urlpatterns = [
    path('dashboard/metrics/', DashboardMetricsView.as_view(), name='dashboard-metrics'),
    path('reports/inventory/', InventoryReportView.as_view(), name='report-inventory'),
    path('reports/purchases/', PurchaseReportView.as_view(), name='report-purchases'),
    path('reports/sales/', SalesReportView.as_view(), name='report-sales'),
]
