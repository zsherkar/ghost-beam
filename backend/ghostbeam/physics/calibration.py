from __future__ import annotations

from ghostbeam.core.schemas import MachineSettings
from ghostbeam.physics.transfer_jax import generate_beam_truth


def calibration_measurement(settings: MachineSettings, drift: float) -> dict:
    truth = generate_beam_truth(settings, drift)
    return {
        "measurement": "synthetic_calibration_screen",
        "hidden_truth": truth.model_dump(),
        "recommendation": "Use this screen measurement to refresh trust in the local operating region.",
    }
