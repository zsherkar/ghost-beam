from __future__ import annotations

from ghostbeam.core.registry import SETTING_LIMITS, clip_delta_without_approval, limit_violations
from ghostbeam.core.schemas import (
    ElogHit,
    GateDecision,
    MachineSettings,
    ProposedAction,
    VirtualDiagnosticResult,
    VisionDiagnosticResult,
)


POLICY_VERSION = "policy-0.1.0"


def _touches(action: ProposedAction, *names: str) -> bool:
    return any(abs(float(action.delta_settings.get(name, 0.0))) > 1e-12 for name in names)


def _all_risk_tags(elog_hits: list[ElogHit]) -> set[str]:
    tags: set[str] = set()
    for hit in elog_hits:
        tags.update(hit.risk_tags)
    return tags


def _intent_allows_rf(action: ProposedAction) -> bool:
    intent = action.intent.lower()
    return any(term in intent for term in ("check", "verify", "correct", "calibration", "calibrate"))


def _recent_calibration(diagnostic: VirtualDiagnosticResult) -> bool:
    return any("recent synthetic calibration" in reason.lower() for reason in diagnostic.reasons)


def _action_increases_vision_risk(action: ProposedAction) -> bool:
    risky_knobs = {"quad_1", "quad_2", "rf_amplitude", "steer_x", "steer_y"}
    return any(name in risky_knobs and delta > 0 for name, delta in action.delta_settings.items())


def evaluate_policy(
    settings: MachineSettings,
    proposed_action: ProposedAction,
    diagnostic: VirtualDiagnosticResult,
    vision: VisionDiagnosticResult,
    elog_hits: list[ElogHit],
) -> GateDecision:
    reasons: list[str] = []
    violations = limit_violations(settings, proposed_action.delta_settings)
    if violations:
        return GateDecision(
            decision="BLOCK",
            reasons=[f"hard limit violation for {name}: proposed {value:.3f}" for name, value in violations.items()],
            safe_next_step="Reject simulated write and ask an operator to choose a bounded recovery action.",
            human_approval_required=True,
            blocked_delta_settings=proposed_action.delta_settings,
        )

    if diagnostic.predicted_beam_loss >= 0.34:
        return GateDecision(
            decision="BLOCK",
            reasons=["predicted beam loss exceeds hard safety threshold"],
            safe_next_step="Do not apply the action. Revert to a known safe tune or request expert review.",
            human_approval_required=True,
            blocked_delta_settings=proposed_action.delta_settings,
        )

    tags = _all_risk_tags(elog_hits)

    if diagnostic.trust_state == "RED":
        return GateDecision(
            decision="REQUEST_CALIBRATION",
            reasons=["virtual diagnostic trust state is RED", *diagnostic.reasons],
            safe_next_step="Take a calibration screen or equivalent verification measurement before any write.",
            human_approval_required=True,
            blocked_delta_settings=proposed_action.delta_settings,
        )

    if "calibration_required" in tags and not _recent_calibration(diagnostic):
        return GateDecision(
            decision="REQUEST_CALIBRATION",
            reasons=["retrieved eLogs recommend calibration for a similar state"],
            safe_next_step="Request calibration measurement before changing settings.",
            human_approval_required=True,
            blocked_delta_settings=proposed_action.delta_settings,
        )

    if "bpm_noise" in tags and diagnostic.uncertainty >= 0.05:
        return GateDecision(
            decision="REQUEST_CALIBRATION",
            reasons=["BPM-noise eLog plus elevated model uncertainty"],
            safe_next_step="Verify BPM readings with a screen measurement before steering.",
            human_approval_required=True,
            blocked_delta_settings=proposed_action.delta_settings,
        )

    if "CLIPPED" in vision.labels:
        return GateDecision(
            decision="REQUEST_CALIBRATION",
            reasons=["beam image is clipped so vision evidence is unreliable"],
            safe_next_step="Recenter or calibrate the diagnostic screen before applying action.",
            human_approval_required=True,
            blocked_delta_settings=proposed_action.delta_settings,
        )

    if "HALO" in vision.labels and _action_increases_vision_risk(proposed_action):
        return GateDecision(
            decision="REQUIRE_HUMAN_REVIEW",
            reasons=["vision diagnostic sees halo and proposed action may worsen loss"],
            safe_next_step="Operator should inspect halo source and approve any optics change manually.",
            human_approval_required=True,
            blocked_delta_settings=proposed_action.delta_settings,
        )

    if _touches(proposed_action, "quad_2") and "quad_conflict" in tags:
        return GateDecision(
            decision="REQUIRE_HUMAN_REVIEW",
            reasons=["retrieved eLog conflict: similar quad_2 action previously worsened beam halo or loss"],
            safe_next_step="Review historical incident and verify RF phase before quad_2 change.",
            human_approval_required=True,
            blocked_delta_settings=proposed_action.delta_settings,
        )

    if _touches(proposed_action, "rf_phase") and "rf_phase_check" in tags and not _intent_allows_rf(proposed_action):
        return GateDecision(
            decision="REQUIRE_HUMAN_REVIEW",
            reasons=["retrieved eLog asks for RF phase readback verification"],
            safe_next_step="Verify RF phase readback before applying phase change.",
            human_approval_required=True,
            blocked_delta_settings=proposed_action.delta_settings,
        )

    if _touches(proposed_action, "steer_x", "steer_y") and "steering_saturation" in tags:
        return GateDecision(
            decision="REQUIRE_HUMAN_REVIEW",
            reasons=["retrieved eLog warns about steering saturation"],
            safe_next_step="Operator should verify corrector headroom before steering.",
            human_approval_required=True,
            blocked_delta_settings=proposed_action.delta_settings,
        )

    max_requested_delta = max((abs(float(v)) for v in proposed_action.delta_settings.values()), default=0.0)
    if diagnostic.trust_state == "YELLOW":
        clipped = clip_delta_without_approval(proposed_action.delta_settings)
        return GateDecision(
            decision="APPROVE_SMALL_STEP",
            reasons=["trust state is YELLOW so Ghost Beam clips to a smaller approved step"],
            safe_next_step="Apply clipped simulated step and continue monitoring.",
            human_approval_required=False,
            approved_delta_settings=clipped,
            blocked_delta_settings={
                name: value
                for name, value in proposed_action.delta_settings.items()
                if abs(float(value) - float(clipped.get(name, 0.0))) > 1e-12
            },
        )

    for name, delta in proposed_action.delta_settings.items():
        if name in SETTING_LIMITS and abs(float(delta)) > SETTING_LIMITS[name].max_delta_without_approval:
            reasons.append(f"{name} delta exceeds no-approval step size")

    if diagnostic.trust_state == "GREEN" and not reasons:
        return GateDecision(
            decision="APPROVE",
            reasons=["trust state GREEN", "no hard limit or eLog conflict"],
            safe_next_step="Apply approved simulated action.",
            human_approval_required=False,
            approved_delta_settings=proposed_action.delta_settings,
        )

    if diagnostic.trust_state == "GREEN" and reasons and max_requested_delta > 0:
        clipped = clip_delta_without_approval(proposed_action.delta_settings)
        return GateDecision(
            decision="APPROVE_SMALL_STEP",
            reasons=reasons,
            safe_next_step="Apply a clipped small step rather than the full proposed action.",
            human_approval_required=False,
            approved_delta_settings=clipped,
            blocked_delta_settings={
                name: value
                for name, value in proposed_action.delta_settings.items()
                if abs(float(value) - float(clipped.get(name, 0.0))) > 1e-12
            },
        )

    return GateDecision(
        decision="REQUIRE_HUMAN_REVIEW",
        reasons=["policy reached conservative fallback"],
        safe_next_step="Ask an operator to review the evidence bundle.",
        human_approval_required=True,
        blocked_delta_settings=proposed_action.delta_settings,
    )
