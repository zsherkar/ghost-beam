from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPORT_SCHEMA_VERSION = "0.1.0"
SYNTHETIC_DISCLOSURE = (
    "Demo uses synthetic accelerator-control data generated from Ghost Beam's JAX digital twin. "
    "No live EPICS writes, real facility logs, or real accelerator hardware are used."
)


def report_root() -> Path:
    return Path(__file__).resolve().parents[2] / "artifacts" / "reports"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _slug_timestamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def _format_delta(action: dict[str, Any] | None) -> str:
    if not action:
        return "not recorded"
    deltas = action.get("delta_settings") or {}
    formatted = ", ".join(f"{name}={value:+.3f}" for name, value in deltas.items())
    intent = action.get("intent") or "action"
    return f"{intent} ({formatted})" if formatted else intent


def _first_entry(transcript: list[dict[str, Any]], step_index: int) -> dict[str, Any] | None:
    return next((entry for entry in transcript if entry.get("step_index") == step_index), None)


def _top_elog(latest_record: dict[str, Any] | None, evaluation: dict[str, Any] | None) -> dict[str, Any] | None:
    hits = (latest_record or {}).get("elog_hits") or []
    if hits:
        return hits[0]
    if evaluation and evaluation.get("top_elog_title"):
        return {
            "title": evaluation.get("top_elog_title"),
            "similarity": evaluation.get("top_elog_similarity"),
            "risk_tags": evaluation.get("risk_tags") or [],
            "recommended_action": None,
        }
    return None


def build_report_payload(
    guided_transcript: list[dict[str, Any]],
    latest_decision_record: dict[str, Any] | None,
    session_export: dict[str, Any] | None,
    frontend_metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    transcript = sorted(guided_transcript, key=lambda entry: int(entry.get("step_index", 0)))
    initial = _first_entry(transcript, 0)
    naive = _first_entry(transcript, 2)
    evaluation = _first_entry(transcript, 3)
    calibration = _first_entry(transcript, 4)
    safer = _first_entry(transcript, 5)
    final_decision = next((entry for entry in reversed(transcript) if entry.get("decision")), safer or evaluation)
    scenario_ids = sorted({entry["scenario_id"] for entry in transcript if entry.get("scenario_id")})
    top_elog = _top_elog(latest_decision_record, evaluation)
    state = (session_export or {}).get("state") or {}
    beam_truth = state.get("beam_truth") or {}
    report_id = f"GBR-{_slug_timestamp()}"
    created_at = _now()
    executive_summary = (
        "Ghost Beam blocked or held the naive quadrupole correction because the virtual diagnostic was outside "
        "its trusted envelope or operator memory warned against that action class. After one synthetic calibration "
        "measurement, Ghost Beam evaluated a smaller RF correction and preserved the audit trail as a backend "
        "mission-report artifact."
    )
    report = {
        "report_id": report_id,
        "schema_version": REPORT_SCHEMA_VERSION,
        "demo_title": "Drifted Twin Test",
        "created_at": created_at,
        "scenario_ids_used": scenario_ids,
        "synthetic_data_disclosure": SYNTHETIC_DISCLOSURE,
        "executive_summary": executive_summary,
        "initial_trust_metrics": initial,
        "naive_proposal": naive.get("proposed_action") if naive else None,
        "naive_projected_outcome": (latest_decision_record or {}).get("simulated_outcome_if_applied"),
        "ghost_beam_decision": evaluation,
        "top_elog_match": {
            "title": top_elog.get("title"),
            "similarity": top_elog.get("similarity"),
            "risk_tags": top_elog.get("risk_tags") or [],
            "recommendation": top_elog.get("recommended_action"),
        } if top_elog else None,
        "calibration_event": calibration,
        "post_calibration_metrics": calibration or safer,
        "safer_action": safer.get("proposed_action") if safer else None,
        "final_decision": final_decision,
        "final_beam_metrics": {
            "beam_quality": beam_truth.get("beam_quality"),
            "beam_size_x": beam_truth.get("beam_size_x"),
            "beam_size_y": beam_truth.get("beam_size_y"),
            "beam_loss": beam_truth.get("beam_loss"),
        } if beam_truth else None,
        "decision_record_ids": sorted({
            entry["decision_record_id"] for entry in transcript if entry.get("decision_record_id")
        }),
        "transcript": transcript,
        "frontend_metadata": frontend_metadata or {},
        "human_diagnosis": (frontend_metadata or {}).get("human_diagnosis"),
        "report_source": "backend artifact",
        "disclosures": {
            "real_epics": False,
            "real_facility_logs": False,
            "real_hardware_writes": False,
            "paid_services": False,
        },
    }
    return report


def report_to_markdown(report: dict[str, Any]) -> str:
    top = report.get("top_elog_match") or {}
    final = report.get("final_decision") or {}
    diagnosis = report.get("human_diagnosis") or {}
    lines = [
        f"# Ghost Beam Mission Report: {report['demo_title']}",
        "",
        f"Report ID: `{report['report_id']}`",
        f"Created: {report['created_at']}",
        "",
        "## Executive Summary",
        "",
        report["executive_summary"],
        "",
        f"> {report['synthetic_data_disclosure']}",
        "",
        "## Key Results",
        "",
        f"- Scenarios used: {', '.join(report.get('scenario_ids_used') or []) or 'not recorded'}",
        f"- Initial OOD score: {(report.get('initial_trust_metrics') or {}).get('ood_score', 'not recorded')}",
        f"- Naive action: {_format_delta(report.get('naive_proposal'))}",
        f"- Ghost Beam decision: {(report.get('ghost_beam_decision') or {}).get('decision', 'not recorded')}",
        f"- Top eLog match: {top.get('title', 'not recorded')} ({top.get('similarity', 'not recorded')})",
        f"- Risk tags: {', '.join(top.get('risk_tags') or []) or 'not recorded'}",
        f"- Post-calibration OOD score: {(report.get('post_calibration_metrics') or {}).get('ood_score', 'not recorded')}",
        f"- Safer action: {_format_delta(report.get('safer_action'))}",
        f"- Final decision: {final.get('decision', 'not recorded')}",
        "",
        "## Ghost Beam Diagnosis",
        "",
        diagnosis.get("summary", "Diagnosis summary was not provided."),
        "",
        "### What Ghost Beam Did",
        "",
    ]
    for index, item in enumerate(diagnosis.get("timeline") or [], start=1):
        lines.append(f"{index}. **{item.get('title', 'Step')}** - {item.get('detail', '')}")
    lines.extend(
        [
            "",
            "## Guided Transcript",
            "",
        ]
    )
    for entry in report.get("transcript") or []:
        lines.extend(
            [
                f"### {int(entry.get('step_index', 0)) + 1}. {entry.get('title', 'Step')}",
                "",
                f"- Endpoint: `{entry.get('endpoint_called', 'not recorded')}`",
                f"- Scenario: {entry.get('scenario_id', 'not recorded')}",
                f"- Decision: {entry.get('decision', 'not evaluated')}",
                f"- OOD: {entry.get('ood_score', 'not recorded')}",
                f"- Trust: {entry.get('trust_state', 'not recorded')} ({entry.get('trust_score', 'not recorded')})",
                f"- Top eLog: {entry.get('top_elog_title', 'none')}",
                f"- Note: {entry.get('note', '')}",
                "",
            ]
        )
    return "\n".join(lines)


def persist_report(report: dict[str, Any]) -> dict[str, Any]:
    root = report_root()
    root.mkdir(parents=True, exist_ok=True)
    timestamp = _slug_timestamp()
    json_name = f"ghostbeam_drifted_twin_report_{timestamp}.json"
    md_name = f"ghostbeam_drifted_twin_report_{timestamp}.md"
    json_path = root / json_name
    markdown_path = root / md_name
    markdown = report_to_markdown(report)
    json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    markdown_path.write_text(markdown, encoding="utf-8")
    return {
        "report_id": report["report_id"],
        "created_at": report["created_at"],
        "report_source": "backend artifact",
        "json": report,
        "markdown": markdown,
        "filename_suggestions": {
            "json": json_name,
            "markdown": md_name,
        },
        "paths": {
            "json": str(json_path),
            "markdown": str(markdown_path),
        },
    }


def generate_and_persist_report(
    guided_transcript: list[dict[str, Any]],
    latest_decision_record: dict[str, Any] | None,
    session_export: dict[str, Any] | None,
    frontend_metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    report = build_report_payload(guided_transcript, latest_decision_record, session_export, frontend_metadata)
    return persist_report(report)


def latest_report() -> dict[str, Any] | None:
    root = report_root()
    if not root.exists():
        return None
    candidates = sorted(root.glob("ghostbeam_drifted_twin_report_*.json"), key=lambda item: item.stat().st_mtime, reverse=True)
    if not candidates:
        return None
    return json.loads(candidates[0].read_text(encoding="utf-8"))


def get_report(report_id: str) -> dict[str, Any] | None:
    root = report_root()
    if not root.exists():
        return None
    for path in root.glob("ghostbeam_drifted_twin_report_*.json"):
        payload = json.loads(path.read_text(encoding="utf-8"))
        if payload.get("report_id") == report_id:
            return payload
    return None
