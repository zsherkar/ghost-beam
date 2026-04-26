from __future__ import annotations

import csv
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean, pstdev
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/public-data", tags=["public-data"])

PUBLIC_DATA_DISCLOSURE = (
    "Public data mode is read-only analysis. No real-time hardware, live ACNET/EPICS, "
    "facility eLogs, or machine writes are used."
)
PUBLIC_DATA_DECISIONS = ["WINDOW_OK", "ANALYZE", "FLAG_FOR_REVIEW", "IMPORT_ERROR", "NO_LOCAL_SLICE"]

_PUBLIC_RUNS: dict[str, dict[str, Any]] = {}
_LATEST_PUBLIC_ARTIFACT: dict[str, Any] | None = None


class PublicDataImportRequest(BaseModel):
    path: str = "backend/data/public_datasets/boostr/local_sample.csv"


class PublicDataEvaluateRequest(BaseModel):
    run_id: str
    start_index: int = 0
    window_size: int = 100


def backend_root() -> Path:
    return Path(__file__).resolve().parents[2]


def project_root() -> Path:
    return backend_root().parent


def public_root() -> Path:
    return backend_root() / "data" / "public_datasets"


def boostr_root() -> Path:
    return public_root() / "boostr"


def boostr_manifest_path() -> Path:
    return public_root() / "boostr_manifest.json"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def boostr_manifest() -> dict[str, Any]:
    path = boostr_manifest_path()
    if not path.exists():
        raise HTTPException(status_code=404, detail="BOOSTR manifest not found")
    return json.loads(path.read_text(encoding="utf-8"))


def public_data_status() -> dict[str, Any]:
    manifest = boostr_manifest() if boostr_manifest_path().exists() else {}
    local_slices = [
        str(path.relative_to(project_root()))
        for path in sorted(boostr_root().glob("*"))
        if path.suffix.lower() in {".csv", ".parquet"}
    ] if boostr_root().exists() else []
    return {
        "adapters_enabled": True,
        "sources": [
            {
                "dataset_id": "boostr",
                "name": manifest.get("name", "BOOSTR"),
                "facility": manifest.get("facility", "Fermilab Booster"),
                "doi": manifest.get("doi", "10.5281/zenodo.4382663"),
                "license": manifest.get("license", "CC BY 4.0"),
                "status": "local_slice_available" if local_slices else "not_installed",
                "default_local_path": manifest.get("default_local_path", "backend/data/public_datasets/boostr/local_sample.csv"),
                "local_slices": local_slices,
                "disclosure": PUBLIC_DATA_DISCLOSURE,
            }
        ],
        "latest_public_data_artifact": _LATEST_PUBLIC_ARTIFACT,
    }


def latest_public_data_artifact() -> dict[str, Any] | None:
    return _LATEST_PUBLIC_ARTIFACT


def _resolve_boostr_path(raw_path: str) -> Path:
    requested = Path(raw_path)
    candidates: list[Path] = []
    if requested.is_absolute():
        candidates.append(requested)
    else:
        candidates.append(project_root() / requested)
        candidates.append(backend_root() / requested)
        candidates.append(boostr_root() / requested.name)
    for candidate in candidates:
        resolved = candidate.resolve()
        try:
            resolved.relative_to(boostr_root().resolve())
        except ValueError:
            continue
        return resolved
    raise HTTPException(
        status_code=400,
        detail="BOOSTR import path must resolve under backend/data/public_datasets/boostr/",
    )


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def _read_parquet(path: Path) -> list[dict[str, Any]]:
    try:
        import pandas as pd  # type: ignore
    except Exception as exc:  # pragma: no cover - optional dependency path
        raise HTTPException(status_code=400, detail="Parquet import requires pandas/pyarrow in the local environment.") from exc
    frame = pd.read_parquet(path)
    return frame.to_dict(orient="records")


def _read_rows(path: Path) -> list[dict[str, Any]]:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return _read_csv(path)
    if suffix == ".parquet":
        return _read_parquet(path)
    raise HTTPException(status_code=400, detail="BOOSTR local slice must be .csv or .parquet")


def _to_float(value: Any) -> float | None:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed if math.isfinite(parsed) else None


def _numeric_columns(rows: list[dict[str, Any]]) -> list[str]:
    if not rows:
        return []
    columns = list(rows[0].keys())
    numeric: list[str] = []
    for column in columns:
        samples = [_to_float(row.get(column)) for row in rows[: min(len(rows), 200)]]
        valid = [value for value in samples if value is not None]
        if valid and len(valid) >= max(1, math.ceil(len(samples) * 0.6)):
            numeric.append(column)
    return numeric


def _timestamp_range(rows: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not rows:
        return None
    candidates = [column for column in rows[0].keys() if "time" in column.lower() or "timestamp" in column.lower()]
    if not candidates:
        return None
    column = candidates[0]
    values = [str(row.get(column, "")) for row in rows if row.get(column)]
    if not values:
        return None
    return {"column": column, "start": values[0], "end": values[-1]}


@router.get("/sources")
def sources():
    return public_data_status()


@router.post("/boostr/import-local")
def import_boostr_local(request: PublicDataImportRequest):
    manifest = boostr_manifest()
    path = _resolve_boostr_path(request.path)
    if not path.exists():
        return {
            "run_id": "",
            "dataset_id": "boostr",
            "source_path": str(path.relative_to(project_root())),
            "row_count": 0,
            "stored_row_count": 0,
            "column_list": [],
            "timestamp_range": None,
            "detected_numeric_signals": [],
            "mapping_status": "NO_LOCAL_SLICE",
            "import_status": "NO_LOCAL_SLICE",
            "decision": "NO_LOCAL_SLICE",
            "allowed_actions": PUBLIC_DATA_DECISIONS,
            "disclosure": PUBLIC_DATA_DISCLOSURE,
        }
    rows = _read_rows(path)
    numeric = _numeric_columns(rows)
    run_id = f"public-boostr-{uuid4().hex[:8]}"
    stored_rows = rows[:5000]
    run = {
        "run_id": run_id,
        "dataset_id": "boostr",
        "source_path": str(path.relative_to(project_root())),
        "manifest": manifest,
        "rows": stored_rows,
        "full_row_count": len(rows),
        "numeric_columns": numeric,
        "timestamp_range": _timestamp_range(rows),
        "created_at": _now(),
        "truncated_for_memory": len(rows) > len(stored_rows),
    }
    _PUBLIC_RUNS[run_id] = run
    return {
        "run_id": run_id,
        "dataset_id": "boostr",
        "source_path": run["source_path"],
        "row_count": len(rows),
        "stored_row_count": len(stored_rows),
        "column_list": list(rows[0].keys()) if rows else [],
        "timestamp_range": run["timestamp_range"],
        "detected_numeric_signals": numeric,
        "mapping_status": "ready_for_read_only_window_analysis" if numeric else "no_numeric_signals_detected",
        "import_status": "IMPORTED",
        "decision": "ANALYZE" if numeric else "IMPORT_ERROR",
        "allowed_actions": PUBLIC_DATA_DECISIONS,
        "disclosure": PUBLIC_DATA_DISCLOSURE,
    }


@router.post("/boostr/evaluate-window")
def evaluate_boostr_window(request: PublicDataEvaluateRequest):
    global _LATEST_PUBLIC_ARTIFACT
    run = _PUBLIC_RUNS.get(request.run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"unknown public data run_id {request.run_id}")
    rows = run["rows"]
    if not rows:
        raise HTTPException(status_code=400, detail="public data run has no rows")
    start = max(0, request.start_index)
    stop = min(len(rows), start + max(1, request.window_size))
    window = rows[start:stop]
    numeric_columns = run["numeric_columns"]
    metrics: dict[str, dict[str, float | int]] = {}
    anomaly_score = 0.0
    for column in numeric_columns:
        baseline = [_to_float(row.get(column)) for row in rows]
        base_values = [value for value in baseline if value is not None]
        values = [_to_float(row.get(column)) for row in window]
        window_values = [value for value in values if value is not None]
        if not base_values or not window_values:
            continue
        base_mean = mean(base_values)
        base_std = pstdev(base_values) or 1e-9
        window_mean = mean(window_values)
        z_score = abs(window_mean - base_mean) / base_std
        anomaly_score = max(anomaly_score, z_score)
        metrics[column] = {
            "mean": window_mean,
            "min": min(window_values),
            "max": max(window_values),
            "z_score": z_score,
            "count": len(window_values),
        }
    trust_score = max(0.0, min(1.0, 1.0 - anomaly_score / 8.0))
    if anomaly_score >= 5.0:
        decision = "FLAG_FOR_REVIEW"
        recommended_action = "Flag this public-data window for expert review before using it as operating context."
    elif anomaly_score >= 2.5:
        decision = "ANALYZE"
        recommended_action = "Analyze the anomalous public-data window as read-only context; no machine action is permitted."
    else:
        decision = "WINDOW_OK"
        recommended_action = "Window appears within the local slice envelope; keep as read-only context."
    artifact = {
        "artifact_type": "PublicDataAnalysisRecord",
        "schema_version": "0.1.0",
        "source_id": "boostr",
        "run_id": request.run_id,
        "dataset_id": "boostr",
        "data_source": "public_boostr",
        "created_at": _now(),
        "window": {"start_index": start, "stop_index": stop, "row_count": len(window)},
        "window_start": start,
        "window_size": len(window),
        "detected_columns": numeric_columns,
        "numeric_metrics": metrics,
        "anomaly_score": anomaly_score,
        "trust_score": trust_score,
        "trust_assessment": "low" if trust_score < 0.45 else "medium" if trust_score < 0.75 else "high",
        "decision": decision,
        "recommended_action": recommended_action,
        "policy_language": "Recorded public data analysis only - no writes permitted.",
        "allowed_actions": PUBLIC_DATA_DECISIONS,
        "writes_allowed": False,
        "hardware_write_permitted": False,
        "disclosure": PUBLIC_DATA_DISCLOSURE,
    }
    _LATEST_PUBLIC_ARTIFACT = artifact
    return artifact
