"""
Service Status model — tracks health of lab components.
Starts as mock/simulated; designed for real health-check integration.
"""
import enum

from sqlalchemy import Enum, Index, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class ServiceName(str, enum.Enum):
    OPEN5GS = "open5gs"
    KAMAILIO_IMS = "kamailio_ims"
    PYHSS = "pyhss"
    WEBUI = "webui"
    DATABASE = "database"
    REDIS = "redis"
    RAN_CONNECTOR = "ran_connector"
    BACKEND_API = "backend_api"
    NGINX = "nginx"


class ServiceState(str, enum.Enum):
    UP = "up"
    DOWN = "down"
    DEGRADED = "degraded"
    UNKNOWN = "unknown"
    MAINTENANCE = "maintenance"


class ServiceStatus(Base, TimestampMixin):
    __tablename__ = "service_status"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    service_name: Mapped[ServiceName] = mapped_column(
        Enum(ServiceName, name="service_name_enum"), nullable=False, unique=True, index=True
    )
    state: Mapped[ServiceState] = mapped_column(
        Enum(ServiceState, name="service_state_enum"), nullable=False, default=ServiceState.UNKNOWN
    )
    version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    host: Mapped[str | None] = mapped_column(String(255), nullable=True)
    port: Mapped[int | None] = mapped_column(nullable=True)
    latency_ms: Mapped[float | None] = mapped_column(nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    diagnostics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    last_checked: Mapped[str | None] = mapped_column(nullable=True)

    def __repr__(self) -> str:
        return f"<ServiceStatus {self.service_name}={self.state}>"
