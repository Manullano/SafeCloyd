"""
Plan Validator - Validar límites de plan para empresas
"""
from django.db.models import Sum, F
from safecloud_api.apps.companies.models import Company, User, Project, Document, DocumentVersion


class PlanValidator:
    """Utilidad para validar que una acción esté dentro de los límites del plan"""
    
    @staticmethod
    def check_user_limit(company: Company) -> tuple[bool, str]:
        """
        Verificar si la empresa puede crear más usuarios
        
        Returns: (allowed: bool, error_message: str)
        """
        if not company or not company.plan:
            return False, "Empresa sin plan asignado"
        
        # Contar usuarios activos de la empresa (excluyendo STAFF)
        user_count = User.objects.filter(
            company=company,
            is_active=True,
            role__in=['CLIENT_ADMIN', 'CLIENT_USER', 'CLIENT_VIEWER']
        ).count()
        
        max_users = company.plan.max_users
        
        if user_count >= max_users:
            return False, f"Has alcanzado el límite de {max_users} usuarios para tu plan. Actualiza tu plan para agregar más."
        
        return True, ""
    
    @staticmethod
    def check_project_limit(company: Company) -> tuple[bool, str]:
        """
        Verificar si la empresa puede crear más proyectos activos
        
        Returns: (allowed: bool, error_message: str)
        """
        if not company or not company.plan:
            return False, "Empresa sin plan asignado"
        
        # Contar proyectos activos de la empresa (no cerrados)
        active_project_count = Project.objects.filter(
            company=company,
            status__in=['PLANNING', 'IN_PROGRESS', 'IN_REVIEW']
        ).count()
        
        max_projects = company.plan.max_active_projects
        
        if active_project_count >= max_projects:
            return False, f"Has alcanzado el límite de {max_projects} proyectos activos para tu plan. Actualiza tu plan o cierra proyectos."
        
        return True, ""
    
    @staticmethod
    def check_document_limit(company: Company) -> tuple[bool, str]:
        """
        Verificar si la empresa puede crear más documentos
        
        Returns: (allowed: bool, error_message: str)
        """
        if not company or not company.plan:
            return False, "Empresa sin plan asignado"
        
        # Contar documentos de la empresa
        doc_count = Document.objects.filter(company=company).count()
        
        max_docs = company.plan.max_docs
        
        if doc_count >= max_docs:
            return False, f"Has alcanzado el límite de {max_docs} documentos para tu plan. Actualiza tu plan o elimina documentos."
        
        return True, ""
    
    @staticmethod
    def check_storage_limit(company: Company, additional_size_mb: int = 0) -> tuple[bool, str]:
        """
        Verificar si la empresa puede agregar más almacenamiento
        
        Args:
            company: Empresa a verificar
            additional_size_mb: Tamaño adicional en MB que se va a agregar
        
        Returns: (allowed: bool, error_message: str)
        """
        if not company or not company.plan:
            return False, "Empresa sin plan asignado"
        
        # Calcular almacenamiento usado (en bytes, convertir a MB)
        from django.db.models import F
        doc_versions = (
            Document.objects.filter(company=company, is_deleted=False)
            .values('id').distinct()
        )
        total_size_bytes = 0
        for doc in doc_versions:
            latest_version = (
                Document.objects.filter(id=doc['id'])
                .values_list('versions__size_bytes', flat=True)
                .order_by('-versions__version_number')
                .first()
            )
            if latest_version:
                total_size_bytes += latest_version
        
        used_storage_mb = int(total_size_bytes / (1024 * 1024)) if total_size_bytes else 0
        max_storage = company.plan.max_storage_mb
        
        if (used_storage_mb + additional_size_mb) > max_storage:
            return False, f"Almacenamiento insuficiente. Usas {used_storage_mb}MB de {max_storage}MB disponibles. Actualiza tu plan o elimina documentos."
        
        return True, ""
    
    @staticmethod
    def validate_all_limits(company: Company, check_type: str = 'all') -> dict:
        """
        Validar múltiples límites a la vez
        
        Args:
            company: Empresa a validar
            check_type: 'all' | 'users' | 'projects' | 'documents' | 'storage'
        
        Returns: {
            'valid': bool,
            'users': {'allowed': bool, 'current': int, 'max': int},
            'projects': {'allowed': bool, 'current': int, 'max': int},
            'documents': {'allowed': bool, 'current': int, 'max': int},
            'storage': {'allowed': bool, 'used_mb': int, 'max_mb': int}
        }
        """
        result = {
            'valid': True,
            'messages': []
        }
        
        if check_type in ['all', 'users']:
            allowed, msg = PlanValidator.check_user_limit(company)
            user_count = User.objects.filter(
                company=company,
                is_active=True,
                role__in=['CLIENT_ADMIN', 'CLIENT_USER', 'CLIENT_VIEWER']
            ).count()
            result['users'] = {
                'allowed': allowed,
                'current': user_count,
                'max': company.plan.max_users if company.plan else 0
            }
            if not allowed:
                result['valid'] = False
                result['messages'].append(msg)
        
        if check_type in ['all', 'projects']:
            allowed, msg = PlanValidator.check_project_limit(company)
            project_count = Project.objects.filter(
                company=company,
                status__in=['PLANNING', 'IN_PROGRESS', 'IN_REVIEW']
            ).count()
            result['projects'] = {
                'allowed': allowed,
                'current': project_count,
                'max': company.plan.max_active_projects if company.plan else 0
            }
            if not allowed:
                result['valid'] = False
                result['messages'].append(msg)
        
        if check_type in ['all', 'documents']:
            allowed, msg = PlanValidator.check_document_limit(company)
            doc_count = Document.objects.filter(company=company).count()
            result['documents'] = {
                'allowed': allowed,
                'current': doc_count,
                'max': company.plan.max_docs if company.plan else 0
            }
            if not allowed:
                result['valid'] = False
                result['messages'].append(msg)
        
        if check_type in ['all', 'storage']:
            allowed, msg = PlanValidator.check_storage_limit(company)
            # Calcular almacenamiento usado
            doc_versions = (
                Document.objects.filter(company=company, is_deleted=False)
                .values('id').distinct()
            )
            total_size_bytes = 0
            for doc in doc_versions:
                latest_version = (
                    Document.objects.filter(id=doc['id'])
                    .values_list('versions__size_bytes', flat=True)
                    .order_by('-versions__version_number')
                    .first()
                )
                if latest_version:
                    total_size_bytes += latest_version
            
            used_storage_mb = int(total_size_bytes / (1024 * 1024)) if total_size_bytes else 0
            result['storage'] = {
                'allowed': allowed,
                'used_mb': used_storage_mb,
                'max_mb': company.plan.max_storage_mb if company.plan else 0
            }
            if not allowed:
                result['valid'] = False
                result['messages'].append(msg)
        
        return result
