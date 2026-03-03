# Backend configuration

from decouple import config

class AppConfig:
    # API
    API_TITLE = 'SAFE Cloud API'
    API_VERSION = '1.0.0'
    
    # Security
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_SECURITY_POLICY = {
        'default-src': ('\'self\'',),
    }
    
    # Rate Limiting
    RATELIMIT_ENABLE = True
    RATELIMIT_USE_CACHE = 'default'
    
    # Pagination
    DEFAULT_PAGE_SIZE = 50
    MAX_PAGE_SIZE = 100
    
    # Search
    SEARCH_BACKEND = 'django.db.models.Q'
    
    # File Upload
    MAX_UPLOAD_SIZE = 52428800  # 50MB
    ALLOWED_UPLOAD_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
    
    # Plans Limits
    PLAN_LIMITS = {
        'BASIC': {
            'max_users': 5,
            'max_projects': 3,
            'max_documents': 50,
            'max_storage_mb': 1000,
        },
        'PRO': {
            'max_users': 20,
            'max_projects': 10,
            'max_documents': 500,
            'max_storage_mb': 10000,
        },
        'CORPORATE': {
            'max_users': 100,
            'max_projects': 50,
            'max_documents': 2000,
            'max_storage_mb': 50000,
        },
        'ENTERPRISE': {
            'max_users': -1,
            'max_projects': -1,
            'max_documents': -1,
            'max_storage_mb': -1,
        },
    }
