from rest_framework import serializers
from safecloud_api.apps.companies.models import (
    Plan, Company, User, StaffCompany, Project, Task, Ticket, TicketEvent, 
    Document, DocumentVersion, Comment, AuditEvent, Role, Permission, RolePermission
)


# ============= Plans =============
class PlanSerializer(serializers.ModelSerializer):
    name_display = serializers.CharField(source='name', read_only=True)
    price = serializers.IntegerField(source='price_clp', read_only=True)
    
    class Meta:
        model = Plan
        fields = ['id', 'code', 'name', 'name_display', 'price', 'price_clp', 'max_users', 'max_active_projects', 'max_docs', 'max_storage_mb', 'max_tickets_per_month', 'support_sla_hours', 'created_at']


# ============= Companies =============
class CompanySerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    
    class Meta:
        model = Company
        fields = ['id', 'plan', 'plan_name', 'rut', 'name', 'industry', 'email', 'phone', 'status', 'created_at']


# ============= Users =============
class UserSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'company', 'company_name', 'full_name', 'email', 'role', 'is_active', 'last_login_at', 'created_at', 'password']
        read_only_fields = ['id', 'created_at', 'last_login_at', 'company_name']

    def validate_email(self, value):
        """Validate that email is unique"""
        # Check if email already exists (case-insensitive)
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Este email ya está registrado en el sistema.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserDetailSerializer(UserSerializer):
    company = CompanySerializer(read_only=True)


class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'role', 'is_active', 'created_at']


# ============= Projects =============
class ProjectSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner_user.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'company', 'company_name', 'name', 'description', 'status', 'start_date', 'end_date', 
                  'owner_user', 'owner_name', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_at', 'company_name', 'owner_name', 'created_by_name']


# ============= Tasks =============
class TaskSerializer(serializers.ModelSerializer):
    assigned_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'project', 'project_name', 'title', 'description', 'status', 'priority', 
                  'assigned_to', 'assigned_name', 'due_at', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_at', 'assigned_name', 'created_by_name', 'project_name']


# ============= Tickets =============
class TicketEventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    
    class Meta:
        model = TicketEvent
        fields = ['id', 'ticket', 'event_type', 'data', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class TicketSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True, allow_null=True)
    assigned_user = serializers.SerializerMethodField(read_only=True)
    events = TicketEventSerializer(many=True, read_only=True)
    
    def get_assigned_user(self, obj):
        """Return assigned user details as nested object"""
        if obj.assigned_to:
            return {
                'id': str(obj.assigned_to.id),
                'full_name': obj.assigned_to.full_name,
                'email': obj.assigned_to.email,
            }
        return None
    
    class Meta:
        model = Ticket
        fields = ['id', 'company', 'company_name', 'project', 'project_name', 'title', 'description', 
                  'category', 'priority', 'status', 'created_by', 'created_by_name', 'assigned_to', 
                  'assigned_to_name', 'assigned_user', 'created_at', 'updated_at', 'events']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_name', 'assigned_to_name', 'company_name', 'project_name']


# ============= Documents =============
class DocumentVersionSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    
    class Meta:
        model = DocumentVersion
        fields = ['id', 'document', 'version_number', 'storage_key', 'file_name', 'mime_type', 
                  'size_bytes', 'sha256', 'uploaded_by', 'uploaded_by_name', 'created_at']
        read_only_fields = ['id', 'created_at', 'uploaded_by_name']


class DocumentSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True, allow_null=True)
    versions = DocumentVersionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Document
        fields = ['id', 'company', 'company_name', 'project', 'project_name', 'title', 'category', 
                  'visibility', 'created_by', 'created_by_name', 'is_deleted', 'created_at', 'versions']
        read_only_fields = ['id', 'created_at', 'created_by_name', 'company_name', 'project_name']


# ============= Comments =============
class CommentSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    user = serializers.SerializerMethodField(read_only=True)
    
    def get_user(self, obj):
        """Return user details as nested object for compatibility"""
        if obj.created_by:
            return {
                'id': str(obj.created_by.id),
                'full_name': obj.created_by.full_name,
                'email': obj.created_by.email,
            }
        return None
    
    class Meta:
        model = Comment
        fields = ['id', 'company', 'company_name', 'entity', 'entity_id', 'content', 'is_internal', 'created_by', 'created_by_name', 'user', 'created_at']
        read_only_fields = ['id', 'created_at', 'created_by_name', 'company_name', 'user']


# ============= Audit =============
class AuditEventSerializer(serializers.ModelSerializer):
    actor_user_name = serializers.CharField(source='actor_user.full_name', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    ip = serializers.CharField(read_only=True)  # Convertir a CharField para evitar problemas de serialización
    
    class Meta:
        model = AuditEvent
        fields = ['id', 'company', 'company_name', 'actor_user', 'actor_user_name', 'action', 
                  'entity', 'entity_id', 'ip', 'user_agent', 'data', 'created_at']
        read_only_fields = ['id', 'created_at', 'ip']


# ============= RBAC =============
class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'module', 'action', 'code', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = ['id', 'code', 'name', 'description', 'is_system', 'permissions', 'created_at']
        read_only_fields = ['id', 'created_at', 'is_system']
    
    def get_permissions(self, obj):
        permissions = obj.permissions_set.all().values_list('permission__code', flat=True)
        return list(permissions)


class RolePermissionSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    permission_code = serializers.CharField(source='permission.code', read_only=True)
    
    class Meta:
        model = RolePermission
        fields = ['id', 'role', 'role_name', 'permission', 'permission_code', 'created_at']
        read_only_fields = ['id', 'created_at', 'role_name', 'permission_code']

