from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import AuthViewSet, UserViewSet, RoleViewSet, PermissionViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')

urlpatterns = [
    path('auth/login/', AuthViewSet.as_view({'post': 'login'}), name='auth-login'),
    path('auth/me/', AuthViewSet.as_view({'get': 'me'}), name='auth-me'),
    path('auth/logout/', AuthViewSet.as_view({'post': 'logout'}), name='auth-logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('', include(router.urls)),
]
