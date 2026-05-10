from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ghostbeam.artifacts.benchmark import latest_benchmark
from ghostbeam.artifacts.decision_record import decision_record_schema
from ghostbeam.artifacts.mission_report import latest_report
from ghostbeam.api.routes_platform import platform_adapters, platform_capabilities
from ghostbeam.api.routes_public_data import latest_public_data_artifact, public_data_status
from ghostbeam.data_sources import (
    data_sources_registry,
    data_sources_summary,
    fermilab_bpm_ipm_manifest_path,
    frictionless_validation_report,
    openpmd_manifest_path,
    workflowhub_manifest_path,
)

SYNTHETIC_DISCLOSURE = (
    "Evidence bundle uses synthetic Ghost Beam data only. No real EPICS, real accelerator hardware, "
    "real facility eLogs, personal data, paid APIs, or external uploads are included."
)


def bundle_root() -> Path:
    artifact_dir = os.getenv("GHOSTBEAM_ARTIFACT_DIR")
    if artifact_dir:
        return Path(artifact_dir).expanduser() / "evidence_bundles"
    return Path(__file__).resolve().parents[2] / "artifacts" / "evidence_bundles"


def data_manifest_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "synthetic_data_manifest.json"


def recorded_manifest_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "recorded_runs" / "sample_recorded_drifted_twin_manifest.json"


def boostr_manifest_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "public_datasets" / "boostr_manifest.json"


def _read_json(path: Path) -> dict[str, Any] | None:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _slug_timestamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def _bundle_readme(bundle: dict[str, Any]) -> str:
    latest_decision = ((bundle.get("latest_decision_record") or {}).get("gate_decision") or {}).get("decision", "not recorded")
    benchmark = bundle.get("latest_benchmark") or {}
    benchmark_summary = benchmark.get("summary", "Benchmark has not been run yet.")
    diagnosis = bundle.get("human_diagnosis") or {}
    diagnosis_summary = diagnosis.get("summary") or "Human-readable diagnosis was not provided by the frontend."
    return "\n".join(
        [
            "# Ghost Beam Evidence Bundle",
            "",
            "Ghost Beam is an accelerator trust agent that gates autonomous accelerator actions using twin trust, uncertainty, OOD detection, eLog memory, hard PV limits, and calibration status.",
            "",
            f"Created: {bundle['created_at']}",
            f"Bundle ID: `{bundle['bundle_id']}`",
            "",
            "## Key Contents",
            "",
            "- Latest session export JSON",
            "- Latest Decision Record JSON",
            "- Latest Mission Report JSON and Markdown when available",
            "- Latest naive-vs-Ghost-Beam benchmark result when available",
            "- Synthetic data manifest",
            "- Recorded-run fixture manifest when available",
            "- Federated data-source registry",
            "- BOOSTR and Fermilab BPM/IPM public dataset manifests",
            "- openPMD, Frictionless, RO-Crate, and WorkflowHub provenance/validation status",
            "- Decision Record JSON schema",
            "- Platform adapter/capability status",
            "- Guided transcript and top eLog evidence when available",
            "",
            "## Current Decision",
            "",
            f"- Latest Ghost Beam decision: `{latest_decision}`",
            f"- Diagnosis: {diagnosis_summary}",
            "",
            "## Benchmark Summary",
            "",
            benchmark_summary,
            "",
            "## Synthetic Data Disclosure",
            "",
            SYNTHETIC_DISCLOSURE,
            "",
            f"Data source for latest session: `{bundle.get('data_source', 'synthetic_live_twin')}`",
        ]
    )


def build_evidence_bundle(
    session_export: dict[str, Any],
    guided_transcript: list[dict[str, Any]] | None = None,
    frontend_metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    manifest = json.loads(data_manifest_path().read_text(encoding="utf-8")) if data_manifest_path().exists() else None
    recorded_manifest = _read_json(recorded_manifest_path())
    boostr_manifest = _read_json(boostr_manifest_path())
    bpm_ipm_manifest = _read_json(fermilab_bpm_ipm_manifest_path())
    openpmd_manifest = _read_json(openpmd_manifest_path())
    workflowhub_manifest = _read_json(workflowhub_manifest_path())
    registry = data_sources_registry()
    state = session_export.get("state") or {}
    latest_decision = state.get("latest_decision_record")
    top_elog = (latest_decision or {}).get("elog_hits", [])[:3]
    mission = latest_report()
    benchmark = latest_benchmark()
    human_diagnosis = (frontend_metadata or {}).get("human_diagnosis")
    bundle = {
        "bundle_id": f"GB-BUNDLE-{_slug_timestamp()}",
        "created_at": _now(),
        "bundle_version": "0.1.0",
        "data_source": state.get("data_source", "synthetic_live_twin"),
        "recorded_run_id": state.get("recorded_run_id"),
        "synthetic_data_disclosure": SYNTHETIC_DISCLOSURE,
        "session_export": session_export,
        "latest_decision_record": latest_decision,
        "latest_mission_report": mission,
        "latest_benchmark": benchmark,
        "synthetic_data_manifest": manifest,
        "recorded_run_manifest": recorded_manifest,
        "data_sources_registry": registry,
        "data_sources_summary": data_sources_summary(registry["sources"]),
        "public_dataset_manifest": boostr_manifest,
        "boostr_manifest": boostr_manifest,
        "fermilab_bpm_ipm_manifest": bpm_ipm_manifest,
        "public_data_status": public_data_status(),
        "latest_public_data_artifact": latest_public_data_artifact(),
        "frictionless_validation_report": frictionless_validation_report(),
        "openpmd_compatibility_manifest": openpmd_manifest,
        "workflowhub_compatibility_manifest": workflowhub_manifest,
        "decision_record_schema": decision_record_schema(),
        "platform_adapters": platform_adapters(),
        "platform_capabilities": platform_capabilities(),
        "guided_transcript": guided_transcript or [],
        "top_elog_evidence": top_elog,
        "human_diagnosis": human_diagnosis,
        "human_diagnosis_markdown": (human_diagnosis or {}).get("markdown") if isinstance(human_diagnosis, dict) else None,
        "frontend_metadata": frontend_metadata or {},
    }
    bundle["README_BUNDLE.md"] = _bundle_readme(bundle)
    bundle["ro-crate-metadata.json"] = {
        "@context": "https://w3id.org/ro/crate/1.1/context",
        "@graph": [
            {
                "@id": "./",
                "@type": "Dataset",
                "name": "Ghost Beam Evidence Bundle",
                "description": "Local synthetic evidence bundle for the Ghost Beam accelerator trust agent demo.",
                "datePublished": bundle["created_at"],
                "hasPart": [
                    {"@id": "session_export.json"},
                    {"@id": "decision_record.json"},
                    {"@id": "mission_report.json"},
                    {"@id": "human_diagnosis.md"},
                    {"@id": "benchmark.json"},
                    {"@id": "synthetic_data_manifest.json"},
                    {"@id": "data_sources_registry.json"},
                    {"@id": "boostr_manifest.json"},
                    {"@id": "fermilab_bpm_ipm_manifest.json"},
                    {"@id": "frictionless_validation_report.json"},
                    {"@id": "openpmd_compatibility_manifest.json"},
                    {"@id": "workflowhub_compatibility_manifest.json"},
                    {"@id": "decision_record.schema.json"},
                ],
            }
        ],
    }
    return bundle


def persist_evidence_bundle(bundle: dict[str, Any]) -> dict[str, Any]:
    root = bundle_root()
    root.mkdir(parents=True, exist_ok=True)
    filename = f"ghostbeam_evidence_bundle_{_slug_timestamp()}.json"
    path = root / filename
    path.write_text(json.dumps(bundle, indent=2), encoding="utf-8")
    return {
        "exported": True,
        "bundle_id": bundle["bundle_id"],
        "created_at": bundle["created_at"],
        "filename": filename,
        "path": str(path),
        "bundle": bundle,
    }
