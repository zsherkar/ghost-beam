from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ghostbeam.artifacts.benchmark import latest_benchmark
from ghostbeam.artifacts.decision_record import decision_record_schema
from ghostbeam.artifacts.mission_report import latest_report
from ghostbeam.api.routes_platform import platform_adapters, platform_capabilities

SYNTHETIC_DISCLOSURE = (
    "Evidence bundle uses synthetic Ghost Beam data only. No real EPICS, real accelerator hardware, "
    "real facility eLogs, personal data, paid APIs, or external uploads are included."
)


def bundle_root() -> Path:
    return Path(__file__).resolve().parents[2] / "artifacts" / "evidence_bundles"


def data_manifest_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "synthetic_data_manifest.json"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _slug_timestamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def _bundle_readme(bundle: dict[str, Any]) -> str:
    latest_decision = ((bundle.get("latest_decision_record") or {}).get("gate_decision") or {}).get("decision", "not recorded")
    benchmark = bundle.get("latest_benchmark") or {}
    benchmark_summary = benchmark.get("summary", "Benchmark has not been run yet.")
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
            "- Latest DecisionRecord JSON",
            "- Latest Mission Report JSON and Markdown when available",
            "- Latest naive-vs-Ghost-Beam benchmark result when available",
            "- Synthetic data manifest",
            "- DecisionRecord JSON schema",
            "- Platform adapter/capability status",
            "- Guided transcript and top eLog evidence when available",
            "",
            "## Current Decision",
            "",
            f"- Latest Ghost Beam decision: `{latest_decision}`",
            "",
            "## Benchmark Summary",
            "",
            benchmark_summary,
            "",
            "## Synthetic Data Disclosure",
            "",
            SYNTHETIC_DISCLOSURE,
        ]
    )


def build_evidence_bundle(
    session_export: dict[str, Any],
    guided_transcript: list[dict[str, Any]] | None = None,
    frontend_metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    manifest = json.loads(data_manifest_path().read_text(encoding="utf-8")) if data_manifest_path().exists() else None
    state = session_export.get("state") or {}
    latest_decision = state.get("latest_decision_record")
    top_elog = (latest_decision or {}).get("elog_hits", [])[:3]
    mission = latest_report()
    benchmark = latest_benchmark()
    bundle = {
        "bundle_id": f"GB-BUNDLE-{_slug_timestamp()}",
        "created_at": _now(),
        "bundle_version": "0.1.0",
        "synthetic_data_disclosure": SYNTHETIC_DISCLOSURE,
        "session_export": session_export,
        "latest_decision_record": latest_decision,
        "latest_mission_report": mission,
        "latest_benchmark": benchmark,
        "synthetic_data_manifest": manifest,
        "decision_record_schema": decision_record_schema(),
        "platform_adapters": platform_adapters(),
        "platform_capabilities": platform_capabilities(),
        "guided_transcript": guided_transcript or [],
        "top_elog_evidence": top_elog,
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
                    {"@id": "benchmark.json"},
                    {"@id": "synthetic_data_manifest.json"},
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
