"""
Call repository.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.call import Call, CallStatus


class CallRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[CallStatus] = None,
        caller_number: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> tuple[list[Call], int]:
        q = select(Call)
        if status:
            q = q.where(Call.status == status)
        if caller_number:
            q = q.where(Call.caller_number.ilike(f"%{caller_number}%"))
        if date_from:
            q = q.where(Call.started_at >= date_from)
        if date_to:
            q = q.where(Call.started_at <= date_to)
        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar_one()
        items = list((await self.db.execute(q.order_by(Call.started_at.desc()).offset(skip).limit(limit))).scalars().all())
        return items, total

    async def get_stats(self) -> dict:
        result = await self.db.execute(
            select(
                func.count(Call.id).label("total"),
                func.sum(Call.duration_seconds).label("total_duration"),
                func.avg(Call.duration_seconds).label("avg_duration"),
            )
        )
        row = result.one()
        status_q = select(Call.status, func.count(Call.id)).group_by(Call.status)
        status_result = await self.db.execute(status_q)
        by_status = {r[0].value: r[1] for r in status_result}
        return {
            "total": row.total or 0,
            "total_duration": int(row.total_duration or 0),
            "avg_duration": float(row.avg_duration or 0),
            "by_status": by_status,
        }

    async def create(self, call: Call) -> Call:
        self.db.add(call)
        await self.db.flush()
        await self.db.refresh(call)
        return call

    async def create_bulk(self, calls: list[Call]) -> list[Call]:
        self.db.add_all(calls)
        await self.db.flush()
        return calls
