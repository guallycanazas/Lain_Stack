"""
Call (CDR) model for telephony records.
"""
import enum

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class CallType(str, enum.Enum):
    VOICE = "voice"
    VOLTE = "volte"
    CS = "cs"  # Circuit Switched
    EMERGENCY = "emergency"


class CallStatus(str, enum.Enum):
    COMPLETED = "completed"
    FAILED = "failed"
    BUSY = "busy"
    NO_ANSWER = "no_answer"
    REJECTED = "rejected"
    IN_PROGRESS = "in_progress"


class Call(Base, TimestampMixin):
    __tablename__ = "calls"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    caller_id: Mapped[int | None] = mapped_column(
        ForeignKey("subscribers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    callee_id: Mapped[int | None] = mapped_column(
        ForeignKey("subscribers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # Raw numbers (stored even if subscriber is deleted)
    caller_number: Mapped[str] = mapped_column(String(20), nullable=False)
    callee_number: Mapped[str] = mapped_column(String(20), nullable=False)
    started_at: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    ended_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    call_type: Mapped[CallType] = mapped_column(
        Enum(CallType, name="call_type_enum"), nullable=False, default=CallType.VOICE
    )
    status: Mapped[CallStatus] = mapped_column(
        Enum(CallStatus, name="call_status_enum"), nullable=False, default=CallStatus.COMPLETED
    )
    sip_call_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    caller: Mapped["Subscriber"] = relationship(
        foreign_keys=[caller_id], back_populates="calls", lazy="noload"
    )

    __table_args__ = (
        Index("ix_calls_started_at", "started_at"),
        Index("ix_calls_status", "status"),
        Index("ix_calls_caller_callee", "caller_id", "callee_id"),
    )

    def __repr__(self) -> str:
        return (
            f"<Call {self.caller_number} → {self.callee_number} "
            f"status={self.status} duration={self.duration_seconds}s>"
        )


from app.models.subscriber import Subscriber  # noqa: E402
