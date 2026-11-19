from django.db import models
from django.conf import settings
from common.models import BaseModel

class Department(BaseModel):
    code = models.CharField(max_length=30, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.code})"


class Designation(BaseModel):
    code = models.CharField(max_length=30, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='designations')
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Designation'
        verbose_name_plural = 'Designations'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.department.name}"


class Employee(BaseModel):
    EMPLOYMENT_TYPES = [
        ('PERMANENT', 'Permanent'),
        ('CONTRACT', 'Contract'),
        ('DAILY_WAGE', 'Daily Wage'),
        ('INTERN', 'Intern'),
    ]

    employee_code = models.CharField(max_length=30, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    joining_date = models.DateField()
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='employees')
    designation = models.ForeignKey(Designation, on_delete=models.PROTECT, related_name='employees')
    employment_type = models.CharField(max_length=30, choices=EMPLOYMENT_TYPES, default='PERMANENT')
    production_unit = models.ForeignKey('masters.ProductionUnit', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_employees')
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employee_profile',
        help_text="Optional system login user account linked to this employee"
    )

    class Meta:
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee_code} - {self.name} ({self.designation.name})"
