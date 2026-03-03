"""
Middleware for multi-tenant data isolation and permission enforcement
"""
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser
from rest_framework.response import Response
from rest_framework import status


class MultiTenantMiddleware(MiddlewareMixin):
    """
    Middleware to enforce multi-tenant data isolation
    Adds tenant context to requests and filters querysets
    """
    
    def process_request(self, request):
        # Skip for anonymous users
        if not hasattr(request, 'user') or isinstance(request.user, AnonymousUser):
            return None
        
        user = request.user
        
        # Add user's company to request context
        if hasattr(user, 'company') and user.company:
            request.tenant_company = user.company
        
        # Add role to request
        if hasattr(user, 'role'):
            request.user_role = user.role
        
        return None


class PermissionCheckMiddleware(MiddlewareMixin):
    """
    Middleware to check permissions on protected endpoints
    """
    
    # Protected endpoints that require permission checks
    PROTECTED_ENDPOINTS = {
        # Projects
        '/api/projects/': 'PROJECTS',
        '/api/tasks/': 'TASKS',
        
        # Tickets
        '/api/tickets/': 'TICKETS',
        
        # Documents
        '/api/documents/': 'DOCUMENTS',
        
        # Users
        '/api/users/': 'USERS',
        
        # Companies
        '/api/companies/': 'COMPANIES',
        
        # Audit
        '/api/audit/': 'AUDIT',
    }
    
    def process_request(self, request):
        if not hasattr(request, 'user') or isinstance(request.user, AnonymousUser):
            return None
        
        user = request.user
        
        # Check if this is a protected endpoint
        path = request.path
        module = None
        
        for endpoint, module_name in self.PROTECTED_ENDPOINTS.items():
            if endpoint in path:
                module = module_name
                break
        
        if not module:
            return None  # Not a protected endpoint
        
        # Determine the action based on HTTP method
        action_map = {
            'GET': 'VIEW',
            'POST': 'CREATE',
            'PUT': 'EDIT',
            'PATCH': 'EDIT',
            'DELETE': 'DELETE',
        }
        
        action = action_map.get(request.method, 'VIEW')
        
        # Check permission
        from safecloud_api.decorators import has_permission
        
        if not has_permission(user, module, action):
            # Return 403 Forbidden for API endpoints
            if request.path.startswith('/api/'):
                return Response(
                    {
                        'detail': f'Permiso denegado para {module}.{action}',
                        'code': 'PERMISSION_DENIED'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
        
        return None
