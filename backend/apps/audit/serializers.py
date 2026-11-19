from rest_framework import serializers, viewsets
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_email', 'user_name', 'action', 'module', 'object_id', 'object_repr', 'old_value', 'new_value', 'ip_address', 'timestamp']


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('user').order_by('-timestamp')
    serializer_class = AuditLogSerializer
    filterset_fields = ['action', 'module', 'user']
    search_fields = ['object_id', 'object_repr', 'user__email', 'user__username', 'ip_address']
    ordering_fields = ['timestamp', 'action', 'module']
    ordering = ['-timestamp']
