from django.apps import AppConfig


class AuthConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'safecloud_api.apps.auth'
    label = 'safecloud_auth'
