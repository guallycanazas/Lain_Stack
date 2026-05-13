"""
Call / CDR Pydantic schemas.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.call import CallStatus, CallType


class CallBase(BaseModel):
    caller_number: str = Field(..., max_length=20)
    callee_number: str = Field(..., max_length=20)
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: int = Field(default=0, ge=0)
    call_type: CallType = CallType.VOICE
    status: CallStatus = CallStatus.COMPLETED
    sip_call_id: Optional[str] = None
    notes: Optional[str] = None


class CallCreate(CallBase):
    caller_id: Optional[int] = None
    callee_id: Optional[int] = None


class CallRead(CallBase):
    id: int
    caller_id: Optional[int]
    callee_id: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class CallFilter(BaseModel):
    status: Optional[CallStatus] = None
    call_type: Optional[CallType] = None
    caller_number: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


class CallStats(BaseModel):
    total: int
    completed: int
    failed: int
    avg_duration_seconds: float
    total_duration_seconds: int
