from decimal import Decimal
from django.db import models
from common.models import BaseModel

class Shipment(BaseModel):
    STATUS_CHOICES = [
        ('CREATED', 'Shipment Created'),
        ('DISPATCHED', 'Dispatched'),
        ('IN_TRANSIT', 'In Transit'),
        ('RECEIVED', 'Received at Gate'),
        ('PARTIALLY_RECEIVED', 'Partially Received'),
        ('DAMAGED', 'Damaged in Transit'),
        ('RETURNED', 'Returned to Consignor'),
        ('CANCELLED', 'Cancelled'),
    ]

    shipment_number = models.CharField(max_length=50, unique=True, db_index=True)
    purchase_order = models.ForeignKey('purchasing.PurchaseOrder', on_delete=models.SET_NULL, null=True, blank=True, related_name='shipments')
    lr_number = models.CharField(max_length=100, blank=True, db_index=True, verbose_name="LR / Bilty Number")
    from_address = models.CharField(max_length=255)
    to_address = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=30, blank=True)
    date = models.DateField()
    freight_charge = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    parcel_name = models.CharField(max_length=150, blank=True)
    parcel_count = models.PositiveIntegerField(default=1)
    transporter = models.CharField(max_length=150, blank=True)
    vehicle_number = models.CharField(max_length=50, blank=True)
    driver = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='driven_shipments',
        help_text="Driver assigned from workforce employee records"
    )
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Shipment'
        verbose_name_plural = 'Shipments'
        ordering = ['-created_at', '-date']

    def __str__(self):
        return f"{self.shipment_number} ({self.transporter} - LR: {self.lr_number or 'N/A'})"
