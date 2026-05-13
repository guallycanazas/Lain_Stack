"""
Alert / Event model for system notifications.
"""
import enum

from sqlalchemy import Boolean, Enum, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class AlertLevel(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AlertSource(str, enum.Enum):
    SYSTEM = "system"
    OPEN5GS = "open5gs"
    KAMAILIO = "kamailio"
    PYHSS = "pyhss"
    RAN = "ran"
    MANUAL = "manual"
    DB = "db"
    REDIS = "redis"


class Alert(Base, TimestampMixin):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    level: Mapped[AlertLevel] = mapped_column(
        Enum(AlertLevel, name="alert_level_enum"), nullable=False, default=AlertLevel.INFO
    )
    source: Mapped[AlertSource] = mapped_column(
        Enum(AlertSource, name="alert_source_enum"), nullable=False, default=AlertSource.SYSTEM
    )
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON payload

    __table_args__ = (
        Index("ix_alerts_level_read", "level", "is_read"),
        Index("ix_alerts_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Alert [{self.level}] {self.title}>"
