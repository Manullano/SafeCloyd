import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.contrib.postgres.fields import ArrayField


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es requerido')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'SUPERADMIN')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class Plan(models.Model):
    PLAN_CHOICES = [
        ('BASIC', 'Básico'),
        ('PRO', 'Pro'),
        ('CORPORATE', 'Corporativo'),
        ('ENTERPRISE', 'Empresa'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, choices=PLAN_CHOICES)
    name = models.CharField(max_length=100, verbose_name='Nombre')
    price_clp = models.IntegerField(null=True, blank=True, verbose_name='Precio (CLP)')
    max_users = models.IntegerField(default=5, verbose_name='Máximo de Usuarios')
    max_active_projects = models.IntegerField(default=3, verbose_name='Máximo de Proyectos Activos')
    max_docs = models.IntegerField(default=50, verbose_name='Máximo de Documentos')
    max_storage_mb = models.IntegerField(default=1000, verbose_name='Máximo de Almacenamiento (MB)')
    max_tickets_per_month = models.IntegerField(default=20, verbose_name='Máximo de Tickets/Mes')
    support_sla_hours = models.IntegerField(default=48, verbose_name='SLA de Soporte (horas)')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado')

    class Meta:
        db_table = 'plans'
        verbose_name = 'Plan'
        verbose_name_plural = 'Planes'

    def __str__(self):
        return self.name


class Company(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Activa'),
        ('INACTIVE', 'Inactiva'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Plan')
    rut = models.CharField(max_length=20, null=True, blank=True, verbose_name='RUT')
    name = models.CharField(max_length=255, verbose_name='Nombre')
    industry = models.CharField(max_length=100, null=True, blank=True, verbose_name='Industria')
    email = models.EmailField(verbose_name='Correo Electrónico')
    phone = models.CharField(max_length=20, null=True, blank=True, verbose_name='Teléfono')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE', verbose_name='Estado')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado')

    class Meta:
        db_table = 'companies'
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'

    def __str__(self):
        return self.name


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('SUPERADMIN', 'Super Admin'),
        ('STAFF_PM', 'Gestor de Proyectos'),
        ('STAFF_SUPPORT', 'Soporte'),
        ('CLIENT_ADMIN', 'Admin del Cliente'),
        ('CLIENT_USER', 'Usuario del Cliente'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name='users', verbose_name='Empresa')
    full_name = models.CharField(max_length=255, verbose_name='Nombre Completo')
    email = models.EmailField(unique=True, verbose_name='Correo Electrónico')
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='CLIENT_USER', verbose_name='Rol')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    is_staff = models.BooleanField(default=False, verbose_name='Es Staff')
    is_superuser = models.BooleanField(default=False, verbose_name='Es Superusuario')
    last_login_at = models.DateTimeField(null=True, blank=True, verbose_name='Último Acceso')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado')

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return self.full_name


class StaffCompany(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    staff_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_companies')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='assigned_staff')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'staff_companies'
        unique_together = ('staff_user', 'company')


class Project(models.Model):
    STATUS_CHOICES = [
        ('PLANNING', 'Planeación'),
        ('IN_PROGRESS', 'En Progreso'),
        ('BLOCKED', 'Bloqueado'),
        ('IN_REVIEW', 'En Revisión'),
        ('CLOSED', 'Cerrado'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNING')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    owner_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='owned_projects')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_projects')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'projects'

    def __str__(self):
        return self.name


class Task(models.Model):
    STATUS_CHOICES = [
        ('TODO', 'Por Hacer'),
        ('DOING', 'En Progreso'),
        ('DONE', 'Hecho'),
    ]
    
    PRIORITY_CHOICES = [
        (1, 'Baja'),
        (2, 'Media'),
        (3, 'Alta'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TODO')
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=2)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    due_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_tasks')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tasks'

    def __str__(self):
        return self.title


class Ticket(models.Model):
    STATUS_CHOICES = [
        ('OPEN', 'Abierto'),
        ('IN_PROGRESS', 'En Progreso'),
        ('WAITING_CUSTOMER', 'Esperando Cliente'),
        ('RESOLVED', 'Resuelto'),
        ('CLOSED', 'Cerrado'),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', 'Baja'),
        ('MEDIUM', 'Media'),
        ('HIGH', 'Alta'),
        ('CRITICAL', 'Crítica'),
    ]
    
    CATEGORY_CHOICES = [
        ('SOFTWARE', 'Software'),
        ('CYBERSECURITY', 'Ciberseguridad'),
        ('PROJECTS', 'Proyectos'),
        ('DIGITALIZATION', 'Digitalización'),
        ('OTHER', 'Otro'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='tickets')
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='OTHER')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_tickets')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tickets'

    def __str__(self):
        return self.title


class TicketEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=100)
    data = models.JSONField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ticket_events'


class Document(models.Model):
    VISIBILITY_CHOICES = [
        ('COMPANY', 'Empresa'),
        ('STAFF_ONLY', 'Solo Staff'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='documents')
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='documents')
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100, null=True, blank=True)
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='COMPANY')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_documents')
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'documents'

    def __str__(self):
        return self.title


class DocumentVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField()
    storage_key = models.CharField(max_length=500)
    file_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100, null=True, blank=True)
    size_bytes = models.BigIntegerField(null=True, blank=True)
    sha256 = models.CharField(max_length=64, null=True, blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'document_versions'
        unique_together = ('document', 'version_number')


class Comment(models.Model):
    ENTITY_TYPES = [
        ('PROJECT', 'Proyecto'),
        ('TASK', 'Tarea'),
        ('TICKET', 'Ticket'),
        ('DOCUMENT', 'Documento'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='comments')
    entity = models.CharField(max_length=50, choices=ENTITY_TYPES)
    entity_id = models.UUIDField()
    content = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'comments'


class AuditEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_events')
    actor_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_events_created')
    action = models.CharField(max_length=100)
    entity = models.CharField(max_length=50, null=True, blank=True)
    entity_id = models.UUIDField(null=True, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_events'


# ============= RBAC MODELS =============

class Role(models.Model):
    """Role Based Access Control - Define all available roles"""
    ROLE_TYPES = [
        ('SUPERADMIN', 'Super Administrador'),
        ('STAFF_PM', 'Gestor de Proyectos'),
        ('STAFF_SUPPORT', 'Soporte Técnico'),
        ('CLIENT_ADMIN', 'Admin del Cliente'),
        ('CLIENT_USER', 'Usuario del Cliente'),
        ('CLIENT_VIEWER', 'Espectador del Cliente'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, choices=ROLE_TYPES, verbose_name='Código')
    name = models.CharField(max_length=100, verbose_name='Nombre')
    description = models.TextField(null=True, blank=True, verbose_name='Descripción')
    is_system = models.BooleanField(default=True, verbose_name='Es del Sistema')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado')
    
    class Meta:
        db_table = 'roles'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
    
    def __str__(self):
        return self.name


class Permission(models.Model):
    """Define all available permissions across modules"""
    MODULE_CHOICES = [
        ('AUTH', 'Autenticación'),
        ('COMPANIES', 'Empresas/Tenants'),
        ('USERS', 'Usuarios'),
        ('PROJECTS', 'Proyectos'),
        ('TASKS', 'Tareas/Kanban'),
        ('DOCUMENTS', 'Documentos'),
        ('TICKETS', 'Tickets/Soporte'),
        ('COMMENTS', 'Comentarios'),
        ('AUDIT', 'Auditoría'),
        ('SETTINGS', 'Configuración'),
    ]
    
    ACTION_CHOICES = [
        ('VIEW', 'Ver'),
        ('CREATE', 'Crear'),
        ('EDIT', 'Editar'),
        ('DELETE', 'Eliminar'),
        ('EXPORT', 'Exportar'),
        ('ASSIGN', 'Asignar'),
        ('APPROVE', 'Aprobar'),
        ('DOWNLOAD', 'Descargar'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.CharField(max_length=50, choices=MODULE_CHOICES, verbose_name='Módulo')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, verbose_name='Acción')
    code = models.CharField(max_length=100, unique=True, verbose_name='Código')  # e.g., 'project.create'
    description = models.TextField(null=True, blank=True, verbose_name='Descripción')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado')
    
    class Meta:
        db_table = 'permissions'
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
        unique_together = ('module', 'action')
    
    def __str__(self):
        return f"{self.module} - {self.action}"


class RolePermission(models.Model):
    """Assign permissions to roles"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='permissions_set', verbose_name='Rol')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='roles', verbose_name='Permiso')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado')
    
    class Meta:
        db_table = 'role_permissions'
        verbose_name = 'Permiso de Rol'
        verbose_name_plural = 'Permisos de Rol'
        unique_together = ('role', 'permission')
    
    def __str__(self):
        return f"{self.role.name} - {self.permission.code}"
