from decimal import Decimal
from django.db import models
from django.conf import settings
from common.models import BaseModel

class SalesOrder(BaseModel):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft Order'),
        ('CONFIRMED', 'Order Confirmed & Stock Reserved'),
        ('PAYMENT_PENDING', 'Payment Pending'),
        ('PAYMENT_RECEIVED', 'Payment Received'),
        ('READY_TO_DISPATCH', 'Ready to Dispatch'),
        ('DISPATCHED', 'Dispatched to Customer'),
        ('DELIVERED', 'Delivered'),
        ('COMPLETED', 'Order Completed'),
        ('CANCELLED', 'Order Cancelled'),
    ]

    PAYMENT_TYPES = [
        ('ADVANCE', 'Advance Full Payment'),
        ('PARTIAL_ADVANCE', 'Partial Advance'),
        ('CREDIT', 'Dealer Credit Term'),
        ('CASH_ON_DELIVERY', 'Cash on Delivery (COD)'),
    ]

    sales_order_number = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey('masters.Customer', on_delete=models.PROTECT, related_name='sales_orders')
    order_date = models.DateField()
    delivery_date = models.DateField()
    payment_type = models.CharField(max_length=30, choices=PAYMENT_TYPES, default='CREDIT')
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    tax = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    grand_total = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    paid_amount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    notes = models.TextField(blank=True)
    is_stock_deducted = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Sales Order'
        verbose_name_plural = 'Sales Orders'
        ordering = ['-created_at', '-order_date']

    def __str__(self):
        return f"{self.sales_order_number} - {self.customer.name} (₹{self.grand_total})"

    def recalculate_totals(self):
        items_subtotal = sum((item.total for item in self.items.filter(is_deleted=False)), Decimal('0.00'))
        self.subtotal = items_subtotal
        self.grand_total = max(Decimal('0.00'), self.subtotal - self.discount + self.tax).quantize(Decimal('0.01'))
        return self.grand_total


class SalesOrderItem(BaseModel):
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('masters.Product', on_delete=models.PROTECT, related_name='sales_items')
    quantity = models.DecimalField(max_digits=14, decimal_places=4)
    rate = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))

    class Meta:
        verbose_name = 'Sales Order Item'
        verbose_name_plural = 'Sales Order Items'

    def save(self, *args, **kwargs):
        line = (self.quantity * self.rate) - self.discount + self.tax
        self.total = max(Decimal('0.00'), line).quantize(Decimal('0.01'))
        super().save(*args, **kwargs)


class SalesPayment(BaseModel):
    PAYMENT_MODES = [
        ('BANK_TRANSFER', 'NEFT / RTGS / IMPS'),
        ('UPI', 'UPI Payment'),
        ('CHEQUE', 'Cheque / DD'),
        ('CASH', 'Cash'),
    ]

    payment_number = models.CharField(max_length=50, unique=True, db_index=True)
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.PROTECT, related_name='payments')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    payment_date = models.DateField()
    payment_mode = models.CharField(max_length=30, choices=PAYMENT_MODES, default='BANK_TRANSFER')
    transaction_reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Sales Payment'
        verbose_name_plural = 'Sales Payments'
        ordering = ['-created_at', '-payment_date']


class Invoice(BaseModel):
    PAYMENT_STATUSES = [
        ('PENDING', 'Payment Pending'),
        ('PARTIALLY_PAID', 'Partially Paid'),
        ('PAID', 'Fully Paid'),
    ]

    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey('masters.Customer', on_delete=models.PROTECT, related_name='invoices')
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.PROTECT, related_name='invoices')
    invoice_date = models.DateField()
    due_date = models.DateField()
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    tax = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    grand_total = models.DecimalField(max_digits=14, decimal_places=2)
    payment_status = models.CharField(max_length=30, choices=PAYMENT_STATUSES, default='PENDING')

    class Meta:
        verbose_name = 'Tax Invoice'
        verbose_name_plural = 'Tax Invoices'
        ordering = ['-created_at', '-invoice_date']

    def __str__(self):
        return f"{self.invoice_number} - {self.customer.name} (₹{self.grand_total})"


class InvoiceItem(BaseModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('masters.Product', on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=14, decimal_places=4)
    rate = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        verbose_name = 'Invoice Item'
        verbose_name_plural = 'Invoice Items'


class SalesReturn(BaseModel):
    REASON_CHOICES = [
        ('DAMAGED', 'Damaged Packaging / Product'),
        ('WRONG_PRODUCT', 'Wrong Item Delivered'),
        ('CUSTOMER_RETURN', 'Customer Dealer Return'),
        ('QUALITY_ISSUE', 'Quality / Fragrance Issue'),
        ('EXCESS', 'Excess Shipment'),
        ('OTHER', 'Other Reason'),
    ]
    STATUS_CHOICES = [
        ('RETURN_REQUESTED', 'Return Requested'),
        ('INSPECTION', 'Quality Inspection'),
        ('APPROVED', 'Return Approved'),
        ('STOCK_ADJUSTMENT', 'Stock Adjusted'),
        ('COMPLETED', 'Return Completed'),
        ('REJECTED', 'Return Rejected'),
    ]

    return_number = models.CharField(max_length=50, unique=True, db_index=True)
    original_sales_order = models.ForeignKey(SalesOrder, on_delete=models.PROTECT, related_name='returns')
    customer = models.ForeignKey('masters.Customer', on_delete=models.PROTECT, related_name='sales_returns')
    product = models.ForeignKey('masters.Product', on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=14, decimal_places=4)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=14, decimal_places=2)
    reason = models.CharField(max_length=30, choices=REASON_CHOICES, default='DAMAGED')
    return_date = models.DateField()
    is_usable = models.BooleanField(default=True, help_text="If True, goods return to saleable inventory. If False, segregated.")
    is_stock_updated = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Sales Return'
        verbose_name_plural = 'Sales Returns'
        ordering = ['-created_at', '-return_date']
