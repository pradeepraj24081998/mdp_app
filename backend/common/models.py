import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone

class SoftDeleteQuerySet(models.QuerySet):
    def delete(self, hard=False):
        if hard:
            return super().delete()
        return self.update(is_deleted=True, updated_at=timezone.now())

    def hard_delete(self):
        return super().delete()

    def restore(self):
        return self.update(is_deleted=False, updated_at=timezone.now())

    def alive(self):
        return self.filter(is_deleted=False)

    def dead(self):
        return self.filter(is_deleted=True)

class SoftDeleteManager(models.Manager):
    def __init__(self, *args, **kwargs):
        self.alive_only = kwargs.pop('alive_only', True)
        super().__init__(*args, **kwargs)

    def get_queryset(self):
        if self.alive_only:
            return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)
        return SoftDeleteQuerySet(self.model, using=self._db)

    def hard_delete(self):
        return self.get_queryset().hard_delete()


class BaseModel(models.Model):
    """
    Common base model for all business models.
    Uses UUID primary keys, soft deletion, audit timestamps, and user footprints.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    status = models.CharField(max_length=50, default='ACTIVE', db_index=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_created",
        help_text="User who created this record"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_updated",
        help_text="User who last updated this record"
    )

    objects = SoftDeleteManager()
    all_objects = SoftDeleteManager(alive_only=False)

    class Meta:
        abstract = True
        ordering = ['-created_at']

    def delete(self, using=None, keep_parents=False, hard=False):
        if hard:
            return super().delete(using=using, keep_parents=keep_parents)
        self.is_deleted = True
        self.save(update_fields=['is_deleted', 'updated_at'])

    def restore(self):
        self.is_deleted = False
        self.save(update_fields=['is_deleted', 'updated_at'])


class DocumentSequence(models.Model):
    """
    Tracks sequential document numbers (e.g. PO-000001, SO-000001)
    guaranteeing concurrency safety and gapless/traceable sequence.
    """
    prefix = models.CharField(max_length=20, unique=True, db_index=True)
    current_value = models.PositiveBigIntegerField(default=0)
    padding_length = models.PositiveSmallIntegerField(default=6)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Document Sequence"
        verbose_name_plural = "Document Sequences"

    def __str__(self):
        return f"{self.prefix} (Current: {self.current_value})"
