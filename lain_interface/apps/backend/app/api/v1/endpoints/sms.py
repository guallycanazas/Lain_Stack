"""
SMS endpoints.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query

from app.core.dependencies import CurrentUser, DBSession
from app.models.sms import SMSDirection, SMSStatus
from app.repositories.sms_repository import SMSRepository
from app.schemas.common import PaginatedResponse
from app.schemas.sms import SMSRead

router = APIRouter(prefix="/sms", tags=["SMS"])


@router.get("", response_model=PaginatedResponse[SMSRead])
async def list_sms(
    db: DBSession,
    current_user: CurrentUser = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: Optional[SMSStatus] = None,
    direction: Optional[SMSDirection] = None,
    sender_number: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    repo = SMSRepository(db)
    skip = (page - 1) * page_size
    items, total = await repo.list_paginated(
        skip=skip, limit=page_size, status=status, direction=direction,
        sender_number=sender_number, date_from=date_from, date_to=date_to,
    )
    return PaginatedResponse.create(
        items=[SMSRead.model_validate(s) for s in items],
        total=total, page=page, page_size=page_size,
    )


@router.get("/stats")
async def get_sms_stats(db: DBSession, current_user: CurrentUser = None):
    repo = SMSRepository(db)
    return await repo.get_stats()
