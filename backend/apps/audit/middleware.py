import threading
import json
import logging

_thread_locals = threading.local()
logger = logging.getLogger(__name__)

def get_current_request():
    return getattr(_thread_locals, 'request', None)

class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.request = request
        response = self.get_response(request)
        _thread_locals.request = None

        # Automatically capture mutating operational actions
        try:
            if request.path.startswith('/api/v1/') and request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
                # Skip auth token refresh and schema endpoints
                if not any(skip in request.path for skip in ['/auth/refresh', '/schema', '/docs', '/redoc', '/audit-logs']):
                    if 200 <= response.status_code < 400:
                        self._log_activity(request, response)
        except Exception as e:
            logger.warning(f"Failed to record audit log: {e}")

        return response

    def _log_activity(self, request, response):
        from .models import AuditLog

        path = request.path.lower()

        # Determine module
        if '/materials' in path: module = 'MATERIALS'
        elif '/products' in path: module = 'PRODUCTS'
        elif '/vendors' in path: module = 'VENDORS'
        elif '/customers' in path: module = 'CUSTOMERS'
        elif '/units' in path: module = 'UNITS'
        elif '/production-units' in path: module = 'PRODUCTION_UNITS'
        elif '/purchases' in path: module = 'PURCHASING'
        elif '/inward' in path or '/damaged-returns' in path: module = 'INWARD'
        elif '/inventory' in path: module = 'INVENTORY'
        elif '/production' in path: module = 'PRODUCTION'
        elif '/sales' in path: module = 'SALES'
        elif '/planning' in path: module = 'PLANNING'
        elif '/shipping' in path: module = 'SHIPPING'
        elif '/employees' in path: module = 'EMPLOYEES'
        elif '/users' in path or '/roles' in path: module = 'ACCOUNTS'
        elif '/notifications' in path: module = 'NOTIFICATIONS'
        else: module = 'SYSTEM'

        # Determine action
        if 'verify' in path: action = 'VERIFY'
        elif 'approve' in path: action = 'APPROVE'
        elif 'reject' in path: action = 'REJECT'
        elif 'dispatch' in path: action = 'DISPATCH'
        elif 'receive' in path: action = 'RECEIVE'
        elif 'cancel' in path: action = 'CANCEL'
        elif 'login' in path: action = 'LOGIN'
        elif request.method == 'POST': action = 'CREATE'
        elif request.method in ['PUT', 'PATCH']: action = 'UPDATE'
        elif request.method == 'DELETE': action = 'DELETE'
        else: action = 'UPDATE'

        user = getattr(request, 'user', None)
        if user and not user.is_authenticated:
            user = None

        ip_addr = request.META.get('HTTP_X_FORWARDED_FOR')
        if ip_addr:
            ip_addr = ip_addr.split(',')[0].strip()
        else:
            ip_addr = request.META.get('REMOTE_ADDR', '127.0.0.1')

        # Object representation
        object_repr = f"{request.method} {request.path}"
        object_id = 'N/A'

        try:
            # Check response data
            if hasattr(response, 'data') and isinstance(response.data, dict):
                data = response.data.get('data') or response.data
                if isinstance(data, dict):
                    object_id = str(data.get('id') or data.get('purchase_number') or data.get('inward_number') or data.get('planning_number') or 'N/A')
                    object_repr = data.get('purchase_number') or data.get('inward_number') or data.get('name') or data.get('title') or object_repr
        except Exception:
            pass

        AuditLog.objects.create(
            user=user,
            action=action,
            module=module,
            object_id=object_id[:100],
            object_repr=str(object_repr)[:255],
            ip_address=ip_addr,
        )
