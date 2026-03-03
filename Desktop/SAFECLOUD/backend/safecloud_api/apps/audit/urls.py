from django.urls import path, include
from rest_framework.routers import DefaultRouter
from safecloud_api.apps.audit.views import AuditEventViewSet

router = DefaultRouter()
router.register(r'events', AuditEventViewSet, basename='audit_event')

urlpatterns = [
    path('', include(router.urls)),
]
