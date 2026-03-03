from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from safecloud_api.apps.companies.models import Company, User, StaffCompany, Plan, Role, Permission, RolePermission
from safecloud_api.core.serializers import CompanySerializer, PlanSerializer, UserSerializer, PermissionSerializer, RoleSerializer, RolePermissionSerializer
from safecloud_api.core.permissions import IsCompanyAdmin, IsStaffUser, HasCompanyAccess
from safecloud_api.core.utils import log_audit_event
from safecloud_api.core.plan_validator import PlanValidator
from safecloud_api.decorators import has_permission


class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]
    queryset = Company.objects.all()  # Define queryset explicitly
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPERADMIN':
            return Company.objects.all()
        return Company.objects.filter(id=user.company.id)
    
    def create(self, request, *args, **kwargs):
        # DEBUG: Log the request
        import sys
        print(f"DEBUG: create() called for user {request.user.email} (role: {request.user.role})", file=sys.stderr)
        
        # Allow SUPERADMIN and STAFF_PM to create companies
        if request.user.role not in ['SUPERADMIN', 'STAFF_PM']:
            return Response({'error': 'Only SUPERADMIN and STAFF_PM can create companies'}, status=status.HTTP_403_FORBIDDEN)
        
        print(f"DEBUG: User is authorized", file=sys.stderr)
        response = super().create(request, *args, **kwargs)
        if response.status_code == 201:
            log_audit_event(
                actor_user=request.user,
                action='COMPANY_CREATED',
                company=Company.objects.get(id=response.data['id']),
                ip=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
                data={'company_id': response.data['id']}
            )
        return response
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        company = self.get_object()
        if request.user.role != 'SUPERADMIN':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        company.status = 'ACTIVE'
        company.save()
        log_audit_event(
            actor_user=request.user,
            action='COMPANY_ACTIVATED',
            company=company,
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )
        return Response(CompanySerializer(company).data)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        company = self.get_object()
        if request.user.role != 'SUPERADMIN':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        company.status = 'INACTIVE'
        company.save()
        log_audit_event(
            actor_user=request.user,
            action='COMPANY_DEACTIVATED',
            company=company,
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )
        return Response(CompanySerializer(company).data)
    
    @action(detail=True, methods=['get'])
    def limits(self, request, pk=None):
        """Obtener límites de plan de una empresa"""
        company = self.get_object()
        if request.user.role != 'SUPERADMIN' and request.user.company != company:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        limits = PlanValidator.validate_all_limits(company, check_type='all')
        return Response(limits)


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [IsAuthenticated]


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsCompanyAdmin]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPERADMIN':
            return User.objects.all()
        return User.objects.filter(company=user.company)
    
    def create(self, request, *args, **kwargs):
        if request.user.role not in ['SUPERADMIN', 'CLIENT_ADMIN']:
            return Response({'error': 'Permiso denegado'}, status=status.HTTP_403_FORBIDDEN)
        
        # ✅ CRÍTICO: Validar límites de plan
        # El usuario que está creando debe tener una empresa asignada
        requester_company = request.user.company if request.user.role == 'CLIENT_ADMIN' else None
        
        # Si es CLIENT_ADMIN, valida límites de su propia empresa
        # Si es SUPERADMIN, valida la empresa especificada en el request
        if request.user.role == 'CLIENT_ADMIN' and requester_company:
            allowed, error_msg = PlanValidator.check_user_limit(requester_company)
            if not allowed:
                log_audit_event(
                    actor_user=request.user,
                    action='USER_CREATION_FAILED',
                    company=requester_company,
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT'),
                    data={'reason': 'Plan limit exceeded'}
                )
                return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
        elif request.user.role == 'SUPERADMIN':
            # SUPERADMIN puede crear para cualquier empresa
            company_id = request.data.get('company')
            if company_id:
                try:
                    target_company = Company.objects.get(id=company_id)
                    allowed, error_msg = PlanValidator.check_user_limit(target_company)
                    if not allowed:
                        log_audit_event(
                            actor_user=request.user,
                            action='USER_CREATION_FAILED',
                            company=target_company,
                            ip=request.META.get('REMOTE_ADDR'),
                            user_agent=request.META.get('HTTP_USER_AGENT'),
                            data={'reason': 'Plan limit exceeded'}
                        )
                        return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
                except Company.DoesNotExist:
                    return Response({'error': 'Empresa no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        response = super().create(request, *args, **kwargs)
        if response.status_code == 201:
            log_audit_event(
                actor_user=request.user,
                action='USER_CREATED',
                company=request.user.company,
                ip=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
                data={'created_user_id': response.data['id'], 'role': response.data.get('role')}
            )
        return response
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save()
        log_audit_event(
            actor_user=request.user,
            action='USER_DEACTIVATED',
            company=request.user.company,
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            data={'deactivated_user_id': str(user.id)}
        )
        return Response(UserSerializer(user).data)


# ============= RBAC Views =============

from safecloud_api.apps.companies.models import Role, Permission, RolePermission
from safecloud_api.core.serializers import (
    RoleSerializer, PermissionSerializer, RolePermissionSerializer
)
from safecloud_api.decorators import require_role, has_permission


class RoleViewSet(viewsets.ModelViewSet):
    """API endpoint for roles"""
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only SUPERADMIN can list all roles
        if self.request.user.role == 'SUPERADMIN':
            return Role.objects.all()
        # Other users cannot list roles
        return Role.objects.none()
    
    def create(self, request, *args, **kwargs):
        # Only SUPERADMIN can create roles
        if request.user.role != 'SUPERADMIN':
            return Response(
                {'detail': 'Solo SUPERADMIN puede crear roles'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for permissions"""
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only SUPERADMIN can list permissions
        if self.request.user.role == 'SUPERADMIN':
            return Permission.objects.all()
        return Permission.objects.none()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_permission(request):
    """
    Check if current user has permission for module.action
    Body: {"module": "PROJECTS", "action": "CREATE"}
    """
    module = request.data.get('module')
    action = request.data.get('action')
    
    if not module or not action:
        return Response(
            {'detail': 'module y action son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user_has_permission = has_permission(request.user, module, action)
    
    return Response({
        'user': request.user.email,
        'role': request.user.role,
        'module': module,
        'action': action,
        'has_permission': user_has_permission
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_permissions(request):
    """Get all permissions for current user"""
    if request.user.role == 'SUPERADMIN':
        permissions = Permission.objects.all().values_list('code', flat=True)
        return Response({
            'user': request.user.email,
            'role': request.user.role,
            'permissions': list(permissions)
        })
    
    # Get role's permissions
    try:
        role_perms = RolePermission.objects.filter(
            role__code=request.user.role
        ).values_list('permission__code', flat=True)
        
        return Response({
            'user': request.user.email,
            'role': request.user.role,
            'permissions': list(role_perms)
        })
    except Exception as e:
        return Response({
            'user': request.user.email,
            'role': request.user.role,
            'permissions': []
        })


class RolePermissionViewSet(viewsets.ModelViewSet):
    """API endpoint for role permissions assignment"""
    queryset = RolePermission.objects.all()
    serializer_class = RolePermissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'SUPERADMIN':
            return RolePermission.objects.all()
        return RolePermission.objects.none()
    
    def create(self, request, *args, **kwargs):
        if request.user.role != 'SUPERADMIN':
            return Response(
                {'detail': 'Solo SUPERADMIN puede asignar permisos'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

