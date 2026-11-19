from decimal import Decimal
from django.db import models
from django.conf import settings
from common.models import BaseModel

class PurchaseOrder(BaseModel):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted for Review'),
        ('MANAGER_REVIEW', 'Manager Review'),
        ('PENDING_ADMIN_APPROVAL', 'Pending Admin Approval (Tier 2)'),
        ('APPROVED', 'Approved'),
        ('ORDERED', 'Ordered / Issued to Vendor'),
        ('PARTIALLY_RECEIVED', 'Partially Received'),
        ('RECEIVED', 'Fully Received'),
        ('COMPLETED', 'Completed'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]

    purchase_number = models.CharField(max_length=50, unique=True, db_index=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='DRAFT', db_index=True)
    planning_document = models.ForeignKey('planning.MaterialPlan', on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_orders')
    vendor = models.ForeignKey('masters.Vendor', on_delete=models.PROTECT, related_name='purchase_orders')
    purchase_date = models.DateField()
    expected_date = models.DateField()
    currency = models.CharField(max_length=10, default='INR')
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    tax = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    freight = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    grand_total = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    notes = models.TextField(blank=True)
    payment_terms = models.CharField(max_length=100, default='Net 30')

    # Approval and audit fields
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_purchases')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='rejected_purchases')
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Purchase Order'
        verbose_name_plural = 'Purchase Orders'
        ordering = ['-created_at', '-purchase_date']

    def __str__(self):
        return f"{self.purchase_number} - {self.vendor.vendor_name} ({self.status})"

    def recalculate_totals(self):
        items_subtotal = sum((item.total for item in self.items.filter(is_deleted=False)), Decimal('0.00'))
        self.subtotal = items_subtotal
        self.grand_total = (self.subtotal - self.discount + self.tax + self.freight).quantize(Decimal('0.01'))
        return self.grand_total


class PurchaseOrderItem(BaseModel):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    material = models.ForeignKey('masters.Material', on_delete=models.PROTECT, related_name='purchase_items')
    unit = models.ForeignKey('masters.Unit', on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=14, decimal_places=4)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))

    class Meta:
        verbose_name = 'Purchase Order Item'
        verbose_name_plural = 'Purchase Order Items'

    def save(self, *args, **kwargs):
        line_subtotal = (self.quantity * self.unit_price) - self.discount + self.tax
        self.total = max(Decimal('0.00'), line_subtotal).quantize(Decimal('0.01'))
        super().save(*args, **kwargs)


class PurchaseApproval(BaseModel):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='approvals')
    tier = models.PositiveSmallIntegerField(default=1) # 1: Manager, 2: Admin
    action = models.CharField(max_length=20, choices=[('APPROVED', 'Approved'), ('REJECTED', 'Rejected'), ('CHANGES_REQUESTED', 'Changes Requested')])
    action_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Purchase Approval'
        verbose_name_plural = 'Purchase Approvals'
        ordering = ['created_at']
