from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from common.responses import success_response, error_response
from .models import SalesOrder, SalesPayment, Invoice, SalesReturn
from .serializers import (
    SalesOrderSerializer, SalesPaymentSerializer, InvoiceSerializer, SalesReturnSerializer
)
from .services import SalesService
from apps.masters.models import ProductionUnit

class SalesOrderViewSet(viewsets.ModelViewSet):
    queryset = SalesOrder.objects.filter(is_deleted=False).select_related('customer').prefetch_related(
        'items__product', 'items__product__unit', 'payments', 'invoices'
    ).order_by('-created_at', '-order_date')
    serializer_class = SalesOrderSerializer
    filterset_fields = ['status', 'customer', 'payment_type', 'is_stock_deducted']
    search_fields = ['sales_order_number', 'customer__name', 'notes']
    ordering_fields = ['created_at', 'sales_order_number', 'order_date', 'delivery_date', 'grand_total', 'status']
    ordering = ['-created_at', '-order_date']

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        order = self.get_object()
        order = SalesService.confirm_order(order, request.user)
        return success_response(data=self.get_serializer(order).data, message="Sales order confirmed.")

    @action(detail=True, methods=['post'])
    def payment(self, request, pk=None):
        order = self.get_object()
        amount = request.data.get('amount')
        payment_mode = request.data.get('payment_mode', 'BANK_TRANSFER')
        ref = request.data.get('transaction_reference', '')
        notes = request.data.get('notes', '')

        if not amount:
            return error_response(message="amount is required.")

        payment_obj = SalesService.record_payment(
            order=order,
            amount=Decimal(str(amount)),
            payment_mode=payment_mode,
            transaction_reference=ref,
            user=request.user,
            notes=notes
        )
        return success_response(
            data=SalesPaymentSerializer(payment_obj).data,
            message="Payment recorded and invoice updated."
        )

    @action(detail=True, methods=['post'], url_path='dispatch')
    def dispatch_order(self, request, pk=None):
        order = self.get_object()
        from_location_id = request.data.get('from_location_id')
        from_location = ProductionUnit.objects.filter(id=from_location_id).first() if from_location_id else None

        order = SalesService.dispatch_order(order, from_location, request.user)
        return success_response(
            data=self.get_serializer(order).data,
            message="Sales order fulfilled and finished goods stock deducted."
        )

    @action(detail=True, methods=['post'])
    def invoice(self, request, pk=None):
        order = self.get_object()
        inv = SalesService.generate_invoice(order, request.user)
        return success_response(data=InvoiceSerializer(inv).data, message="Tax invoice generated.")


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Invoice.objects.filter(is_deleted=False).select_related('customer', 'sales_order').prefetch_related('items__product').order_by('-created_at', '-invoice_date')
    serializer_class = InvoiceSerializer
    filterset_fields = ['payment_status', 'customer']
    search_fields = ['invoice_number', 'customer__name', 'sales_order__sales_order_number']
    ordering_fields = ['created_at', 'invoice_number', 'invoice_date', 'due_date', 'grand_total', 'payment_status']
    ordering = ['-created_at', '-invoice_date']


class SalesReturnViewSet(viewsets.ModelViewSet):
    queryset = SalesReturn.objects.filter(is_deleted=False).select_related('customer', 'product', 'original_sales_order').order_by('-created_at', '-return_date')
    serializer_class = SalesReturnSerializer
    filterset_fields = ['status', 'reason', 'is_usable', 'is_stock_updated']
    search_fields = ['return_number', 'customer__name', 'product__product_name']
    ordering_fields = ['created_at', 'return_number', 'return_date', 'status']
    ordering = ['-created_at', '-return_date']

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        ret = self.get_object()
        to_location_id = request.data.get('to_location_id')
        to_location = ProductionUnit.objects.filter(id=to_location_id).first() if to_location_id else None

        ret = SalesService.approve_and_post_return(ret, to_location, request.user)
        return success_response(data=self.get_serializer(ret).data, message="Sales return processed and stock adjusted.")
