from rest_framework import permissions

class HasModulePermission(permissions.BasePermission):
    """
    Checks if the user has the required permission code (e.g. 'purchase.approve', 'inventory.adjust').
    Superusers bypass all checks.
    """
    def __init__(self, required_permission=None):
        self.required_permission = required_permission

    def __call__(self):
        return self

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser or request.user.is_staff:
            return True

        perm = getattr(view, 'required_permission', self.required_permission)
        if not perm:
            return True

        # Check in user assigned roles & permissions
        user_roles = request.user.user_roles.select_related('role').all()
        for ur in user_roles:
            role_perms = ur.role.role_permissions.select_related('permission').values_list('permission__code', flat=True)
            if perm in role_perms:
                return True

        return False
