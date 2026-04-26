from __future__ import annotations

from ghostbeam.core.registry import DEFAULT_SETTINGS, SETTING_LIMITS
from ghostbeam.core.schemas import MachineSettings


class SimulatedEPICS:
    def __init__(self, settings: MachineSettings | None = None):
        self.settings = settings or DEFAULT_SETTINGS

    def read_pv(self, name: str) -> float:
        if not hasattr(self.settings, name):
            raise KeyError(f"unknown simulated PV {name}")
        return float(getattr(self.settings, name))

    def write_pv(self, name: str, value: float) -> None:
        if name not in SETTING_LIMITS:
            raise KeyError(f"unknown simulated PV {name}")
        limit = SETTING_LIMITS[name]
        if value < limit.minimum or value > limit.maximum:
            raise ValueError(f"{name}={value} outside simulated hard limits")
        payload = self.settings.model_dump()
        payload[name] = float(value)
        self.settings = MachineSettings(**payload)

    def get_limits(self, name: str) -> dict:
        limit = SETTING_LIMITS[name]
        return {
            "min": limit.minimum,
            "max": limit.maximum,
            "max_delta_without_approval": limit.max_delta_without_approval,
            "units": limit.units,
        }

    def snapshot(self) -> dict:
        return self.settings.model_dump()
