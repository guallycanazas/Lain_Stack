"""
Alert and ServiceStatus Pydantic schemas.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.alert import AlertLevel, AlertSource
from app.models.service_status import ServiceName, ServiceState


class AlertCreate(BaseModel):
    title: str
    message: str
    level: AlertLevel = AlertLevel.INFO
    source: AlertSource = AlertSource.SYSTEM
    metadata_json: Optional[str] = None


class AlertRead(AlertCreate):
    id: int
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertMarkRead(BaseModel):
    is_read: bool = True


class ServiceStatusRead(BaseModel):
    id: int
    service_name: ServiceName
    state: ServiceState
    version: Optional[str]
    host: Optional[str]
    port: Optional[int]
    latency_ms: Optional[float]
    notes: Optional[str]
    diagnostics: Optional[dict] = None
    last_checked: Optional[str]
    updated_at: datetime

    model_config = {"from_attributes": True}


class ServiceStatusUpdate(BaseModel):
    state: ServiceState
    version: Optional[str] = None
    latency_ms: Optional[float] = None
    notes: Optional[str] = None


class DashboardKPIs(BaseModel):
    """Aggregated dashboard KPIs."""
    total_subscribers: int
    active_subscribers: int
    total_sim_cards: int
    available_sims: int
    total_calls: int
    completed_calls: int
    failed_calls: int
    total_sms: int
    unread_alerts: int
    critical_alerts: int
    services_up: int
    services_total: int
