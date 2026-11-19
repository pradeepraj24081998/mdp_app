import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from common.models import BaseModel

class StockBalance(models.Model):
    """
    Current stock balance snapshot per item (Material or Product) and Location.
    Updated strictly via InventoryService with row-level locks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    material = models.ForeignKey(
        'masters.Material',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='stock_balances'
    )
    product = models.ForeignKey(
        'masters.Product',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='stock_balances'
    )
    location = models.ForeignKey(
        'masters.ProductionUnit',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='stock_balances'
    )
    batch_number = models.CharField(max_length=100, blank=True, default='')
    usable_quantity = models.DecimalField(max_digits=14, decimal_places=4, default=Decimal('0.0000'))
    reserved_quantity = models.DecimalField(max_digits=14, decimal_places=4, default=Decimal('0.0000'))
    quarantined_quantity = models.DecimalField(max_digits=14, decimal_places=4, default=Decimal('0.0000'))
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Stock Balance'
        verbose_name_plural = 'Stock Balances'
        indexes = [
            models.Index(fields=['material', 'location']),
            models.Index(fields=['product', 'location']),
        ]
        ordering = ['-updated_at']

    def __str__(self):
        item_name = self.material.name if self.material else (self.product.product_name if self.product else 'Unknown')
        loc_name = self.location.name if self.location else 'Main Warehouse'
        return f"{item_name} @ {loc_name}: {self.usable_quantity}"


class StockTransaction(models.Model):
    """
    Immutable, append-only double entry ledger for every stock change.
    Never deleted or updated.
    """
    TRANSACTION_TYPES = [
        ('OPENING_STOCK', 'Opening Stock'),
        ('PURCHASE_IN', 'Purchase Inward Received'),
        ('PURCHASE_RETURN', 'Purchase Return / Vendor Return'),
        ('PRODUCTION_ISSUE', 'Production Dispatch / Material Issue'),
        ('PRODUCTION_CONSUMPTION', 'Production Material Consumption'),
        ('PRODUCTION_OUTPUT', 'Production Finished Goods Output'),
        ('SALES_OUT', 'Sales Order Dispatch'),
        ('SALES_RETURN', 'Sales Return Inward'),
        ('STOCK_ADJUSTMENT', 'Physical Stock Adjustment'),
        ('TRANSFER_IN', 'Transfer In'),
        ('TRANSFER_OUT', 'Transfer Out'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction_type = models.CharField(max_length=50, choices=TRANSACTION_TYPES, db_index=True)
    material = models.ForeignKey('masters.Material', on_delete=models.PROTECT, null=True, blank=True, related_name='stock_transactions')
    product = models.ForeignKey('masters.Product', on_delete=models.PROTECT, null=True, blank=True, related_name='stock_transactions')
    quantity = models.DecimalField(max_digits=14, decimal_places=4)
    unit = models.ForeignKey('masters.Unit', on_delete=models.PROTECT)
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    value = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    reference_type = models.CharField(max_length=50, db_index=True) # e.g. InwardReceipt, SalesOrder
    reference_id = models.UUIDField(db_index=True)
    from_location = models.ForeignKey('masters.ProductionUnit', on_delete=models.PROTECT, null=True, blank=True, related_name='outgoing_transactions')
    to_location = models.ForeignKey('masters.ProductionUnit', on_delete=models.PROTECT, null=True, blank=True, related_name='incoming_transactions')
    balance_after = models.DecimalField(max_digits=14, decimal_places=4, default=Decimal('0.0000'))
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='stock_transactions')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = 'Stock Transaction'
        verbose_name_plural = 'Stock Transactions'
        ordering = ['-created_at']

    def __str__(self):
        item = self.material.name if self.material else (self.product.product_name if self.product else 'Item')
        return f"[{self.transaction_type}] {item} ({self.quantity}) on {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class OpeningStock(BaseModel):
    opening_number = models.CharField(max_length=50, unique=True, db_index=True)
    material = models.ForeignKey('masters.Material', on_delete=models.PROTECT, null=True, blank=True)
    product = models.ForeignKey('masters.Product', on_delete=models.PROTECT, null=True, blank=True)
    unit = models.ForeignKey('masters.Unit', on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=14, decimal_places=4)
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    value = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    location = models.ForeignKey('masters.ProductionUnit', on_delete=models.PROTECT, null=True, blank=True)
    reason = models.TextField(blank=True)
    is_posted = models.BooleanField(default=False)
    date = models.DateField()

    class Meta:
        verbose_name = 'Opening Stock'
        verbose_name_plural = 'Opening Stock Entries'
        ordering = ['-created_at', '-date']


class StockAdjustment(BaseModel):
    ADJUSTMENT_TYPES = [
        ('PHYSICAL_COUNT', 'Physical Stock Count Discrepancy'),
        ('DAMAGE_WRITE_OFF', 'Damage Write-off'),
        ('EXPIRY', 'Expiry'),
        ('CORRECTION', 'Data Entry Correction'),
    ]

    adjustment_number = models.CharField(max_length=50, unique=True, db_index=True)
    material = models.ForeignKey('masters.Material', on_delete=models.PROTECT, null=True, blank=True)
    product = models.ForeignKey('masters.Product', on_delete=models.PROTECT, null=True, blank=True)
    unit = models.ForeignKey('masters.Unit', on_delete=models.PROTECT)
    location = models.ForeignKey('masters.ProductionUnit', on_delete=models.PROTECT, null=True, blank=True)
    system_quantity = models.DecimalField(max_digits=14, decimal_places=4)
    physical_quantity = models.DecimalField(max_digits=14, decimal_places=4)
    difference_quantity = models.DecimalField(max_digits=14, decimal_places=4)
    reason_type = models.CharField(max_length=50, choices=ADJUSTMENT_TYPES, default='PHYSICAL_COUNT')
    reason = models.TextField()
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_adjustments')
    is_approved = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Stock Adjustment'
        verbose_name_plural = 'Stock Adjustments'
        ordering = ['-created_at']


class StockTransfer(BaseModel):
    transfer_number = models.CharField(max_length=50, unique=True, db_index=True)
    material = models.ForeignKey('masters.Material', on_delete=models.PROTECT, null=True, blank=True)
    product = models.ForeignKey('masters.Product', on_delete=models.PROTECT, null=True, blank=True)
    unit = models.ForeignKey('masters.Unit', on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=14, decimal_places=4)
    from_location = models.ForeignKey('masters.ProductionUnit', on_delete=models.PROTECT, related_name='transfers_from')
    to_location = models.ForeignKey('masters.ProductionUnit', on_delete=models.PROTECT, related_name='transfers_to')
    notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Stock Transfer'
        verbose_name_plural = 'Stock Transfers'
        ordering = ['-created_at']
