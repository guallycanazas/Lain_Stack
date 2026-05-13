"""
SMS repository.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sms import SMS, SMSDirection, SMSStatus


class SMSRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[SMSStatus] = None,
        direction: Optional[SMSDirection] = None,
        sender_number: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> tuple[list[SMS], int]:
        q = select(SMS)
        if status:
            q = q.where(SMS.status == status)
        if direction:
            q = q.where(SMS.direction == direction)
        if sender_number:
            q = q.where(SMS.sender_number.ilike(f"%{sender_number}%"))
        if date_from:
            q = q.where(SMS.sent_at >= date_from)
        if date_to:
            q = q.where(SMS.sent_at <= date_to)
        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar_one()
        items = list(
            (await self.db.execute(q.order_by(SMS.sent_at.desc()).offset(skip).limit(limit))).scalars().all()
        )
        return items, total

    async def get_stats(self) -> dict:
        result = await self.db.execute(select(func.count(SMS.id)))
        total = result.scalar_one()
        direction_q = select(SMS.direction, func.count(SMS.id)).group_by(SMS.direction)
        direction_result = await self.db.execute(direction_q)
        by_direction = {r[0].value: r[1] for r in direction_result}
        return {"total": total, "by_direction": by_direction}

    async def create(self, sms: SMS) -> SMS:
        self.db.add(sms)
        await self.db.flush()
        await self.db.refresh(sms)
        return sms

    async def create_bulk(self, sms_list: list[SMS]) -> list[SMS]:
        self.db.add_all(sms_list)
        await self.db.flush()
        return sms_list
