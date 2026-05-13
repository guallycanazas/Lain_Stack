#!/usr/bin/env python3
"""
CanazasTEL Admin Platform — Database seed script.
Creates realistic demo data for thesis presentation.

Usage:
    python scripts/seed.py
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta, timezone
from random import choice, randint, uniform

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import hash_password
from app.models.alert import Alert, AlertLevel, AlertSource
from app.models.call import Call, CallStatus, CallType
from app.models.service_status import ServiceName, ServiceState, ServiceStatus
from app.models.sim_card import SimCard, SimStatus, SubscriberSimAssignment
from app.models.sms import SMS, SMSDirection, SMSStatus
from app.models.subscriber import Subscriber, SubscriberStatus, SimType
from app.models.user import User, UserRole

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


def now() -> datetime:
    return datetime.now(timezone.utc)


def past(days: int = 0, hours: int = 0, minutes: int = 0) -> datetime:
    return now() - timedelta(days=days, hours=hours, minutes=minutes)


# ── Telecom lab demo data ─────────────────────────────────────────────
SUBSCRIBERS_DATA = [
    {"full_name": "Carlos Mendoza Ríos",     "imsi": "716020100000001", "msisdn": "51900000001", "status": SubscriberStatus.ACTIVE,    "sim_type": SimType.USIM,    "profile": "volte", "apn": "ims"},
    {"full_name": "Ana Lucía Vargas",         "imsi": "716020100000002", "msisdn": "51900000002", "status": SubscriberStatus.ACTIVE,    "sim_type": SimType.USIM,    "profile": "data", "apn": "internet"},
    {"full_name": "Diego Paredes Soto",       "imsi": "716020100000003", "msisdn": "51900000003", "status": SubscriberStatus.ACTIVE,    "sim_type": SimType.ISIM,    "profile": "ims", "apn": "ims"},
    {"full_name": "Mónica Quispe Huamán",     "imsi": "716020100000004", "msisdn": "51900000004", "status": SubscriberStatus.INACTIVE,  "sim_type": SimType.USIM,    "profile": "data", "apn": "internet"},
    {"full_name": "Roberto Flores Castro",    "imsi": "716020100000005", "msisdn": "51900000005", "status": SubscriberStatus.ACTIVE,    "sim_type": SimType.USIM,    "profile": "volte", "apn": "ims"},
    {"full_name": "Valeria Torres Meza",      "imsi": "716020100000006", "msisdn": "51900000006", "status": SubscriberStatus.SUSPENDED, "sim_type": SimType.UICC,    "profile": "data", "apn": "internet"},
    {"full_name": "Jorge Huanca Ccallo",      "imsi": "716020100000007", "msisdn": "51900000007", "status": SubscriberStatus.TESTING,   "sim_type": SimType.USIM,    "profile": "testing", "apn": "test"},
    {"full_name": "Fernanda Ríos Alvarado",   "imsi": "716020100000008", "msisdn": "51900000008", "status": SubscriberStatus.ACTIVE,    "sim_type": SimType.USIM,    "profile": "volte", "apn": "ims"},
    {"full_name": "Luis Cárdenas Neyra",      "imsi": "716020100000009", "msisdn": "51900000009", "status": SubscriberStatus.ACTIVE,    "sim_type": SimType.ISIM,    "profile": "ims", "apn": "ims"},
    {"full_name": "Patricia Salas Zevallos",  "imsi": "716020100000010", "msisdn": "51900000010", "status": SubscriberStatus.INACTIVE,  "sim_type": SimType.USIM,    "profile": "data", "apn": "internet"},
    {"full_name": "Andrés Vega Palomino",     "imsi": "716020100000011", "msisdn": "51900000011", "status": SubscriberStatus.ACTIVE,    "sim_type": SimType.USIM,    "profile": "volte", "apn": "ims"},
    {"full_name": "Carolina Mamani López",    "imsi": "716020100000012", "msisdn": "51900000012", "status": SubscriberStatus.ACTIVE,    "sim_type": SimType.UICC,    "profile": "data", "apn": "internet"},
    {"full_name": "Héctor Rojas Quispe",      "imsi": "716020100000013", "msisdn": "51900000013", "status": SubscriberStatus.TESTING,   "sim_type": SimType.USIM,    "profile": "testing", "apn": "test"},
    {"full_name": "Sofía Delgado Torres",     "imsi": "716020100000014", "msisdn": "51900000014", "status": SubscriberStatus.ACTIVE,    "sim_type": SimType.ISIM,    "profile": "ims", "apn": "ims"},
    {"full_name": "Miguel Arce Condori",      "imsi": "716020100000015", "msisdn": "51900000015", "status": SubscriberStatus.SUSPENDED, "sim_type": SimType.USIM,    "profile": "data", "apn": "internet"},
    {"full_name": "Isabel Chávez Benites",    "imsi": "716020100000016", "msisdn": "51900000016", "status": SubscriberStatus.ACTIVE,    "sim_type": SimType.USIM,    "profile": "volte", "apn": "ims"},
    {"full_name": "Ramón Quispe Apaza",       "imsi": "716020100000017", "msisdn": "51900000017", "status": SubscriberStatus.ACTIVE,    "sim_type": SimType.USIM,    "profile": "data", "apn": "internet"},
    {"full_name": "Elena Medina Farfán",      "imsi": "716020100000018", "msisdn": "51900000018", "status": SubscriberStatus.INACTIVE,  "sim_type": SimType.VIRTUAL, "profile": "virtual", "apn": "internet"},
    {"full_name": "Gustavo Lazo Montoya",     "imsi": "716020100000019", "msisdn": "51900000019", "status": SubscriberStatus.ACTIVE,    "sim_type": SimType.USIM,    "profile": "volte", "apn": "ims"},
    {"full_name": "Natalia Ponce Gamboa",     "imsi": "716020100000020", "msisdn": "51900000020", "status": SubscriberStatus.TESTING,   "sim_type": SimType.ISIM,    "profile": "testing", "apn": "test"},
]


async def seed(session: AsyncSession):
    print("🌱 Starting seed for CanazasTEL Admin Platform...")

    from sqlalchemy import text
    # Clean database before seeding (important if re-running)
    await session.execute(text("TRUNCATE TABLE audit_logs, alerts, service_status, sms, calls, subscriber_sim_assignments, sim_cards, subscribers, users CASCADE"))

    # ── Users ──────────────────────────────────────────────────────
    print("  → Creating users...")
    users_data = [
        {"email": "admin@canazastel.lab",    "username": "admin",    "full_name": "William Canazas (Admin)",    "role": UserRole.ADMIN,    "password": "Admin1234!"},
        {"email": "operator@canazastel.lab", "username": "operator", "full_name": "Lab Operator",              "role": UserRole.OPERATOR, "password": "Oper1234!"},
        {"email": "viewer@canazastel.lab",   "username": "viewer",   "full_name": "Read-Only Viewer",          "role": UserRole.VIEWER,   "password": "View1234!"},
    ]
    users = []
    for ud in users_data:
        u = User(
            email=ud["email"], username=ud["username"], full_name=ud["full_name"],
            role=ud["role"], hashed_password=hash_password(ud["password"]),
            is_active=True,
            bio=f"Demo {ud['role'].value} account for CanazasTEL lab thesis project.",
        )
        session.add(u)
        users.append(u)
    await session.flush()
    print(f"    ✓ {len(users)} users created")

    # ── Subscribers ────────────────────────────────────────────────
    print("  → Creating subscribers...")
    subscribers = []
    for i, sd in enumerate(SUBSCRIBERS_DATA):
        s = Subscriber(
            **sd,
            iccid=f"8951{str(i+1).zfill(18)}",
            email=f"sub{str(i+1).zfill(3)}@lab.canazastel",
            notes=f"Lab subscriber #{i+1}. MCC: 716, MNC: 02 (Perú lab)",
        )
        session.add(s)
        subscribers.append(s)
    await session.flush()
    print(f"    ✓ {len(subscribers)} subscribers created")

    # ── SIM Cards ──────────────────────────────────────────────────
    print("  → Creating SIM cards...")
    sim_statuses = [SimStatus.AVAILABLE, SimStatus.AVAILABLE, SimStatus.ASSIGNED, SimStatus.TESTING, SimStatus.BLOCKED]
    sim_cards = []
    for i in range(25):
        sim = SimCard(
            iccid=f"8951PE{str(i+100).zfill(16)}",
            imsi=f"71602010{str(i+50).zfill(7)}",
            msisdn=f"5190{str(i+50).zfill(7)}",
            sim_type="usim" if i % 3 != 0 else "isim",
            manufacturer="VALID" if i % 2 == 0 else "Gemalto",
            batch_id=f"BATCH-2024-{str((i // 5) + 1).zfill(3)}",
            status=sim_statuses[i % len(sim_statuses)],
            amf="8000",
            notes="Lab SIM - Test batch",
        )
        session.add(sim)
        sim_cards.append(sim)
    await session.flush()
    print(f"    ✓ {len(sim_cards)} SIM cards created")

    # ── Assign some SIMs ──────────────────────────────────────────
    print("  → Assigning SIMs to subscribers...")
    for i, sub in enumerate(subscribers[:10]):
        assigned_sims = [s for s in sim_cards if s.status == SimStatus.ASSIGNED]
        available_sims = [s for s in sim_cards if s.status == SimStatus.AVAILABLE]
        if available_sims and i < 8:
            sim = available_sims[0]
            assignment = SubscriberSimAssignment(
                subscriber_id=sub.id,
                sim_card_id=sim.id,
                assigned_at=past(days=randint(1, 30)),
                assigned_by="admin",
                notes="Initial provisioning",
            )
            sim.status = SimStatus.ASSIGNED
            session.add(assignment)
    await session.flush()

    # ── Calls (CDRs) ───────────────────────────────────────────────
    print("  → Generating CDR records (calls)...")
    call_statuses = [CallStatus.COMPLETED] * 6 + [CallStatus.FAILED] * 2 + [CallStatus.BUSY, CallStatus.NO_ANSWER]
    call_types = [CallType.VOICE, CallType.VOLTE, CallType.VOLTE, CallType.CS]
    calls = []
    for i in range(80):
        caller = choice(subscribers)
        callee = choice([s for s in subscribers if s.id != caller.id])
        started = past(days=randint(0, 60), hours=randint(0, 23), minutes=randint(0, 59))
        duration = randint(5, 600) if choice([True] * 7 + [False] * 3) else 0
        status_val = choice(call_statuses)
        c = Call(
            caller_id=caller.id,
            callee_id=callee.id,
            caller_number=caller.msisdn,
            callee_number=callee.msisdn,
            started_at=started,
            ended_at=started + timedelta(seconds=duration) if duration else None,
            duration_seconds=duration,
            call_type=choice(call_types),
            status=status_val,
            sip_call_id=f"sip-call-{i:04d}@lab.canazastel",
        )
        session.add(c)
        calls.append(c)
    await session.flush()
    print(f"    ✓ {len(calls)} call records created")

    # ── SMS ────────────────────────────────────────────────────────
    print("  → Generating SMS records...")
    sms_contents = [
        "Prueba de SMS desde laboratorio LTE",
        "Test message VoLTE IMS lab",
        "Verificación de servicio SMSC",
        "SMS de bienvenida al servicio",
        "Notificación de activación de cuenta",
        "Código de verificación: 847291",
        "Servicio de datos activado correctamente",
        "Mensaje de prueba - IMS core OK",
    ]
    sms_list = []
    for i in range(60):
        sender = choice(subscribers)
        receiver = choice([s for s in subscribers if s.id != sender.id])
        sent = past(days=randint(0, 60), hours=randint(0, 23))
        sms_status = choice([SMSStatus.DELIVERED] * 6 + [SMSStatus.FAILED] * 2 + [SMSStatus.PENDING])
        sms = SMS(
            sender_id=sender.id,
            receiver_id=receiver.id,
            sender_number=sender.msisdn,
            receiver_number=receiver.msisdn,
            content=choice(sms_contents),
            direction=choice([SMSDirection.MO, SMSDirection.MT]),
            status=sms_status,
            sent_at=sent,
            delivered_at=sent + timedelta(seconds=randint(1, 30)) if sms_status == SMSStatus.DELIVERED else None,
            smsc_id=f"smsc.lab.canazastel",
        )
        session.add(sms)
        sms_list.append(sms)
    await session.flush()
    print(f"    ✓ {len(sms_list)} SMS records created")

    # ── Alerts ────────────────────────────────────────────────────
    print("  → Creating alerts and events...")
    alerts_data = [
        {"title": "Open5GS MME iniciado", "message": "El componente MME de Open5GS se inició correctamente.", "level": AlertLevel.INFO, "source": AlertSource.OPEN5GS},
        {"title": "HSS inaccesible", "message": "PyHSS no responde en el puerto 3868. Verificar servicio Diameter.", "level": AlertLevel.CRITICAL, "source": AlertSource.PYHSS},
        {"title": "Suscriptor sin SIM asignada", "message": "El IMSI 716020100000004 intentó registrarse sin SIM activa.", "level": AlertLevel.WARNING, "source": AlertSource.OPEN5GS},
        {"title": "SMSC: cola de SMS alta", "message": "La cola de mensajes supera 500 mensajes pendientes.", "level": AlertLevel.WARNING, "source": AlertSource.SYSTEM},
        {"title": "Kamailio: registro de UE exitoso", "message": "UE 51900000001 registrado en IMS core (P-CSCF/I-CSCF/S-CSCF).", "level": AlertLevel.INFO, "source": AlertSource.KAMAILIO},
        {"title": "Backup de base de datos completado", "message": "Backup completo realizado exitosamente. Archivo: canazastel_20260318.sql.gz", "level": AlertLevel.INFO, "source": AlertSource.DB},
        {"title": "RAN: UE desconectada", "message": "UE con MSISDN 51900000006 se desconectó del RAN sin procedimiento de detach.", "level": AlertLevel.WARNING, "source": AlertSource.RAN},
        {"title": "Sesión VoLTE establecida", "message": "Llamada VoLTE exitosa entre 51900000001 y 51900000005. QoS: QCI=1.", "level": AlertLevel.INFO, "source": AlertSource.KAMAILIO},
        {"title": "Error en autenticación EAP-AKA", "message": "Fallo en autenticación de IMSI 716020100000013 — verificar Ki/OPc en HSS.", "level": AlertLevel.ERROR, "source": AlertSource.PYHSS},
        {"title": "Redis: memoria al 80%", "message": "El uso de memoria Redis ha superado el 80% del límite configurado.", "level": AlertLevel.WARNING, "source": AlertSource.REDIS},
        {"title": "Nueva sesión de datos LTE", "message": "PDN Connection establecida para IMSI 716020100000001 con APN: ims.", "level": AlertLevel.INFO, "source": AlertSource.OPEN5GS},
        {"title": "Sistema iniciado", "message": "CanazasTEL Admin Platform iniciada correctamente. Env: development.", "level": AlertLevel.INFO, "source": AlertSource.SYSTEM},
    ]
    for i, ad in enumerate(alerts_data):
        a = Alert(
            **ad,
            is_read=(i > 5),
            created_at=past(hours=i * 2 + randint(0, 4)),
        )
        session.add(a)
    await session.flush()
    print(f"    ✓ {len(alerts_data)} alerts created")

    # ── Service Status ────────────────────────────────────────────
    print("  → Seeding service status (simulated)...")
    services_seed = [
        {"service_name": ServiceName.OPEN5GS,      "state": ServiceState.UP,          "version": "2.7.1", "host": "192.168.1.10", "port": None,  "latency_ms": 12.3},
        {"service_name": ServiceName.KAMAILIO_IMS,  "state": ServiceState.UP,          "version": "5.8.0", "host": "192.168.1.11", "port": 5060,  "latency_ms": 8.7},
        {"service_name": ServiceName.PYHSS,          "state": ServiceState.DOWN,        "version": "1.2.0", "host": "192.168.1.12", "port": 3868,  "latency_ms": None},
        {"service_name": ServiceName.WEBUI,          "state": ServiceState.UP,          "version": "1.0.0", "host": "localhost",    "port": 9999,  "latency_ms": 5.1},
        {"service_name": ServiceName.DATABASE,       "state": ServiceState.UP,          "version": "16.2",  "host": "db",           "port": 5432,  "latency_ms": 2.1},
        {"service_name": ServiceName.REDIS,          "state": ServiceState.UP,          "version": "7.2.4", "host": "redis",        "port": 6379,  "latency_ms": 0.8},
        {"service_name": ServiceName.RAN_CONNECTOR,  "state": ServiceState.UNKNOWN,     "version": None,    "host": "native",       "port": None,  "latency_ms": None},
        {"service_name": ServiceName.BACKEND_API,    "state": ServiceState.UP,          "version": "1.0.0", "host": "localhost",    "port": 8000,  "latency_ms": 3.5},
        {"service_name": ServiceName.NGINX,          "state": ServiceState.UP,          "version": "1.25",  "host": "nginx",        "port": 80,    "latency_ms": 1.2},
    ]
    for sd in services_seed:
        svc = ServiceStatus(**sd, notes="Simulated — ready for real health-check integration",
                            last_checked=now().isoformat())
        session.add(svc)
    await session.flush()
    print(f"    ✓ {len(services_seed)} service statuses seeded")

    await session.commit()
    print("\n✅ Seed completed successfully!")
    print("\n📋 Demo credentials:")
    print("   admin    / Admin1234!  (admin@canazastel.lab)")
    print("   operator / Oper1234!  (operator@canazastel.lab)")
    print("   viewer   / View1234!  (viewer@canazastel.lab)")


async def main():
    async with AsyncSessionLocal() as session:
        await seed(session)


if __name__ == "__main__":
    asyncio.run(main())
