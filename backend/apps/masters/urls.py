from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UnitViewSet, MaterialViewSet, VendorViewSet,
    ProductViewSet, CustomerViewSet, ProductionUnitViewSet,
    ProductionUnitEmployeeViewSet, WarehouseViewSet
)

router = DefaultRouter()
router.register(r'units', UnitViewSet, basename='unit')
router.register(r'materials', MaterialViewSet, basename='material')
router.register(r'vendors', VendorViewSet, basename='vendor')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')
router.register(r'production-units', ProductionUnitViewSet, basename='production-unit')
router.register(r'production-unit-employees', ProductionUnitEmployeeViewSet, basename='production-unit-employee')


urlpatterns = [
    path('', include(router.urls)),
]
