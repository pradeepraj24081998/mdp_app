from decimal import Decimal
from django.db import models
from django.conf import settings
from common.models import BaseModel

class InwardReceipt(BaseModel):
    STATUS_CHOICES = [
        ('RECEIVED', 'Gate Received / Pending Verification'),
        ('VERIFIED', 'Quality Verified & Stock Updated'),
        ('PARTIALLY_ACCEPTED', 'Partially Accepted (Damages Found)'),
        ('REJECTED', 'Lot Rejected'),
        ('COMPLETED', 'Completed'),
    ]

    inward_number = models.CharField(max_length=50, unique=True, db_index=True)
    purchase_order = models.ForeignKey('purchasing.PurchaseOrder', on_delete=models.PROTECT, related_name='inward_receipts')
    vendor = models.ForeignKey('masters.Vendor', on_delete=models.PROTECT, related_name='inward_receipts')
    received_date = models.DateField()
    invoice_number = models.CharField(max_length=100, blank=True, verbose_name="Vendor Invoice / Bill No")
    shipment = models.ForeignKey('shipping.Shipment', on_delete=models.SET_NULL, null=True, blank=True, related_name='inward_receipts')
    received_by = models.ForeignKey(
        'employees.Employee',
        on_delete=models.PROTECT,
        related_name='received_inwards',
        help_text="Store keeper / workforce employee who physically received goods at gate"
    )
    is_stock_updated = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Inward Receipt'
        verbose_name_plural = 'Inward Receipts'
        ordering = ['-created_at', '-received_date']

    def __str__(self):
        return f"{self.inward_number} (PO: {self.purchase_order.purchase_number})"


class InwardItem(BaseModel):
    VERIFICATION_STATUSES = [
        ('PENDING', 'Pending Quality Verification'),
        ('ACCEPTED', 'Accepted in Full'),
        ('DAMAGED', 'Damaged Found'),
        ('SHORT', 'Shortage Found'),
        ('EXCESS', 'Excess Found'),
        ('REJECTED', 'Entire Line Rejected'),
    ]

    inward = models.ForeignKey(InwardReceipt, on_delete=models.CASCADE, related_name='items')
    material = models.ForeignKey('masters.Material', on_delete=models.PROTECT, related_name='inward_items')
    ordered_quantity = models.DecimalField(max_digits=14, decimal_places=4)
    received_quantity = models.DecimalField(max_digits=14, decimal_places=4)
    accepted_quantity = models.DecimalField(max_digits=14, decimal_places=4, default=Decimal('0.0000'))
    damaged_quantity = models.DecimalField(max_digits=14, decimal_places=4, default=Decimal('0.0000'))
    rejected_quantity = models.DecimalField(max_digits=14, decimal_places=4, default=Decimal('0.0000'))
    unit = models.ForeignKey('masters.Unit', on_delete=models.PROTECT)
    verification_status = models.CharField(max_length=30, choices=VERIFICATION_STATUSES, default='PENDING')
    remarks = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Inward Item'
        verbose_name_plural = 'Inward Items'

    def __str__(self):
        return f"{self.material.name} - Recv: {self.received_quantity}, Acc: {self.accepted_quantity} {self.unit.code}"


class DamagedMaterialReturn(BaseModel):
    RETURN_TYPES = [
        ('FULL_RETURN', 'Full Return to Vendor'),
        ('PARTIAL_RETURN', 'Partial Return of Damaged Units'),
        ('REPLACEMENT', 'Vendor Replacement'),
        ('CREDIT', 'Credit Note Requested'),
    ]
    STATUS_CHOICES = [
        ('REQUESTED', 'Return Requested'),
        ('DISPATCHED_TO_VENDOR', 'Dispatched to Vendor'),
        ('REPLACED', 'Replacement Received'),
        ('CREDITED', 'Credit Note Received'),
        ('CANCELLED', 'Cancelled'),
    ]

    inward_item = models.ForeignKey(InwardItem, on_delete=models.CASCADE, related_name='return_requests')
    vendor = models.ForeignKey('masters.Vendor', on_delete=models.PROTECT, related_name='material_returns')
    return_type = models.CharField(max_length=30, choices=RETURN_TYPES, default='CREDIT')
    quantity = models.DecimalField(max_digits=14, decimal_places=4)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='REQUESTED')
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Damaged Material Return'
        verbose_name_plural = 'Damaged Material Returns'
