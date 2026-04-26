from __future__ import annotations


class EPICSStub:
    """Future EPICS adapter boundary.

    This class intentionally does not import EPICS libraries or discover real
    process variables. It documents the interface for a later read-only or
    hardware-gated integration.
    """

    def read_pv(self, name: str) -> float:
        raise NotImplementedError("Real EPICS access is disabled in the MVP")

    def write_pv(self, name: str, value: float) -> None:
        raise NotImplementedError("Real EPICS writes are forbidden in the MVP")

    def get_limits(self, name: str) -> dict:
        raise NotImplementedError("Use registry limits until a real facility adapter is approved")

    def snapshot(self) -> dict:
        raise NotImplementedError("Real EPICS snapshots are disabled in the MVP")
