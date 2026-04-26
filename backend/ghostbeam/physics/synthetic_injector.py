from __future__ import annotations

import numpy as np

from ghostbeam.core.registry import DEFAULT_SETTINGS, apply_delta
from ghostbeam.core.schemas import BeamTruth, MachineSettings, ProposedAction, SafeSignals
from ghostbeam.physics.transfer_jax import (
    generate_beam_image,
    generate_beam_truth,
    generate_safe_signals,
    gradient_suggestion,
)


def sample_operating_settings(n: int = 2500, seed: int = 7, drift_span: float = 0.18) -> list[tuple[MachineSettings, float]]:
    rng = np.random.default_rng(seed)
    samples: list[tuple[MachineSettings, float]] = []
    for _ in range(n):
        drift = float(rng.uniform(-drift_span, drift_span))
        settings = MachineSettings(
            quad_1=float(rng.normal(0.35 + 0.18 * drift, 0.18)),
            quad_2=float(rng.normal(-0.25 - 0.22 * drift, 0.18)),
            steer_x=float(rng.normal(0.02 * drift, 0.045)),
            steer_y=float(rng.normal(-0.02 * drift, 0.045)),
            rf_phase=float(rng.normal(0.4 + 1.4 * drift, 0.55)),
            rf_amplitude=float(rng.normal(1.0 + 0.04 * drift, 0.035)),
        )
        samples.append((settings, drift))
    return samples


def current_state(settings: MachineSettings = DEFAULT_SETTINGS, drift: float = 0.0) -> tuple[SafeSignals, BeamTruth]:
    return generate_safe_signals(settings, drift), generate_beam_truth(settings, drift)


def propose_gradient_action(settings: MachineSettings, drift: float = 0.0, intent: str = "improve beam quality") -> ProposedAction:
    return ProposedAction(intent=intent, delta_settings=gradient_suggestion(settings, drift), source="optimizer")


def simulate_action(settings: MachineSettings, action: ProposedAction, drift: float = 0.0) -> BeamTruth:
    return generate_beam_truth(apply_delta(settings, action.delta_settings), drift)


__all__ = [
    "generate_beam_image",
    "generate_beam_truth",
    "generate_safe_signals",
    "sample_operating_settings",
    "current_state",
    "propose_gradient_action",
    "simulate_action",
]
