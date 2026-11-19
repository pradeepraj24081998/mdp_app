from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.db.models import ProtectedError
from common.responses import success_response, error_response
from common.services import DocumentNumberService
from .models import Unit, Material, Vendor, Product, Customer, ProductionUnit, ProductionUnitEmployee, Warehouse
from .serializers import (
    UnitSerializer, MaterialSerializer, VendorSerializer,
    ProductSerializer, CustomerSerializer, ProductionUnitSerializer,
    ProductionUnitEmployeeSerializer, WarehouseSerializer
)


class MasterDeleteMixin:
    """
    Standardizes soft-deletion with user-friendly Foreign Key ProtectedError handling.
    """
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        display_name = (
            getattr(instance, 'name', None) or
            getattr(instance, 'vendor_name', None) or
            getattr(instance, 'product_name', None) or
            getattr(instance, 'code', None) or
            str(instance)
        )
        try:
            instance.delete()
            return success_response(message=f"'{display_name}' has been deleted successfully.")
        except ProtectedError:
            return error_response(
                message=f"Cannot delete '{display_name}' because it is linked to existing transactions, inventory balances, or dependent records.",
                status_code=status.HTTP_400_BAD_REQUEST
            )


class UnitViewSet(MasterDeleteMixin, viewsets.ModelViewSet):
    queryset = Unit.objects.filter(is_deleted=False).order_by('-created_at')
    serializer_class = UnitSerializer
    filterset_fields = ['status']
    search_fields = ['code', 'name', 'symbol']
    ordering_fields = ['created_at', 'code', 'name']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'], url_path='next-code')
    def next_code(self, request):
        code = DocumentNumberService.peek_next_code(prefix='UNT', model=Unit, field_name='code', padding=3)
        return success_response(data={'code': code})


class MaterialViewSet(MasterDeleteMixin, viewsets.ModelViewSet):
    queryset = Material.objects.filter(is_deleted=False).select_related('unit').order_by('-created_at')
    serializer_class = MaterialSerializer
    filterset_fields = ['material_type', 'unit', 'is_active', 'status']
    search_fields = ['material_code', 'name', 'description']
    ordering_fields = ['created_at', 'material_code', 'name', 'minimum_stock']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'], url_path='next-code')
    def next_code(self, request):
        code = DocumentNumberService.peek_next_code(prefix='MAT', model=Material, field_name='material_code', padding=3)
        return success_response(data={'code': code})


class VendorViewSet(MasterDeleteMixin, viewsets.ModelViewSet):
    queryset = Vendor.objects.filter(is_deleted=False).order_by('-created_at')
    serializer_class = VendorSerializer
    filterset_fields = ['city', 'state', 'status']
    search_fields = ['vendor_code', 'vendor_name', 'contact_person', 'phone', 'email', 'gst_number']
    ordering_fields = ['created_at', 'vendor_code', 'vendor_name']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'], url_path='next-code')
    def next_code(self, request):
        code = DocumentNumberService.peek_next_code(prefix='VEN', model=Vendor, field_name='vendor_code', padding=3)
        return success_response(data={'code': code})


class ProductViewSet(MasterDeleteMixin, viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_deleted=False).select_related('unit').order_by('-created_at')
    serializer_class = ProductSerializer
    filterset_fields = ['category', 'unit', 'status']
    search_fields = ['product_code', 'product_name', 'description']
    ordering_fields = ['created_at', 'product_code', 'product_name', 'selling_price']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'], url_path='next-code')
    def next_code(self, request):
        code = DocumentNumberService.peek_next_code(prefix='PRD', model=Product, field_name='product_code', padding=3)
        return success_response(data={'code': code})


class CustomerViewSet(MasterDeleteMixin, viewsets.ModelViewSet):
    queryset = Customer.objects.filter(is_deleted=False).order_by('-created_at')
    serializer_class = CustomerSerializer
    filterset_fields = ['customer_type', 'city', 'state', 'status']
    search_fields = ['customer_code', 'name', 'contact_person', 'phone', 'email', 'gst_number']
    ordering_fields = ['created_at', 'customer_code', 'name', 'credit_limit']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'], url_path='next-code')
    def next_code(self, request):
        code = DocumentNumberService.peek_next_code(prefix='CUST', model=Customer, field_name='customer_code', padding=3)
        return success_response(data={'code': code})


class ProductionUnitViewSet(MasterDeleteMixin, viewsets.ModelViewSet):
    queryset = ProductionUnit.objects.filter(is_deleted=False).select_related('manager').order_by('-created_at')
    serializer_class = ProductionUnitSerializer
    filterset_fields = ['status']
    search_fields = ['production_unit_code', 'name', 'description', 'manager__name']
    ordering_fields = ['created_at', 'production_unit_code', 'name']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'], url_path='next-code')
    def next_code(self, request):
        code = DocumentNumberService.peek_next_code(prefix='PU', model=ProductionUnit, field_name='production_unit_code', padding=3)
        return success_response(data={'code': code})


class ProductionUnitEmployeeViewSet(MasterDeleteMixin, viewsets.ModelViewSet):
    queryset = ProductionUnitEmployee.objects.filter(is_deleted=False).select_related('production_unit', 'employee').order_by('-created_at')
    serializer_class = ProductionUnitEmployeeSerializer
    filterset_fields = ['production_unit', 'employee', 'role', 'is_active']
    ordering_fields = ['created_at', 'role']
    ordering = ['-created_at']


class WarehouseViewSet(MasterDeleteMixin, viewsets.ModelViewSet):
    queryset = Warehouse.objects.filter(is_deleted=False).select_related('manager', 'production_unit').order_by('-created_at')
    serializer_class = WarehouseSerializer
    filterset_fields = ['warehouse_type', 'city', 'state', 'is_active', 'status', 'production_unit']
    search_fields = ['warehouse_code', 'name', 'city', 'manager__name', 'contact_phone']
    ordering_fields = ['created_at', 'warehouse_code', 'name', 'capacity_sqft']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'], url_path='next-code')
    def next_code(self, request):
        code = DocumentNumberService.peek_next_code(prefix='WH', model=Warehouse, field_name='warehouse_code', padding=3)
        return success_response(data={'code': code})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return success_response(
            data=serializer.data,
            message="Warehouse master created successfully.",
            status_code=status.HTTP_201_CREATED
        )


