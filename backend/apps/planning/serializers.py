from rest_framework import serializers
from .models import MaterialPlan, MaterialPlanItem
from common.services import DocumentNumberService

class MaterialPlanItemSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_code = serializers.CharField(source='material.material_code', read_only=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)

    class Meta:
        model = MaterialPlanItem
        fields = ['id', 'material', 'material_name', 'material_code', 'unit', 'unit_code', 'quantity', 'estimated_rate']


class MaterialPlanSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.vendor_name', read_only=True)
    items = MaterialPlanItemSerializer(many=True, required=False)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = MaterialPlan
        fields = [
            'id', 'planning_number', 'planning_date', 'vendor', 'vendor_name',
            'required_date', 'notes', 'status', 'rejection_reason',
            'approved_by', 'approved_by_name', 'approved_at', 'items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'planning_number', 'status', 'approved_by', 'approved_at', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        user = self.context['request'].user
        validated_data['planning_number'] = DocumentNumberService.generate_number(prefix='PLAN')
        validated_data['created_by'] = user
        validated_data['status'] = 'DRAFT'
        plan = super().create(validated_data)

        for item_data in items_data:
            MaterialPlanItem.objects.create(plan=plan, created_by=user, **item_data)
        return plan

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        user = self.context['request'].user
        plan = super().update(instance, validated_data)

        if items_data is not None and plan.status == 'DRAFT':
            plan.items.all().delete(hard=True)
            for item_data in items_data:
                MaterialPlanItem.objects.create(plan=plan, created_by=user, **item_data)
        return plan
