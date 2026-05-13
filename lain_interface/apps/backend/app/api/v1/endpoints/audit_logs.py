"""
Audit log read endpoints.
"""
from fastapi import APIRouter, Query

from app.core.dependencies import AdminOnly, CurrentUser, DBSession
from app.models.audit_log import AuditAction, AuditLog
from app.schemas.common import PaginatedResponse
from sqlalchemy import func, select
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AuditLogRead(BaseModel):
    id: int
    user_id: Optional[int]
    username: Optional[str]
    action: AuditAction
    resource_type: Optional[str]
    resource_id: Optional[str]
    description: Optional[str]
    ip_address: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=PaginatedResponse[AuditLogRead], dependencies=[AdminOnly])
async def list_audit_logs(
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    action: Optional[AuditAction] = None,
    username: Optional[str] = None,
):
    q = select(AuditLog)
    if action:
        q = q.where(AuditLog.action == action)
    if username:
        q = q.where(AuditLog.username.ilike(f"%{username}%"))
    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()
    items = list(
        (await db.execute(q.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size))).scalars().all()
    )
    return PaginatedResponse.create(
        items=[AuditLogRead.model_validate(a) for a in items],
        total=total, page=page, page_size=page_size,
    )
