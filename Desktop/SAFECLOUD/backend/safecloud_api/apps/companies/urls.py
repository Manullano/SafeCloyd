from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from safecloud_api.apps.companies.views import (
    CompanyViewSet, PlanViewSet, UserViewSet, RoleViewSet, 
    PermissionViewSet, RolePermissionViewSet, check_permission, my_permissions
)
from safecloud_api.core.serializers import CompanySerializer
from safecloud_api.apps.companies.models import Company, Plan

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def companies_list_create(request):
    """Companies list and create endpoint - replaces ViewSet due to 405 issue"""
    if request.method == 'GET':
        companies = Company.objects.all()
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data)
    
    if request.method == 'POST':
        # Allow SUPERADMIN and STAFF_PM
        if request.user.role not in ['SUPERADMIN', 'STAFF_PM']:
            return Response({'error': 'Only SUPERADMIN and STAFF_PM can create'}, status=status.HTTP_403_FORBIDDEN)
        
        # Create company
        serializer = CompanySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def companies_detail(request, company_id):
    """Company detail, update, and delete endpoint"""
    try:
        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        return Response({'error': 'Company not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # GET - Retrieve company details
    if request.method == 'GET':
        serializer = CompanySerializer(company)
        return Response(serializer.data)
    
    # PUT/PATCH - Update company
    if request.method in ['PUT', 'PATCH']:
        if request.user.role != 'SUPERADMIN':
            return Response({'error': 'Only SUPERADMIN can update companies'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = CompanySerializer(company, data=request.data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # DELETE - Delete company
    if request.method == 'DELETE':
        if request.user.role != 'SUPERADMIN':
            return Response({'error': 'Only SUPERADMIN can delete companies'}, status=status.HTTP_403_FORBIDDEN)
        
        company.delete()
        return Response({'detail': 'Company deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_user(request):
    """Debug endpoint to check current user info"""
    return Response({
        'user': request.user.email,
        'role': request.user.role,
        'company': str(request.user.company.id) if request.user.company else None,
        'is_authenticated': request.user.is_authenticated,
    })

router = DefaultRouter()
router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'role-permissions', RolePermissionViewSet, basename='role-permission')

urlpatterns = [
    # Companies CRUD - using simple view instead of ViewSet
    path('', companies_list_create, name='companies-list-create'),
    path('<uuid:company_id>/', companies_detail, name='companies-detail'),
    # Debug
    path('debug/user/', debug_user, name='debug-user'),
    # Custom permission endpoints
    path('permissions/check/', check_permission, name='check-permission'),
    path('permissions/my_permissions/', my_permissions, name='my-permissions'),
    # Router includes
    path('', include(router.urls)),
]
