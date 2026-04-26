from __future__ import annotations

from ghostbeam.core.schemas import MachineSettings

SETTING_ORDER = (
    "quad_1",
    "quad_2",
    "steer_x",
    "steer_y",
    "rf_phase",
    "rf_amplitude",
)


def settings_to_vector(settings: MachineSettings) -> list[float]:
    return [float(getattr(settings, name)) for name in SETTING_ORDER]


def vector_to_settings(vector: list[float] | tuple[float, ...]) -> MachineSettings:
    return MachineSettings(**{name: float(vector[i]) for i, name in enumerate(SETTING_ORDER)})
