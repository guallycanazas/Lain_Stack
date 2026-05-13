"""
Subscriber CRUD endpoints.
"""
import csv
import io
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import StreamingResponse

from app.core.dependencies import AdminOrOperator, CurrentUser, DBSession
from app.integrations.open5gs_client import (
    Open5GSClient,
    Open5GSClientError,
    apply_open5gs_subscriber_update,
    build_open5gs_subscriber_payload,
    summarize_open5gs_subscriber,
)
from app.models.audit_log import AuditAction
from app.models.subscriber import Subscriber, SubscriberStatus, SimType
from app.repositories.subscriber_repository import SubscriberRepository
from app.schemas.common import PaginatedResponse
from app.schemas.subscriber import SubscriberCreate, SubscriberRead, SubscriberUpdate
from app.services.audit_service import AuditService

router = APIRouter(prefix="/subscribers", tags=["Subscribers"])


@router.get("", response_model=PaginatedResponse[SubscriberRead])
async def list_subscribers(
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: Optional[SubscriberStatus] = None,
    sim_type: Optional[SimType] = None,
    search: Optional[str] = None,
    current_user: CurrentUser = None,
):
    repo = SubscriberRepository(db)
    skip = (page - 1) * page_size
    items, total = await repo.list_paginated(
        skip=skip, limit=page_size, status=status, search=search, sim_type=sim_type
    )
    return PaginatedResponse.create(
        items=[SubscriberRead.model_validate(s) for s in items],
        total=total, page=page, page_size=page_size,
    )


@router.post("", response_model=SubscriberRead, status_code=status.HTTP_201_CREATED, dependencies=[AdminOrOperator])
async def create_subscriber(body: SubscriberCreate, current_user: CurrentUser, request: Request, db: DBSession):
    repo = SubscriberRepository(db)
    audit = AuditService(db)
    if await repo.get_by_imsi(body.imsi):
        raise HTTPException(status_code=409, detail="IMSI already registered")
    if await repo.get_by_msisdn(body.msisdn):
        raise HTTPException(status_code=409, detail="MSISDN already registered")

    open5gs_payload = build_open5gs_subscriber_payload(
        imsi=body.imsi,
        msisdn=body.msisdn,
        ki=body.ki,
        opc=body.opc,
        amf=body.amf,
        imeisv=body.imeisv,
    )
    try:
        await Open5GSClient().create_subscriber(open5gs_payload)
    except Open5GSClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    local_data = body.model_dump(exclude={"ki", "opc", "amf", "imeisv"})
    local_data["full_name"] = body.full_name or f"Open5GS Subscriber {body.imsi}"
    local_data["status"] = SubscriberStatus.ACTIVE
    local_data["apn"] = "internet,ims"
    local_data["profile"] = body.profile or "open5gs-volte"
    local_data["notes"] = body.notes or "Provisioned directly in Open5GS from Lain Interface"
    sub = Subscriber(**local_data)
    sub = await repo.create(sub)
    await audit.log(AuditAction.CREATE, user=current_user, resource_type="subscriber",
                    resource_id=sub.id, request=request)
    return sub


@router.get("/open5gs", summary="List subscribers directly from Open5GS WebUI")
async def list_open5gs_subscribers(current_user: CurrentUser = None):
    try:
        subscribers = await Open5GSClient().list_subscribers()
    except Open5GSClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {
        "source": "open5gs",
        "count": len(subscribers),
        "items": [summarize_open5gs_subscriber(sub) for sub in subscribers],
    }


@router.post("/open5gs/sync", summary="Import Open5GS subscribers into local admin database", dependencies=[AdminOrOperator])
async def sync_open5gs_subscribers(current_user: CurrentUser, request: Request, db: DBSession):
    try:
        open5gs_subscribers = await Open5GSClient().list_subscribers()
    except Open5GSClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    repo = SubscriberRepository(db)
    audit = AuditService(db)
    created = 0
    updated = 0
    skipped: list[dict[str, str]] = []

    for raw in open5gs_subscribers:
        item = summarize_open5gs_subscriber(raw)
        imsi = item.get("imsi")
        msisdn = item.get("msisdn")
        if not imsi:
            skipped.append({"imsi": "", "reason": "missing IMSI"})
            continue
        if not msisdn:
            skipped.append({"imsi": imsi, "reason": "missing MSISDN in Open5GS"})
            continue
        if not (4 <= len(msisdn) <= 15 and msisdn.lstrip("+").isdigit()):
            skipped.append({"imsi": imsi, "reason": f"invalid MSISDN in Open5GS: {msisdn}"})
            continue

        apn = ",".join(item["apns"]) if item.get("apns") else "internet"
        local_status = SubscriberStatus.ACTIVE if item.get("subscriber_status") == 0 else SubscriberStatus.SUSPENDED
        existing = await repo.get_by_imsi(imsi)
        if existing:
            existing.msisdn = msisdn
            existing.status = local_status
            existing.apn = apn
            existing.sim_type = SimType.USIM
            existing.profile = "open5gs"
            existing.notes = "Synced from Open5GS WebUI"
            await repo.update(existing)
            updated += 1
            continue

        msisdn_owner = await repo.get_by_msisdn(msisdn)
        if msisdn_owner:
            skipped.append({"imsi": imsi, "reason": f"MSISDN {msisdn} already belongs to another subscriber"})
            continue

        subscriber = Subscriber(
            imsi=imsi,
            msisdn=msisdn,
            full_name=f"Open5GS Subscriber {imsi}",
            status=local_status,
            apn=apn,
            sim_type=SimType.USIM,
            profile="open5gs",
            notes="Synced from Open5GS WebUI",
        )
        await repo.create(subscriber)
        created += 1

    await audit.log(
        AuditAction.UPDATE,
        user=current_user,
        resource_type="open5gs_subscribers_sync",
        request=request,
        metadata={"created": created, "updated": updated, "skipped": len(skipped)},
    )
    await db.commit()
    return {
        "source": "open5gs",
        "total_remote": len(open5gs_subscribers),
        "created": created,
        "updated": updated,
        "skipped": skipped,
    }


@router.get("/{sub_id}", response_model=SubscriberRead)
async def get_subscriber(sub_id: int, db: DBSession, current_user: CurrentUser = None):
    repo = SubscriberRepository(db)
    sub = await repo.get_by_id(sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    return sub


@router.patch("/{sub_id}", response_model=SubscriberRead, dependencies=[AdminOrOperator])
async def update_subscriber(sub_id: int, body: SubscriberUpdate, current_user: CurrentUser, request: Request, db: DBSession):
    repo = SubscriberRepository(db)
    audit = AuditService(db)
    sub = await repo.get_by_id(sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscriber not found")

    open5gs = Open5GSClient()
    try:
        remote = await open5gs.get_subscriber(sub.imsi)
        if remote:
            remote_payload = apply_open5gs_subscriber_update(remote, msisdn=body.msisdn)
            await open5gs.update_subscriber(sub.imsi, remote_payload)
    except Open5GSClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(sub, field, value)
    sub = await repo.update(sub)
    await audit.log(AuditAction.UPDATE, user=current_user, resource_type="subscriber",
                    resource_id=sub_id, request=request)
    return sub


@router.delete("/{sub_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[AdminOrOperator])
async def delete_subscriber(sub_id: int, current_user: CurrentUser, request: Request, db: DBSession):
    repo = SubscriberRepository(db)
    audit = AuditService(db)
    sub = await repo.get_by_id(sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscriber not found")

    try:
        await Open5GSClient().delete_subscriber(sub.imsi)
    except Open5GSClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    await repo.soft_delete(sub)
    await audit.log(AuditAction.DELETE, user=current_user, resource_type="subscriber",
                    resource_id=sub_id, request=request)


@router.get("/export/csv", summary="Export subscribers as CSV")
async def export_csv(db: DBSession, current_user: CurrentUser = None):
    repo = SubscriberRepository(db)
    items, _ = await repo.list_paginated(limit=10000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "imsi", "msisdn", "iccid", "full_name", "email", "status", "apn", "sim_type", "profile", "created_at"])
    for s in items:
        writer.writerow([s.id, s.imsi, s.msisdn, s.iccid, s.full_name, s.email,
                         s.status.value, s.apn, s.sim_type.value, s.profile, s.created_at])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=subscribers.csv"},
    )
