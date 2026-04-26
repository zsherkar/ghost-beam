from __future__ import annotations

from dataclasses import dataclass

from ghostbeam.core.schemas import MachineSettings


@dataclass(frozen=True)
class SettingLimit:
    minimum: float
    maximum: float
    max_delta_without_approval: float
    units: str = "arb"


SETTING_LIMITS: dict[str, SettingLimit] = {
    "quad_1": SettingLimit(-2.0, 2.0, 0.15, "1/m"),
    "quad_2": SettingLimit(-2.0, 2.0, 0.15, "1/m"),
    "steer_x": SettingLimit(-1.0, 1.0, 0.10, "mrad"),
    "steer_y": SettingLimit(-1.0, 1.0, 0.10, "mrad"),
    "rf_phase": SettingLimit(-10.0, 10.0, 1.0, "deg"),
    "rf_amplitude": SettingLimit(0.5, 1.5, 0.05, "MV"),
}

DEFAULT_SETTINGS = MachineSettings(
    quad_1=0.35,
    quad_2=-0.25,
    steer_x=0.0,
    steer_y=0.0,
    rf_phase=0.4,
    rf_amplitude=1.0,
)


def registry_payload() -> dict:
    return {
        name: {
            "min": limit.minimum,
            "max": limit.maximum,
            "max_delta_without_approval": limit.max_delta_without_approval,
            "units": limit.units,
        }
        for name, limit in SETTING_LIMITS.items()
    }


def apply_delta(settings: MachineSettings, delta: dict[str, float]) -> MachineSettings:
    payload = settings.model_dump()
    for key, value in delta.items():
        if key in payload:
            payload[key] = float(payload[key]) + float(value)
    return MachineSettings(**payload)


def limit_violations(settings: MachineSettings, delta: dict[str, float]) -> dict[str, float]:
    proposed = apply_delta(settings, delta)
    violations: dict[str, float] = {}
    for name, limit in SETTING_LIMITS.items():
        value = getattr(proposed, name)
        if value < limit.minimum or value > limit.maximum:
            violations[name] = value
    return violations


def clip_delta_without_approval(delta: dict[str, float]) -> dict[str, float]:
    clipped: dict[str, float] = {}
    for name, value in delta.items():
        if name not in SETTING_LIMITS:
            continue
        max_delta = SETTING_LIMITS[name].max_delta_without_approval
        clipped[name] = max(-max_delta, min(max_delta, float(value)))
    return clipped
