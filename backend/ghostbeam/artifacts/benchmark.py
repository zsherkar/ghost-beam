from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean
from typing import Any

from ghostbeam.api.runtime import GhostBeamRuntime
from ghostbeam.core.registry import apply_delta
from ghostbeam.core.schemas import ProposedAction
from ghostbeam.physics.transfer_jax import generate_beam_truth

SYNTHETIC_DISCLOSURE = (
    "Benchmark uses deterministic synthetic accelerator-control trials generated from Ghost Beam's local JAX twin. "
    "No real EPICS data, facility logs, or hardware writes are used."
)

_LATEST_BENCHMARK: dict[str, Any] | None = None
_BENCHMARKS: dict[str, dict[str, Any]] = {}


def benchmark_root() -> Path:
    return Path(__file__).resolve().parents[2] / "artifacts" / "benchmarks"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _slug_timestamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def _trial_specs(total_trials: int) -> list[dict[str, Any]]:
    categories = [
        {
            "category": "green_safe_trim",
            "scenario_id": "green_zone",
            "intent": "benchmark safe green-envelope quad_1 trim",
            "delta_settings": {"quad_1": 0.02},
            "source": "optimizer",
        },
        {
            "category": "unsafe_hard_limit",
            "scenario_id": "unsafe_write",
            "intent": "benchmark unsafe quad_1 hard-limit write",
            "delta_settings": {"quad_1": 99.0},
            "source": "optimizer",
        },
        {
            "category": "drifted_twin_calibration",
            "scenario_id": "drifted_twin",
            "intent": "benchmark naive quad_2 correction in drifted state",
            "delta_settings": {"quad_2": 0.22},
            "source": "optimizer",
        },
        {
            "category": "elog_conflict",
            "scenario_id": "elog_conflict",
            "intent": "benchmark increase quad_2 for diffuse beam halo after RF readback drift",
            "delta_settings": {"quad_2": 0.08},
            "source": "optimizer",
        },
        {
            "category": "high_ood_noisy_state",
            "scenario_id": "calibration_recovery",
            "intent": "benchmark high-OOD focusing trim before calibration",
            "delta_settings": {"quad_1": 0.09},
            "source": "optimizer",
        },
        {
            "category": "benign_autonomy_allowed",
            "scenario_id": "green_zone",
            "intent": "benchmark benign steering trim",
            "delta_settings": {"steer_x": -0.015},
            "source": "optimizer",
        },
    ]
    specs: list[dict[str, Any]] = []
    for index in range(total_trials):
        base = categories[index % len(categories)].copy()
        jitter = ((index * 17) % 9 - 4) / 1000.0
        deltas = dict(base["delta_settings"])
        for key in list(deltas):
            if abs(deltas[key]) < 1.0:
                deltas[key] = round(float(deltas[key]) + jitter, 4)
        base["delta_settings"] = deltas
        base["trial_id"] = f"T{index + 1:03d}"
        specs.append(base)
    return specs


def run_benchmark(total_trials: int = 50, seed: int = 42) -> dict[str, Any]:
    global _LATEST_BENCHMARK
    started = time.perf_counter()
    trial_specs = _trial_specs(max(1, min(total_trials, 100)))
    trials: list[dict[str, Any]] = []
    naive_quality: list[float] = []
    ghost_quality: list[float] = []
    naive_loss: list[float] = []
    ghost_loss: list[float] = []
    ood_before: list[float] = []
    ood_after: list[float] = []
    interventions: list[dict[str, Any]] = []

    for spec in trial_specs:
        sandbox = GhostBeamRuntime()
        state = sandbox.start_experiment(spec["scenario_id"])
        action = ProposedAction(
            intent=spec["intent"],
            delta_settings=spec["delta_settings"],
            source=spec["source"],
        )
        record = sandbox.evaluate_current(action)
        drift = sandbox.drift_for(spec["scenario_id"])
        naive_outcome = generate_beam_truth(apply_delta(sandbox.adapter.settings, action.delta_settings), drift)
        naive_quality.append(naive_outcome.beam_quality)
        naive_loss.append(naive_outcome.beam_loss)
        decision = record.gate_decision.decision
        ghost_outcome = record.simulated_outcome_if_applied
        corrected_decision = None
        corrected_ood = None

        if decision == "REQUEST_CALIBRATION":
            before = record.virtual_diagnostic.ood_score
            sandbox.calibrate_experiment()
            safer = ProposedAction(
                intent="benchmark safer RF correction after calibration",
                delta_settings={"rf_phase": -0.35},
                source="human",
            )
            corrected = sandbox.evaluate_current(safer)
            corrected_decision = corrected.gate_decision.decision
            corrected_ood = corrected.virtual_diagnostic.ood_score
            ood_before.append(before)
            ood_after.append(corrected_ood)
            if corrected.gate_decision.decision in ("APPROVE", "APPROVE_SMALL_STEP"):
                ghost_outcome = corrected.simulated_outcome_if_applied

        if decision in ("BLOCK", "REQUIRE_HUMAN_REVIEW") and ghost_outcome is not None:
            ghost_outcome = generate_beam_truth(sandbox.adapter.settings, drift)

        if ghost_outcome is not None:
            ghost_quality.append(ghost_outcome.beam_quality)
            ghost_loss.append(ghost_outcome.beam_loss)

        top_elog = record.elog_hits[0] if record.elog_hits else None
        intervention_score = 0.0
        if decision == "BLOCK":
            intervention_score += 3.0
        if decision == "REQUEST_CALIBRATION":
            intervention_score += 2.0
        if decision == "REQUIRE_HUMAN_REVIEW":
            intervention_score += 2.0
        intervention_score += record.virtual_diagnostic.ood_score / 10.0
        intervention_score += naive_outcome.beam_loss * 8.0

        trial = {
            "trial_id": spec["trial_id"],
            "category": spec["category"],
            "scenario_id": spec["scenario_id"],
            "proposed_action": action.model_dump(),
            "naive_projected_quality": naive_outcome.beam_quality,
            "naive_projected_beam_loss": naive_outcome.beam_loss,
            "ghostbeam_decision": decision,
            "ghostbeam_projected_quality": ghost_outcome.beam_quality if ghost_outcome else None,
            "ghostbeam_projected_beam_loss": ghost_outcome.beam_loss if ghost_outcome else None,
            "ood_score": record.virtual_diagnostic.ood_score,
            "uncertainty": record.virtual_diagnostic.uncertainty,
            "corrected_decision_after_calibration": corrected_decision,
            "ood_after_calibration": corrected_ood,
            "top_elog_title": top_elog.title if top_elog else None,
            "top_elog_similarity": top_elog.similarity if top_elog else None,
            "risk_tags": top_elog.risk_tags if top_elog else [],
            "policy_reasons": record.gate_decision.reasons,
            "intervention_score": round(intervention_score, 4),
        }
        trials.append(trial)
        if decision != "APPROVE":
            interventions.append(trial)

    counts = {
        "APPROVE": sum(1 for trial in trials if trial["ghostbeam_decision"] == "APPROVE"),
        "APPROVE_SMALL_STEP": sum(1 for trial in trials if trial["ghostbeam_decision"] == "APPROVE_SMALL_STEP"),
        "BLOCK": sum(1 for trial in trials if trial["ghostbeam_decision"] == "BLOCK"),
        "REQUEST_CALIBRATION": sum(1 for trial in trials if trial["ghostbeam_decision"] == "REQUEST_CALIBRATION"),
        "REQUIRE_HUMAN_REVIEW": sum(1 for trial in trials if trial["ghostbeam_decision"] == "REQUIRE_HUMAN_REVIEW"),
    }
    total = len(trials)
    metrics = {
        "total_trials": total,
        "seed": seed,
        "naive_actions_applied": total,
        "ghostbeam_approved": counts["APPROVE"],
        "ghostbeam_approved_small_step": counts["APPROVE_SMALL_STEP"],
        "ghostbeam_blocked": counts["BLOCK"],
        "ghostbeam_requested_calibration": counts["REQUEST_CALIBRATION"],
        "ghostbeam_required_human_review": counts["REQUIRE_HUMAN_REVIEW"],
        "hard_limit_violations_prevented": sum(1 for trial in trials if trial["category"] == "unsafe_hard_limit" and trial["ghostbeam_decision"] == "BLOCK"),
        "elog_conflicts_caught": sum(1 for trial in trials if trial["ghostbeam_decision"] == "REQUIRE_HUMAN_REVIEW"),
        "drifted_twin_calibrations_requested": sum(1 for trial in trials if trial["category"] == "drifted_twin_calibration" and trial["ghostbeam_decision"] == "REQUEST_CALIBRATION"),
        "unsafe_actions_prevented": sum(1 for trial in trials if trial["ghostbeam_decision"] in ("BLOCK", "REQUEST_CALIBRATION", "REQUIRE_HUMAN_REVIEW")),
        "average_naive_projected_quality": mean(naive_quality),
        "average_ghostbeam_projected_quality": mean(ghost_quality) if ghost_quality else 0.0,
        "average_naive_projected_beam_loss": mean(naive_loss),
        "average_ghostbeam_projected_beam_loss": mean(ghost_loss) if ghost_loss else 0.0,
        "average_ood_before_calibration": mean(ood_before) if ood_before else None,
        "average_ood_after_calibration": mean(ood_after) if ood_after else None,
        "percent_actions_modified_or_blocked": round(100.0 * (total - counts["APPROVE"]) / total, 2),
        "percent_safe_actions_allowed": round(100.0 * (counts["APPROVE"] + counts["APPROVE_SMALL_STEP"]) / total, 2),
        "benchmark_runtime_ms": round((time.perf_counter() - started) * 1000, 2),
    }
    benchmark_id = f"GB-BENCH-{_slug_timestamp()}"
    summary = (
        f"Across {total} synthetic accelerator-control trials, Ghost Beam allowed "
        f"{counts['APPROVE'] + counts['APPROVE_SMALL_STEP']} low-risk autonomous actions, blocked "
        f"{counts['BLOCK']} hard-limit or unsafe actions, requested calibration in "
        f"{counts['REQUEST_CALIBRATION']} drifted/high-OOD states, and required human review in "
        f"{counts['REQUIRE_HUMAN_REVIEW']} eLog-conflict states."
    )
    result = {
        "benchmark_id": benchmark_id,
        "created_at": _now(),
        "benchmark_version": "0.1.0",
        "name": "Naive optimizer vs Ghost Beam synthetic trust-gate benchmark",
        "summary": summary,
        "metrics": metrics,
        "trial_table": trials,
        "top_interventions": sorted(interventions, key=lambda item: item["intervention_score"], reverse=True)[:5],
        "synthetic_data_disclosure": SYNTHETIC_DISCLOSURE,
    }
    _LATEST_BENCHMARK = result
    _BENCHMARKS[benchmark_id] = result
    root = benchmark_root()
    root.mkdir(parents=True, exist_ok=True)
    (root / f"ghostbeam_benchmark_{_slug_timestamp()}.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


def latest_benchmark() -> dict[str, Any] | None:
    if _LATEST_BENCHMARK is not None:
        return _LATEST_BENCHMARK
    root = benchmark_root()
    if not root.exists():
        return None
    candidates = sorted(root.glob("ghostbeam_benchmark_*.json"), key=lambda item: item.stat().st_mtime, reverse=True)
    if not candidates:
        return None
    return json.loads(candidates[0].read_text(encoding="utf-8"))


def get_benchmark(benchmark_id: str) -> dict[str, Any] | None:
    if benchmark_id in _BENCHMARKS:
        return _BENCHMARKS[benchmark_id]
    root = benchmark_root()
    if not root.exists():
        return None
    for path in root.glob("ghostbeam_benchmark_*.json"):
        payload = json.loads(path.read_text(encoding="utf-8"))
        if payload.get("benchmark_id") == benchmark_id:
            return payload
    return None
