from decimal import Decimal
from rest_framework import serializers
from .models import PurchaseOrder, PurchaseOrderItem, PurchaseApproval
from common.services import DocumentNumberService

class PurchaseApprovalSerializer(serializers.ModelSerializer):
    action_by_name = serializers.CharField(source='action_by.get_full_name', read_only=True)

    class Meta:
        model = PurchaseApproval
        fields = ['id', 'tier', 'action', 'action_by', 'action_by_name', 'notes', 'created_at']


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_code = serializers.CharField(source='material.material_code', read_only=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = [
            'id', 'material', 'material_name', 'material_code',
            'unit', 'unit_code', 'quantity', 'unit_price',
            'discount', 'tax', 'total'
        ]
        read_only_fields = ['id', 'total']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.vendor_name', read_only=True)
    vendor_code = serializers.CharField(source='vendor.vendor_code', read_only=True)
    planning_number = serializers.CharField(source='planning_document.planning_number', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    items = PurchaseOrderItemSerializer(many=True, required=False)
    approvals = PurchaseApprovalSerializer(many=True, read_only=True)
    total_materials_count = serializers.SerializerMethodField()
    total_quantity = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'purchase_number', 'planning_document', 'planning_number', 'vendor',
            'vendor_name', 'vendor_code', 'purchase_date', 'expected_date',
            'currency', 'subtotal', 'discount', 'tax', 'freight',
            'grand_total', 'notes', 'payment_terms', 'status',
            'approved_by', 'approved_by_name', 'approved_at',
            'rejected_by', 'rejected_at', 'rejection_reason',
            'items', 'approvals', 'total_materials_count', 'total_quantity',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'purchase_number', 'subtotal', 'grand_total',
            'status', 'approved_by', 'approved_at', 'rejected_by',
            'rejected_at', 'total_materials_count', 'total_quantity',
            'created_at', 'updated_at'
        ]

    def get_total_materials_count(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'items' in obj._prefetched_objects_cache:
            return len(obj.items.all())
        return obj.items.count()

    def get_total_quantity(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        user = self.context['request'].user
        validated_data['purchase_number'] = DocumentNumberService.generate_number(prefix='PO')
        validated_data['created_by'] = user
        validated_data['status'] = 'DRAFT'
        po = super().create(validated_data)

        for item_data in items_data:
            PurchaseOrderItem.objects.create(purchase_order=po, created_by=user, **item_data)

        po.recalculate_totals()
        po.save()
        return po

    def update(self, instance, validated_data):
        if instance.status not in ['DRAFT', 'MANAGER_REVIEW']:
            raise serializers.ValidationError(f"Cannot edit PO in status '{instance.status}'.")

        items_data = validated_data.pop('items', None)
        user = self.context['request'].user
        po = super().update(instance, validated_data)

        if items_data is not None:
            po.items.all().delete(hard=True)
            for item_data in items_data:
                PurchaseOrderItem.objects.create(purchase_order=po, created_by=user, **item_data)

        po.recalculate_totals()
        po.save()

        # If PO now has 0 active items, soft-delete it so it does not linger empty
        if po.items.filter(is_deleted=False).count() == 0:
            po.delete()

        return po
