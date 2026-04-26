from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from ghostbeam import __version__
from ghostbeam.control.policy_gate import POLICY_VERSION
from ghostbeam.core.schemas import DecisionRecord

DECISION_RECORD_SCHEMA_VERSION = "0.1.0"


def enrich_record(record: DecisionRecord, model_version: str = "unknown") -> dict:
    validation = validate_decision_record(record)
    payload = record.model_dump()
    payload.update(
        {
            "schema_version": DECISION_RECORD_SCHEMA_VERSION,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "engine_version": __version__,
            "model_version": model_version,
            "policy_version": POLICY_VERSION,
            "data_notice": "Synthetic simulator and synthetic eLogs only.",
            "validation": validation,
        }
    )
    return payload


def decision_record_schema() -> dict[str, Any]:
    schema = DecisionRecord.model_json_schema()
    schema.update(
        {
            "$id": "https://ghost-beam.local/schemas/decision_record.schema.json",
            "schema_version": DECISION_RECORD_SCHEMA_VERSION,
            "title": "Ghost Beam DecisionRecord",
            "description": "Machine-readable Ghost Beam gate decision over synthetic accelerator-control data.",
        }
    )
    return schema


def validate_decision_record(record: DecisionRecord | dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    try:
        DecisionRecord.model_validate(record)
    except Exception as exc:  # Pydantic error text is useful for artifact QA.
        errors.append(str(exc))
    return {
        "decision_record_valid": not errors,
        "schema_version": DECISION_RECORD_SCHEMA_VERSION,
        "validation_errors": errors,
    }
