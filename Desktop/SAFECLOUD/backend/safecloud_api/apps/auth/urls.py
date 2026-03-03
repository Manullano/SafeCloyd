from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from safecloud_api.apps.auth.views import CustomTokenObtainPairView, LoginView, RegisterView, current_user

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', current_user, name='current_user'),
]
