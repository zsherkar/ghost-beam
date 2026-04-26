from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ghostbeam.api.runtime import list_scenarios, runtime
from ghostbeam.core.registry import registry_payload
from ghostbeam.physics.transfer_jax import generate_safe_signals

router = APIRouter()


class ScenarioLoadRequest(BaseModel):
    scenario_id: str


@router.get("/registry")
def get_registry():
    return {"pvs": registry_payload()}


@router.get("/scenarios")
def get_scenarios():
    return {"scenarios": list_scenarios()}


@router.post("/scenarios/load")
def load_scenario(request: ScenarioLoadRequest):
    try:
        return runtime.load(request.scenario_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/state/current")
def current_state():
    settings = runtime.adapter.settings
    safe = generate_safe_signals(settings, runtime.drift_for(runtime.current_scenario_id))
    return {
        "scenario_id": runtime.current_scenario_id,
        "current_settings": settings.model_dump(),
        "safe_signals": safe.model_dump(),
    }
