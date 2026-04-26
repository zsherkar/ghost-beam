from __future__ import annotations

import json
from pathlib import Path

from ghostbeam.artifacts.decision_record import enrich_record
from ghostbeam.core.schemas import DecisionRecord


def export_decision_json(record: DecisionRecord, path: Path, model_version: str = "unknown") -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(enrich_record(record, model_version), indent=2), encoding="utf-8")
    return path
