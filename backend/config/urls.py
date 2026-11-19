from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView
)

def health_check(request):
    return JsonResponse({
        'status': 'online',
        'app': 'MDP Aroma ERP Backend API',
        'version': '1.0.0',
        'api_root': '/api/v1/',
        'docs': '/api/v1/docs/',
    })

api_v1_patterns = [
    # Accounts & RBAC
    path('', include('apps.accounts.urls')),

    # Employees & HR
    path('', include('apps.employees.urls')),

    # Masters (Materials, Units, Vendors, Products, Customers, Production Units)
    path('', include('apps.masters.urls')),

    # Planning
    path('', include('apps.planning.urls')),

    # Purchasing
    path('', include('apps.purchasing.urls')),

    # Shipping Logistics
    path('', include('apps.shipping.urls')),

    # Inward & Quality Verification
    path('', include('apps.inward.urls')),

    # Inventory Ledger & Balances
    path('inventory/', include('apps.inventory.urls')),

    # Production & Manufacturing
    path('production/', include('apps.production.urls')),

    # Sales & Invoices
    path('sales/', include('apps.sales.urls')),

    # BI Reports & Dashboards
    path('', include('apps.reports.urls')),

    # Notifications
    path('', include('apps.notifications.urls')),

    # Compliance & Audit Logs
    path('', include('apps.audit.urls')),

    # OpenAPI Schema & Interactive Swagger UI
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

urlpatterns = [
    path('', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/v1/', include((api_v1_patterns, 'api_v1'))),
]
