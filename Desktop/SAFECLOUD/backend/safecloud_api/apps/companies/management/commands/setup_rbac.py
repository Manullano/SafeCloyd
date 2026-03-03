"""
Management command to set up RBAC system with default roles and permissions
Usage: python manage.py setup_rbac
"""
from django.core.management.base import BaseCommand
from safecloud_api.apps.companies.models import Role, Permission, RolePermission


class Command(BaseCommand):
    help = 'Initialize RBAC system with default roles and permissions'
    
    def handle(self, *args, **options):
        self.stdout.write('Inicializando sistema RBAC...\n')
        
        # Define all roles
        roles_data = [
            ('SUPERADMIN', 'Super Administrador', 'Acceso total a todas las empresas y módulos'),
            ('STAFF_PM', 'Gestor de Proyectos', 'Gestiona proyectos para empresas asignadas'),
            ('STAFF_SUPPORT', 'Soporte Técnico', 'Resuelve tickets de empresas asignadas'),
            ('CLIENT_ADMIN', 'Admin del Cliente', 'Administrador de su propia empresa'),
            ('CLIENT_USER', 'Usuario del Cliente', 'Usuario estándar con acceso limitado'),
            ('CLIENT_VIEWER', 'Espectador del Cliente', 'Solo lectura de información'),
        ]
        
        # Define all permissions (module, action)
        permissions_data = [
            # Auth (A)
            ('AUTH', 'VIEW', 'auth.view_profile'),
            ('AUTH', 'EDIT', 'auth.edit_profile'),
            
            # Companies (B)
            ('COMPANIES', 'VIEW', 'companies.view'),
            ('COMPANIES', 'CREATE', 'companies.create'),
            ('COMPANIES', 'EDIT', 'companies.edit'),
            
            # Users (C)
            ('USERS', 'VIEW', 'users.view'),
            ('USERS', 'CREATE', 'users.create'),
            ('USERS', 'EDIT', 'users.edit'),
            ('USERS', 'DELETE', 'users.delete'),
            ('USERS', 'ASSIGN', 'users.assign_roles'),
            
            # Projects (D)
            ('PROJECTS', 'VIEW', 'projects.view'),
            ('PROJECTS', 'CREATE', 'projects.create'),
            ('PROJECTS', 'EDIT', 'projects.edit'),
            ('PROJECTS', 'DELETE', 'projects.delete'),
            ('PROJECTS', 'ASSIGN', 'projects.assign'),
            
            # Tasks (E)
            ('TASKS', 'VIEW', 'tasks.view'),
            ('TASKS', 'CREATE', 'tasks.create'),
            ('TASKS', 'EDIT', 'tasks.edit'),
            ('TASKS', 'ASSIGN', 'tasks.assign'),
            
            # Documents (F)
            ('DOCUMENTS', 'VIEW', 'documents.view'),
            ('DOCUMENTS', 'CREATE', 'documents.upload'),
            ('DOCUMENTS', 'DELETE', 'documents.delete'),
            ('DOCUMENTS', 'DOWNLOAD', 'documents.download'),
            ('DOCUMENTS', 'EDIT', 'documents.edit_visibility'),
            
            # Tickets (G)
            ('TICKETS', 'VIEW', 'tickets.view'),
            ('TICKETS', 'CREATE', 'tickets.create'),
            ('TICKETS', 'EDIT', 'tickets.edit'),
            ('TICKETS', 'ASSIGN', 'tickets.assign'),
            
            # Comments (H)
            ('COMMENTS', 'CREATE', 'comments.create'),
            ('COMMENTS', 'VIEW', 'comments.view'),
            ('COMMENTS', 'DELETE', 'comments.delete'),
            
            # Audit (I)
            ('AUDIT', 'VIEW', 'audit.view_logs'),
            ('AUDIT', 'EXPORT', 'audit.export'),
            
            # Settings (J)
            ('SETTINGS', 'VIEW', 'settings.view'),
            ('SETTINGS', 'EDIT', 'settings.edit'),
        ]
        
        # Create roles
        created_roles = {}
        for code, name, description in roles_data:
            role, created = Role.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'description': description,
                    'is_system': True
                }
            )
            created_roles[code] = role
            status_msg = '✓ Creado' if created else '• Existente'
            self.stdout.write(f'  {status_msg}: {name}')
        
        self.stdout.write(f'\n✓ {len(created_roles)} roles procesados\n')
        
        # Create permissions
        created_perms = {}
        for module, action, code in permissions_data:
            perm, created = Permission.objects.get_or_create(
                code=code,
                defaults={
                    'module': module,
                    'action': action,
                    'description': f'{action} en {module}'
                }
            )
            created_perms[code] = perm
        
        self.stdout.write(f'✓ {len(created_perms)} permisos procesados\n')
        
        # Assign permissions to roles based on specification
        role_permissions = {
            'SUPERADMIN': [
                # Super admin has all permissions
                'auth.view_profile', 'auth.edit_profile',
                'companies.view', 'companies.create', 'companies.edit',
                'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_roles',
                'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'projects.assign',
                'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign',
                'documents.view', 'documents.upload', 'documents.delete', 'documents.download', 'documents.edit_visibility',
                'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.assign',
                'comments.create', 'comments.view', 'comments.delete',
                'audit.view_logs', 'audit.export',
                'settings.view', 'settings.edit',
            ],
            'STAFF_PM': [
                # Project Manager
                'auth.view_profile', 'auth.edit_profile',
                'users.view',
                'projects.view', 'projects.create', 'projects.edit', 'projects.assign',
                'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign',
                'documents.view', 'documents.download',
                'tickets.view', 'tickets.create',
                'comments.create', 'comments.view',
                'audit.view_logs',
            ],
            'STAFF_SUPPORT': [
                # Support Staff
                'auth.view_profile', 'auth.edit_profile',
                'users.view',
                'projects.view',
                'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.assign',
                'documents.view', 'documents.download',
                'comments.create', 'comments.view',
                'audit.view_logs',
            ],
            'CLIENT_ADMIN': [
                # Client Administrator
                'auth.view_profile', 'auth.edit_profile',
                'users.view', 'users.create', 'users.edit', 'users.assign_roles',
                'projects.view', 'projects.create', 'projects.edit', 'projects.assign',
                'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign',
                'documents.view', 'documents.upload', 'documents.download', 'documents.edit_visibility',
                'tickets.view', 'tickets.create', 'tickets.edit',
                'comments.create', 'comments.view',
                'settings.view', 'settings.edit',
            ],
            'CLIENT_USER': [
                # Standard Client User
                'auth.view_profile', 'auth.edit_profile',
                'projects.view', 'projects.assign',
                'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign',
                'documents.view', 'documents.download',
                'tickets.view', 'tickets.create',
                'comments.create', 'comments.view',
            ],
            'CLIENT_VIEWER': [
                # Read-only Client User
                'auth.view_profile',
                'projects.view',
                'tasks.view',
                'documents.view', 'documents.download',
                'tickets.view',
                'comments.view',
            ],
        }
        
        # Assign permissions to roles
        total_assigned = 0
        for role_code, perm_codes in role_permissions.items():
            role = created_roles.get(role_code)
            if not role:
                continue
            
            RolePermission.objects.filter(role=role).delete()  # Clear existing
            
            for perm_code in perm_codes:
                perm = created_perms.get(perm_code)
                if perm:
                    RolePermission.objects.get_or_create(
                        role=role,
                        permission=perm
                    )
                    total_assigned += 1
        
        self.stdout.write(f'✓ {total_assigned} permisos asignados a roles\n')
        self.stdout.write(self.style.SUCCESS('\n✓ Sistema RBAC inicializado exitosamente!'))
