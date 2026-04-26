from __future__ import annotations

from ghostbeam.core.schemas import MachineSettings, ProposedAction
from ghostbeam.control.optimizer import propose_local_search_action


def propose_with_xopt_if_available(settings: MachineSettings, intent: str = "improve beam quality") -> ProposedAction:
    try:
        import xopt  # type: ignore  # noqa: F401
    except Exception:
        return propose_local_search_action(settings, intent=f"{intent} using local-search fallback")
    return propose_local_search_action(settings, intent=f"{intent} using Xopt-compatible fallback")
