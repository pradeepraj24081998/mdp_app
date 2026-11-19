from rest_framework import serializers
from .models import SalesOrder, SalesOrderItem, SalesPayment, Invoice, InvoiceItem, SalesReturn
from common.services import DocumentNumberService

class SalesOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    product_code = serializers.CharField(source='product.product_code', read_only=True)
    unit_code = serializers.CharField(source='product.unit.code', read_only=True)

    class Meta:
        model = SalesOrderItem
        fields = ['id', 'product', 'product_name', 'product_code', 'unit_code', 'quantity', 'rate', 'discount', 'tax', 'total']
        read_only_fields = ['id', 'total']


class SalesPaymentSerializer(serializers.ModelSerializer):
    sales_order_number = serializers.CharField(source='sales_order.sales_order_number', read_only=True)

    class Meta:
        model = SalesPayment
        fields = ['id', 'payment_number', 'sales_order', 'sales_order_number', 'amount', 'payment_date', 'payment_mode', 'transaction_reference', 'notes', 'created_at']
        read_only_fields = ['id', 'payment_number', 'created_at']


class InvoiceItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)

    class Meta:
        model = InvoiceItem
        fields = ['id', 'product', 'product_name', 'quantity', 'rate', 'discount', 'tax', 'total']


class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    sales_order_number = serializers.CharField(source='sales_order.sales_order_number', read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name', 'sales_order',
            'sales_order_number', 'invoice_date', 'due_date', 'subtotal',
            'discount', 'tax', 'grand_total', 'payment_status', 'items', 'created_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'created_at']


class SalesOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_code = serializers.CharField(source='customer.customer_code', read_only=True)
    items = SalesOrderItemSerializer(many=True, required=False)
    payments = SalesPaymentSerializer(many=True, read_only=True)
    invoices = InvoiceSerializer(many=True, read_only=True)

    class Meta:
        model = SalesOrder
        fields = [
            'id', 'sales_order_number', 'customer', 'customer_name', 'customer_code',
            'order_date', 'delivery_date', 'payment_type', 'subtotal',
            'discount', 'tax', 'grand_total', 'paid_amount', 'notes',
            'status', 'is_stock_deducted', 'items', 'payments', 'invoices',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'sales_order_number', 'subtotal', 'grand_total',
            'paid_amount', 'status', 'is_stock_deducted', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        user = self.context['request'].user
        validated_data['sales_order_number'] = DocumentNumberService.generate_number(prefix='SO')
        validated_data['created_by'] = user
        order = super().create(validated_data)

        for item_data in items_data:
            SalesOrderItem.objects.create(sales_order=order, created_by=user, **item_data)

        order.recalculate_totals()
        order.save()
        return order


class SalesReturnSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    sales_order_number = serializers.CharField(source='original_sales_order.sales_order_number', read_only=True)

    class Meta:
        model = SalesReturn
        fields = [
            'id', 'return_number', 'original_sales_order', 'sales_order_number',
            'customer', 'customer_name', 'product', 'product_name', 'quantity',
            'price', 'total', 'reason', 'return_date', 'is_usable',
            'is_stock_updated', 'status', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'return_number', 'total', 'is_stock_updated', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['return_number'] = DocumentNumberService.generate_number(prefix='RET')
        validated_data['created_by'] = user
        validated_data['total'] = validated_data['quantity'] * validated_data['price']
        return super().create(validated_data)
