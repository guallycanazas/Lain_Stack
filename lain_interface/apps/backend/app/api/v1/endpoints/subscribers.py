"""
Subscriber CRUD endpoints.
"""
import csv
import io
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import StreamingResponse

from app.core.dependencies import AdminOrOperator, CurrentUser, DBSession
from app.models.audit_log import AuditAction
from app.models.subscriber import Subscriber, SubscriberStatus, SimType
from app.repositories.subscriber_repository import SubscriberRepository
from app.schemas.common import PaginatedResponse
from app.schemas.subscriber import SubscriberCreate, SubscriberRead, SubscriberUpdate
from app.services.audit_service import AuditService

router = APIRouter(prefix="/subscribers", tags=["Subscribers"])


@router.get("", response_model=PaginatedResponse[SubscriberRead])
async def list_subscribers(
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: Optional[SubscriberStatus] = None,
    sim_type: Optional[SimType] = None,
    search: Optional[str] = None,
    current_user: CurrentUser = None,
):
    repo = SubscriberRepository(db)
    skip = (page - 1) * page_size
    items, total = await repo.list_paginated(
        skip=skip, limit=page_size, status=status, search=search, sim_type=sim_type
    )
    return PaginatedResponse.create(
        items=[SubscriberRead.model_validate(s) for s in items],
        total=total, page=page, page_size=page_size,
    )


@router.post("", response_model=SubscriberRead, status_code=status.HTTP_201_CREATED, dependencies=[AdminOrOperator])
async def create_subscriber(body: SubscriberCreate, current_user: CurrentUser, request: Request, db: DBSession):
    repo = SubscriberRepository(db)
    audit = AuditService(db)
    if await repo.get_by_imsi(body.imsi):
        raise HTTPException(status_code=409, detail="IMSI already registered")
    if await repo.get_by_msisdn(body.msisdn):
        raise HTTPException(status_code=409, detail="MSISDN already registered")
    sub = Subscriber(**body.model_dump())
    sub = await repo.create(sub)
    await audit.log(AuditAction.CREATE, user=current_user, resource_type="subscriber",
                    resource_id=sub.id, request=request)
    return sub


@router.get("/{sub_id}", response_model=SubscriberRead)
async def get_subscriber(sub_id: int, db: DBSession, current_user: CurrentUser = None):
    repo = SubscriberRepository(db)
    sub = await repo.get_by_id(sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    return sub


@router.patch("/{sub_id}", response_model=SubscriberRead, dependencies=[AdminOrOperator])
async def update_subscriber(sub_id: int, body: SubscriberUpdate, current_user: CurrentUser, request: Request, db: DBSession):
    repo = SubscriberRepository(db)
    audit = AuditService(db)
    sub = await repo.get_by_id(sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(sub, field, value)
    sub = await repo.update(sub)
    await audit.log(AuditAction.UPDATE, user=current_user, resource_type="subscriber",
                    resource_id=sub_id, request=request)
    return sub


@router.delete("/{sub_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[AdminOrOperator])
async def delete_subscriber(sub_id: int, current_user: CurrentUser, request: Request, db: DBSession):
    repo = SubscriberRepository(db)
    audit = AuditService(db)
    sub = await repo.get_by_id(sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    await repo.soft_delete(sub)
    await audit.log(AuditAction.DELETE, user=current_user, resource_type="subscriber",
                    resource_id=sub_id, request=request)


@router.get("/export/csv", summary="Export subscribers as CSV")
async def export_csv(db: DBSession, current_user: CurrentUser = None):
    repo = SubscriberRepository(db)
    items, _ = await repo.list_paginated(limit=10000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "imsi", "msisdn", "iccid", "full_name", "email", "status", "apn", "sim_type", "profile", "created_at"])
    for s in items:
        writer.writerow([s.id, s.imsi, s.msisdn, s.iccid, s.full_name, s.email,
                         s.status.value, s.apn, s.sim_type.value, s.profile, s.created_at])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=subscribers.csv"},
    )
