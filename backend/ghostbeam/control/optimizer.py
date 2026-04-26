from __future__ import annotations

import numpy as np

from ghostbeam.core.registry import apply_delta
from ghostbeam.core.schemas import MachineSettings, ProposedAction
from ghostbeam.diagnostics.virtual_diagnostic import VirtualDiagnostic, get_default_diagnostic
from ghostbeam.physics.transfer_jax import gradient_suggestion


def propose_local_search_action(
    settings: MachineSettings,
    intent: str = "improve beam quality",
    diagnostic: VirtualDiagnostic | None = None,
    drift: float = 0.0,
    seed: int = 23,
) -> ProposedAction:
    model = diagnostic or get_default_diagnostic()
    rng = np.random.default_rng(seed)
    base = model.predict(settings, drift=drift).predicted_quality
    candidates: list[dict[str, float]] = [gradient_suggestion(settings, drift)]
    names = ["quad_1", "quad_2", "steer_x", "steer_y", "rf_phase", "rf_amplitude"]
    scales = np.array([0.08, 0.08, 0.04, 0.04, 0.35, 0.02])
    for _ in range(24):
        raw = rng.normal(0.0, scales)
        candidates.append({name: float(raw[i]) for i, name in enumerate(names)})

    best_delta = candidates[0]
    best_quality = base
    for delta in candidates:
        proposed_settings = apply_delta(settings, delta)
        quality = model.predict(proposed_settings, drift=drift).predicted_quality
        if quality > best_quality:
            best_quality = quality
            best_delta = delta

    return ProposedAction(intent=intent, delta_settings=best_delta, source="optimizer")
