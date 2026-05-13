"""
SIM Card endpoints.
"""
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request, status

from app.core.dependencies import AdminOnly, AdminOrOperator, CurrentUser, DBSession
from app.models.audit_log import AuditAction
from app.models.sim_card import SimCard, SimStatus, SubscriberSimAssignment
from app.repositories.alert_repository import ServiceStatusRepository
from app.schemas.common import PaginatedResponse
from app.schemas.sim_card import (
    SimAssignmentCreate,
    SimAssignmentRead,
    SimCardCreate,
    SimCardRead,
    SimCardUpdate,
)
from app.services.audit_service import AuditService
from sqlalchemy import func, select

router = APIRouter(prefix="/sim-cards", tags=["SIM Cards"])


@router.get("", response_model=PaginatedResponse[SimCardRead])
async def list_sim_cards(
    db: DBSession,
    current_user: CurrentUser = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: Optional[SimStatus] = None,
):
    q = select(SimCard)
    if status:
        q = q.where(SimCard.status == status)
    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()
    items = list((await db.execute(q.order_by(SimCard.created_at.desc()).offset((page - 1) * page_size).limit(page_size))).scalars().all())
    return PaginatedResponse.create(
        items=[SimCardRead.model_validate(s) for s in items],
        total=total, page=page, page_size=page_size,
    )


@router.post("", response_model=SimCardRead, status_code=status.HTTP_201_CREATED, dependencies=[AdminOrOperator])
async def create_sim_card(body: SimCardCreate, current_user: CurrentUser, request: Request, db: DBSession):
    audit = AuditService(db)
    existing = (await db.execute(select(SimCard).where(SimCard.iccid == body.iccid))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="ICCID already registered")
    data = body.model_dump(exclude={"ki_placeholder", "opc_placeholder"})
    sim = SimCard(**data)
    # Store credential placeholders (never expose)
    if body.ki_placeholder:
        sim._ki_placeholder = body.ki_placeholder
    if body.opc_placeholder:
        sim._opc_placeholder = body.opc_placeholder
    db.add(sim)
    await db.flush()
    await db.refresh(sim)
    await audit.log(AuditAction.CREATE, user=current_user, resource_type="sim_card",
                    resource_id=sim.id, request=request)
    return sim


@router.get("/{sim_id}", response_model=SimCardRead)
async def get_sim_card(sim_id: int, db: DBSession, current_user: CurrentUser = None):
    sim = (await db.execute(select(SimCard).where(SimCard.id == sim_id))).scalar_one_or_none()
    if not sim:
        raise HTTPException(status_code=404, detail="SIM card not found")
    return sim


@router.patch("/{sim_id}", response_model=SimCardRead, dependencies=[AdminOrOperator])
async def update_sim_card(sim_id: int, body: SimCardUpdate, current_user: CurrentUser, db: DBSession):
    sim = (await db.execute(select(SimCard).where(SimCard.id == sim_id))).scalar_one_or_none()
    if not sim:
        raise HTTPException(status_code=404, detail="SIM card not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(sim, field, value)
    await db.flush()
    await db.refresh(sim)
    return sim


@router.post("/assign", response_model=SimAssignmentRead, dependencies=[AdminOrOperator])
async def assign_sim(body: SimAssignmentCreate, current_user: CurrentUser, db: DBSession):
    from datetime import datetime, timezone
    sim = (await db.execute(select(SimCard).where(SimCard.id == body.sim_card_id))).scalar_one_or_none()
    if not sim:
        raise HTTPException(status_code=404, detail="SIM card not found")
    if sim.status != SimStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail=f"SIM is not available (current status: {sim.status})")
    assignment = SubscriberSimAssignment(
        subscriber_id=body.subscriber_id,
        sim_card_id=body.sim_card_id,
        assigned_at=datetime.now(timezone.utc),
        assigned_by=current_user.username,
        notes=body.notes,
    )
    sim.status = SimStatus.ASSIGNED
    db.add(assignment)
    await db.flush()
    await db.refresh(assignment)
    return assignment
