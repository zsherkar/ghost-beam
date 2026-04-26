from __future__ import annotations

from fastapi import APIRouter

from ghostbeam.api.runtime import runtime
from ghostbeam.core.schemas import MachineSettings
from ghostbeam.diagnostics.vision import analyze_beam_image
from ghostbeam.physics.transfer_jax import generate_beam_image

router = APIRouter()


@router.post("/vision/analyze")
def analyze(settings: MachineSettings):
    drift = runtime.drift_for(runtime.current_scenario_id)
    image = generate_beam_image(settings, drift)
    return analyze_beam_image(image)
