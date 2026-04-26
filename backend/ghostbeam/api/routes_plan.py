from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from ghostbeam.api.runtime import runtime
from ghostbeam.core.schemas import DecisionRecord, MachineSettings, ProposedAction

router = APIRouter()


class ProposeRequest(BaseModel):
    current_settings: MachineSettings
    intent: str = "improve beam quality"
    scenario_id: str | None = None


class EvaluatePlanRequest(BaseModel):
    scenario_id: str
    current_settings: MachineSettings
    proposed_action: ProposedAction


class CalibrationRequest(BaseModel):
    scenario_id: str
    current_settings: MachineSettings | None = None


@router.post("/control/propose")
def propose(request: ProposeRequest):
    return runtime.propose(request.current_settings, request.intent, request.scenario_id)


@router.post("/plan/evaluate")
def evaluate(request: EvaluatePlanRequest):
    return runtime.evaluate(request.scenario_id, request.current_settings, request.proposed_action)


@router.post("/control/apply-simulated")
def apply_simulated(record: DecisionRecord):
    return runtime.apply_simulated(record)


@router.post("/calibration/request")
def request_calibration(request: CalibrationRequest):
    return runtime.request_calibration(request.scenario_id, request.current_settings)


@router.post("/calibration/apply")
def apply_calibration(request: CalibrationRequest):
    return runtime.apply_calibration(request.scenario_id, request.current_settings)
