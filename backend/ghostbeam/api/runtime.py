from __future__ import annotations

from pathlib import Path
from typing import Any
from datetime import datetime, timezone
import csv
import json

import yaml

from ghostbeam.adapters.simulated_epics import SimulatedEPICS
from ghostbeam.artifacts.decision_record import enrich_record, validate_decision_record, DECISION_RECORD_SCHEMA_VERSION
from ghostbeam.control.optimizer import propose_local_search_action
from ghostbeam.control.policy_gate import evaluate_policy
from ghostbeam.core.registry import DEFAULT_SETTINGS, SETTING_LIMITS, apply_delta, limit_violations
from ghostbeam.core.schemas import DecisionRecord, MachineSettings, ProposedAction
from ghostbeam.diagnostics.virtual_diagnostic import get_default_diagnostic
from ghostbeam.diagnostics.vision import analyze_beam_image
from ghostbeam.memory.retrieval import build_elog_query, retrieve_elogs
from ghostbeam.physics.calibration import calibration_measurement
from ghostbeam.physics.transfer_jax import generate_beam_image, generate_beam_truth, generate_safe_signals, propagate


def scenario_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "scenarios"


def recorded_runs_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "recorded_runs"


def list_scenarios() -> list[dict[str, str]]:
    scenarios: list[dict[str, str]] = []
    for path in sorted(scenario_dir().glob("*.yaml")):
        data = load_scenario(path.stem)
        scenarios.append(
            {
                "scenario_id": data["scenario_id"],
                "description": data.get("description", ""),
                "expected_behavior": data.get("expected_behavior", ""),
            }
        )
    return scenarios


def load_scenario(scenario_id: str) -> dict[str, Any]:
    path = scenario_dir() / f"{scenario_id}.yaml"
    if not path.exists():
        raise KeyError(f"unknown scenario_id {scenario_id}")
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def scenario_settings(data: dict[str, Any]) -> MachineSettings:
    return MachineSettings(**data["current_settings"])


def scenario_action(data: dict[str, Any]) -> ProposedAction:
    return ProposedAction(**data["proposed_action"])


def list_recorded_runs() -> list[dict[str, Any]]:
    runs: list[dict[str, Any]] = []
    for path in sorted(recorded_runs_dir().glob("*_manifest.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        runs.append(
            {
                "run_id": data["run_id"],
                "title": data.get("title", data["run_id"]),
                "description": data.get("description", ""),
                "source": data.get("source", "recorded_fixture"),
                "disclosure": data.get("disclosure", ""),
                "steps": data.get("steps", 0),
                "manifest_path": str(path),
            }
        )
    return runs


def load_recorded_manifest(run_id: str) -> dict[str, Any]:
    path = recorded_runs_dir() / f"{run_id}_manifest.json"
    if not path.exists():
        raise KeyError(f"unknown recorded run_id {run_id}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_recorded_rows(run_id: str) -> list[dict[str, str]]:
    path = recorded_runs_dir() / f"{run_id}.csv"
    if not path.exists():
        raise KeyError(f"recorded run rows not found for {run_id}")
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def load_recorded_elogs(run_id: str) -> list[dict[str, Any]]:
    path = recorded_runs_dir() / f"{run_id}_elogs.csv"
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as handle:
        rows: list[dict[str, Any]] = []
        for row in csv.DictReader(handle):
            rows.append(
                {
                    **row,
                    "risk_tags": [
                        item.strip()
                        for item in str(row.get("risk_tags", "")).split(";")
                        if item.strip()
                    ],
                }
            )
        return rows


def recorded_settings(row: dict[str, str]) -> MachineSettings:
    return MachineSettings(
        quad_1=float(row["quad_1"]),
        quad_2=float(row["quad_2"]),
        steer_x=float(row["steer_x"]),
        steer_y=float(row["steer_y"]),
        rf_phase=float(row["rf_phase"]),
        rf_amplitude=float(row["rf_amplitude"]),
    )


def recorded_action(row: dict[str, str]) -> ProposedAction:
    event_type = row.get("event_type", "")
    if event_type == "naive_proposal":
        return ProposedAction(
            intent="recorded naive quadrupole correction from trace",
            source="scenario",
            delta_settings={"quad_2": 0.22},
        )
    if event_type == "safer_correction":
        return ProposedAction(
            intent="recorded safer RF correction after calibration",
            source="scenario",
            delta_settings={"rf_phase": -0.35, "quad_2": 0.03},
        )
    if event_type == "unsafe_probe":
        return ProposedAction(
            intent="recorded unsafe hard-limit probe",
            source="scenario",
            delta_settings={"quad_1": 99.0},
        )
    return ProposedAction(
        intent="recorded trace monitor evaluation",
        source="scenario",
        delta_settings={},
    )


class GhostBeamRuntime:
    def __init__(self):
        self.adapter = SimulatedEPICS(DEFAULT_SETTINGS)
        self.current_scenario_id = "green_zone"
        self.latest_record: DecisionRecord | None = None
        self.latest_record_id: str | None = None
        self.latest_proposed_action: ProposedAction | None = None
        self.calibration_weights: dict[str, float] = {}
        self.history: list[dict[str, Any]] = []
        self.step_number = 0
        self.records: dict[str, DecisionRecord] = {}
        self.data_source = "synthetic_live_twin"
        self.recorded_run_id: str | None = None
        self.recorded_step: int | None = None
        self.recorded_manifest: dict[str, Any] | None = None

    def load(self, scenario_id: str) -> dict[str, Any]:
        data = load_scenario(scenario_id)
        self.current_scenario_id = scenario_id
        self.data_source = "synthetic_live_twin"
        self.recorded_run_id = None
        self.recorded_step = None
        self.recorded_manifest = None
        settings = scenario_settings(data)
        self.adapter = SimulatedEPICS(settings)
        return {
            "scenario_id": scenario_id,
            "description": data.get("description", ""),
            "drift": float(data.get("drift", 0.0)),
            "current_settings": settings.model_dump(),
            "proposed_action": scenario_action(data).model_dump(),
            "expected_behavior": data.get("expected_behavior", ""),
        }

    def drift_for(self, scenario_id: str) -> float:
        try:
            return float(load_scenario(scenario_id).get("drift", 0.0))
        except KeyError:
            return 0.0

    def calibration_weight(self, scenario_id: str) -> float:
        return float(self.calibration_weights.get(scenario_id, 0.0))

    def evaluate(
        self,
        scenario_id: str,
        settings: MachineSettings,
        proposed_action: ProposedAction,
    ) -> DecisionRecord:
        drift = self.drift_for(scenario_id)
        calibration_weight = self.calibration_weight(scenario_id)
        safe = generate_safe_signals(settings, drift)
        diagnostic_model = get_default_diagnostic()
        virtual = diagnostic_model.predict(settings, safe, drift=drift, calibration_weight=calibration_weight)
        image = generate_beam_image(settings, drift)
        vision = analyze_beam_image(image)
        query = build_elog_query(proposed_action, virtual, vision)
        hits = retrieve_elogs(query, top_k=3)
        gate = evaluate_policy(settings, proposed_action, virtual, vision, hits)
        simulated_outcome = generate_beam_truth(apply_delta(settings, proposed_action.delta_settings), drift)
        record = DecisionRecord(
            scenario_id=scenario_id,
            current_settings=settings,
            safe_signals=safe,
            proposed_action=proposed_action,
            virtual_diagnostic=virtual,
            vision_diagnostic=vision,
            elog_hits=hits,
            gate_decision=gate,
            simulated_outcome_if_applied=simulated_outcome,
        )
        self.latest_record = record
        return record

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")

    def _append_event(self, kind: str, title: str, payload: dict[str, Any] | None = None) -> None:
        self.history.append(
            {
                "step": self.step_number,
                "timestamp": self._now(),
                "kind": kind,
                "title": title,
                "payload": payload or {},
            }
        )

    def _record_id(self) -> str:
        return f"DR-{len(self.records) + 1:04d}"

    def _store_record(self, record: DecisionRecord) -> str:
        record_id = self._record_id()
        self.records[record_id] = record
        self.latest_record = record
        self.latest_record_id = record_id
        return record_id

    def _current_drift(self) -> float:
        return self.drift_for(self.current_scenario_id)

    def _beam_trajectory(self, settings: MachineSettings | None = None) -> list[list[float]]:
        current = settings or self.adapter.settings
        metrics = propagate(current, self._current_drift())
        points: list[list[float]] = []
        for index in range(15):
            t = index / 14.0
            z = -4.8 + 9.6 * t
            x = float(metrics["x"]) * 9.0 * (0.15 + 0.85 * t) + 0.05 * current.steer_x * t
            y = float(metrics["y"]) * 9.0 * (0.15 + 0.85 * t) + 0.05 * current.steer_y * t
            x += 0.035 * float(current.quad_1 - current.quad_2) * (t - 0.5) ** 2
            points.append([x, y, z])
        return points

    def _device_registry(self) -> list[dict[str, Any]]:
        settings = self.adapter.settings
        device_specs = [
            ("Q7FF1", "quadrupole", "quad_1", "T/m", [0.0, 0.0, -3.35]),
            ("Q7FF2", "quadrupole", "quad_2", "T/m", [0.0, 0.0, -1.55]),
            ("STEER07-X", "steerer", "steer_x", "mrad", [0.0, 0.0, -0.55]),
            ("STEER07-Y", "steerer", "steer_y", "mrad", [0.0, 0.0, 0.35]),
            ("RFCAV07", "rf_cavity", "rf_phase", "deg", [0.0, 0.0, 1.3]),
            ("BPM07-06", "bpm", "bpm_x_2", "mm", [0.0, 0.0, 2.55]),
            ("BCM07-03", "bcm", "beam_current_proxy", "a.u.", [0.0, 0.0, 3.55]),
            ("OTR07", "diagnostic_screen", "beam_quality", "a.u.", [0.0, 0.0, 4.55]),
        ]
        safe = generate_safe_signals(settings, self._current_drift())
        truth = generate_beam_truth(settings, self._current_drift())
        payload: list[dict[str, Any]] = []
        for device_id, device_type, pv, fallback_unit, position in device_specs:
            if hasattr(settings, pv):
                value = float(getattr(settings, pv))
                limit = SETTING_LIMITS.get(pv)
                payload.append(
                    {
                        "id": device_id,
                        "type": device_type,
                        "pv": pv,
                        "value": value,
                        "unit": limit.units if limit else fallback_unit,
                        "min": limit.minimum if limit else None,
                        "max": limit.maximum if limit else None,
                        "max_delta": limit.max_delta_without_approval if limit else None,
                        "position": position,
                    }
                )
                continue
            source = safe if hasattr(safe, pv) else truth
            payload.append(
                {
                    "id": device_id,
                    "type": device_type,
                    "pv": pv,
                    "value": float(getattr(source, pv)),
                    "unit": fallback_unit,
                    "min": None,
                    "max": None,
                    "max_delta": None,
                    "position": position,
                }
            )
        return payload

    def experiment_state(self) -> dict[str, Any]:
        settings = self.adapter.settings
        drift = self._current_drift()
        safe = generate_safe_signals(settings, drift)
        truth = generate_beam_truth(settings, drift)
        image = generate_beam_image(settings, drift, size=32)
        latest_record = self.latest_record
        return {
            "scenario_id": self.current_scenario_id,
            "data_source": self.data_source,
            "recorded_run_id": self.recorded_run_id,
            "recorded_step": self.recorded_step,
            "recorded_manifest": self.recorded_manifest,
            "step_number": self.step_number,
            "drift": drift,
            "calibration_freshness": self.calibration_weight(self.current_scenario_id),
            "current_settings": settings.model_dump(),
            "safe_signals": safe.model_dump(),
            "beam_truth": truth.model_dump(),
            "latest_proposed_action": self.latest_proposed_action.model_dump() if self.latest_proposed_action else None,
            "latest_decision_record_id": self.latest_record_id,
            "latest_decision_record": latest_record.model_dump() if latest_record else None,
            "latest_diagnostic": latest_record.virtual_diagnostic.model_dump() if latest_record else None,
            "latest_vision_diagnostic": latest_record.vision_diagnostic.model_dump() if latest_record else None,
            "latest_elog_hits": [hit.model_dump() for hit in latest_record.elog_hits] if latest_record else [],
            "latest_gate_decision": latest_record.gate_decision.model_dump() if latest_record else None,
            "history": self.history[-80:],
            "trajectory": self._beam_trajectory(settings),
            "beam_profile": image.tolist(),
            "device_registry": self._device_registry(),
        }

    def start_experiment(self, scenario_id: str) -> dict[str, Any]:
        loaded = self.load(scenario_id)
        self.calibration_weights[scenario_id] = 0.0
        self.step_number = 0
        self.history = []
        self.records = {}
        self.latest_record_id = None
        self.latest_record = None
        self.latest_proposed_action = scenario_action(load_scenario(scenario_id))
        self._append_event(
            "scenario_start",
            f"Started {scenario_id}",
            {
                "description": loaded.get("description", ""),
                "expected_behavior": loaded.get("expected_behavior", ""),
            },
        )
        record = self.evaluate_current(self.latest_proposed_action, append_history=False)
        self._append_event(
            "evaluate",
            f"Initial Ghost Beam evaluation: {record.gate_decision.decision}",
            {"decision_record_id": self.latest_record_id, "decision": record.gate_decision.decision},
        )
        return self.experiment_state()

    def _recorded_row_by_step(self, run_id: str, step: int) -> tuple[dict[str, Any], dict[str, str]]:
        manifest = load_recorded_manifest(run_id)
        rows = load_recorded_rows(run_id)
        if not rows:
            raise KeyError(f"recorded run {run_id} has no rows")
        selected = next((row for row in rows if int(row["step"]) == int(step)), rows[0])
        return manifest, selected

    def load_recorded_run(self, run_id: str) -> dict[str, Any]:
        manifest, row = self._recorded_row_by_step(run_id, 0)
        scenario_id = str(manifest.get("scenario_id", "drifted_twin"))
        self.current_scenario_id = scenario_id
        self.data_source = "recorded_fixture"
        self.recorded_run_id = run_id
        self.recorded_step = int(row["step"])
        self.recorded_manifest = manifest
        self.adapter = SimulatedEPICS(recorded_settings(row))
        self.calibration_weights[scenario_id] = float(manifest.get("calibration_weight", 0.0))
        self.step_number = int(row["step"])
        self.history = []
        self.records = {}
        self.latest_record_id = None
        self.latest_record = None
        self.latest_proposed_action = recorded_action(row)
        self._append_event(
            "recorded_run_load",
            f"Loaded recorded fixture {run_id}",
            {
                "run_id": run_id,
                "step": self.recorded_step,
                "source": "recorded_fixture",
                "disclosure": manifest.get("disclosure", ""),
                "note": row.get("note", ""),
            },
        )
        record = self.evaluate_current(self.latest_proposed_action, append_history=False)
        self._append_event(
            "evaluate",
            f"Recorded fixture evaluation: {record.gate_decision.decision}",
            {"decision_record_id": self.latest_record_id, "decision": record.gate_decision.decision},
        )
        return {
            "run_id": run_id,
            "loaded_step": self.recorded_step,
            "manifest": manifest,
            "available_steps": [int(item["step"]) for item in load_recorded_rows(run_id)],
            "recorded_elogs": load_recorded_elogs(run_id),
            "state": self.experiment_state(),
        }

    def evaluate_recorded_step(self, run_id: str, step: int) -> dict[str, Any]:
        manifest, row = self._recorded_row_by_step(run_id, step)
        scenario_id = str(manifest.get("scenario_id", "drifted_twin"))
        self.current_scenario_id = scenario_id
        self.data_source = "recorded_fixture"
        self.recorded_run_id = run_id
        self.recorded_step = int(row["step"])
        self.recorded_manifest = manifest
        self.adapter = SimulatedEPICS(recorded_settings(row))
        self.step_number = int(row["step"])
        action = recorded_action(row)
        record = self.evaluate_current(action, append_history=True)
        self._append_event(
            "recorded_step",
            f"Evaluated recorded fixture step {self.recorded_step}",
            {
                "run_id": run_id,
                "event_type": row.get("event_type", ""),
                "note": row.get("note", ""),
                "decision_record_id": self.latest_record_id,
            },
        )
        return {
            "run_id": run_id,
            "step": self.recorded_step,
            "row": row,
            "manifest": manifest,
            "recorded_elogs": load_recorded_elogs(run_id),
            "decision_record_id": self.latest_record_id,
            "decision_record": record.model_dump(),
            "state": self.experiment_state(),
            "disclosure": manifest.get("disclosure", ""),
        }

    def propose_experiment_action(
        self,
        intent: str = "improve beam quality",
        source: str = "optimizer",
        delta_settings: dict[str, float] | None = None,
    ) -> ProposedAction:
        if delta_settings is None:
            action = self.propose(self.adapter.settings, intent=intent, scenario_id=self.current_scenario_id)
        else:
            action = ProposedAction(intent=intent, delta_settings=delta_settings, source=source)  # type: ignore[arg-type]
        self.latest_proposed_action = action
        self._append_event("propose", f"Proposed action from {action.source}", action.model_dump())
        return action

    def evaluate_current(self, proposed_action: ProposedAction, append_history: bool = True) -> DecisionRecord:
        self.latest_proposed_action = proposed_action
        record = self.evaluate(self.current_scenario_id, self.adapter.settings, proposed_action)
        record_id = self._store_record(record)
        if append_history:
            self._append_event(
                "evaluate",
                f"Ghost Beam decision: {record.gate_decision.decision}",
                {"decision_record_id": record_id, "decision": record.gate_decision.decision, "action": proposed_action.model_dump()},
            )
        return record

    def apply_experiment_record(self, decision_record_id: str | None = None, force: bool = False) -> dict[str, Any]:
        record = self.latest_record
        if record is None:
            self._append_event("apply_rejected", "No DecisionRecord available to apply")
            return {"applied": False, "reason": "no DecisionRecord available", "state": self.experiment_state()}
        if decision_record_id and decision_record_id != self.latest_record_id:
            self._append_event("apply_rejected", "DecisionRecord id does not match latest evaluation")
            return {"applied": False, "reason": "decision_record_id does not match latest evaluation", "state": self.experiment_state()}

        delta = record.gate_decision.approved_delta_settings or record.proposed_action.delta_settings
        violations = limit_violations(record.current_settings, delta)
        if violations:
            self._append_event("apply_rejected", "Hard limits rejected attempted apply", {"violations": violations})
            return {"applied": False, "reason": "hard limit violation", "violations": violations, "state": self.experiment_state()}

        decision = record.gate_decision.decision
        if decision not in ("APPROVE", "APPROVE_SMALL_STEP") and not force:
            self._append_event("apply_rejected", f"Decision {decision} is not applyable", {"decision": decision})
            return {"applied": False, "reason": f"decision {decision} is not allowed to apply", "state": self.experiment_state()}

        next_settings = apply_delta(self.adapter.settings, delta)
        self.adapter = SimulatedEPICS(next_settings)
        self.step_number += 1
        self._append_event(
            "apply",
            f"Applied {decision} action",
            {"decision_record_id": self.latest_record_id, "applied_delta_settings": delta},
        )
        monitor_action = ProposedAction(intent="post-apply verification monitor", delta_settings={}, source="scenario")
        self.evaluate_current(monitor_action, append_history=True)
        return {"applied": True, "applied_delta_settings": delta, "state": self.experiment_state()}

    def calibrate_experiment(self) -> dict[str, Any]:
        settings = self.adapter.settings
        drift = self._current_drift()
        self.calibration_weights[self.current_scenario_id] = 1.0
        measurement = calibration_measurement(settings, drift)
        self.step_number += 1
        self._append_event(
            "calibration",
            "Synthetic calibration screen acquired",
            {"measurement": measurement},
        )
        action = self.latest_proposed_action or ProposedAction(intent="post-calibration verification", delta_settings={}, source="scenario")
        self.evaluate_current(action, append_history=True)
        return {"calibration_applied": True, "measurement": measurement, "state": self.experiment_state()}

    def reset_experiment(self) -> dict[str, Any]:
        return self.start_experiment(self.current_scenario_id)

    def experiment_history(self) -> list[dict[str, Any]]:
        return self.history[-200:]

    def export_experiment(self) -> dict[str, Any]:
        validation_by_record = {
            record_id: validate_decision_record(record)
            for record_id, record in self.records.items()
        }
        validation_errors = [
            {"decision_record_id": record_id, "errors": validation["validation_errors"]}
            for record_id, validation in validation_by_record.items()
            if validation["validation_errors"]
        ]
        return {
            "exported_at": self._now(),
            "engine": "ghost-beam",
            "schema_version": "0.1.0",
            "scenario_id": self.current_scenario_id,
            "state": self.experiment_state(),
            "decision_records": {record_id: record.model_dump() for record_id, record in self.records.items()},
            "decision_record_validation": validation_by_record,
            "validation": {
                "decision_record_valid": not validation_errors,
                "schema_version": DECISION_RECORD_SCHEMA_VERSION,
                "validation_errors": validation_errors,
            },
            "history": self.experiment_history(),
            "synthetic_data_disclosure": (
                "Synthetic accelerator-control data from Ghost Beam's JAX digital twin. "
                "No real EPICS, facility eLogs, or hardware writes are included."
            ),
        }

    def dry_run_health_check(self) -> dict[str, Any]:
        sandbox = GhostBeamRuntime()
        items: list[dict[str, Any]] = []

        def item(check_id: str, label: str, passed: bool, detail: str, expected: str | None = None, observed: Any = None) -> None:
            items.append(
                {
                    "id": check_id,
                    "label": label,
                    "status": "pass" if passed else "fail",
                    "detail": detail,
                    "expected": expected,
                    "observed": observed,
                }
            )

        scenarios = list_scenarios()
        item(
            "scenarios",
            "Scenarios reachable",
            len(scenarios) >= 5,
            f"{len(scenarios)} synthetic scenarios loaded.",
            expected="at least five demo scenarios",
            observed=[scenario["scenario_id"] for scenario in scenarios],
        )

        sandbox.start_experiment("green_zone")
        safe_action = sandbox.propose_experiment_action(
            intent="dry-run safe quad_1 trim",
            source="human",
            delta_settings={"quad_1": 0.03},
        )
        green_decision = sandbox.evaluate_current(safe_action)
        green_state = sandbox.experiment_state()
        green_apply = sandbox.apply_experiment_record(green_state["latest_decision_record_id"])
        item(
            "green",
            "Green-zone safe trim evaluates and applies",
            green_decision.gate_decision.decision in ("APPROVE", "APPROVE_SMALL_STEP") and green_apply["applied"],
            f"Decision {green_decision.gate_decision.decision}; apply={green_apply['applied']}.",
            expected="APPROVE or APPROVE_SMALL_STEP and applied=true",
            observed=green_decision.gate_decision.decision,
        )

        sandbox.start_experiment("green_zone")
        unsafe_action = sandbox.propose_experiment_action(
            intent="dry-run unsafe quad_1 write",
            source="human",
            delta_settings={"quad_1": 99},
        )
        unsafe_decision = sandbox.evaluate_current(unsafe_action)
        item(
            "unsafe",
            "Unsafe quad_1=+99 blocks",
            unsafe_decision.gate_decision.decision == "BLOCK",
            f"Decision {unsafe_decision.gate_decision.decision}.",
            expected="BLOCK",
            observed=unsafe_decision.gate_decision.decision,
        )

        drift_state = sandbox.start_experiment("drifted_twin")
        drift_action = ProposedAction(**drift_state["latest_proposed_action"])
        drift_before = sandbox.evaluate_current(drift_action)
        sandbox.calibrate_experiment()
        safer_action = sandbox.propose_experiment_action(
            intent="dry-run safer RF correction after calibration",
            source="human",
            delta_settings={"rf_phase": -0.35},
        )
        drift_after = sandbox.evaluate_current(safer_action)
        item(
            "drift",
            "Drifted twin requests calibration and improves after calibration",
            drift_before.gate_decision.decision == "REQUEST_CALIBRATION"
            and drift_after.virtual_diagnostic.ood_score < drift_before.virtual_diagnostic.ood_score,
            (
                f"Before {drift_before.gate_decision.decision}, OOD {drift_before.virtual_diagnostic.ood_score:.2f}; "
                f"after {drift_after.gate_decision.decision}, OOD {drift_after.virtual_diagnostic.ood_score:.2f}."
            ),
            expected="REQUEST_CALIBRATION then lower OOD",
            observed={
                "before_decision": drift_before.gate_decision.decision,
                "before_ood": drift_before.virtual_diagnostic.ood_score,
                "after_decision": drift_after.gate_decision.decision,
                "after_ood": drift_after.virtual_diagnostic.ood_score,
            },
        )

        elog_state = sandbox.start_experiment("elog_conflict")
        elog_action = ProposedAction(**elog_state["latest_proposed_action"])
        elog_decision = sandbox.evaluate_current(elog_action)
        item(
            "elog",
            "eLog conflict requires human review",
            elog_decision.gate_decision.decision == "REQUIRE_HUMAN_REVIEW",
            f"Decision {elog_decision.gate_decision.decision}; top eLog {elog_decision.elog_hits[0].title if elog_decision.elog_hits else 'none'}.",
            expected="REQUIRE_HUMAN_REVIEW",
            observed=elog_decision.gate_decision.decision,
        )

        exported = sandbox.export_experiment()
        item(
            "export",
            "Session export validates",
            bool(exported.get("validation", {}).get("decision_record_valid")),
            f"Exported {len(exported.get('decision_records', {}))} dry-run DecisionRecords.",
            expected="valid DecisionRecords",
            observed=exported.get("validation"),
        )

        return {
            "checked_at": self._now(),
            "dry_run": True,
            "mutates_active_session": False,
            "active_session": {
                "scenario_id": self.current_scenario_id,
                "step_number": self.step_number,
                "latest_decision_record_id": self.latest_record_id,
                "calibration_freshness": self.calibration_weight(self.current_scenario_id),
            },
            "summary": {
                "status": "pass" if all(entry["status"] == "pass" for entry in items) else "fail",
                "passed": sum(1 for entry in items if entry["status"] == "pass"),
                "total": len(items),
            },
            "items": items,
        }

    def experiment_device_registry(self) -> list[dict[str, Any]]:
        return self._device_registry()

    def experiment_trajectory(self) -> list[list[float]]:
        return self._beam_trajectory(self.adapter.settings)

    def experiment_beam_profile(self) -> list[list[float]]:
        return generate_beam_image(self.adapter.settings, self._current_drift(), size=32).tolist()

    def propose(self, settings: MachineSettings, intent: str, scenario_id: str | None = None) -> ProposedAction:
        drift = self.drift_for(scenario_id or self.current_scenario_id)
        return propose_local_search_action(settings, intent=intent, drift=drift)

    def apply_simulated(self, record: DecisionRecord) -> dict[str, Any]:
        if record.gate_decision.decision not in ("APPROVE", "APPROVE_SMALL_STEP"):
            return {
                "applied": False,
                "reason": f"decision {record.gate_decision.decision} is not allowed to apply",
                "current_settings": self.adapter.snapshot(),
            }
        delta = record.gate_decision.approved_delta_settings or record.proposed_action.delta_settings
        next_settings = apply_delta(record.current_settings, delta)
        self.adapter = SimulatedEPICS(next_settings)
        return {"applied": True, "current_settings": next_settings.model_dump(), "applied_delta_settings": delta}

    def request_calibration(self, scenario_id: str, settings: MachineSettings | None = None) -> dict[str, Any]:
        drift = self.drift_for(scenario_id)
        current = settings or self.adapter.settings
        return {
            "scenario_id": scenario_id,
            "recommended_measurement": "synthetic OTR calibration screen",
            "reason": "Reduce local OOD and uncertainty before a machine write.",
            "measurement_preview": calibration_measurement(current, drift),
        }

    def apply_calibration(self, scenario_id: str, settings: MachineSettings | None = None) -> dict[str, Any]:
        drift = self.drift_for(scenario_id)
        current = settings or self.adapter.settings
        self.calibration_weights[scenario_id] = 1.0
        measurement = calibration_measurement(current, drift)
        diagnostic = get_default_diagnostic().predict(current, drift=drift, calibration_weight=1.0)
        return {
            "scenario_id": scenario_id,
            "calibration_applied": True,
            "measurement": measurement,
            "virtual_diagnostic": diagnostic.model_dump(),
        }

    def latest_artifact(self) -> dict[str, Any] | None:
        if self.latest_record is None:
            return None
        return enrich_record(self.latest_record, get_default_diagnostic().model_version)


runtime = GhostBeamRuntime()
