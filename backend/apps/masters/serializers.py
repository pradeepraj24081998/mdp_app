from rest_framework import serializers
from common.services import DocumentNumberService
from .models import Unit, Material, Vendor, Product, Customer, ProductionUnit, ProductionUnitEmployee, Warehouse

class UnitSerializer(serializers.ModelSerializer):
    code = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Unit
        fields = ['id', 'code', 'name', 'symbol', 'status', 'created_at']

    def create(self, validated_data):
        if not validated_data.get('code'):
            validated_data['code'] = DocumentNumberService.generate_unique_code(
                prefix='UNT', model=Unit, field_name='code', padding=3
            )
        else:
            validated_data['code'] = validated_data['code'].strip().upper()
        return super().create(validated_data)


class MaterialSerializer(serializers.ModelSerializer):
    material_code = serializers.CharField(required=False, allow_blank=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)

    class Meta:
        model = Material
        fields = [
            'id', 'material_code', 'name', 'description', 'material_type',
            'unit', 'unit_code', 'unit_name', 'minimum_stock', 'reorder_level',
            'is_active', 'status', 'created_at'
        ]

    def create(self, validated_data):
        if not validated_data.get('material_code'):
            validated_data['material_code'] = DocumentNumberService.generate_unique_code(
                prefix='MAT', model=Material, field_name='material_code', padding=3
            )
        else:
            validated_data['material_code'] = validated_data['material_code'].strip().upper()
        return super().create(validated_data)


class VendorSerializer(serializers.ModelSerializer):
    vendor_code = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Vendor
        fields = [
            'id', 'vendor_code', 'vendor_name', 'contact_person', 'phone',
            'email', 'address', 'city', 'state', 'country', 'pincode',
            'gst_number', 'tax_number', 'payment_terms', 'notes', 'status',
            'created_at'
        ]

    def create(self, validated_data):
        if not validated_data.get('vendor_code'):
            validated_data['vendor_code'] = DocumentNumberService.generate_unique_code(
                prefix='VEN', model=Vendor, field_name='vendor_code', padding=3
            )
        else:
            validated_data['vendor_code'] = validated_data['vendor_code'].strip().upper()
        return super().create(validated_data)


class ProductSerializer(serializers.ModelSerializer):
    product_code = serializers.CharField(required=False, allow_blank=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'product_code', 'product_name', 'description', 'category',
            'unit', 'unit_code', 'unit_name', 'selling_price', 'cost_price',
            'minimum_stock', 'status', 'created_at'
        ]

    def create(self, validated_data):
        if not validated_data.get('product_code'):
            validated_data['product_code'] = DocumentNumberService.generate_unique_code(
                prefix='PRD', model=Product, field_name='product_code', padding=3
            )
        else:
            validated_data['product_code'] = validated_data['product_code'].strip().upper()
        return super().create(validated_data)


class CustomerSerializer(serializers.ModelSerializer):
    customer_code = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'customer_code', 'name', 'customer_type', 'contact_person',
            'phone', 'email', 'address', 'city', 'state', 'pincode',
            'gst_number', 'credit_limit', 'payment_terms', 'status',
            'created_at'
        ]

    def create(self, validated_data):
        if not validated_data.get('customer_code'):
            validated_data['customer_code'] = DocumentNumberService.generate_unique_code(
                prefix='CUST', model=Customer, field_name='customer_code', padding=3
            )
        else:
            validated_data['customer_code'] = validated_data['customer_code'].strip().upper()
        return super().create(validated_data)


class ProductionUnitEmployeeSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_code', read_only=True)

    class Meta:
        model = ProductionUnitEmployee
        fields = ['id', 'production_unit', 'employee', 'employee_code', 'employee_name', 'role', 'joined_date', 'is_active']


class ProductionUnitSerializer(serializers.ModelSerializer):
    production_unit_code = serializers.CharField(required=False, allow_blank=True)
    manager_name = serializers.CharField(source='manager.name', read_only=True)
    employees = ProductionUnitEmployeeSerializer(source='unit_employees', many=True, read_only=True)

    class Meta:
        model = ProductionUnit
        fields = [
            'id', 'production_unit_code', 'name', 'description', 'address',
            'manager', 'manager_name', 'status', 'employees', 'created_at'
        ]

    def create(self, validated_data):
        if not validated_data.get('production_unit_code'):
            validated_data['production_unit_code'] = DocumentNumberService.generate_unique_code(
                prefix='PU', model=ProductionUnit, field_name='production_unit_code', padding=3
            )
        else:
            validated_data['production_unit_code'] = validated_data['production_unit_code'].strip().upper()
        return super().create(validated_data)


class WarehouseSerializer(serializers.ModelSerializer):
    warehouse_code = serializers.CharField(required=False, allow_blank=True)
    manager_name = serializers.CharField(source='manager.name', read_only=True)
    production_unit_name = serializers.CharField(source='production_unit.name', read_only=True)
    is_active = serializers.BooleanField(default=True, required=False)


    class Meta:
        model = Warehouse
        fields = [
            'id', 'warehouse_code', 'name', 'warehouse_type',
            'address', 'city', 'state', 'pincode',
            'manager', 'manager_name', 'contact_phone', 'contact_email',
            'capacity_sqft', 'production_unit', 'production_unit_name',
            'is_active', 'status', 'created_at'
        ]

    def create(self, validated_data):
        if not validated_data.get('warehouse_code'):
            validated_data['warehouse_code'] = DocumentNumberService.generate_unique_code(
                prefix='WH', model=Warehouse, field_name='warehouse_code', padding=3
            )
        else:
            validated_data['warehouse_code'] = validated_data['warehouse_code'].strip().upper()
        return super().create(validated_data)

