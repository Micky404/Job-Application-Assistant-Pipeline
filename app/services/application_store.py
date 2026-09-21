import json
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

APPLICATIONS_DIR = "data/applications"
UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)

AGENT_KEYS = (
    "cover_letter",
    "company_info",
    "project",
    "motivation",
    "technical_qa",
    "candidate_info",
)


def ensure_dir() -> None:
    os.makedirs(APPLICATIONS_DIR, exist_ok=True)


def _is_valid_id(app_id: str) -> bool:
    return bool(app_id and UUID_RE.match(app_id))


def _path(app_id: str) -> str:
    if not _is_valid_id(app_id):
        raise ValueError("Identifiant de candidature invalide.")
    return os.path.join(APPLICATIONS_DIR, f"{app_id}.json")


def _read(app_id: str) -> Optional[dict[str, Any]]:
    path = _path(app_id)
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def _write(record: dict[str, Any]) -> dict[str, Any]:
    ensure_dir()
    with open(_path(record["id"]), "w", encoding="utf-8") as handle:
        json.dump(record, handle, ensure_ascii=False, indent=2)
    return record


def _normalize_offer(company_name: str, job_title: str) -> tuple[str, str]:
    return (company_name or "").strip().casefold(), (job_title or "").strip().casefold()


def find_existing_for_offer(company_name: str, job_title: str) -> Optional[dict[str, Any]]:
    wanted = _normalize_offer(company_name, job_title)
    if not wanted[0] or not wanted[1]:
        return None

    ensure_dir()
    best: Optional[dict[str, Any]] = None
    best_ts = ""

    for name in os.listdir(APPLICATIONS_DIR):
        if not name.endswith(".json"):
            continue
        path = os.path.join(APPLICATIONS_DIR, name)
        try:
            with open(path, encoding="utf-8") as handle:
                data = json.load(handle)
        except (json.JSONDecodeError, OSError):
            continue
        if _normalize_offer(data.get("company_name", ""), data.get("job_title", "")) != wanted:
            continue
        timestamp = data.get("updated_at") or data.get("created_at") or ""
        if timestamp >= best_ts:
            best = data
            best_ts = timestamp

    return best


def save_application(payload: dict[str, Any]) -> dict[str, Any]:
    ensure_dir()
    existing: Optional[dict[str, Any]] = None
    app_id = payload.get("id")

    if app_id and _is_valid_id(app_id):
        existing = _read(app_id)
    else:
        existing = find_existing_for_offer(
            str(payload.get("company_name") or ""),
            str(payload.get("job_title") or ""),
        )
        app_id = existing["id"] if existing and existing.get("id") else str(uuid.uuid4())

    now = datetime.now(timezone.utc).isoformat()
    created_at = (
        (existing or {}).get("created_at")
        or payload.get("created_at")
        or now
    )

    record: dict[str, Any] = {
        "id": app_id,
        "company_name": payload.get("company_name")
        or (existing or {}).get("company_name")
        or "",
        "job_title": payload.get("job_title")
        or (existing or {}).get("job_title")
        or "",
        "job_description": payload.get("job_description")
        if payload.get("job_description") is not None
        else (existing or {}).get("job_description", ""),
        "created_at": created_at,
        "updated_at": now,
    }

    for key in AGENT_KEYS:
        incoming = payload.get(key)
        if incoming is not None:
            record[key] = incoming
        elif existing and key in existing:
            record[key] = existing[key]
        else:
            record[key] = None

    return _write(record)


def list_applications() -> list[dict[str, Any]]:
    ensure_dir()
    items: list[dict[str, Any]] = []

    for name in os.listdir(APPLICATIONS_DIR):
        if not name.endswith(".json"):
            continue
        path = os.path.join(APPLICATIONS_DIR, name)
        try:
            with open(path, encoding="utf-8") as handle:
                data = json.load(handle)
        except (json.JSONDecodeError, OSError):
            continue
        items.append(
            {
                "id": data.get("id", name.replace(".json", "")),
                "company_name": data.get("company_name", ""),
                "job_title": data.get("job_title", ""),
                "created_at": data.get("created_at", ""),
                "updated_at": data.get("updated_at", ""),
            }
        )

    items.sort(
        key=lambda item: item.get("updated_at") or item.get("created_at") or "",
        reverse=True,
    )
    return items


def get_application(app_id: str) -> Optional[dict[str, Any]]:
    if not _is_valid_id(app_id):
        return None
    return _read(app_id)


def delete_application(app_id: str) -> bool:
    if not _is_valid_id(app_id):
        return False
    path = _path(app_id)
    if not os.path.exists(path):
        return False
    os.remove(path)
    return True
