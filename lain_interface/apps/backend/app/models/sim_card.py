"""
SIM Card model and subscriber-SIM assignment history.
SIM credential fields (Ki/OPc/AMF) are stored as PLACEHOLDER strings only —
never exposed in API responses or logs.
"""
import enum

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class SimStatus(str, enum.Enum):
    AVAILABLE = "available"
    ASSIGNED = "assigned"
    BLOCKED = "blocked"
    TESTING = "testing"
    RETIRED = "retired"


class SimCard(Base, TimestampMixin):
    __tablename__ = "sim_cards"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    iccid: Mapped[str] = mapped_column(String(22), unique=True, nullable=False, index=True)
    imsi: Mapped[str | None] = mapped_column(String(15), nullable=True)
    msisdn: Mapped[str | None] = mapped_column(String(15), nullable=True)
    # Sensitive placeholders — NEVER expose raw values via API
    _ki_placeholder: Mapped[str | None] = mapped_column(
        "ki_placeholder", String(32), nullable=True
    )
    _opc_placeholder: Mapped[str | None] = mapped_column(
        "opc_placeholder", String(32), nullable=True
    )
    amf: Mapped[str | None] = mapped_column(String(8), nullable=True, default="8000")
    adm: Mapped[str | None] = mapped_column(String(16), nullable=True)
    # Classification
    sim_type: Mapped[str] = mapped_column(String(20), nullable=False, default="usim")
    manufacturer: Mapped[str | None] = mapped_column(String(100), nullable=True)
    batch_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[SimStatus] = mapped_column(
        Enum(SimStatus, name="sim_status_enum"),
        nullable=False,
        default=SimStatus.AVAILABLE,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    assignments: Mapped[list["SubscriberSimAssignment"]] = relationship(
        back_populates="sim_card", lazy="noload"
    )

    __table_args__ = (Index("ix_sim_cards_status", "status"),)

    def __repr__(self) -> str:
        return f"<SimCard iccid={self.iccid} status={self.status}>"


class SubscriberSimAssignment(Base, TimestampMixin):
    """Assignment history between subscribers and SIM cards."""

    __tablename__ = "subscriber_sim_assignments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    subscriber_id: Mapped[int] = mapped_column(
        ForeignKey("subscribers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sim_card_id: Mapped[int] = mapped_column(
        ForeignKey("sim_cards.id", ondelete="CASCADE"), nullable=False, index=True
    )
    assigned_at: Mapped[str | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    unassigned_at: Mapped[str | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    assigned_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    subscriber: Mapped["Subscriber"] = relationship(
        back_populates="sim_assignments", lazy="joined"
    )
    sim_card: Mapped["SimCard"] = relationship(
        back_populates="assignments", lazy="joined"
    )


from app.models.subscriber import Subscriber  # noqa: E402
