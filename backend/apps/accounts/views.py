from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from common.responses import success_response, error_response
from common.services import DocumentNumberService
from .models import User, Role, Permission
from .serializers import UserSerializer, RoleSerializer, PermissionSerializer, LoginSerializer

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success_response(
            data=serializer.validated_data,
            message="Logged in successfully"
        )

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        user = request.user
        perms = set()
        for ur in user.user_roles.filter(is_deleted=False).select_related('role'):
            role_perms = ur.role.role_permissions.filter(is_deleted=False).values_list('permission__code', flat=True)
            perms.update(role_perms)

        roles = [ur.role.code for ur in user.user_roles.filter(is_deleted=False).select_related('role')]
        if user.is_superuser:
            roles.append('SUPER_ADMIN')

        data = {
            'user': UserSerializer(user).data,
            'roles': roles,
            'permissions': list(perms)
        }
        return success_response(data=data, message="Profile fetched successfully")

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def logout(self, request):
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        return success_response(message="Logged out successfully")


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    filterset_fields = ['is_active', 'is_staff']
    search_fields = ['email', 'username', 'first_name', 'last_name', 'phone']
    ordering_fields = ['created_at', 'email', 'first_name']
    ordering = ['-created_at']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return success_response(
            data=UserSerializer(user).data,
            message=f"User account '{user.email or user.username}' created successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return success_response(
            data=UserSerializer(user).data,
            message=f"User account '{user.email or user.username}' updated successfully."
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.id == instance.id:
            return error_response(
                message="You cannot delete your own currently logged-in user account.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        if instance.is_superuser:
            superuser_count = User.objects.filter(is_superuser=True).count()
            if superuser_count <= 1:
                return error_response(
                    message="Cannot delete the primary/last system super administrator.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        display_name = instance.email or instance.username
        try:
            instance.delete()
            return success_response(message=f"User account '{display_name}' has been deleted successfully.")
        except Exception as e:
            return error_response(
                message=f"Cannot delete user '{display_name}': {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.filter(is_deleted=False).order_by('-created_at')
    serializer_class = RoleSerializer
    filterset_fields = ['status']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['created_at', 'name', 'code']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'], url_path='next-code')
    def next_code(self, request):
        code = DocumentNumberService.peek_next_code(prefix='ROL', model=Role, field_name='code', padding=3)
        return success_response(data={'code': code})

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.code in ['SUPER_ADMIN', 'ADMIN']:
            return error_response(
                message=f"System standard role '{instance.name}' ({instance.code}) is core to system security and cannot be deleted.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        active_users_count = instance.role_assignments.filter(is_deleted=False).count()
        if active_users_count > 0:
            return error_response(
                message=f"Cannot delete role '{instance.name}' because it is assigned to {active_users_count} active user(s). Please reassign users before deleting.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        display_name = instance.name
        instance.delete()
        return success_response(message=f"Role '{display_name}' has been deleted successfully.")


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.filter(is_deleted=False).order_by('module', 'name')
    serializer_class = PermissionSerializer
    filterset_fields = ['module']
    search_fields = ['name', 'code', 'module']
    pagination_class = None
