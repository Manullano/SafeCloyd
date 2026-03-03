from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from safecloud_api.apps.companies.models import Ticket, TicketEvent
from safecloud_api.core.serializers import TicketSerializer, TicketEventSerializer
from safecloud_api.core.utils import log_audit_event


class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPERADMIN':
            return Ticket.objects.all()
        return Ticket.objects.filter(company=user.company)
    
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        data['company'] = request.user.company.id
        data['created_by'] = request.user.id
        
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
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
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
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        ticket = self.get_object()
        comment_text = request.data.get('comment')
        
        if not comment_text:
            return Response({'error': 'Comment is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        event = TicketEvent.objects.create(
            ticket=ticket,
            event_type='COMMENT',
            created_by=request.user,
            data={'comment': comment_text}
        )
        
        log_audit_event(
            actor_user=request.user,
            action='TICKET_COMMENTED',
            company=request.user.company,
            entity='TICKET',
            entity_id=str(ticket.id),
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            data={'comment': comment_text}
        )
        
        return Response({'message': 'Comment added', 'event': TicketEventSerializer(event).data})
