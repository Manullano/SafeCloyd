from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from safecloud_api.apps.companies.models import Ticket, TicketEvent, Comment
from safecloud_api.core.serializers import TicketSerializer, TicketEventSerializer, CommentSerializer
from safecloud_api.core.utils import log_audit_event
from safecloud_api.core.plan_validator import PlanValidator


class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPERADMIN' or user.role in ['STAFF_PM', 'STAFF_SUPPORT']:
            return Ticket.objects.all().select_related('company', 'assigned_to', 'created_by', 'project')
        return Ticket.objects.filter(company=user.company).select_related('company', 'assigned_to', 'created_by', 'project')
    
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        data['company'] = request.user.company.id
        data['created_by'] = request.user.id
        
        # Note: Ticket limit is per-month, not total - would need additional tracking
        # For now, we allow creation but could add a warning in future
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        log_audit_event(
            actor_user=request.user,
            action='TICKET_CREATED',
            company=request.user.company,
            entity='TICKET',
            entity_id=serializer.data['id'],
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            data={'ticket_title': data.get('title')}
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Handle both partial and full updates"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """Override PATCH to allow status/priority updates"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """Get all comments for a ticket"""
        ticket = self.get_object()
        comments = Comment.objects.filter(
            entity='TICKET',
            entity_id=ticket.id
        ).select_related('created_by').order_by('created_at')
        
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to a ticket"""
        ticket = self.get_object()
        text = request.data.get('text') or request.data.get('comment')
        is_internal = request.data.get('is_internal', False)
        
        if not text:
            return Response(
                {'error': 'Comment text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        comment = Comment.objects.create(
            company=ticket.company,
            entity='TICKET',
            entity_id=ticket.id,
            content=text,
            is_internal=is_internal,
            created_by=request.user
        )
        
        log_audit_event(
            actor_user=request.user,
            action='COMMENT_CREATED',
            company=request.user.company,
            entity='COMMENT',
            entity_id=str(comment.id),
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            data={'comment_text': text, 'ticket_id': str(ticket.id)}
        )
        
        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Change ticket status"""
        ticket = self.get_object()
        new_status = request.data.get('status')
        
        valid_statuses = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED']
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = ticket.status
        ticket.status = new_status
        ticket.save()
        
        # Create ticket event
        event = TicketEvent.objects.create(
            ticket=ticket,
            event_type='STATUS_CHANGE',
            created_by=request.user,
            data={'old_status': old_status, 'new_status': new_status}
        )
        
        log_audit_event(
            actor_user=request.user,
            action='TICKET_STATUS_CHANGED',
            company=request.user.company,
            entity='TICKET',
            entity_id=str(ticket.id),
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            data={'old_status': old_status, 'new_status': new_status}
        )
        
        return Response(TicketSerializer(ticket).data)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign ticket to a user"""
        ticket = self.get_object()
        assigned_user_id = request.data.get('assigned_to')
        
        ticket.assigned_to_id = assigned_user_id
        ticket.save()
        
        event = TicketEvent.objects.create(
            ticket=ticket,
            event_type='ASSIGNMENT',
            created_by=request.user,
            data={'assigned_to_id': assigned_user_id}
        )
        
        log_audit_event(
            actor_user=request.user,
            action='TICKET_ASSIGNED',
            company=request.user.company,
            entity='TICKET',
            entity_id=str(ticket.id),
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            data={'assigned_to_id': assigned_user_id}
        )
        
        return Response(TicketSerializer(ticket).data)


class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for general comment CRUD operations"""
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPERADMIN' or user.role in ['STAFF_PM', 'STAFF_SUPPORT']:
            return Comment.objects.all().select_related('company', 'created_by')
        return Comment.objects.filter(company=user.company).select_related('company', 'created_by')
    
    def create(self, request, *args, **kwargs):
        """Create a new comment"""
        data = request.data.copy()
        
        # Auto-fill company and created_by
        data['company'] = request.user.company.id
        data['created_by'] = request.user.id
        
        # Handle different field names from frontend (text vs content)
        if 'text' in data and 'content' not in data:
            data['content'] = data.pop('text')
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        log_audit_event(
            actor_user=request.user,
            action='COMMENT_CREATED',
            company=request.user.company,
            entity='COMMENT',
            entity_id=serializer.data['id'],
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            data={'comment_text': data.get('content', data.get('text'))}
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

