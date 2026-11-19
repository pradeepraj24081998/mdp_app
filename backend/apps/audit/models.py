import uuid
from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Soft Deleted'),
        ('APPROVE', 'Approved'),
        ('REJECT', 'Rejected'),
        ('VERIFY', 'Verified'),
        ('DISPATCH', 'Dispatched'),
        ('RECEIVE', 'Received'),
        ('CANCEL', 'Cancelled'),
        ('LOGIN', 'User Login'),
        ('LOGOUT', 'User Logout'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=30, choices=ACTION_CHOICES, db_index=True)
    module = models.CharField(max_length=50, db_index=True) # e.g. PURCHASING, INVENTORY, PRODUCTION, SALES
    object_id = models.CharField(max_length=100, db_index=True)
    object_repr = models.CharField(max_length=255, blank=True)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-timestamp']

    def __str__(self):
        user_str = self.user.email if self.user else 'System'
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {user_str} - {self.action} on {self.module} ({self.object_repr})"

    def save(self, *args, **kwargs):
        # Prevent modification after initial insert
        if self.pk and AuditLog.objects.filter(pk=self.pk).exists():
            raise PermissionError("Audit log records are immutable and cannot be modified.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError("Audit log records cannot be deleted.")
