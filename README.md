# 🗼 Lain Stack

> **Plataforma integral de telecomunicaciones LTE / 4G / IMS / VoLTE + 5G SA / VoNR**
>
> Stack unificado que combina un núcleo de red containerizado con una interfaz de administración web tipo NOC/BSS/OSS.

[![License](https://img.shields.io/badge/license-BSD--2--Clause-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-✓-2496ED?logo=docker)](https://docker.com)
[![Version](https://img.shields.io/badge/version-1.0.0-orange)](#)

---

## 🧬 Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│                      Lain Stack                          │
│                                                          │
│  ┌─────────────────────────┐  ┌───────────────────────┐  │
│  │     docker_open5gs      │  │    lain_interface     │  │
│  │                         │  │                       │  │
│  │  🧠 Core 4G/5G          │  │  🖥️  Admin Web UI    │  │
│  │  📞 IMS (VoLTE/VoNR)    │  │  📊 Dashboard KPIs   │  │
│  │  📡 eNB/gNB + UE        │  │  👥 Subscribers CRUD │  │
│  │  🔐 HSS/AUSF/UDM        │  │  📱 SIM Management   │  │
│  │  🔄 UPF/SGW              │  │  📞 CDR + SMS Logs   │  │
│  │                         │  │  🚨 Alertas          │  │
│  └──────────┬──────────────┘  └───────────┬───────────┘  │
│             │                             │              │
│             └──────────  ┌ ─ ─ ┘          │              │
│                    Interconexión futura    │              │
│                                           │              │
│  ┌────────────────────────────────────────┘              │
│  │  🐘 PostgreSQL  │  🌀 Redis  │  🐳 Docker Compose    │
│  └───────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────┘
```

### 🗂️ Estructura del repositorio

```
Lain_Stack/
├── docker_open5gs/          ← Core de red 4G/5G + IMS
│   ├── base/                # Dockerfiles de open5gs
│   ├── amf/ smf/ upf/ ...   # Funciones de red 5GC
│   ├── mme/ sgwc/ sgwu/ ... # Funciones de red EPC
│   ├── ims_base/            # Kamailio IMS
│   ├── pcscf/ icscf/ scscf/ # CSCF functions
│   ├── srslte/ srsran/      # srsRAN eNB/gNB
│   ├── ueransim/            # Simulador UERANSIM
│   ├── .env                 # Configuración de red
│   └── *.yaml               # Docker Compose files
│
└── lain_interface/          ← Admin Platform (Web UI)
    ├── apps/
    │   ├── backend/         # FastAPI + SQLAlchemy
    │   └── frontend/        # React + TypeScript + Vite
    ├── infra/postgres/      # init.sql
    ├── scripts/             # start.sh, setup-dev.sh
    ├── docker-compose.yml
    └── .env.example
```

---

## 🚀 Quick Start

### 0️⃣ Prerrequisitos

| Herramienta | Versión mínima |
|-------------|---------------|
| Docker | >= 24.0 |
| Docker Compose | >= 2.20 |
| Git | ✓ |
| Ubuntu | 22.04+ (host) |

### 1️⃣ Clonar

```bash
git clone https://github.com/guallycanazas/Lain_Stack.git
cd Lain_Stack
```

### 2️⃣ Levantar la Admin Platform

```bash
cd lain_interface

# Copiar y editar variables de entorno
cp .env.example .env

# Iniciar todo (DB + Redis + Backend + Frontend)
./scripts/start.sh --seed

# ── URLs ─────────────────────────────
# Frontend:   http://localhost
# Swagger:    http://localhost:8000/api/v1/docs
# Health:     http://localhost:8000/health
```

### 3️⃣ Levantar el Core 4G/5G

```bash
cd ../docker_open5gs

# Editar .env con tus parámetros (MCC, MNC, IPs)
nano .env

# 4G Core + IMS + VoLTE
docker compose -f 4g-volte-deploy.yaml up -d

# ── O bien: 5G SA Core ────────────────
# docker compose -f sa-deploy.yaml up -d

# Open5GS WebUI: http://<DOCKER_HOST_IP>:9999
# Usuario: admin / Password: 1423
```

---

## 🧩 Componentes

### 📡 `docker_open5gs` — Core de Red

Despliega una red 4G/5G completa usando:

| Componente | Tecnología |
|-----------|-----------|
| 🧠 Core 4G/5G | [open5gs](https://github.com/open5gs/open5gs) |
| 📞 IMS (VoLTE/VoNR) | [Kamailio](https://github.com/kamailio/kamailio) / [OpenSIPS](https://github.com/OpenSIPS/opensips) |
| 🔐 HSS/IMS-HSS | open5gs HSS / [PyHSS](https://github.com/nickvsnetworking/pyhss) / [OsmoHLR](https://github.com/osmocom/osmo-hlr) |
| 📻 eNB/gNB (OTA) | [srsRAN_4G](https://github.com/srsran/srsRAN_4G) / [srsRAN_Project](https://github.com/srsran/srsRAN_Project) |
| 🔬 Simulador RF | [UERANSIM](https://github.com/aligungr/UERANSIM) |
| 🔄 UPF 5G | [eUPF](https://github.com/edgecomllc/eupf) |
| 💰 OCS | [Sigscale OCS](https://github.com/sigscale/ocs) |
| 📊 Monitoring | Prometheus + Grafana |

**Despliegues disponibles:**

| Archivo | Descripción |
|---------|------------|
| `4g-volte-deploy.yaml` | 4G EPC + IMS VoLTE (Kamailio) |
| `4g-volte-opensips-ims-deploy.yaml` | 4G EPC + IMS VoLTE (OpenSIPS) |
| `sa-deploy.yaml` | 5G SA Core |
| `sa-vonr-deploy.yaml` | 5G SA + IMS VoNR |
| `srsenb.yaml` | eNB OTA con SDR |
| `nr-gnb.yaml` / `nr-ue.yaml` | gNB + UE simulados |

### 🖥️ `lain_interface` — Admin Platform

Plataforma web full-stack tipo NOC/BSS/OSS:

| Módulo | Descripción |
|--------|------------|
| 📊 Dashboard | KPIs en tiempo real, gráficos, estado de servicios |
| 👥 Suscriptores | CRUD de abonados IMSI/MSISDN/ICCID + export CSV |
| 📱 SIM Cards | Catálogo USIM/ISIM, asignación a suscriptores |
| 📞 CDRs | Historial de llamadas VoLTE/CS con estadísticas |
| 💬 SMS | Registro MO/MT con filtros |
| 🚨 Alertas | Feed de eventos con niveles de severidad |
| 🔧 Servicios | Estado de componentes del laboratorio |
| 👤 Usuarios | Roles: Admin / Operador / Visualizador |
| 📝 Auditoría | Log de acciones críticas |

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Backend API** | FastAPI 0.111 + Uvicorn + SQLAlchemy 2.0 |
| **Frontend SPA** | React 18 + TypeScript + Vite + Tailwind CSS |
| **Base de datos** | PostgreSQL 16 (admin) + MongoDB (open5gs) |
| **Caché** | Redis 7 |
| **Auth** | JWT (access + refresh rotation) + bcrypt |
| **Reverse Proxy** | Nginx |
| **Orquestación** | Docker + Docker Compose |
| **Core de red** | open5gs + Kamailio + srsRAN |
| **SDK/SDR** | USRP B210, LimeSDR, ZMQ (simulado) |

---

## 🔐 Seguridad

- 🔑 Contraseñas hasheadas con bcrypt
- 🎫 JWT con access token (30 min) + refresh token (7 días)
- 🔄 Refresh token rotation con revocación
- 🛡️ Roles enforced en backend + frontend
- 🚫 Campos sensibles (Ki/OPc) nunca expuestos en API
- 📝 Audit log de acciones críticas
- 🌐 CORS configurable por entorno

---

## 🔮 Roadmap de integración

| Prioridad | Tarea | Estado |
|-----------|-------|--------|
| 🔴 Alta | Conectar lain_interface a Open5GS WebUI | ⬜ Pendiente |
| 🔴 Alta | Sincronización de abonados con HSS | ⬜ Pendiente |
| 🟡 Media | Ingesta de logs MME/AMF/SMF en dashboard | ⬜ Pendiente |
| 🟡 Media | Conector a Kamailio para CDRs reales | ⬜ Pendiente |
| 🟡 Media | Integración con PyHSS REST API | ⬜ Pendiente |
| 🟢 Baja | Monitoreo KPIs de radio (RSRP, SINR) | ⬜ Pendiente |
| 🟢 Baja | Prometheus + Grafana dashboards | ⬜ Pendiente |
| 🟢 Baja | Exportación PDF de reportes | ⬜ Pendiente |

---

## 👤 Equipo

| Rol | Nombre |
|-----|--------|
| 🧑‍💻 Desarrollador | William Roy Canazas Rosas |
| 🎓 Proyecto | Tesis — Laboratorio LTE/4G/IMS/VoLTE |
| 📍 MCC/MNC | 716 / 02 (Perú) |

---

<p align="center">
  <sub>Built with ☕ · 📡 · 🐳 · 💚</sub>
</p>
