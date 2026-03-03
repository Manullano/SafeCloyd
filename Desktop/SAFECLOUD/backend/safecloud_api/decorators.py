"""
Permission and Role based decorators for API endpoints
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status


def require_permission(module, action):
    """Decorator to check if user has specific module.action permission"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return Response(
                    {'detail': 'Autenticación requerida'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check permission
            if has_permission(request.user, module, action):
                return view_func(request, *args, **kwargs)
            
            return Response(
                {'detail': f'Permiso denegado: {module}.{action}'},
                status=status.HTTP_403_FORBIDDEN
            )
        return wrapper
    return decorator


def require_role(*allowed_roles):
    """Decorator to check if user has one of the allowed roles"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return Response(
                    {'detail': 'Autenticación requerida'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if request.user.role not in allowed_roles:
                return Response(
                    {'detail': f'Rol requerido: {", ".join(allowed_roles)}'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def has_permission(user, module, action):
    """
    Check if user has permission for module.action
    
    Args:
        user: User object
        module: Module name (e.g., 'PROJECTS', 'TICKETS')
        action: Action name (e.g., 'VIEW', 'CREATE')
    
    Returns:
        bool: True if user has permission, False otherwise
    """
    from django.apps import apps
    
    # SUPERADMIN has all permissions
    if user.role == 'SUPERADMIN':
        return True
    
    try:
        RolePermission = apps.get_model('companies', 'RolePermission')
        Permission = apps.get_model('companies', 'Permission')
        
        # Get user's role
        role_code = user.role
        
        # Check if permission exists
        perm = Permission.objects.filter(
            module=module,
            action=action
        ).first()
        
        if not perm:
            return False
        
        # Check if role has this permission
        return RolePermission.objects.filter(
            role__code=role_code,
            permission=perm
        ).exists()
    except Exception as e:
        print(f"Error checking permission: {e}")
        return False


def check_multi_tenant_access(user, company_id):
    """
    Check if user has access to company resources
    
    Args:
        user: User object
        company_id: Company UUID
    
    Returns:
        bool: True if user can access company's data
    """
    # SUPERADMIN can access all companies
    if user.role == 'SUPERADMIN':
        return True
    
    # CLIENT_* users can only access their own company
    if user.role.startswith('CLIENT_'):
        return user.company_id == company_id
    
    # STAFF users need to be assigned to the company or have global access
    if user.role.startswith('STAFF_'):
        from django.apps import apps
        StaffCompany = apps.get_model('companies', 'StaffCompany')
        return StaffCompany.objects.filter(
            staff_user=user,
            company_id=company_id
        ).exists()
    
    return False
