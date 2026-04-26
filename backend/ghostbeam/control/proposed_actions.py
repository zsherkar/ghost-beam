from __future__ import annotations

from ghostbeam.core.schemas import MachineSettings, ProposedAction
from ghostbeam.physics.transfer_jax import gradient_suggestion


def action_from_delta(intent: str, delta_settings: dict[str, float], source: str = "optimizer") -> ProposedAction:
    return ProposedAction(intent=intent, delta_settings=delta_settings, source=source)


def gradient_action(settings: MachineSettings, drift: float = 0.0, intent: str = "improve beam quality") -> ProposedAction:
    return ProposedAction(intent=intent, delta_settings=gradient_suggestion(settings, drift), source="optimizer")
