from django.contrib import admin
from safecloud_api.apps.companies.models import (
    Plan, Company, User, StaffCompany, Project, Task, Ticket, TicketEvent,
    Document, DocumentVersion, Comment, AuditEvent, Role, Permission, RolePermission
)


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'price_clp', 'max_users', 'max_active_projects']
    search_fields = ['code', 'name']

    class Meta:
        verbose_name = 'Plan'
        verbose_name_plural = 'Planes'


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'rut', 'status', 'created_at']
    search_fields = ['name', 'rut', 'email']
    list_filter = ['status', 'created_at']

    class Meta:
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'role', 'company', 'is_active', 'created_at']
    search_fields = ['full_name', 'email']
    list_filter = ['role', 'is_active', 'created_at']

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'status', 'start_date', 'end_date', 'created_at']
    search_fields = ['name', 'company__name']
    list_filter = ['status', 'created_at']

    class Meta:
        verbose_name = 'Proyecto'
        verbose_name_plural = 'Proyectos'


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'status', 'priority', 'assigned_to', 'created_at']
    search_fields = ['title', 'project__name']
    list_filter = ['status', 'priority', 'created_at']

    class Meta:
        verbose_name = 'Tarea'
        verbose_name_plural = 'Tareas'


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'status', 'priority', 'category', 'created_at']
    search_fields = ['title', 'company__name']
    list_filter = ['status', 'priority', 'category', 'created_at']

    class Meta:
        verbose_name = 'Ticket'
        verbose_name_plural = 'Tickets'


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'category', 'visibility', 'created_at']
    search_fields = ['title', 'company__name']
    list_filter = ['visibility', 'created_at', 'is_deleted']

    class Meta:
        verbose_name = 'Documento'
        verbose_name_plural = 'Documentos'


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ['action', 'actor_user', 'company', 'entity', 'created_at']
    search_fields = ['action', 'actor_user__full_name', 'company__name']
    list_filter = ['action', 'created_at']
    readonly_fields = ['created_at']

    class Meta:
        verbose_name = 'Evento de Auditoría'
        verbose_name_plural = 'Eventos de Auditoría'


# ============= RBAC ADMIN =============

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'is_system', 'created_at']
    search_fields = ['code', 'name']
    list_filter = ['is_system', 'created_at']
    readonly_fields = ['created_at', 'id']

    class Meta:
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['code', 'module', 'action', 'created_at']
    search_fields = ['code', 'module', 'action']
    list_filter = ['module', 'action', 'created_at']
    readonly_fields = ['created_at', 'id']

    class Meta:
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'


class RolePermissionInline(admin.TabularInline):
    model = RolePermission
    extra = 1
    readonly_fields = ['created_at']


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ['role', 'permission', 'created_at']
    search_fields = ['role__name', 'permission__code']
    list_filter = ['role', 'created_at']
    readonly_fields = ['created_at', 'id']

    class Meta:
        verbose_name = 'Permiso de Rol'
        verbose_name_plural = 'Permisos de Rol'

