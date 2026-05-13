"""
Subscriber Pydantic schemas.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.subscriber import SimType, SubscriberStatus


class SubscriberBase(BaseModel):
    imsi: str = Field(..., min_length=15, max_length=15, pattern=r"^\d{15}$")
    msisdn: str = Field(..., min_length=4, max_length=15, pattern=r"^\+?\d{4,15}$")
    iccid: Optional[str] = Field(None, min_length=19, max_length=22)
    full_name: str = Field(..., min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    status: SubscriberStatus = SubscriberStatus.INACTIVE
    apn: str = Field(default="internet", max_length=100)
    sim_type: SimType = SimType.USIM
    profile: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class SubscriberCreate(SubscriberBase):
    full_name: Optional[str] = None
    ki: str = Field(..., min_length=32, max_length=32, pattern=r"^[0-9a-fA-F]{32}$")
    opc: str = Field(..., min_length=32, max_length=32, pattern=r"^[0-9a-fA-F]{32}$")
    amf: str = Field(default="8000", min_length=4, max_length=4, pattern=r"^[0-9a-fA-F]{4}$")
    imeisv: Optional[str] = Field(None, min_length=16, max_length=16, pattern=r"^\d{16}$")


class SubscriberUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    status: Optional[SubscriberStatus] = None
    apn: Optional[str] = Field(None, max_length=100)
    sim_type: Optional[SimType] = None
    profile: Optional[str] = None
    notes: Optional[str] = None
    msisdn: Optional[str] = None
    iccid: Optional[str] = None


class SubscriberRead(SubscriberBase):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]

    model_config = {"from_attributes": True}


class SubscriberFilter(BaseModel):
    status: Optional[SubscriberStatus] = None
    sim_type: Optional[SimType] = None
    search: Optional[str] = None  # searches IMSI, MSISDN, name
