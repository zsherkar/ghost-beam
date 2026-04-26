from ghostbeam.control.policy_gate import evaluate_policy
from ghostbeam.core.schemas import (
    ElogHit,
    MachineSettings,
    ProposedAction,
    VirtualDiagnosticResult,
    VisionDiagnosticResult,
)


def settings():
    return MachineSettings(quad_1=0.3, quad_2=-0.2, steer_x=0.0, steer_y=0.0, rf_phase=0.4, rf_amplitude=1.0)


def vd(trust_state="GREEN", loss=0.03, uncertainty=0.02):
    return VirtualDiagnosticResult(
        predicted_quality=0.9,
        predicted_size_x=0.15,
        predicted_size_y=0.16,
        predicted_beam_loss=loss,
        uncertainty=uncertainty,
        ood_score=1.0,
        trust_state=trust_state,
        reasons=["unit"],
    )


def vision(labels=None):
    return VisionDiagnosticResult(
        centroid_x=0.0,
        centroid_y=0.0,
        sigma_x=0.15,
        sigma_y=0.15,
        ellipticity=1.0,
        halo_score=0.0,
        clipping_score=0.0,
        labels=labels or ["CENTERED"],
    )


def elog(tags):
    return [
        ElogHit(
            date="2024-01-01",
            title="Synthetic",
            text="Synthetic",
            recommended_action="Review",
            similarity=0.9,
            risk_tags=tags,
        )
    ]


def test_hard_limit_blocks():
    decision = evaluate_policy(
        settings(),
        ProposedAction(intent="unsafe", delta_settings={"quad_1": 2.0}),
        vd(),
        vision(),
        [],
    )
    assert decision.decision == "BLOCK"


def test_red_trust_requests_calibration():
    decision = evaluate_policy(
        settings(),
        ProposedAction(intent="trim", delta_settings={"quad_1": 0.02}),
        vd("RED"),
        vision(),
        [],
    )
    assert decision.decision == "REQUEST_CALIBRATION"


def test_yellow_trust_approves_small_step():
    decision = evaluate_policy(
        settings(),
        ProposedAction(intent="trim", delta_settings={"quad_1": 0.3}),
        vd("YELLOW", uncertainty=0.07),
        vision(),
        [],
    )
    assert decision.decision == "APPROVE_SMALL_STEP"
    assert abs(decision.approved_delta_settings["quad_1"]) <= 0.15


def test_elog_conflict_requires_human_review():
    decision = evaluate_policy(
        settings(),
        ProposedAction(intent="increase quad_2", delta_settings={"quad_2": 0.08}),
        vd(),
        vision(),
        elog(["quad_conflict"]),
    )
    assert decision.decision == "REQUIRE_HUMAN_REVIEW"


def test_green_small_no_conflict_approves():
    decision = evaluate_policy(
        settings(),
        ProposedAction(intent="small safe trim", delta_settings={"quad_1": 0.02}),
        vd(),
        vision(),
        [],
    )
    assert decision.decision == "APPROVE"


def test_high_predicted_beam_loss_blocks():
    decision = evaluate_policy(
        settings(),
        ProposedAction(intent="lossy", delta_settings={"quad_1": 0.02}),
        vd("YELLOW", loss=0.4),
        vision(),
        [],
    )
    assert decision.decision == "BLOCK"


def test_calibration_required_elog_requests_calibration():
    decision = evaluate_policy(
        settings(),
        ProposedAction(intent="trim", delta_settings={"quad_1": 0.02}),
        vd(),
        vision(),
        elog(["calibration_required"]),
    )
    assert decision.decision == "REQUEST_CALIBRATION"
