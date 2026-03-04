from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from safecloud_api.apps.companies.models import Project, Task
from safecloud_api.core.serializers import ProjectSerializer, TaskSerializer
from safecloud_api.core.utils import log_audit_event
from safecloud_api.core.plan_validator import PlanValidator


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPERADMIN':
            return Project.objects.all()
        return Project.objects.filter(company=user.company)
    
    def create(self, request, *args, **kwargs):
        if request.user.role not in ['SUPERADMIN', 'CLIENT_ADMIN']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # ✅ Validar límites de plan para crear proyecto activo
        company = request.user.company
        allowed, error_msg = PlanValidator.check_project_limit(company)
        if not allowed:
            log_audit_event(
                actor_user=request.user,
                action='PROJECT_CREATION_FAILED',
                company=company,
                ip=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
                data={'reason': 'Plan limit exceeded'}
            )
            return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
        
        data = request.data.copy()
        data['company'] = request.user.company.id
        data['created_by'] = request.user.id
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        log_audit_event(
            actor_user=request.user,
            action='PROJECT_CREATED',
            company=request.user.company,
            entity='PROJECT',
            entity_id=serializer.data['id'],
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            data={'project_name': data.get('name')}
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        project = self.get_object()
        new_status = request.data.get('status')
        
        valid_statuses = ['PLANNING', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'CLOSED']
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = project.status
        project.status = new_status
        project.save()
        
        log_audit_event(
            actor_user=request.user,
            action='PROJECT_STATUS_CHANGED',
            company=request.user.company,
            entity='PROJECT',
            entity_id=str(project.id),
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            data={'old_status': old_status, 'new_status': new_status}
        )
        
        return Response(ProjectSerializer(project).data)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPERADMIN':
            return Task.objects.all()
        return Task.objects.filter(project__company=user.company)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = serializer.save(created_by=request.user)
        
        log_audit_event(
            actor_user=request.user,
            action='TASK_CREATED',
            company=request.user.company,
            entity='TASK',
            entity_id=str(task.id),
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            data={'task_title': task.title}
        )
        
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')
        
        valid_statuses = ['TODO', 'DOING', 'DONE']
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = task.status
        task.status = new_status
        task.save()
        
        log_audit_event(
            actor_user=request.user,
            action='TASK_STATUS_CHANGED',
            company=request.user.company,
            entity='TASK',
            entity_id=str(task.id),
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            data={'old_status': old_status, 'new_status': new_status}
        )
        
        return Response(TaskSerializer(task).data)
