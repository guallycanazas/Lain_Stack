"""
API v1 router — aggregates all endpoint modules.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    alerts,
    audit_logs,
    auth,
    calls,
    dashboard,
    sim_cards,
    sms,
    subscribers,
    users,
)

api_router = APIRouter()

# Core auth
api_router.include_router(auth.router)

# Users & profile
api_router.include_router(users.router)

# Dashboard
api_router.include_router(dashboard.router)

# Telecom entities
api_router.include_router(subscribers.router)
api_router.include_router(sim_cards.router)
api_router.include_router(calls.router)
api_router.include_router(sms.router)

# Events & monitoring
api_router.include_router(alerts.alert_router, tags=["Alerts"])
api_router.include_router(alerts.service_router, tags=["Service Status"])

# Audit
api_router.include_router(audit_logs.router)
