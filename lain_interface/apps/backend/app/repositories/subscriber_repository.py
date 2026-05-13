"""
Subscriber repository.
"""
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscriber import Subscriber, SubscriberStatus


class SubscriberRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _base_query(self):
        return select(Subscriber).where(Subscriber.deleted_at.is_(None))

    async def get_by_id(self, sub_id: int) -> Optional[Subscriber]:
        result = await self.db.execute(self._base_query().where(Subscriber.id == sub_id))
        return result.scalar_one_or_none()

    async def get_by_imsi(self, imsi: str) -> Optional[Subscriber]:
        result = await self.db.execute(self._base_query().where(Subscriber.imsi == imsi))
        return result.scalar_one_or_none()

    async def get_by_msisdn(self, msisdn: str) -> Optional[Subscriber]:
        result = await self.db.execute(self._base_query().where(Subscriber.msisdn == msisdn))
        return result.scalar_one_or_none()

    async def list_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[SubscriberStatus] = None,
        search: Optional[str] = None,
        sim_type: Optional[str] = None,
    ) -> tuple[list[Subscriber], int]:
        q = self._base_query()
        if status:
            q = q.where(Subscriber.status == status)
        if sim_type:
            q = q.where(Subscriber.sim_type == sim_type)
        if search:
            pattern = f"%{search}%"
            q = q.where(
                or_(
                    Subscriber.imsi.ilike(pattern),
                    Subscriber.msisdn.ilike(pattern),
                    Subscriber.full_name.ilike(pattern),
                    Subscriber.email.ilike(pattern),
                )
            )
        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar_one()
        items_q = q.order_by(Subscriber.created_at.desc()).offset(skip).limit(limit)
        items = list((await self.db.execute(items_q)).scalars().all())
        return items, total

    async def count_by_status(self) -> dict[str, int]:
        result = await self.db.execute(
            select(Subscriber.status, func.count(Subscriber.id))
            .where(Subscriber.deleted_at.is_(None))
            .group_by(Subscriber.status)
        )
        return {row[0].value: row[1] for row in result}

    async def create(self, sub: Subscriber) -> Subscriber:
        self.db.add(sub)
        await self.db.flush()
        await self.db.refresh(sub)
        return sub

    async def update(self, sub: Subscriber) -> Subscriber:
        await self.db.flush()
        await self.db.refresh(sub)
        return sub

    async def soft_delete(self, sub: Subscriber) -> None:
        sub.soft_delete()
        await self.db.flush()
