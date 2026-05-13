"""
Alert and Service Status repositories.
"""
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert, AlertLevel
from app.models.service_status import ServiceName, ServiceState, ServiceStatus


class AlertRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        level: Optional[AlertLevel] = None,
        is_read: Optional[bool] = None,
    ) -> tuple[list[Alert], int]:
        q = select(Alert)
        if level:
            q = q.where(Alert.level == level)
        if is_read is not None:
            q = q.where(Alert.is_read == is_read)
        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar_one()
        items = list(
            (await self.db.execute(q.order_by(Alert.created_at.desc()).offset(skip).limit(limit))).scalars().all()
        )
        return items, total

    async def count_unread_by_level(self) -> dict[str, int]:
        result = await self.db.execute(
            select(Alert.level, func.count(Alert.id))
            .where(Alert.is_read == False)  # noqa: E712
            .group_by(Alert.level)
        )
        return {r[0].value: r[1] for r in result}

    async def get_by_id(self, alert_id: int) -> Optional[Alert]:
        result = await self.db.execute(select(Alert).where(Alert.id == alert_id))
        return result.scalar_one_or_none()

    async def create(self, alert: Alert) -> Alert:
        self.db.add(alert)
        await self.db.flush()
        await self.db.refresh(alert)
        return alert

    async def mark_all_read(self) -> None:
        from sqlalchemy import update
        await self.db.execute(update(Alert).where(Alert.is_read == False).values(is_read=True))  # noqa: E712
        await self.db.flush()


class ServiceStatusRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_all(self) -> list[ServiceStatus]:
        result = await self.db.execute(select(ServiceStatus).order_by(ServiceStatus.service_name))
        return list(result.scalars().all())

    async def get_by_name(self, name: ServiceName) -> Optional[ServiceStatus]:
        result = await self.db.execute(
            select(ServiceStatus).where(ServiceStatus.service_name == name)
        )
        return result.scalar_one_or_none()

    async def upsert(self, service: ServiceStatus) -> ServiceStatus:
        self.db.add(service)
        await self.db.flush()
        await self.db.refresh(service)
        return service

    async def count_by_state(self) -> dict[str, int]:
        result = await self.db.execute(
            select(ServiceStatus.state, func.count(ServiceStatus.id)).group_by(ServiceStatus.state)
        )
        return {r[0].value: r[1] for r in result}
