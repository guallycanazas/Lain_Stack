"""Open5GS WebUI API client."""
from typing import Any

import httpx
from jose import jwt

from app.core.config import settings


class Open5GSClientError(RuntimeError):
    pass


class Open5GSClient:
    def __init__(self) -> None:
        self.base_url = settings.OPEN5GS_API_URL.rstrip("/")
        self.jwt_secret = settings.OPEN5GS_JWT_SECRET

    def _auth_headers(self) -> dict[str, str]:
        token = jwt.encode(
            {"user": {"_id": "lain-integration", "username": "admin", "roles": ["admin"]}},
            self.jwt_secret,
            algorithm="HS256",
        )
        return {"Authorization": f"Bearer {token}"}

    async def list_subscribers(self) -> list[dict[str, Any]]:
        if not self.base_url:
            raise Open5GSClientError("OPEN5GS_API_URL is not configured")

        url = f"{self.base_url}/api/db/Subscriber"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=self._auth_headers())
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise Open5GSClientError(f"Open5GS request failed: {exc}") from exc

        data = response.json()
        if not isinstance(data, list):
            raise Open5GSClientError("Open5GS returned an unexpected subscribers payload")
        return data


def summarize_open5gs_subscriber(raw: dict[str, Any]) -> dict[str, Any]:
    sessions = []
    for network_slice in raw.get("slice") or []:
        for session in network_slice.get("session") or []:
            sessions.append(
                {
                    "name": session.get("name"),
                    "type": session.get("type"),
                    "qos_index": (session.get("qos") or {}).get("index"),
                }
            )

    msisdn = raw.get("msisdn") or []
    return {
        "imsi": raw.get("imsi"),
        "msisdn": msisdn[0] if msisdn else None,
        "msisdn_list": msisdn,
        "subscriber_status": raw.get("subscriber_status"),
        "operator_determined_barring": raw.get("operator_determined_barring"),
        "network_access_mode": raw.get("network_access_mode"),
        "apns": [session["name"] for session in sessions if session.get("name")],
        "sessions": sessions,
    }
