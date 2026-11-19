from rest_framework import serializers
from .models import (
    ProductionOrder, ProductionOrderEmployee, MaterialDispatch,
    MaterialConsumption, FinishedGoodsReceipt
)
from common.services import DocumentNumberService

class ProductionOrderEmployeeSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_code', read_only=True)

    class Meta:
        model = ProductionOrderEmployee
        fields = ['id', 'production_order', 'employee', 'employee_code', 'employee_name', 'role']


class MaterialDispatchSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    handler_name = serializers.CharField(source='material_handler.name', read_only=True)
    from_location_name = serializers.CharField(source='from_location.name', read_only=True)
    to_unit_name = serializers.CharField(source='production_unit.name', read_only=True)

    class Meta:
        model = MaterialDispatch
        fields = [
            'id', 'dispatch_number', 'production_order', 'from_location', 'from_location_name',
            'production_unit', 'to_unit_name', 'material', 'material_name',
            'quantity', 'unit', 'unit_code', 'material_handler', 'handler_name',
            'date', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'dispatch_number', 'created_at']


class MaterialConsumptionSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)

    class Meta:
        model = MaterialConsumption
        fields = [
            'id', 'production_order', 'material', 'material_name',
            'planned_quantity', 'issued_quantity', 'used_quantity',
            'wastage', 'unit', 'unit_code'
        ]


class FinishedGoodsReceiptSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)

    class Meta:
        model = FinishedGoodsReceipt
        fields = [
            'id', 'production_order', 'product', 'product_name',
            'quantity', 'unit', 'unit_code', 'batch_number',
            'production_unit', 'quality_status', 'date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ProductionOrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    product_code = serializers.CharField(source='product.product_code', read_only=True)
    production_unit_name = serializers.CharField(source='production_unit.name', read_only=True)
    supervisor_name = serializers.CharField(source='supervisor.name', read_only=True)
    workers = ProductionOrderEmployeeSerializer(source='assigned_workers', many=True, read_only=True)
    worker_assignments = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    dispatches = MaterialDispatchSerializer(many=True, read_only=True)
    consumptions = MaterialConsumptionSerializer(many=True, read_only=True)
    goods_receipts = FinishedGoodsReceiptSerializer(many=True, read_only=True)

    class Meta:
        model = ProductionOrder
        fields = [
            'id', 'production_number', 'production_unit', 'production_unit_name',
            'product', 'product_name', 'product_code', 'batch_number',
            'planned_quantity', 'actual_quantity', 'start_date', 'expected_completion',
            'completed_date', 'supervisor', 'supervisor_name', 'notes',
            'status', 'workers', 'worker_assignments', 'dispatches', 'consumptions',
            'goods_receipts', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'production_number', 'status', 'created_at', 'updated_at']

    def create(self, validated_data):
        worker_assignments = validated_data.pop('worker_assignments', [])
        user = self.context['request'].user
        validated_data['production_number'] = DocumentNumberService.generate_number(prefix='PROD')
        validated_data['created_by'] = user
        order = super().create(validated_data)

        for w in worker_assignments:
            ProductionOrderEmployee.objects.create(
                production_order=order,
                employee_id=w['employee_id'],
                role=w.get('role', 'OPERATOR'),
                created_by=user
            )
        return order
