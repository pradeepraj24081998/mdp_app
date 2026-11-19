from .models import AuditLog
from .middleware import get_current_request

class AuditService:
    @classmethod
    def log(
        cls,
        *,
        action: str,
        module: str,
        object_id: str,
        object_repr: str = '',
        old_value=None,
        new_value=None,
        user=None,
        request=None
    ) -> AuditLog:
        req = request or get_current_request()
        effective_user = user
        ip_addr = None

        if req:
            if not effective_user and hasattr(req, 'user') and req.user.is_authenticated:
                effective_user = req.user
            # Extract client IP
            x_forwarded_for = req.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_addr = x_forwarded_for.split(',')[0].strip()
            else:
                ip_addr = req.META.get('REMOTE_ADDR')

        return AuditLog.objects.create(
            user=effective_user,
            action=action,
            module=module,
            object_id=str(object_id),
            object_repr=object_repr,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_addr
        )
