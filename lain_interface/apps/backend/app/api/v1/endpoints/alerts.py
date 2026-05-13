"""
Alerts and Service Status endpoints.
"""
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.core.dependencies import AdminOrOperator, CurrentUser, DBSession
from app.models.alert import AlertLevel
from app.models.service_status import ServiceName, ServiceState
from app.repositories.alert_repository import AlertRepository, ServiceStatusRepository
from app.schemas.alert import AlertCreate, AlertMarkRead, AlertRead, DashboardKPIs, ServiceStatusRead, ServiceStatusUpdate
from app.schemas.common import PaginatedResponse
from app.services.health_check_service import HealthCheckService

router = APIRouter(tags=["Alerts & Services"])


# ── Alerts ───────────────────────────────────────────────────────────
alert_router = APIRouter(prefix="/alerts")


@alert_router.get("", response_model=PaginatedResponse[AlertRead])
async def list_alerts(
    db: DBSession,
    current_user: CurrentUser = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    level: Optional[AlertLevel] = None,
    is_read: Optional[bool] = None,
):
    repo = AlertRepository(db)
    skip = (page - 1) * page_size
    items, total = await repo.list_paginated(skip=skip, limit=page_size, level=level, is_read=is_read)
    return PaginatedResponse.create(
        items=[AlertRead.model_validate(a) for a in items],
        total=total, page=page, page_size=page_size,
    )


@alert_router.post("", response_model=AlertRead, dependencies=[AdminOrOperator], status_code=201)
async def create_alert(body: AlertCreate, db: DBSession):
    from app.models.alert import Alert
    repo = AlertRepository(db)
    alert = Alert(**body.model_dump())
    return await repo.create(alert)


@alert_router.patch("/{alert_id}/read", response_model=AlertRead)
async def mark_alert_read(alert_id: int, body: AlertMarkRead, db: DBSession, current_user: CurrentUser = None):
    repo = AlertRepository(db)
    alert = await repo.get_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = body.is_read
    await db.flush()
    await db.refresh(alert)
    return alert


@alert_router.post("/mark-all-read", dependencies=[AdminOrOperator])
async def mark_all_read(db: DBSession):
    repo = AlertRepository(db)
    await repo.mark_all_read()
    return {"message": "All alerts marked as read"}


@alert_router.get("/unread-counts")
async def unread_alert_counts(db: DBSession, current_user: CurrentUser = None):
    repo = AlertRepository(db)
    return await repo.count_unread_by_level()


# ── Service Status ────────────────────────────────────────────────────
service_router = APIRouter(prefix="/services")


@service_router.get("", response_model=list[ServiceStatusRead])
async def list_services(db: DBSession, current_user: CurrentUser = None):
    health = HealthCheckService(db)
    results = await health.run_all_checks()

    repo = ServiceStatusRepository(db)
    services = await repo.list_all()
    service_map = {svc.service_name.value: svc for svc in services}

    from datetime import datetime, timezone

    output = []
    for name, result in results.items():
        svc = service_map.get(name)
        if svc:
            svc.state = ServiceState(result.state) if result.state in ["up", "down", "degraded", "maintenance"] else svc.state
            svc.latency_ms = result.latency_ms
            svc.version = result.version or svc.version
            svc.notes = result.notes
            svc.diagnostics = result.diagnostics
            svc.last_checked = datetime.now(timezone.utc).isoformat()
        else:
            svc = ServiceStatus(
                service_name=ServiceName[name.upper()] if name.upper() in ServiceName._member_names_ else ServiceName(name),
                state=ServiceState(result.state) if result.state in ["up", "down", "degraded", "maintenance"] else ServiceState.UNKNOWN,
                latency_ms=result.latency_ms,
                version=result.version,
                notes=result.notes,
                last_checked=datetime.now(timezone.utc).isoformat(),
            )
        svc = await repo.upsert(svc)
        output.append(svc)

    return [ServiceStatusRead.model_validate(s) for s in output]


@service_router.post("/{service_id}/verify", response_model=ServiceStatusRead)
async def verify_service(service_id: int, db: DBSession, current_user: CurrentUser = None):
    from datetime import datetime, timezone
    health = HealthCheckService(db)
    results = await health.run_all_checks()

    repo = ServiceStatusRepository(db)
    services = await repo.list_all()
    service_map = {svc.id: svc for svc in services}

    svc = service_map.get(service_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    result = results.get(svc.service_name.value)
    if result:
        svc.state = ServiceState(result.state) if result.state in ["up", "down", "degraded", "maintenance"] else svc.state
        svc.latency_ms = result.latency_ms
        svc.version = result.version or svc.version
        svc.notes = result.notes
        svc.last_checked = datetime.now(timezone.utc).isoformat()
    else:
        svc.state = ServiceState.UNKNOWN
        svc.notes = "No se pudo verificar"
        svc.last_checked = datetime.now(timezone.utc).isoformat()

    await repo.upsert(svc)
    return ServiceStatusRead.model_validate(svc)


@service_router.post("/verify-all", response_model=list[ServiceStatusRead])
async def verify_all_services(db: DBSession, current_user: CurrentUser = None):
    from datetime import datetime, timezone
    health = HealthCheckService(db)
    results = await health.run_all_checks()

    repo = ServiceStatusRepository(db)
    services = await repo.list_all()

    output = []
    for svc in services:
        result = results.get(svc.service_name.value)
        if result:
            svc.state = ServiceState(result.state) if result.state in ["up", "down", "degraded", "maintenance"] else svc.state
            svc.latency_ms = result.latency_ms
            svc.version = result.version or svc.version
            svc.notes = result.notes
            svc.diagnostics = result.diagnostics
        else:
            svc.state = ServiceState.UNKNOWN
            svc.notes = "No se pudo verificar"
        svc.last_checked = datetime.now(timezone.utc).isoformat()
        await repo.upsert(svc)
        output.append(ServiceStatusRead.model_validate(svc))

    return output


@service_router.patch("/{service_name}", response_model=ServiceStatusRead, dependencies=[AdminOrOperator])
async def update_service_status(service_name: ServiceName, body: ServiceStatusUpdate, db: DBSession):
    from datetime import datetime, timezone
    repo = ServiceStatusRepository(db)
    svc = await repo.get_by_name(service_name)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    svc.state = body.state
    if body.version:
        svc.version = body.version
    if body.latency_ms is not None:
        svc.latency_ms = body.latency_ms
    if body.notes:
        svc.notes = body.notes
    svc.last_checked = datetime.now(timezone.utc).isoformat()
    return await repo.upsert(svc)
