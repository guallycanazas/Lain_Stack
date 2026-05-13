"""
Call CDR endpoints.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query

from app.core.dependencies import CurrentUser, DBSession
from app.models.call import CallStatus, CallType
from app.repositories.call_repository import CallRepository
from app.schemas.call import CallRead, CallStats
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/calls", tags=["Calls (CDR)"])


@router.get("", response_model=PaginatedResponse[CallRead])
async def list_calls(
    db: DBSession,
    current_user: CurrentUser = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: Optional[CallStatus] = None,
    call_type: Optional[CallType] = None,
    caller_number: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    repo = CallRepository(db)
    skip = (page - 1) * page_size
    items, total = await repo.list_paginated(
        skip=skip, limit=page_size, status=status,
        caller_number=caller_number, date_from=date_from, date_to=date_to,
    )
    return PaginatedResponse.create(
        items=[CallRead.model_validate(c) for c in items],
        total=total, page=page, page_size=page_size,
    )


@router.get("/stats", response_model=CallStats)
async def get_call_stats(db: DBSession, current_user: CurrentUser = None):
    repo = CallRepository(db)
    raw = await repo.get_stats()
    by_status = raw.get("by_status", {})
    return CallStats(
        total=raw["total"],
        completed=by_status.get("completed", 0),
        failed=by_status.get("failed", 0),
        avg_duration_seconds=raw["avg_duration"],
        total_duration_seconds=raw["total_duration"],
    )
