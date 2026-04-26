from ghostbeam.core.schemas import (
    BeamTruth,
    DecisionRecord,
    ElogHit,
    GateDecision,
    MachineSettings,
    ProposedAction,
    SafeSignals,
    VirtualDiagnosticResult,
    VisionDiagnosticResult,
)


def test_schema_json_serialization_roundtrip():
    settings = MachineSettings(
        quad_1=0.3,
        quad_2=-0.2,
        steer_x=0.0,
        steer_y=0.01,
        rf_phase=0.5,
        rf_amplitude=1.0,
    )
    safe = SafeSignals(
        bpm_x_1=0.01,
        bpm_y_1=-0.01,
        bpm_x_2=0.02,
        bpm_y_2=-0.02,
        charge=0.8,
        temperature=32.0,
        rf_readback=1.0,
        beam_current_proxy=0.75,
    )
    vd = VirtualDiagnosticResult(
        predicted_quality=0.9,
        predicted_size_x=0.2,
        predicted_size_y=0.21,
        predicted_beam_loss=0.02,
        uncertainty=0.03,
        ood_score=1.2,
        trust_state="GREEN",
        reasons=["inside training envelope"],
    )
    vision = VisionDiagnosticResult(
        centroid_x=0.0,
        centroid_y=0.0,
        sigma_x=0.16,
        sigma_y=0.17,
        ellipticity=1.06,
        halo_score=0.01,
        clipping_score=0.0,
        labels=["CENTERED"],
    )
    record = DecisionRecord(
        scenario_id="unit",
        current_settings=settings,
        safe_signals=safe,
        proposed_action=ProposedAction(
            intent="small trim", delta_settings={"quad_1": 0.02}
        ),
        virtual_diagnostic=vd,
        vision_diagnostic=vision,
        elog_hits=[
            ElogHit(
                date="2024-01-01",
                title="Synthetic note",
                text="No incident.",
                recommended_action="Proceed.",
                similarity=0.8,
            )
        ],
        gate_decision=GateDecision(
            decision="APPROVE",
            reasons=["low risk"],
            safe_next_step="Apply simulated setting.",
            human_approval_required=False,
            approved_delta_settings={"quad_1": 0.02},
        ),
        simulated_outcome_if_applied=BeamTruth(
            beam_quality=0.91,
            beam_size_x=0.19,
            beam_size_y=0.2,
            beam_loss=0.01,
            emittance_proxy=0.18,
        ),
    )

    loaded = DecisionRecord.model_validate_json(record.model_dump_json())
    assert loaded.scenario_id == "unit"
    assert loaded.gate_decision.decision == "APPROVE"
