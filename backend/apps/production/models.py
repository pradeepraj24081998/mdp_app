from decimal import Decimal
from django.db import models
from common.models import BaseModel

class ProductionOrder(BaseModel):
    STATUS_CHOICES = [
        ('PLANNED', 'Production Planned'),
        ('MATERIAL_REQUESTED', 'Materials Requested'),
        ('MATERIAL_ISSUED', 'Materials Issued & Dispatched'),
        ('IN_PROGRESS', 'Manufacturing In Progress'),
        ('QUALITY_CHECK', 'Under Quality Check'),
        ('COMPLETED', 'Finished Goods Completed & Received'),
        ('REJECTED', 'Batch Quality Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]

    production_number = models.CharField(max_length=50, unique=True, db_index=True)
    production_unit = models.ForeignKey('masters.ProductionUnit', on_delete=models.PROTECT, related_name='production_orders')
    product = models.ForeignKey('masters.Product', on_delete=models.PROTECT, related_name='production_orders')
    batch_number = models.CharField(max_length=100, db_index=True)
    planned_quantity = models.DecimalField(max_digits=14, decimal_places=4)
    actual_quantity = models.DecimalField(max_digits=14, decimal_places=4, default=Decimal('0.0000'))
    start_date = models.DateField()
    expected_completion = models.DateField()
    completed_date = models.DateField(null=True, blank=True)
    supervisor = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='supervised_orders',
        help_text="Floor supervisor assigned from workforce employees"
    )
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Production Order'
        verbose_name_plural = 'Production Orders'
        ordering = ['-created_at', '-start_date']

    def __str__(self):
        return f"{self.production_number} - {self.product.product_name} ({self.status})"


class ProductionOrderEmployee(BaseModel):
    ROLES = [
        ('SUPERVISOR', 'Supervisor'),
        ('OPERATOR', 'Machine Operator'),
        ('MATERIAL_HANDLER', 'Material Handler'),
        ('QUALITY_CHECKER', 'Quality Checker'),
        ('PACKER', 'Packer'),
    ]

    production_order = models.ForeignKey(ProductionOrder, on_delete=models.CASCADE, related_name='assigned_workers')
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='production_assignments')
    role = models.CharField(max_length=50, choices=ROLES, default='OPERATOR')

    class Meta:
        verbose_name = 'Production Order Employee Assignment'
        verbose_name_plural = 'Production Order Employee Assignments'
        unique_together = ('production_order', 'employee', 'role')


class MaterialDispatch(BaseModel):
    dispatch_number = models.CharField(max_length=50, unique=True, db_index=True)
    production_order = models.ForeignKey(ProductionOrder, on_delete=models.PROTECT, related_name='dispatches')
    from_location = models.ForeignKey('masters.ProductionUnit', on_delete=models.PROTECT, null=True, blank=True, related_name='raw_dispatches_out')
    production_unit = models.ForeignKey('masters.ProductionUnit', on_delete=models.PROTECT, related_name='raw_dispatches_in')
    material = models.ForeignKey('masters.Material', on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=14, decimal_places=4)
    unit = models.ForeignKey('masters.Unit', on_delete=models.PROTECT)
    material_handler = models.ForeignKey(
        'employees.Employee',
        on_delete=models.PROTECT,
        related_name='handled_dispatches',
        help_text="Workforce member who physically carried/loaded the raw materials"
    )
    date = models.DateField()
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Material Dispatch'
        verbose_name_plural = 'Material Dispatches'
        ordering = ['-created_at', '-date']


class MaterialConsumption(BaseModel):
    production_order = models.ForeignKey(ProductionOrder, on_delete=models.CASCADE, related_name='consumptions')
    material = models.ForeignKey('masters.Material', on_delete=models.PROTECT)
    planned_quantity = models.DecimalField(max_digits=14, decimal_places=4)
    issued_quantity = models.DecimalField(max_digits=14, decimal_places=4)
    used_quantity = models.DecimalField(max_digits=14, decimal_places=4)
    wastage = models.DecimalField(max_digits=14, decimal_places=4, default=Decimal('0.0000'))
    unit = models.ForeignKey('masters.Unit', on_delete=models.PROTECT)

    class Meta:
        verbose_name = 'Material Consumption'
        verbose_name_plural = 'Material Consumptions'


class FinishedGoodsReceipt(BaseModel):
    QUALITY_STATUSES = [
        ('PASSED', 'Passed Quality Inspection'),
        ('FAILED', 'Failed / Defective'),
        ('REWORK', 'Sent for Rework'),
    ]

    production_order = models.ForeignKey(ProductionOrder, on_delete=models.PROTECT, related_name='goods_receipts')
    product = models.ForeignKey('masters.Product', on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=14, decimal_places=4)
    unit = models.ForeignKey('masters.Unit', on_delete=models.PROTECT)
    batch_number = models.CharField(max_length=100)
    production_unit = models.ForeignKey('masters.ProductionUnit', on_delete=models.PROTECT)
    quality_status = models.CharField(max_length=30, choices=QUALITY_STATUSES, default='PASSED')
    date = models.DateField()

    class Meta:
        verbose_name = 'Finished Goods Receipt'
        verbose_name_plural = 'Finished Goods Receipts'
        ordering = ['-created_at', '-date']
