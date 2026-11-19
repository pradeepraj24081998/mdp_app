from django.db import models
from common.models import BaseModel

class Unit(BaseModel):
    code = models.CharField(max_length=20, unique=True, db_index=True) # e.g. KG, LT, COUNT, BOX
    name = models.CharField(max_length=50) # Kilogram, Litre, Piece
    symbol = models.CharField(max_length=10, blank=True)

    class Meta:
        verbose_name = 'Unit of Measurement'
        verbose_name_plural = 'Units of Measurement'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.code})"


class Material(BaseModel):
    MATERIAL_TYPES = [
        ('RAW_MATERIAL', 'Raw Material'),
        ('PACKING_MATERIAL', 'Packing Material'),
        ('CONSUMABLE', 'Consumable'),
        ('OTHER', 'Other'),
    ]

    material_code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
    material_type = models.CharField(max_length=50, choices=MATERIAL_TYPES, default='RAW_MATERIAL')
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, related_name='materials')
    minimum_stock = models.DecimalField(max_digits=14, decimal_places=4, default=0.0)
    reorder_level = models.DecimalField(max_digits=14, decimal_places=4, default=0.0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Material'
        verbose_name_plural = 'Materials'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.material_code} - {self.name}"


class Vendor(BaseModel):
    vendor_code = models.CharField(max_length=50, unique=True, db_index=True)
    vendor_name = models.CharField(max_length=200, db_index=True)
    contact_person = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='India')
    pincode = models.CharField(max_length=20, blank=True)
    gst_number = models.CharField(max_length=30, blank=True)
    tax_number = models.CharField(max_length=30, blank=True)
    payment_terms = models.CharField(max_length=100, default='Net 30')
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Vendor'
        verbose_name_plural = 'Vendors'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.vendor_code} - {self.vendor_name}"


class Product(BaseModel):
    product_code = models.CharField(max_length=50, unique=True, db_index=True)
    product_name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, default='Incense Sticks')
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, related_name='products')
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    minimum_stock = models.DecimalField(max_digits=14, decimal_places=4, default=0.0)

    class Meta:
        verbose_name = 'Finished Good / Product'
        verbose_name_plural = 'Finished Goods / Products'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.product_code} - {self.product_name}"


class Customer(BaseModel):
    CUSTOMER_TYPES = [
        ('DEALER', 'Dealer'),
        ('WHOLESALER', 'Wholesaler'),
        ('RETAILER', 'Retailer'),
        ('OTHER', 'Other'),
    ]

    customer_code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200, db_index=True)
    customer_type = models.CharField(max_length=30, choices=CUSTOMER_TYPES, default='DEALER')
    contact_person = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=20, blank=True)
    gst_number = models.CharField(max_length=30, blank=True)
    credit_limit = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)
    payment_terms = models.CharField(max_length=100, default='Net 15')

    class Meta:
        verbose_name = 'Customer / Dealer'
        verbose_name_plural = 'Customers / Dealers'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.customer_code} - {self.name} ({self.customer_type})"


class ProductionUnit(BaseModel):
    production_unit_code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    address = models.TextField(blank=True)
    manager = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_units'
    )

    class Meta:
        verbose_name = 'Production Unit'
        verbose_name_plural = 'Production Units'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.production_unit_code} - {self.name}"


class ProductionUnitEmployee(BaseModel):
    UNIT_ROLES = [
        ('SUPERVISOR', 'Supervisor'),
        ('OPERATOR', 'Machine Operator'),
        ('MATERIAL_HANDLER', 'Material Handler'),
        ('QUALITY_CHECKER', 'Quality Checker'),
        ('PACKER', 'Packer'),
    ]

    production_unit = models.ForeignKey(ProductionUnit, on_delete=models.CASCADE, related_name='unit_employees')
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='unit_assignments')
    role = models.CharField(max_length=50, choices=UNIT_ROLES, default='OPERATOR')
    joined_date = models.DateField()
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Production Unit Employee'
        verbose_name_plural = 'Production Unit Employees'
        unique_together = ('production_unit', 'employee', 'role')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee.name} @ {self.production_unit.name} ({self.role})"


class Warehouse(BaseModel):
    WAREHOUSE_TYPES = [
        ('RAW_MATERIAL', 'Raw Material Godown'),
        ('FINISHED_GOODS', 'Finished Goods Depot'),
        ('PACKAGING', 'Packaging & Consumables'),
        ('QUARANTINE', 'Quarantine / Hold Area'),
        ('TRANSIT', 'In-Transit / Buffer Store'),
        ('GENERAL', 'Central Store / General'),
    ]

    warehouse_code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200, db_index=True)
    warehouse_type = models.CharField(max_length=50, choices=WAREHOUSE_TYPES, default='GENERAL')
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=20, blank=True)
    manager = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_warehouses'
    )
    contact_phone = models.CharField(max_length=30, blank=True)
    contact_email = models.EmailField(blank=True)
    capacity_sqft = models.DecimalField(max_digits=12, decimal_places=2, default=0.0, blank=True)
    production_unit = models.ForeignKey(
        'masters.ProductionUnit',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='warehouses',
        help_text="Associated manufacturing plant if co-located"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Warehouse'
        verbose_name_plural = 'Warehouses'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.warehouse_code} - {self.name} ({self.get_warehouse_type_display()})"

