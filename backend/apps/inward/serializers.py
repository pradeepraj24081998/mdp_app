from decimal import Decimal
from rest_framework import serializers
from .models import InwardReceipt, InwardItem, DamagedMaterialReturn
from common.services import DocumentNumberService
from apps.masters.models import Vendor

class DamagedMaterialReturnSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.vendor_name', read_only=True)
    material_name = serializers.CharField(source='inward_item.material.name', read_only=True)

    class Meta:
        model = DamagedMaterialReturn
        fields = ['id', 'inward_item', 'material_name', 'vendor', 'vendor_name', 'return_type', 'quantity', 'status', 'notes', 'created_at']


class InwardItemSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_code = serializers.CharField(source='material.material_code', read_only=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    return_requests = DamagedMaterialReturnSerializer(many=True, read_only=True)

    class Meta:
        model = InwardItem
        fields = [
            'id', 'material', 'material_name', 'material_code',
            'ordered_quantity', 'received_quantity', 'accepted_quantity',
            'damaged_quantity', 'rejected_quantity', 'unit', 'unit_code',
            'verification_status', 'remarks', 'return_requests'
        ]


class InwardReceiptSerializer(serializers.ModelSerializer):
    purchase_number = serializers.CharField(source='purchase_order.purchase_number', read_only=True)
    vendor = serializers.PrimaryKeyRelatedField(queryset=Vendor.objects.all(), required=False)
    vendor_name = serializers.CharField(source='vendor.vendor_name', read_only=True)
    received_by_name = serializers.CharField(source='received_by.name', read_only=True)
    items = InwardItemSerializer(many=True, required=False)

    class Meta:
        model = InwardReceipt
        fields = [
            'id', 'inward_number', 'purchase_order', 'purchase_number',
            'vendor', 'vendor_name', 'received_date', 'invoice_number',
            'shipment', 'received_by', 'received_by_name',
            'is_stock_updated', 'status', 'notes', 'items', 'created_at'
        ]
        read_only_fields = ['id', 'inward_number', 'is_stock_updated', 'status', 'created_at']

    def validate(self, attrs):
        po = attrs.get('purchase_order')
        if not po:
            raise serializers.ValidationError({'purchase_order': 'Purchase Order is required.'})

        if po.status not in ['ORDERED', 'PARTIALLY_RECEIVED']:
            raise serializers.ValidationError({
                'purchase_order': f"PO '{po.purchase_number}' cannot be received because its status is '{po.status}'. Only ORDERED purchase orders can be received at the gate."
            })

        # Ensure vendor matches or is set from PO
        if not attrs.get('vendor'):
            attrs['vendor'] = po.vendor
        elif attrs['vendor'] != po.vendor:
            raise serializers.ValidationError({'vendor': 'Selected vendor does not match the purchase order vendor.'})

        invoice_number = attrs.get('invoice_number', '')
        if not invoice_number or not invoice_number.strip():
            raise serializers.ValidationError({'invoice_number': 'Vendor Delivery Bill / Invoice Number is required.'})
        attrs['invoice_number'] = invoice_number.strip()

        if not attrs.get('received_by'):
            raise serializers.ValidationError({'received_by': 'Receiving workforce staff member is required.'})

        if not attrs.get('received_date'):
            raise serializers.ValidationError({'received_date': 'Delivery received date is required.'})

        po_items = po.items.filter(is_deleted=False)
        if not po_items.exists():
            raise serializers.ValidationError({'purchase_order': 'The selected purchase order has no line items to receive.'})

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        user = self.context['request'].user
        validated_data['inward_number'] = DocumentNumberService.generate_number(prefix='INW')
        validated_data['created_by'] = user
        validated_data['status'] = 'RECEIVED'
        inward = super().create(validated_data)

        # If items not explicitly passed in payload, pre-populate from PurchaseOrder items
        if not items_data:
            for po_item in inward.purchase_order.items.filter(is_deleted=False):
                already_accepted = sum(
                    (
                        it.accepted_quantity
                        for prev_inw in inward.purchase_order.inward_receipts.exclude(id=inward.id).filter(is_stock_updated=True)
                        for it in prev_inw.items.filter(material=po_item.material, is_deleted=False)
                    ),
                    Decimal('0.0000')
                )
                remaining_pending = max(Decimal('0.0000'), po_item.quantity - already_accepted)

                InwardItem.objects.create(
                    inward=inward,
                    material=po_item.material,
                    unit=po_item.unit,
                    ordered_quantity=po_item.quantity,
                    received_quantity=remaining_pending if remaining_pending > Decimal('0.0000') else po_item.quantity,
                    created_by=user
                )
        else:
            for item_data in items_data:
                InwardItem.objects.create(inward=inward, created_by=user, **item_data)

        # Update purchase order status to PARTIALLY_RECEIVED or RECEIVED
        inward.purchase_order.status = 'PARTIALLY_RECEIVED'
        inward.purchase_order.save(update_fields=['status'])
        return inward
