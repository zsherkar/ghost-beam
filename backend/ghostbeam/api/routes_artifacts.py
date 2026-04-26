from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException

from ghostbeam.api.runtime import runtime
from ghostbeam.artifacts.decision_record import decision_record_schema
from ghostbeam.artifacts.export_json import export_decision_json
from ghostbeam.diagnostics.virtual_diagnostic import get_default_diagnostic

router = APIRouter()


@router.get("/artifacts/latest")
def latest_artifact():
    artifact = runtime.latest_artifact()
    if artifact is None:
        raise HTTPException(status_code=404, detail="no DecisionRecord has been generated yet")
    return artifact


@router.post("/artifacts/export")
def export_latest():
    if runtime.latest_record is None:
        raise HTTPException(status_code=404, detail="no DecisionRecord has been generated yet")
    path = Path(__file__).resolve().parents[2] / "artifacts_output" / "latest_decision.json"
    export_decision_json(runtime.latest_record, path, get_default_diagnostic().model_version)
    return {"exported": True, "path": str(path)}


@router.get("/artifacts/schemas/decision-record")
def decision_record_json_schema():
    return decision_record_schema()
