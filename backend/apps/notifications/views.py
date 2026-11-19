from django.db import models
from rest_framework import viewsets
from rest_framework.decorators import action
from django.utils import timezone
from common.responses import success_response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Notification.objects.none()
        return Notification.objects.filter(is_deleted=False).filter(
            models.Q(recipient=user) | models.Q(recipient__isnull=True)
        ).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.read_at = timezone.now()
        notif.save(update_fields=['is_read', 'read_at'])
        return success_response(data=self.get_serializer(notif).data, message="Notification marked as read.")

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True, read_at=timezone.now())
        return success_response(message="All notifications marked as read.")

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return success_response(data={'unread_count': count}, message="Unread count fetched.")
