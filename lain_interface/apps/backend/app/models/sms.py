"""
SMS model for lab messaging records (MO/MT).
"""
import enum

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class SMSDirection(str, enum.Enum):
    MO = "mo"  # Mobile Originated
    MT = "mt"  # Mobile Terminated
    INTERNAL = "internal"


class SMSStatus(str, enum.Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    PENDING = "pending"
    REJECTED = "rejected"


class SMS(Base, TimestampMixin):
    __tablename__ = "sms"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sender_id: Mapped[int | None] = mapped_column(
        ForeignKey("subscribers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    receiver_id: Mapped[int | None] = mapped_column(
        ForeignKey("subscribers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    sender_number: Mapped[str] = mapped_column(String(20), nullable=False)
    receiver_number: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)  # Simulated payload
    direction: Mapped[SMSDirection] = mapped_column(
        Enum(SMSDirection, name="sms_direction_enum"), nullable=False, default=SMSDirection.MO
    )
    status: Mapped[SMSStatus] = mapped_column(
        Enum(SMSStatus, name="sms_status_enum"), nullable=False, default=SMSStatus.SENT
    )
    sent_at: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    delivered_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    smsc_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationships
    sender: Mapped["Subscriber"] = relationship(
        foreign_keys=[sender_id], back_populates="sms_sent", lazy="noload"
    )

    __table_args__ = (
        Index("ix_sms_sent_at", "sent_at"),
        Index("ix_sms_status", "status"),
        Index("ix_sms_sender_receiver", "sender_id", "receiver_id"),
    )

    def __repr__(self) -> str:
        return f"<SMS {self.sender_number} → {self.receiver_number} status={self.status}>"


from app.models.subscriber import Subscriber  # noqa: E402
