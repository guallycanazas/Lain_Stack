"""
SMS Pydantic schemas.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.sms import SMSDirection, SMSStatus


class SMSBase(BaseModel):
    sender_number: str = Field(..., max_length=20)
    receiver_number: str = Field(..., max_length=20)
    content: Optional[str] = None
    direction: SMSDirection = SMSDirection.MO
    status: SMSStatus = SMSStatus.SENT
    sent_at: datetime


class SMSCreate(SMSBase):
    sender_id: Optional[int] = None
    receiver_id: Optional[int] = None
    smsc_id: Optional[str] = None


class SMSRead(SMSBase):
    id: int
    sender_id: Optional[int]
    receiver_id: Optional[int]
    delivered_at: Optional[datetime]
    smsc_id: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class SMSFilter(BaseModel):
    status: Optional[SMSStatus] = None
    direction: Optional[SMSDirection] = None
    sender_number: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
