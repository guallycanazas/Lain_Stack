"""
SIM Card Pydantic schemas.
Note: Ki/OPc credential fields are write-only / never returned in responses.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.sim_card import SimStatus


class SimCardBase(BaseModel):
    iccid: str = Field(..., min_length=19, max_length=22)
    imsi: Optional[str] = Field(None, min_length=15, max_length=15, pattern=r"^\d{15}$")
    msisdn: Optional[str] = Field(None, max_length=15)
    sim_type: str = Field(default="usim")
    manufacturer: Optional[str] = None
    batch_id: Optional[str] = None
    status: SimStatus = SimStatus.AVAILABLE
    amf: Optional[str] = Field(None, max_length=8)
    notes: Optional[str] = None


class SimCardCreate(SimCardBase):
    # Ki and OPc are write-only — stored securely and never returned
    ki_placeholder: Optional[str] = Field(None, max_length=32, description="Ki placeholder (write-only)")
    opc_placeholder: Optional[str] = Field(None, max_length=32, description="OPc placeholder (write-only)")
    adm: Optional[str] = Field(None, max_length=16)


class SimCardUpdate(BaseModel):
    status: Optional[SimStatus] = None
    notes: Optional[str] = None
    manufacturer: Optional[str] = None
    batch_id: Optional[str] = None
    msisdn: Optional[str] = None


class SimCardRead(SimCardBase):
    id: int
    created_at: datetime
    updated_at: datetime
    # Ki/OPc intentionally excluded from read schema

    model_config = {"from_attributes": True}


class SimAssignmentCreate(BaseModel):
    subscriber_id: int
    sim_card_id: int
    notes: Optional[str] = None


class SimAssignmentRead(BaseModel):
    id: int
    subscriber_id: int
    sim_card_id: int
    assigned_by: Optional[str]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
