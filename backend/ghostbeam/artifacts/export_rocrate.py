from __future__ import annotations

from pathlib import Path

from ghostbeam.artifacts.export_json import export_decision_json
from ghostbeam.core.schemas import DecisionRecord


def export_rocrate_or_json(record: DecisionRecord, path: Path, model_version: str = "unknown") -> Path:
    try:
        import rocrate  # type: ignore  # noqa: F401
    except Exception:
        return export_decision_json(record, path.with_suffix(".json"), model_version)
    return export_decision_json(record, path.with_suffix(".json"), model_version)
