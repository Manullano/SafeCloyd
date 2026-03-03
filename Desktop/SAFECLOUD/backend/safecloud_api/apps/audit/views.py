from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from safecloud_api.apps.companies.models import AuditEvent
from safecloud_api.core.serializers import AuditEventSerializer


class AuditEventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditEventSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPERADMIN':
            return AuditEvent.objects.all()
        return AuditEvent.objects.filter(company=user.company)
