# CanazasTEL Admin Platform

> **Plataforma integral de administración, monitoreo y operación para laboratorio de telecomunicaciones LTE/4G/IMS/VoLTE**
>
> Proyecto de Tesis — Universidad · MCC 716 / MNC 02 (Perú)

---

## Descripción

CanazasTEL Admin Platform es un sistema web full-stack diseñado como parte de un proyecto de tesis académica orientado a la gestión y monitoreo de un laboratorio LTE/IMS. Provee una interfaz administrativa tipo NOC/BSS/OSS con los siguientes módulos:

| Módulo | Descripción |
|---|---|
| Dashboard | KPIs en tiempo real, gráficos de actividad, estado de servicios |
| Suscriptores | CRUD de abonados con IMSI/MSISDN/ICCID, export CSV |
| SIM Cards | Catálogo de USIMs/ISIMs, asignación a suscriptores |
| Llamadas (CDR) | Historial de llamadas VoLTE/CS con estadísticas |
| SMS | Registro MO/MT con filtros y estados |
| Alertas | Feed de eventos del sistema con niveles de severidad |
| Servicios | Estado de componentes del laboratorio (Open5GS, Kamailio, etc.) |
| Usuarios | Gestión de accesos y roles (Admin/Operador/Visualizador) |
| Auditoría | Log de acciones críticas con usuario, timestamp y recurso |

---

## Arquitectura

```
canazastel-admin/
├── apps/
│   ├── backend/          # FastAPI + SQLAlchemy + Alembic
│   │   ├── app/
│   │   │   ├── api/v1/   # Endpoints REST versionados
│   │   │   ├── core/     # Config, Security, Dependencies
│   │   │   ├── db/       # Session factory, Base ORM
│   │   │   ├── models/   # SQLAlchemy models
│   │   │   ├── schemas/  # Pydantic v2 schemas
│   │   │   ├── services/ # Business logic
│   │   │   ├── repositories/ # Data access layer
│   │   │   └── integrations/ # Conectores futuros
│   │   ├── alembic/      # Migraciones DB
│   │   └── scripts/      # seed.py
│   └── frontend/         # React + TypeScript + Vite
│       └── src/
│           ├── api/      # Axios client + endpoints
│           ├── components/ # UI + Layout
│           ├── hooks/    # Auth context
│           ├── pages/    # Módulos de la plataforma
│           ├── store/    # Auth token store
│           └── types/    # TypeScript types
├── infra/
│   └── postgres/         # init.sql
├── scripts/              # start.sh, setup-dev.sh
├── docs/                 # Documentación técnica
├── .env.example          # Template de variables
└── docker-compose.yml    # Orquestación de servicios
```

### Stack Tecnológico

**Backend:**
- FastAPI 0.111 + Uvicorn (ASGI)
- SQLAlchemy 2.0 async + Alembic (migraciones)
- PostgreSQL 16 (base de datos principal)
- Redis 7 (caché / colas)
- JWT (access + refresh token rotation)
- Pydantic v2 + pydantic-settings
- Ruff + Black (lint/format)
- Pytest (testing)

**Frontend:**
- React 18 + TypeScript + Vite
- Tailwind CSS (diseño NOC/telecom personalizado)
- React Query (server state)
- React Router v6 (SPA routing + rutas protegidas)
- React Hook Form + Zod (validación)
- Recharts (gráficos)
- Axios (cliente HTTP con interceptores JWT)

**Infraestructura:**
- Docker + Docker Compose
- Nginx (reverse proxy + serve estático)

---

## Requisitos

- Docker >= 24.0
- Docker Compose >= 2.20
- Make (opcional)
- Git

> Para desarrollo local sin Docker: Python 3.11+ y Node.js 20+

---

## Cómo levantar

### Método 1: Script automatizado (recomendado)

```bash
# Clonar el repositorio
git clone <repo-url>
cd canazastel-admin

# Primera vez (levanta + corre migraciones + seed)
./scripts/start.sh --seed

# Siguientes veces
./scripts/start.sh
```

### Método 2: Manual con Docker Compose

```bash
# 1. Configurar environment
cp .env.example .env
# Editar .env si es necesario

# 2. Levantar DB y Redis
docker compose up -d db redis

# 3. Esperar ~10s y correr migraciones
docker compose run --rm backend sh -c "cd /app && alembic upgrade head"

# 4. Poblar con datos demo
docker compose run --rm backend python scripts/seed.py

# 5. Levantar backend y frontend
docker compose up -d backend frontend

# Ver logs
docker compose logs -f backend
```

### Método 3: Desarrollo local (sin Docker)

```bash
# Backend
cd apps/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Asegúrate de tener PostgreSQL y Redis corriendo localmente
uvicorn app.main:app --reload --port 8000

# Frontend (en otra terminal)
cd apps/frontend
npm install
npm run dev
```

---

## URLs

| Servicio | URL |
|---|---|
| Frontend | http://localhost |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/api/v1/docs |
| ReDoc | http://localhost:8000/api/v1/redoc |
| Health check | http://localhost:8000/health |

---

## Credenciales Demo

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin1234!` | Administrador |
| `operator` | `Oper1234!` | Operador |
| `viewer` | `View1234!` | Solo lectura |

---

## Datos Demo Incluidos

- 20 suscriptores con IMSI/MSISDN reales de laboratorio (MCC 716 / MNC 02)
- 25 SIM cards con estados variados
- 80 registros de llamadas VoLTE/CS
- 60 mensajes SMS MO/MT
- 12 alertas del sistema con distintos niveles
- 9 servicios del laboratorio con estados simulados

---

## Módulos y Endpoints API

| Endpoint | Descripción |
|---|---|
| `POST /api/v1/auth/login` | Login → tokens |
| `POST /api/v1/auth/refresh` | Renovar access token |
| `POST /api/v1/auth/logout` | Logout + revocación |
| `GET /api/v1/auth/me` | Usuario actual |
| `GET /api/v1/dashboard/kpis` | KPIs del sistema |
| `GET/POST /api/v1/subscribers` | Listar / crear suscriptores |
| `GET/PATCH/DELETE /api/v1/subscribers/{id}` | CRUD |
| `GET /api/v1/subscribers/export/csv` | Exportar CSV |
| `GET/POST /api/v1/sim-cards` | SIM catalog |
| `POST /api/v1/sim-cards/assign` | Asignar SIM a suscriptor |
| `GET /api/v1/calls` | CDR listing |
| `GET /api/v1/calls/stats` | Estadísticas |
| `GET /api/v1/sms` | SMS listing |
| `GET /api/v1/alerts` | Feed alertas |
| `PATCH /api/v1/alerts/{id}/read` | Marcar leída |
| `GET /api/v1/services` | Estado servicios |
| `GET /api/v1/audit-logs` | Auditoría (admin) |
| `GET/POST/PATCH/DELETE /api/v1/users` | Gestión usuarios |

---

## Roadmap de Integraciones Futuras

### Open5GS
- [ ] Conector a API REST de Open5GS WebUI
- [ ] Sincronización de abonados con Open5GS HSS/AUSF
- [ ] Ingesta de logs de MME/AMF/SMF

### Kamailio IMS
- [ ] Lector de logs del P-CSCF/I-CSCF/S-CSCF
- [ ] Registro de sesiones SIP
- [ ] Integración con kámailio CSVDump para CDRs reales

### PyHSS
- [ ] Integración con API REST de PyHSS
- [ ] Aprovisionamiento automático desde la plataforma
- [ ] Monitoreo de autenticaciones EAP-AKA

### RAN / SDR
- [ ] Conector a scripts nativos SDR (wrapper Python)
- [ ] Monitoring de UEs conectadas al eNB
- [ ] Ingesta de KPIs de radio (RSRP, SINR, throughput)

### Observabilidad
- [ ] Integración Prometheus + Grafana
- [ ] Métricas de API (latency, error rate, throughput)
- [ ] Dashboards de Grafana para telecom KPIs

### Reportes
- [ ] Exportación de reportes PDF
- [ ] CDR export batch
- [ ] Estadísticas semanales/mensuales

---

## Seguridad

- Contraseñas hasheadas con bcrypt
- JWT con access token corto (30min) + refresh token largo (7d)
- Refresh token rotation en DB con soporte de revocación
- CORS configurable por entorno
- Campos sensibles (Ki/OPc) nunca expuestos en respuestas API
- Roles: Admin > Operator > Viewer, enforced en backend y frontend
- Audit log de todas las acciones críticas

---

## Checklist de Funcionamiento

- [x] Backend FastAPI levanta correctamente
- [x] Migraciones Alembic crean el esquema completo
- [x] Seed pobla la base de datos con datos demo
- [x] Login JWT funcional con refresh token rotation
- [x] Dashboard KPIs cargan desde DB
- [x] CRUD de suscriptores (crear/editar/eliminar/listar/buscar)
- [x] SIM card catalog y asignación
- [x] CDRs de llamadas con filtros y stats
- [x] Historial SMS con filtros
- [x] Alertas con mark-read/mark-all-read
- [x] Estado de servicios con health indicator
- [x] Frontend conectado al backend vía API
- [x] Rutas protegidas por rol
- [x] Docker Compose funcional end-to-end
- [x] Nginx sirve SPA y proxea /api/

---

## Equipo

**Desarrollador:** William Roy Canazas Rosas  
**Proyecto:** Tesis · Laboratorio LTE/4G/IMS/VoLTE  
**Versión:** 1.0.0 · 2026
