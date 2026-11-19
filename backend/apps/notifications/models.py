from django.db import models
from django.conf import settings
from common.models import BaseModel

class Notification(BaseModel):
    NOTIFICATION_TYPES = [
        ('PURCHASE_APPROVAL', 'Purchase Approval Required'),
        ('LOW_STOCK', 'Low Stock Warning'),
        ('MATERIAL_RECEIVED', 'Material Received at Gate'),
        ('DAMAGED_MATERIAL', 'Damaged Material Reported'),
        ('PRODUCTION_COMPLETED', 'Production Batch Completed'),
        ('PAYMENT_RECEIVED', 'Customer Payment Received'),
        ('SHIPMENT_DELIVERED', 'Shipment Delivered'),
        ('INVOICE_GENERATED', 'Tax Invoice Generated'),
        ('GENERAL', 'General Alert'),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        help_text="Target user, or null if broadcast to managers"
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default='GENERAL')
    reference_module = models.CharField(max_length=50, blank=True)
    reference_id = models.UUIDField(null=True, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.title}"
