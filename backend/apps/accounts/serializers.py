from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, Role, Permission, UserRole, RolePermission

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'code', 'module', 'description']


class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    permission_ids = serializers.ListField(child=serializers.UUIDField(), write_only=True, required=False)

    class Meta:
        model = Role
        fields = ['id', 'name', 'code', 'description', 'status', 'permissions', 'permission_ids', 'created_at']

    def get_permissions(self, obj):
        perms = Permission.objects.filter(permission_roles__role=obj, permission_roles__is_deleted=False)
        return PermissionSerializer(perms, many=True).data

    def create(self, validated_data):
        permission_ids = validated_data.pop('permission_ids', [])
        role = super().create(validated_data)
        for perm_id in permission_ids:
            RolePermission.objects.create(role=role, permission_id=perm_id)
        return role

    def update(self, instance, validated_data):
        permission_ids = validated_data.pop('permission_ids', None)
        role = super().update(instance, validated_data)
        if permission_ids is not None:
            RolePermission.objects.filter(role=role).delete(hard=True)
            for perm_id in permission_ids:
                RolePermission.objects.create(role=role, permission_id=perm_id)
        return role


class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    role_ids = serializers.ListField(child=serializers.UUIDField(), write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'phone', 'is_active', 'is_staff', 'roles', 'role_ids', 'password',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_password(self, value):
        if value and len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value

    def get_roles(self, obj):
        roles = Role.objects.filter(role_assignments__user=obj, role_assignments__is_deleted=False)
        return [{'id': r.id, 'name': r.name, 'code': r.code} for r in roles]

    def create(self, validated_data):
        role_ids = validated_data.pop('role_ids', [])
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Password is required when creating a new user account.'})
        user = User.objects.create_user(**validated_data, password=password)
        for r_id in role_ids:
            UserRole.objects.create(user=user, role_id=r_id)
        return user

    def update(self, instance, validated_data):
        role_ids = validated_data.pop('role_ids', None)
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password and password.strip():
            user.set_password(password)
            user.save()
        if role_ids is not None:
            UserRole.objects.filter(user=user).delete(hard=True)
            for r_id in role_ids:
                UserRole.objects.create(user=user, role_id=r_id)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('This account has been deactivated.')

        refresh = RefreshToken.for_user(user)

        # Collect user permissions
        perms = set()
        for ur in user.user_roles.filter(is_deleted=False).select_related('role'):
            role_perms = ur.role.role_permissions.filter(is_deleted=False).values_list('permission__code', flat=True)
            perms.update(role_perms)

        roles = [ur.role.code for ur in user.user_roles.filter(is_deleted=False).select_related('role')]
        if user.is_superuser:
            roles.append('SUPER_ADMIN')

        return {
            'user': UserSerializer(user).data,
            'roles': roles,
            'permissions': list(perms),
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
