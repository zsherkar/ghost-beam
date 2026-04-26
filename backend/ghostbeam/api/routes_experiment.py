from __future__ import annotations

from pathlib import Path
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ghostbeam.api.runtime import runtime
from ghostbeam.artifacts.evidence_bundle import build_evidence_bundle, persist_evidence_bundle
from ghostbeam.core.schemas import ProposedAction
from ghostbeam.artifacts.mission_report import generate_and_persist_report, get_report, latest_report

router = APIRouter(prefix="/experiment", tags=["experiment"])


class ExperimentStartRequest(BaseModel):
    scenario_id: str = "green_zone"


class ExperimentProposeRequest(BaseModel):
    intent: str = "improve beam quality"
    source: Literal["human", "llm", "optimizer", "scenario"] = "optimizer"
    delta_settings: dict[str, float] | None = None


class ExperimentEvaluateRequest(BaseModel):
    proposed_action: ProposedAction


class ExperimentApplyRequest(BaseModel):
    decision_record_id: str | None = None
    force: bool = False


class ExperimentReportRequest(BaseModel):
    guided_transcript: list[dict[str, Any]] = []
    latest_decision_record: dict[str, Any] | None = None
    session_export: dict[str, Any] | None = None
    frontend_metadata: dict[str, Any] = {}


class EvidenceBundleRequest(BaseModel):
    guided_transcript: list[dict[str, Any]] = []
    frontend_metadata: dict[str, Any] = {}


@router.get("/state")
def experiment_state():
    return runtime.experiment_state()


@router.post("/start")
def start_experiment(request: ExperimentStartRequest):
    try:
        return runtime.start_experiment(request.scenario_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/propose")
def propose_experiment_action(request: ExperimentProposeRequest):
    return runtime.propose_experiment_action(
        intent=request.intent,
        source=request.source,
        delta_settings=request.delta_settings,
    )


@router.post("/evaluate")
def evaluate_experiment_action(request: ExperimentEvaluateRequest):
    return runtime.evaluate_current(request.proposed_action)


@router.post("/apply")
def apply_experiment_action(request: ExperimentApplyRequest):
    return runtime.apply_experiment_record(request.decision_record_id, request.force)


@router.post("/calibrate")
def calibrate_experiment():
    return runtime.calibrate_experiment()


@router.post("/reset")
def reset_experiment():
    return runtime.reset_experiment()


@router.get("/history")
def experiment_history():
    return {"history": runtime.experiment_history()}


@router.post("/export")
def export_experiment():
    return runtime.export_experiment()


@router.post("/evidence-bundle")
def export_evidence_bundle(request: EvidenceBundleRequest):
    bundle = build_evidence_bundle(
        runtime.export_experiment(),
        guided_transcript=request.guided_transcript,
        frontend_metadata=request.frontend_metadata,
    )
    return persist_evidence_bundle(bundle)


@router.post("/health-check")
def dry_run_health_check():
    return runtime.dry_run_health_check()


@router.post("/report/generate")
def generate_experiment_report(request: ExperimentReportRequest):
    return generate_and_persist_report(
        request.guided_transcript,
        request.latest_decision_record,
        request.session_export,
        request.frontend_metadata,
    )


@router.get("/report/latest")
def latest_experiment_report():
    report = latest_report()
    if report is None:
        raise HTTPException(status_code=404, detail="no mission report has been generated yet")
    return report


@router.get("/report/{report_id}")
def experiment_report(report_id: str):
    report = get_report(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail=f"unknown report_id {report_id}")
    return report


@router.get("/replay/drifted-twin")
def drifted_twin_replay():
    path = Path(__file__).resolve().parents[2] / "data" / "replays" / "drifted_twin_replay.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="drifted twin replay artifact not found")
    import json

    return json.loads(path.read_text(encoding="utf-8"))


@router.get("/device-registry")
def experiment_device_registry():
    return {"devices": runtime.experiment_device_registry()}


@router.get("/trajectory")
def experiment_trajectory():
    return {"trajectory": runtime.experiment_trajectory()}


@router.get("/beam-profile")
def experiment_beam_profile():
    return {"beam_profile": runtime.experiment_beam_profile()}
