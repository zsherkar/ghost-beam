from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

from ghostbeam.core.decision_types import DecisionType, TrustState


class MachineSettings(BaseModel):
    quad_1: float
    quad_2: float
    steer_x: float
    steer_y: float
    rf_phase: float
    rf_amplitude: float


class SafeSignals(BaseModel):
    bpm_x_1: float
    bpm_y_1: float
    bpm_x_2: float
    bpm_y_2: float
    charge: float
    temperature: float
    rf_readback: float
    beam_current_proxy: float


class BeamTruth(BaseModel):
    beam_quality: float
    beam_size_x: float
    beam_size_y: float
    beam_loss: float
    emittance_proxy: float


class VirtualDiagnosticResult(BaseModel):
    predicted_quality: float
    predicted_size_x: float
    predicted_size_y: float
    predicted_beam_loss: float
    uncertainty: float
    ood_score: float
    trust_state: TrustState
    reasons: list[str]


class VisionDiagnosticResult(BaseModel):
    centroid_x: float
    centroid_y: float
    sigma_x: float
    sigma_y: float
    ellipticity: float
    halo_score: float
    clipping_score: float
    labels: list[str]


class ProposedAction(BaseModel):
    intent: str
    delta_settings: dict[str, float]
    source: Literal["human", "llm", "optimizer", "scenario"] = "optimizer"


class ElogHit(BaseModel):
    date: str
    title: str
    text: str
    recommended_action: str
    similarity: float
    risk_tags: list[str] = Field(default_factory=list)


class GateDecision(BaseModel):
    decision: DecisionType
    reasons: list[str]
    safe_next_step: str
    human_approval_required: bool
    approved_delta_settings: dict[str, float] = Field(default_factory=dict)
    blocked_delta_settings: dict[str, float] = Field(default_factory=dict)


class DecisionRecord(BaseModel):
    scenario_id: str
    current_settings: MachineSettings
    safe_signals: SafeSignals
    proposed_action: ProposedAction
    virtual_diagnostic: VirtualDiagnosticResult
    vision_diagnostic: VisionDiagnosticResult
    elog_hits: list[ElogHit]
    gate_decision: GateDecision
    simulated_outcome_if_applied: Optional[BeamTruth] = None
