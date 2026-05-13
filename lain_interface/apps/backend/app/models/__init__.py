"""
Central model registry — import all models so Alembic can detect them.
"""
from app.db.base import Base  # noqa: F401
from app.models.alert import Alert  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.call import Call  # noqa: F401
from app.models.refresh_token import RefreshToken  # noqa: F401
from app.models.service_status import ServiceStatus  # noqa: F401
from app.models.sim_card import SimCard, SubscriberSimAssignment  # noqa: F401
from app.models.sms import SMS  # noqa: F401
from app.models.subscriber import Subscriber  # noqa: F401
from app.models.user import User  # noqa: F401
