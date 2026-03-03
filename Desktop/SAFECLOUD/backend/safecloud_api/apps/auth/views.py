from rest_framework import status, viewsets, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from safecloud_api.apps.companies.models import User
from safecloud_api.core.serializers import UserSerializer, UserDetailSerializer
from safecloud_api.core.utils import log_audit_event, update_user_last_login


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        update_user_last_login(user)
        log_audit_event(
            actor_user=user,
            action='LOGIN',
            company=user.company,
            ip=self.context['request'].META.get('REMOTE_ADDR'),
            user_agent=self.context['request'].META.get('HTTP_USER_AGENT')
        )
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LoginView(generics.GenericAPIView):
    serializer_class = UserSerializer
    permission_classes = []
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        try:
            user = User.objects.get(email=email)
            
            # ✅ CRÍTICO: Validar que el usuario está activo
            if not user.is_active:
                log_audit_event(
                    actor_user=user,
                    action='LOGIN_FAILED',
                    company=user.company,
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT'),
                    data={'reason': 'User is inactive'}
                )
                return Response({'error': 'Usuario desactivado'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # ✅ CRÍTICO: Validar que la empresa está activa (si el usuario tiene empresa asignada)
            if user.company and user.company.status == 'INACTIVE':
                log_audit_event(
                    actor_user=user,
                    action='LOGIN_FAILED',
                    company=user.company,
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT'),
                    data={'reason': 'Company is inactive'}
                )
                return Response({'error': 'Empresa inactiva. Contacta a soporte.'}, status=status.HTTP_403_FORBIDDEN)
            
            if user.check_password(password):
                update_user_last_login(user)
                log_audit_event(
                    actor_user=user,
                    action='LOGIN_SUCCESS',
                    company=user.company,
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT')
                )
                
                # Generar tokens JWT
                refresh = RefreshToken.for_user(user)
                
                serializer = UserDetailSerializer(user)
                return Response({
                    'user': serializer.data,
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'message': 'Login exitoso'
                }, status=status.HTTP_200_OK)
            else:
                log_audit_event(
                    actor_user=user,
                    action='LOGIN_FAILED',
                    company=user.company,
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT'),
                    data={'reason': 'Invalid password'}
                )
                return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)


class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = []
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        log_audit_event(
            actor_user=user,
            action='USER_CREATED',
            company=user.company,
            data={'user_id': str(user.id)}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current authenticated user info"""
    serializer = UserDetailSerializer(request.user)
    return Response(serializer.data)
