"""
Subscriber (Abonado) model — core entity of the telecom lab.
"""
import enum

from sqlalchemy import Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin


class SubscriberStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    TESTING = "testing"


class SimType(str, enum.Enum):
    USIM = "usim"
    ISIM = "isim"
    UICC = "uicc"
    VIRTUAL = "virtual"


class Subscriber(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "subscribers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    # Telecom identifiers
    imsi: Mapped[str] = mapped_column(String(15), unique=True, nullable=False, index=True)
    msisdn: Mapped[str] = mapped_column(String(15), unique=True, nullable=False, index=True)
    iccid: Mapped[str | None] = mapped_column(String(22), unique=True, nullable=True)
    # Personal info
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Status & profile
    status: Mapped[SubscriberStatus] = mapped_column(
        Enum(SubscriberStatus, name="subscriber_status_enum"),
        nullable=False,
        default=SubscriberStatus.INACTIVE,
    )
    apn: Mapped[str] = mapped_column(String(100), nullable=False, default="internet")
    sim_type: Mapped[SimType] = mapped_column(
        Enum(SimType, name="sim_type_enum"), nullable=False, default=SimType.USIM
    )
    profile: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g. volte, data-only
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Relationships
    sim_assignments: Mapped[list["SubscriberSimAssignment"]] = relationship(
        back_populates="subscriber", lazy="noload"
    )
    calls: Mapped[list["Call"]] = relationship(
        foreign_keys="Call.caller_id", back_populates="caller", lazy="noload"
    )
    sms_sent: Mapped[list["SMS"]] = relationship(
        foreign_keys="SMS.sender_id", back_populates="sender", lazy="noload"
    )

    __table_args__ = (
        Index("ix_subscribers_imsi_msisdn", "imsi", "msisdn"),
        Index("ix_subscribers_status", "status"),
    )

    def __repr__(self) -> str:
        return f"<Subscriber imsi={self.imsi} msisdn={self.msisdn} status={self.status}>"


from app.models.call import Call  # noqa: E402
from app.models.sim_card import SubscriberSimAssignment  # noqa: E402
from app.models.sms import SMS  # noqa: E402
