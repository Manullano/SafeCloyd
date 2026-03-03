from rest_framework import permissions


class IsCompanyMember(permissions.BasePermission):
    """Check if user belongs to the company"""
    
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'company'):
            return obj.company.id == request.user.company.id
        return False


class IsCompanyAdmin(permissions.BasePermission):
    """Check if user is CLIENT_ADMIN or SUPERADMIN"""
    
    def has_permission(self, request, view):
        return request.user.role in ['CLIENT_ADMIN', 'SUPERADMIN']


class IsStaffUser(permissions.BasePermission):
    """Check if user is staff (SUPERADMIN, STAFF_PM, STAFF_SUPPORT)"""
    
    def has_permission(self, request, view):
        return request.user.role in ['SUPERADMIN', 'STAFF_PM', 'STAFF_SUPPORT']


class HasCompanyAccess(permissions.BasePermission):
    """Check if user has access to company resources"""
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'SUPERADMIN':
            return True
        
        if hasattr(obj, 'company'):
            company = obj.company
        else:
            company = obj
        
        return company.id == request.user.company.id
