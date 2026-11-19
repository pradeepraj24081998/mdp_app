from decimal import Decimal
from django.db import models
from django.conf import settings
from common.models import BaseModel

class MaterialPlan(BaseModel):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted for Review'),
        ('UNDER_REVIEW', 'Under Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('PURCHASE_CREATED', 'Purchase Order Created'),
        ('CANCELLED', 'Cancelled'),
    ]

    planning_number = models.CharField(max_length=50, unique=True, db_index=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='DRAFT', db_index=True)
    planning_date = models.DateField()
    vendor = models.ForeignKey('masters.Vendor', on_delete=models.SET_NULL, null=True, blank=True, related_name='material_plans')
    required_date = models.DateField()
    notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_plans')
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Material Plan'
        verbose_name_plural = 'Material Plans'
        ordering = ['-created_at', '-planning_date']

    def __str__(self):
        return f"{self.planning_number} ({self.status})"


class MaterialPlanItem(BaseModel):
    plan = models.ForeignKey(MaterialPlan, on_delete=models.CASCADE, related_name='items')
    material = models.ForeignKey('masters.Material', on_delete=models.PROTECT, related_name='plan_items')
    unit = models.ForeignKey('masters.Unit', on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=14, decimal_places=4)
    estimated_rate = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    class Meta:
        verbose_name = 'Material Plan Item'
        verbose_name_plural = 'Material Plan Items'

    def __str__(self):
        return f"{self.material.name} - {self.quantity} {self.unit.code}"
