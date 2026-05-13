"""
Dashboard KPIs endpoint.
"""
from fastapi import APIRouter

from app.core.dependencies import CurrentUser, DBSession
from app.repositories.alert_repository import AlertRepository, ServiceStatusRepository
from app.repositories.call_repository import CallRepository
from app.repositories.sms_repository import SMSRepository
from app.repositories.subscriber_repository import SubscriberRepository
from app.schemas.alert import DashboardKPIs

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/kpis", response_model=DashboardKPIs)
async def get_kpis(db: DBSession, current_user: CurrentUser = None):
    """Aggregated KPIs for the main dashboard."""
    sub_repo = SubscriberRepository(db)
    call_repo = CallRepository(db)
    sms_repo = SMSRepository(db)
    alert_repo = AlertRepository(db)
    svc_repo = ServiceStatusRepository(db)

    # Subscribers
    _, total_subs = await sub_repo.list_paginated(limit=1)
    sub_by_status = await sub_repo.count_by_status()
    active_subs = sub_by_status.get("active", 0)

    # SIM cards
    from sqlalchemy import func, select
    from app.models.sim_card import SimCard
    sim_total = (await db.execute(select(func.count(SimCard.id)))).scalar_one()
    sim_available = (await db.execute(
        select(func.count(SimCard.id)).where(SimCard.status == "available")
    )).scalar_one()

    # Calls
    call_stats = await call_repo.get_stats()
    by_call_status = call_stats.get("by_status", {})
    completed_calls = by_call_status.get("completed", 0)
    failed_calls = by_call_status.get("failed", 0)

    # SMS
    sms_stats = await sms_repo.get_stats()

    # Alerts
    unread_counts = await alert_repo.count_unread_by_level()
    unread_total = sum(unread_counts.values())
    critical = unread_counts.get("critical", 0)

    # Services
    svc_counts = await svc_repo.count_by_state()
    services_up = svc_counts.get("up", 0)
    services_total = sum(svc_counts.values())

    return DashboardKPIs(
        total_subscribers=total_subs,
        active_subscribers=active_subs,
        total_sim_cards=sim_total,
        available_sims=sim_available,
        total_calls=call_stats["total"],
        completed_calls=completed_calls,
        failed_calls=failed_calls,
        total_sms=sms_stats["total"],
        unread_alerts=unread_total,
        critical_alerts=critical,
        services_up=services_up,
        services_total=services_total,
    )
