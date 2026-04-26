from __future__ import annotations

from fastapi import APIRouter

from ghostbeam.api.runtime import runtime
from ghostbeam.core.schemas import MachineSettings
from ghostbeam.diagnostics.virtual_diagnostic import get_default_diagnostic
from ghostbeam.physics.transfer_jax import generate_safe_signals

router = APIRouter()


@router.post("/diagnostic/predict")
def predict(settings: MachineSettings):
    drift = runtime.drift_for(runtime.current_scenario_id)
    safe = generate_safe_signals(settings, drift)
    result = get_default_diagnostic().predict(
        settings,
        safe_signals=safe,
        drift=drift,
        calibration_weight=runtime.calibration_weight(runtime.current_scenario_id),
    )
    return result
