from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Schema & Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # API Endpoints
    path('api/auth/', include('safecloud_api.apps.auth.urls')),
    path('api/users/', include('safecloud_api.apps.users.urls')),
    path('api/companies/', include('safecloud_api.apps.companies.urls')),
    path('api/projects/', include('safecloud_api.apps.projects.urls')),
    path('api/documents/', include('safecloud_api.apps.documents.urls')),
    path('api/tickets/', include('safecloud_api.apps.tickets.urls')),
    path('api/audit/', include('safecloud_api.apps.audit.urls')),
]
