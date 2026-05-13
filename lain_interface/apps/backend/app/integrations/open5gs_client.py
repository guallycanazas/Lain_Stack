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

    async def get_subscriber(self, imsi: str) -> dict[str, Any] | None:
        if not self.base_url:
            raise Open5GSClientError("OPEN5GS_API_URL is not configured")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/api/db/Subscriber/{imsi}",
                    headers=self._auth_headers(),
                )
                if response.status_code == 404:
                    return None
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise Open5GSClientError(f"Open5GS request failed: {exc}") from exc
        return response.json()

    async def create_subscriber(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.base_url:
            raise Open5GSClientError("OPEN5GS_API_URL is not configured")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/db/Subscriber",
                    headers=self._auth_headers(),
                    json=payload,
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise Open5GSClientError(f"Open5GS create failed: {exc}") from exc
        return response.json()

    async def update_subscriber(self, imsi: str, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.base_url:
            raise Open5GSClientError("OPEN5GS_API_URL is not configured")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.patch(
                    f"{self.base_url}/api/db/Subscriber/{imsi}",
                    headers=self._auth_headers(),
                    json=payload,
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise Open5GSClientError(f"Open5GS update failed: {exc}") from exc
        return response.json()

    async def delete_subscriber(self, imsi: str) -> None:
        if not self.base_url:
            raise Open5GSClientError("OPEN5GS_API_URL is not configured")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.delete(
                    f"{self.base_url}/api/db/Subscriber/{imsi}",
                    headers=self._auth_headers(),
                )
                if response.status_code == 404:
                    return
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise Open5GSClientError(f"Open5GS delete failed: {exc}") from exc


def build_open5gs_subscriber_payload(
    *,
    imsi: str,
    msisdn: str,
    ki: str,
    opc: str,
    amf: str = "8000",
    imeisv: str | None = None,
) -> dict[str, Any]:
    return {
        "schema_version": 1,
        "imsi": imsi,
        "msisdn": [msisdn] if msisdn else [],
        "imeisv": [imeisv] if imeisv else [],
        "mme_host": [],
        "mme_realm": [],
        "purge_flag": [],
        "security": {
            "k": ki.upper(),
            "amf": amf.upper(),
            "op": None,
            "opc": opc.upper(),
        },
        "ambr": {
            "downlink": {"value": 1, "unit": 3},
            "uplink": {"value": 1, "unit": 3},
        },
        "slice": [
            {
                "sst": 1,
                "default_indicator": True,
                "session": [
                    {
                        "name": "internet",
                        "type": 3,
                        "qos": {
                            "index": 9,
                            "arp": {
                                "priority_level": 8,
                                "pre_emption_capability": 1,
                                "pre_emption_vulnerability": 1,
                            },
                        },
                        "ambr": {
                            "downlink": {"value": 1, "unit": 3},
                            "uplink": {"value": 1, "unit": 3},
                        },
                        "pcc_rule": [],
                    },
                    {
                        "name": "ims",
                        "type": 3,
                        "qos": {
                            "index": 5,
                            "arp": {
                                "priority_level": 1,
                                "pre_emption_capability": 1,
                                "pre_emption_vulnerability": 1,
                            },
                        },
                        "ambr": {
                            "downlink": {"value": 3580, "unit": 1},
                            "uplink": {"value": 1530, "unit": 1},
                        },
                        "pcc_rule": [
                            _ims_pcc_rule(priority_level=2, qci=1, mbr=128),
                            _ims_pcc_rule(priority_level=4, qci=2, mbr=812),
                        ],
                    },
                ],
            }
        ],
        "access_restriction_data": 32,
        "subscriber_status": 0,
        "operator_determined_barring": 2,
        "network_access_mode": 0,
        "subscribed_rau_tau_timer": 12,
    }


def _ims_pcc_rule(*, priority_level: int, qci: int, mbr: int) -> dict[str, Any]:
    return {
        "flow": [],
        "qos": {
            "index": qci,
            "arp": {
                "priority_level": priority_level,
                "pre_emption_capability": 2,
                "pre_emption_vulnerability": 2,
            },
            "mbr": {
                "downlink": {"value": mbr, "unit": 1},
                "uplink": {"value": mbr, "unit": 1},
            },
            "gbr": {
                "downlink": {"unit": 1},
                "uplink": {"unit": 1},
            },
        },
    }


def apply_open5gs_subscriber_update(existing: dict[str, Any], *, msisdn: str | None = None) -> dict[str, Any]:
    payload = {k: v for k, v in existing.items() if k not in {"_id", "__v"}}
    if msisdn is not None:
        payload["msisdn"] = [msisdn] if msisdn else []
    return payload


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
