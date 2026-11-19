from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from common.exceptions import InvalidStatusTransitionError, BusinessLogicError
from common.services import DocumentNumberService
from apps.inventory.services import InventoryService
from apps.masters.models import ProductionUnit
from .models import SalesOrder, SalesPayment, Invoice, InvoiceItem, SalesReturn

class SalesService:
    @classmethod
    @transaction.atomic
    def confirm_order(cls, order: SalesOrder, user) -> SalesOrder:
        if order.status != 'DRAFT':
            raise InvalidStatusTransitionError(f"Cannot confirm order in status '{order.status}'.")
        order.status = 'CONFIRMED'
        order.updated_by = user
        order.save(update_fields=['status', 'updated_by', 'updated_at'])
        return order

    @classmethod
    @transaction.atomic
    def record_payment(
        cls,
        order: SalesOrder,
        amount: Decimal,
        payment_mode: str,
        transaction_reference: str,
        user,
        notes: str = ''
    ) -> SalesPayment:
        amount = Decimal(str(amount))
        pay_num = DocumentNumberService.generate_number(prefix='PAY')

        payment = SalesPayment.objects.create(
            payment_number=pay_num,
            sales_order=order,
            amount=amount,
            payment_date=timezone.now().date(),
            payment_mode=payment_mode,
            transaction_reference=transaction_reference,
            notes=notes,
            created_by=user
        )

        order.paid_amount += amount
        if order.paid_amount >= order.grand_total:
            order.status = 'PAYMENT_RECEIVED'
        else:
            order.status = 'PAYMENT_PENDING'
        order.updated_by = user
        order.save(update_fields=['paid_amount', 'status', 'updated_by', 'updated_at'])

        # Generate or update invoice
        cls.generate_invoice(order, user)
        return payment

    @classmethod
    @transaction.atomic
    def generate_invoice(cls, order: SalesOrder, user) -> Invoice:
        invoice = Invoice.objects.filter(sales_order=order).first()
        if not invoice:
            inv_num = DocumentNumberService.generate_number(prefix='INV')
            invoice = Invoice.objects.create(
                invoice_number=inv_num,
                customer=order.customer,
                sales_order=order,
                invoice_date=timezone.now().date(),
                due_date=timezone.now().date() + timezone.timedelta(days=15),
                subtotal=order.subtotal,
                discount=order.discount,
                tax=order.tax,
                grand_total=order.grand_total,
                payment_status='PAID' if order.paid_amount >= order.grand_total else ('PARTIALLY_PAID' if order.paid_amount > Decimal('0.00') else 'PENDING'),
                created_by=user
            )
            for item in order.items.filter(is_deleted=False):
                InvoiceItem.objects.create(
                    invoice=invoice,
                    product=item.product,
                    quantity=item.quantity,
                    rate=item.rate,
                    discount=item.discount,
                    tax=item.tax,
                    total=item.total,
                    created_by=user
                )
        else:
            invoice.payment_status = 'PAID' if order.paid_amount >= order.grand_total else ('PARTIALLY_PAID' if order.paid_amount > Decimal('0.00') else 'PENDING')
            invoice.save(update_fields=['payment_status', 'updated_at'])

        return invoice

    @classmethod
    @transaction.atomic
    def dispatch_order(cls, order: SalesOrder, from_location, user) -> SalesOrder:
        if order.is_stock_deducted:
            raise InvalidStatusTransitionError("Finished goods stock has already been deducted for this sales order.")

        if not from_location:
            from_location = ProductionUnit.objects.filter(is_deleted=False).first()

        # Deduct finished goods atomically via InventoryService
        for item in order.items.filter(is_deleted=False):
            InventoryService.sell_product(
                product=item.product,
                quantity=item.quantity,
                unit=item.product.unit,
                from_location=from_location,
                reference_id=order.id,
                created_by=user,
                rate=item.rate,
                notes=f"Sales Order fulfillment {order.sales_order_number} to {order.customer.name}"
            )

        order.is_stock_deducted = True
        order.status = 'DISPATCHED'
        order.updated_by = user
        order.save(update_fields=['is_stock_deducted', 'status', 'updated_by', 'updated_at'])
        return order

    @classmethod
    @transaction.atomic
    def approve_and_post_return(cls, sales_return: SalesReturn, to_location, user) -> SalesReturn:
        if sales_return.is_stock_updated:
            raise InvalidStatusTransitionError("Stock has already been adjusted for this sales return.")

        if not to_location:
            to_location = ProductionUnit.objects.filter(is_deleted=False).first()

        InventoryService.process_sales_return(
            product=sales_return.product,
            quantity=sales_return.quantity,
            unit=sales_return.product.unit,
            to_location=to_location,
            reference_id=sales_return.id,
            created_by=user,
            is_usable=sales_return.is_usable,
            notes=f"Sales Return {sales_return.return_number} (Order: {sales_return.original_sales_order.sales_order_number})"
        )

        sales_return.is_stock_updated = True
        sales_return.status = 'COMPLETED'
        sales_return.updated_by = user
        sales_return.save(update_fields=['is_stock_updated', 'status', 'updated_by', 'updated_at'])
        return sales_return
