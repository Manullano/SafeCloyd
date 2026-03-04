from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from safecloud_api.apps.companies.models import Document, DocumentVersion
from safecloud_api.core.serializers import DocumentSerializer, DocumentVersionSerializer
from safecloud_api.core.utils import log_audit_event
from safecloud_api.core.plan_validator import PlanValidator


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPERADMIN':
            return Document.objects.all()
        
        if user.role in ['STAFF_PM', 'STAFF_SUPPORT']:
            return Document.objects.filter(company=user.company)
        
        # CLIENT users see only COMPANY visibility docs
        return Document.objects.filter(company=user.company, visibility='COMPANY')
    
    def create(self, request, *args, **kwargs):
        # ✅ Validar límites de plan para crear documento
        company = request.user.company
        allowed, error_msg = PlanValidator.check_document_limit(company)
        if not allowed:
            log_audit_event(
                actor_user=request.user,
                action='DOCUMENT_CREATION_FAILED',
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
        doc = serializer.save()
        
        # Create initial version if file is provided
        if 'file' in request.FILES:
            file = request.FILES['file']
            DocumentVersion.objects.create(
                document=doc,
                version_number=1,
                storage_key=f'{doc.id}/v1/{file.name}',
                file_name=file.name,
                mime_type=file.content_type,
                size_bytes=file.size,
                uploaded_by=request.user
            )
        
        log_audit_event(
            actor_user=request.user,
            action='DOCUMENT_CREATED',
            company=request.user.company,
            entity='DOCUMENT',
            entity_id=str(doc.id),
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            data={'document_title': doc.title}
        )
        
        return Response(DocumentSerializer(doc).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def upload_version(self, request, pk=None):
        document = self.get_object()
        
        if 'file' not in request.FILES:
            return Response({'error': 'File is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        last_version = document.versions.latest('version_number') if document.versions.exists() else None
        next_version = (last_version.version_number + 1) if last_version else 1
        
        version = DocumentVersion.objects.create(
            document=document,
            version_number=next_version,
            storage_key=f'{document.id}/v{next_version}/{file.name}',
            file_name=file.name,
            mime_type=file.content_type,
            size_bytes=file.size,
            uploaded_by=request.user
        )
        
        log_audit_event(
            actor_user=request.user,
            action='DOCUMENT_VERSION_UPLOADED',
            company=request.user.company,
            entity='DOCUMENT',
            entity_id=str(document.id),
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            data={'version_number': next_version, 'file_name': file.name}
        )
        
        return Response(DocumentVersionSerializer(version).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        """Get all versions of a document"""
        document = self.get_object()
        versions = document.versions.all().order_by('-version_number')
        serializer = DocumentVersionSerializer(versions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def restore_version(self, request, pk=None):
        """Restore a document to a specific version"""
        document = self.get_object()
        version_id = request.data.get('version_id')
        
        if not version_id:
            return Response({'error': 'version_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            version = DocumentVersion.objects.get(id=version_id, document=document)
        except DocumentVersion.DoesNotExist:
            return Response({'error': 'Version not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create new version as a copy of the restored version
        next_version = document.versions.latest('version_number').version_number + 1
        
        new_version = DocumentVersion.objects.create(
            document=document,
            version_number=next_version,
            storage_key=version.storage_key,  # Same file storage
            file_name=version.file_name,
            mime_type=version.mime_type,
            size_bytes=version.size_bytes,
            sha256=version.sha256,
            uploaded_by=request.user
        )
        
        log_audit_event(
            actor_user=request.user,
            action='DOCUMENT_VERSION_RESTORED',
            company=request.user.company,
            entity='DOCUMENT',
            entity_id=str(document.id),
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            data={
                'restored_from_version': version.version_number,
                'new_version_number': next_version
            }
        )
        
        return Response(
            DocumentVersionSerializer(new_version).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['delete'])
    def soft_delete(self, request, pk=None):
        document = self.get_object()
        document.is_deleted = True
        document.save()
        
        log_audit_event(
            actor_user=request.user,
            action='DOCUMENT_DELETED',
            company=request.user.company,
            entity='DOCUMENT',
            entity_id=str(document.id),
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            data={'document_title': document.title}
        )
        
        return Response({'message': 'Document deleted'}, status=status.HTTP_200_OK)
