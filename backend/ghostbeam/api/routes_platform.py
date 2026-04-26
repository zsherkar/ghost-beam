from __future__ import annotations

from pathlib import Path
import json
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ghostbeam import __version__
from ghostbeam.artifacts.decision_record import DECISION_RECORD_SCHEMA_VERSION

router = APIRouter(prefix="/platform", tags=["platform"])
BACKEND_STARTED_AT = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


@router.get("/adapters")
def platform_adapters():
    return {
        "active_adapter_id": "simulated",
        "adapters": [
            {
                "id": "simulated",
                "name": "Simulated JAX Twin",
                "status": "active",
                "read_enabled": True,
                "write_enabled": True,
                "real_hardware": False,
                "description": "Local synthetic accelerator session backed by Ghost Beam's JAX transfer-matrix twin.",
            },
            {
                "id": "replay",
                "name": "Replay Artifact",
                "status": "available_artifact",
                "read_enabled": True,
                "write_enabled": False,
                "real_hardware": False,
                "description": "Static replay fixture for reviewing a prior synthetic drifted-twin run.",
            },
            {
                "id": "epics_stub",
                "name": "EPICS Stub",
                "status": "available_stub",
                "read_enabled": False,
                "write_enabled": False,
                "real_hardware": False,
                "description": "Interface placeholder only. No EPICS imports, network discovery, or hardware writes.",
            },
            {
                "id": "future_epics",
                "name": "Future Facility EPICS Adapter",
                "status": "planned_requires_facility_review",
                "read_enabled": False,
                "write_enabled": False,
                "real_hardware": False,
                "description": "Documented swap-in boundary for a facility-approved read-only integration.",
            },
        ],
    }


@router.get("/capabilities")
def platform_capabilities():
    return {
        "adapter_mode": "simulated",
        "real_hardware_writes_enabled": False,
        "capabilities": {
            "jax_transfer_matrix_twin": True,
            "virtual_diagnostic": True,
            "uncertainty": True,
            "ood_detection": True,
            "beam_profile_vision": True,
            "elog_memory": True,
            "policy_gate": True,
            "calibration_sim": True,
            "mission_report": True,
            "decision_record_schema": True,
            "epics_stub": True,
            "real_epics": False,
        },
        "safety_notice": "Ghost Beam MVP is local-only and simulated. Real EPICS reads/writes are disabled.",
    }


@router.get("/data-manifest")
def synthetic_data_manifest():
    path = Path(__file__).resolve().parents[2] / "data" / "synthetic_data_manifest.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="synthetic data manifest not found")
    return json.loads(path.read_text(encoding="utf-8"))


@router.get("/version")
def platform_version():
    manifest_path = Path(__file__).resolve().parents[2] / "data" / "synthetic_data_manifest.json"
    return {
        "app_name": "Ghost Beam",
        "version": __version__,
        "schema_version": DECISION_RECORD_SCHEMA_VERSION,
        "backend_started_at": BACKEND_STARTED_AT,
        "route_groups_available": [
            "health",
            "state",
            "diagnostic",
            "vision",
            "elog",
            "plan",
            "artifacts",
            "experiment",
            "platform",
            "benchmark",
        ],
        "adapter_mode": "simulated",
        "real_hardware_writes_enabled": False,
        "synthetic_data_manifest_available": manifest_path.exists(),
        "report_persistence_enabled": True,
        "benchmark_enabled": True,
        "evidence_bundle_enabled": True,
        "replay_enabled": True,
        "safety_notice": "Local-only simulated MVP. Real EPICS reads/writes and hardware control are disabled.",
    }
