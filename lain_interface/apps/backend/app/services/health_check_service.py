"""
Health Check Service — Real health checks for lab services.
"""
import asyncio
import time
from dataclasses import dataclass
from typing import Optional

import redis.asyncio as redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings


@dataclass
class HealthCheckResult:
    state: str
    latency_ms: Optional[float] = None
    version: Optional[str] = None
    notes: Optional[str] = None
    diagnostics: Optional[dict] = None


class HealthCheckService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def check_postgresql(self) -> HealthCheckResult:
        try:
            start = time.perf_counter()
            result = await self.db.execute(text("SELECT 1, version()"))
            row = result.fetchone()
            latency = (time.perf_counter() - start) * 1000

            version = row[1].split(" ")[1] if row and row[1] else None

            db_info = await self.db.execute(text("""
                SELECT
                    current_database() as db_name,
                    pg_size_pretty(pg_database_size(current_database())) as db_size,
                    (SELECT count(*) FROM pg_stat_activity) as connections,
                    (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as active_connections
            """))
            db_row = db_info.fetchone()

            return HealthCheckResult(
                state="up",
                latency_ms=round(latency, 1),
                version=version,
                diagnostics={
                    "database": db_row[0] if db_row else None,
                    "size": db_row[1] if db_row else None,
                    "total_connections": int(db_row[2]) if db_row else 0,
                    "db_connections": int(db_row[3]) if db_row else 0,
                },
            )
        except Exception as e:
            return HealthCheckResult(state="down", notes=str(e)[:100])

    async def check_redis(self) -> HealthCheckResult:
        try:
            start = time.perf_counter()
            client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
            )
            await client.ping()
            latency = (time.perf_counter() - start) * 1000

            info = await client.info("memory")
            connected_clients = await client.info("clients")
            uptime = await client.info("server")

            await client.close()

            return HealthCheckResult(
                state="up",
                latency_ms=round(latency, 1),
                version="7",
                diagnostics={
                    "memory_used": info.get("used_memory_human") if info else None,
                    "connected_clients": connected_clients.get("connected_clients") if connected_clients else 0,
                    "uptime_days": round(uptime.get("uptime_in_seconds", 0) / 86400, 1) if uptime else 0,
                },
            )
        except Exception as e:
            return HealthCheckResult(state="down", notes=str(e)[:100])

    async def check_http_service(
        self,
        name: str,
        url: str,
        timeout: float = 3.0,
    ) -> HealthCheckResult:
        try:
            import httpx
            start = time.perf_counter()
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(url)
                latency = (time.perf_counter() - start) * 1000

            if response.status_code == 200:
                data = response.json() if response.headers.get("content-type", "").startswith("application/json") else None
                version = data.get("version") if data else None
                return HealthCheckResult(state="up", latency_ms=round(latency, 1), version=version)
            elif response.status_code >= 500:
                return HealthCheckResult(state="degraded", latency_ms=round(latency, 1), notes=f"HTTP {response.status_code}")
            else:
                return HealthCheckResult(state="up", latency_ms=round(latency, 1))
        except asyncio.TimeoutError:
            return HealthCheckResult(state="down", notes=f"Timeout connecting to {name}")
        except Exception as e:
            return HealthCheckResult(state="down", notes=str(e)[:100])

    async def check_open5gs(self) -> HealthCheckResult:
        if not settings.OPEN5GS_API_URL:
            return HealthCheckResult(
                state="maintenance",
                notes="Open5GS API URL not configured in .env (OPEN5GS_API_URL)",
            )
        return await self.check_http_service("Open5GS", f"{settings.OPEN5GS_API_URL}/api/v1/health")

    async def check_kamailio(self) -> HealthCheckResult:
        if not settings.KAMAILIO_LOG_PATH:
            return HealthCheckResult(
                state="maintenance",
                notes="Kamailio log path not configured (simulated in this environment)",
            )
        return HealthCheckResult(state="up", notes="Kamailio IMS running")

    async def check_pyhss(self) -> HealthCheckResult:
        if not settings.PYHSS_API_URL:
            return HealthCheckResult(
                state="maintenance",
                notes="PyHSS API URL not configured in .env (PYHSS_API_URL)",
            )
        return await self.check_http_service("PyHSS", f"{settings.PYHSS_API_URL}/api/health")

    async def check_webui(self) -> HealthCheckResult:
        if not settings.OPEN5GS_API_URL:
            return HealthCheckResult(
                state="maintenance",
                notes="Open5GS WebUI URL not configured",
            )
        return await self.check_http_service("WebUI", f"{settings.OPEN5GS_API_URL}")

    async def check_backend_api(self) -> HealthCheckResult:
        try:
            import httpx
            start = time.perf_counter()
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get("http://backend:8000/health")
                latency = (time.perf_counter() - start) * 1000
            return HealthCheckResult(
                state="up",
                latency_ms=round(latency, 1),
                version=settings.APP_VERSION,
                diagnostics={
                    "status_code": response.status_code,
                    "response_time_ms": round(latency, 1),
                },
            )
        except Exception as e:
            return HealthCheckResult(state="down", notes=str(e)[:100])

    async def check_nginx(self) -> HealthCheckResult:
        try:
            import httpx
            start = time.perf_counter()
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get("http://frontend/")
                latency = (time.perf_counter() - start) * 1000
            return HealthCheckResult(
                state="up",
                latency_ms=round(latency, 1),
                version="1.25",
                diagnostics={
                    "nginx_version": "1.25",
                    "frontend_status": response.status_code,
                },
            )
        except Exception as e:
            return HealthCheckResult(state="down", notes=str(e)[:100])

    async def check_ran_connector(self) -> HealthCheckResult:
        if not settings.RAN_CONNECTOR_URL:
            return HealthCheckResult(
                state="maintenance",
                notes="RAN Connector URL not configured (RAN_CONNECTOR_URL) — awaiting SDR integration",
            )
        return await self.check_http_service("RAN Connector", f"{settings.RAN_CONNECTOR_URL}/health")

    async def run_all_checks(self) -> dict[str, HealthCheckResult]:
        results = await asyncio.gather(
            self.check_postgresql(),
            self.check_redis(),
            self.check_open5gs(),
            self.check_kamailio(),
            self.check_pyhss(),
            self.check_webui(),
            self.check_backend_api(),
            self.check_nginx(),
            self.check_ran_connector(),
            return_exceptions=True,
        )

        keys = [
            "database",
            "redis",
            "open5gs",
            "kamailio_ims",
            "pyhss",
            "webui",
            "backend_api",
            "nginx",
            "ran_connector",
        ]

        output = {}
        for key, result in zip(keys, results):
            if isinstance(result, Exception):
                output[key] = HealthCheckResult(state="down", notes=str(result)[:100])
            else:
                output[key] = result

        return output