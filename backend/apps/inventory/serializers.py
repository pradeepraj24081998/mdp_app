from rest_framework import serializers
from .models import StockBalance, StockTransaction, OpeningStock, StockAdjustment, StockTransfer
from .services import InventoryService
from common.services import DocumentNumberService

class StockBalanceSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_code = serializers.CharField(source='material.material_code', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    product_code = serializers.CharField(source='product.product_code', read_only=True)
    unit_code = serializers.SerializerMethodField()
    location_name = serializers.CharField(source='location.name', read_only=True)
    category = serializers.SerializerMethodField()
    minimum_stock = serializers.SerializerMethodField()
    reorder_level = serializers.SerializerMethodField()
    cost_price = serializers.SerializerMethodField()
    valuation = serializers.SerializerMethodField()

    class Meta:
        model = StockBalance
        fields = [
            'id', 'material', 'material_name', 'material_code',
            'product', 'product_name', 'product_code', 'unit_code',
            'category', 'minimum_stock', 'reorder_level', 'cost_price', 'valuation',
            'location', 'location_name', 'batch_number', 'usable_quantity',
            'reserved_quantity', 'quarantined_quantity', 'updated_at'
        ]

    def get_unit_code(self, obj):
        if obj.material and obj.material.unit:
            return obj.material.unit.code
        if obj.product and obj.product.unit:
            return obj.product.unit.code
        return ''

    def get_category(self, obj):
        if obj.material:
            return obj.material.get_material_type_display()
        if obj.product:
            return obj.product.category or 'Finished Goods'
        return 'Standard'

    def get_minimum_stock(self, obj):
        if obj.material:
            return float(obj.material.minimum_stock or 0)
        if obj.product:
            return float(obj.product.minimum_stock or 0)
        return 0.0

    def get_reorder_level(self, obj):
        if obj.material:
            return float(obj.material.reorder_level or 0)
        if obj.product:
            return float((obj.product.minimum_stock or 0) * 1.5)
        return 0.0

    def get_cost_price(self, obj):
        if obj.product and obj.product.cost_price:
            return float(obj.product.cost_price)
        return 0.0

    def get_valuation(self, obj):
        cost = self.get_cost_price(obj)
        qty = float(obj.usable_quantity or 0)
        return round(qty * cost, 2)



class StockTransactionSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    from_location_name = serializers.CharField(source='from_location.name', read_only=True)
    to_location_name = serializers.CharField(source='to_location.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = StockTransaction
        fields = [
            'id', 'transaction_type', 'material', 'material_name',
            'product', 'product_name', 'quantity', 'unit', 'unit_code',
            'rate', 'value', 'reference_type', 'reference_id',
            'from_location', 'from_location_name', 'to_location', 'to_location_name',
            'balance_after', 'notes', 'created_by', 'created_by_name', 'created_at'
        ]


class OpeningStockSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = OpeningStock
        fields = [
            'id', 'opening_number', 'material', 'material_name',
            'product', 'product_name', 'unit', 'unit_code',
            'quantity', 'rate', 'value', 'location', 'location_name',
            'reason', 'is_posted', 'date', 'created_at'
        ]
        read_only_fields = ['id', 'opening_number', 'value', 'is_posted', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if not user or not getattr(user, 'is_authenticated', False):
            from django.contrib.auth import get_user_model
            user = get_user_model().objects.filter(is_superuser=True).first() or get_user_model().objects.first()

        qty = validated_data.get('quantity')
        rate = validated_data.get('rate', 0)
        validated_data['value'] = qty * rate
        validated_data['opening_number'] = DocumentNumberService.generate_number(prefix='OPN')
        validated_data['created_by'] = user
        validated_data['is_posted'] = True
        opening = super().create(validated_data)

        # Post to inventory ledger immediately
        InventoryService.record_opening_stock(
            opening_stock_id=opening.id,
            material=opening.material,
            product=opening.product,
            quantity=opening.quantity,
            unit=opening.unit,
            rate=opening.rate,
            location=opening.location,
            created_by=user
        )
        return opening


class StockAdjustmentSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = StockAdjustment
        fields = [
            'id', 'adjustment_number', 'material', 'material_name',
            'product', 'product_name', 'unit', 'location', 'location_name',
            'system_quantity', 'physical_quantity', 'difference_quantity',
            'reason_type', 'reason', 'is_approved', 'approved_by', 'created_at'
        ]
        read_only_fields = ['id', 'adjustment_number', 'difference_quantity', 'is_approved', 'approved_by', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if not user or not getattr(user, 'is_authenticated', False):
            from django.contrib.auth import get_user_model
            user = get_user_model().objects.filter(is_superuser=True).first() or get_user_model().objects.first()

        sys_qty = validated_data.get('system_quantity')
        phys_qty = validated_data.get('physical_quantity')
        validated_data['difference_quantity'] = phys_qty - sys_qty
        validated_data['adjustment_number'] = DocumentNumberService.generate_number(prefix='ADJ')
        validated_data['created_by'] = user
        validated_data['is_approved'] = True
        validated_data['approved_by'] = user
        adjustment = super().create(validated_data)

        # Post adjustment
        InventoryService.adjust_stock(
            material=adjustment.material,
            product=adjustment.product,
            quantity_diff=adjustment.difference_quantity,
            unit=adjustment.unit,
            location=adjustment.location,
            reference_id=adjustment.id,
            created_by=user,
            reason=f"[{adjustment.reason_type}] {adjustment.reason}"
        )
        return adjustment


class StockTransferSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    from_location_name = serializers.CharField(source='from_location.name', read_only=True)
    to_location_name = serializers.CharField(source='to_location.name', read_only=True)

    class Meta:
        model = StockTransfer
        fields = [
            'id', 'transfer_number', 'material', 'material_name',
            'product', 'product_name', 'unit', 'quantity',
            'from_location', 'from_location_name', 'to_location', 'to_location_name',
            'notes', 'created_at'
        ]
        read_only_fields = ['id', 'transfer_number', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['transfer_number'] = DocumentNumberService.generate_number(prefix='TRF')
        validated_data['created_by'] = user
        transfer = super().create(validated_data)

        InventoryService.transfer_stock(
            material=transfer.material,
            product=transfer.product,
            quantity=transfer.quantity,
            unit=transfer.unit,
            from_location=transfer.from_location,
            to_location=transfer.to_location,
            reference_id=transfer.id,
            created_by=user,
            notes=transfer.notes
        )
        return transfer
