from django.utils.timezone import now
from safecloud_api.apps.companies.models import User, AuditEvent


def log_audit_event(actor_user, action, company=None, entity=None, entity_id=None, ip=None, user_agent=None, data=None):
    """Helper to log audit events"""
    AuditEvent.objects.create(
        company=company,
        actor_user=actor_user,
        action=action,
        entity=entity,
        entity_id=entity_id,
        ip=ip,
        user_agent=user_agent,
        data=data
    )


def update_user_last_login(user):
    """Update user's last_login_at"""
    user.last_login_at = now()
    user.save(update_fields=['last_login_at'])
