import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from common.models import BaseModel

class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        if not username:
            raise ValueError('Username is required')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Accounts User model represents digital authentication identity.
    Distinct from physical employees.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    username = models.CharField(max_length=150, unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email} ({self.get_full_name() or self.username})"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class Role(BaseModel):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Permission(BaseModel):
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=100, unique=True, db_index=True)
    module = models.CharField(max_length=50, db_index=True) # e.g. PURCHASING, INVENTORY, SALES
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Permission'
        verbose_name_plural = 'Permissions'
        ordering = ['module', 'name']

    def __str__(self):
        return f"{self.module} - {self.name} ({self.code})"


class UserRole(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_assignments')

    class Meta:
        verbose_name = 'User Role Assignment'
        verbose_name_plural = 'User Role Assignments'
        unique_together = ('user', 'role')

    def __str__(self):
        return f"{self.user.email} -> {self.role.name}"


class RolePermission(BaseModel):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='permission_roles')

    class Meta:
        verbose_name = 'Role Permission'
        verbose_name_plural = 'Role Permissions'
        unique_together = ('role', 'permission')

    def __str__(self):
        return f"{self.role.name} -> {self.permission.code}"
