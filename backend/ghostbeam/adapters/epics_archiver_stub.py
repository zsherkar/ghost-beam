from __future__ import annotations

from typing import Any


class EPICSArchiverReadOnlyStub:
    """Disabled read-only boundary for future archived PV retrieval.

    The MVP intentionally makes no network calls, performs no PV discovery, and
    never writes to hardware. This class exists so the platform contract can
    show where a facility-approved archived-PV connector would fit later.
    """

    writes_allowed = False
    read_enabled = False
    status_value = "not_configured"

    def status(self) -> dict[str, Any]:
        return {
            "id": "epics_archiver_stub",
            "name": "EPICS Archiver Appliance read-only connector stub",
            "status": self.status_value,
            "read_enabled": self.read_enabled,
            "writes_allowed": self.writes_allowed,
            "runtime_network_required": False,
            "detail": "Disabled in the MVP. No EPICS/Archiver network connection is configured.",
        }

    def get_pv_window(self, pv_names: list[str], start: str, end: str) -> dict[str, Any]:
        return {
            **self.status(),
            "requested_pvs": pv_names,
            "start": start,
            "end": end,
            "samples": [],
        }

    def get_pv_at_time(self, pv_names: list[str], at: str) -> dict[str, Any]:
        return {
            **self.status(),
            "requested_pvs": pv_names,
            "at": at,
            "values": {},
        }
