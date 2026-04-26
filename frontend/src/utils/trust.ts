import { DecisionRecord, TrustState } from '../api/client'

export function trustTone(trust?: TrustState) {
  if (trust === 'GREEN') return 'tone-green'
  if (trust === 'RED') return 'tone-red'
  return 'tone-yellow'
}

export function beamTone(record: DecisionRecord | null) {
  const decision = record?.gate_decision.decision
  const trust = record?.virtual_diagnostic.trust_state
  if (decision === 'BLOCK') return 'beam-red'
  if (decision === 'REQUEST_CALIBRATION' || trust === 'RED' || trust === 'YELLOW') return 'beam-amber'
  return 'beam-green'
}

export function trustDisplay(record: DecisionRecord | null) {
  const decision = record?.gate_decision.decision
  const trust = record?.virtual_diagnostic.trust_state
  if (decision === 'BLOCK') return 'Blocked'
  if (decision === 'REQUEST_CALIBRATION') return 'Calibration Required'
  if (trust === 'GREEN') return 'Trusted'
  if (trust === 'YELLOW') return 'Caution'
  if (trust === 'RED') return 'Untrusted'
  return 'Pending'
}

export function twinTrustDisplay(record: DecisionRecord | null) {
  const trust = record?.virtual_diagnostic.trust_state
  if (trust === 'GREEN') return 'Trusted'
  if (trust === 'YELLOW') return 'Caution'
  if (trust === 'RED') return 'Untrusted'
  return 'Pending'
}

export function decisionReason(record: DecisionRecord | null) {
  const decision = record?.gate_decision.decision
  const trust = record?.virtual_diagnostic.trust_state
  const reasons = record?.gate_decision.reasons ?? []
  if (!record) return 'Waiting for live DecisionRecord.'
  if (decision === 'BLOCK') {
    if (reasons.some((reason) => reason.toLowerCase().includes('hard limit'))) return 'Action violates hard PV limit.'
    return 'Safety policy blocks this action.'
  }
  if (decision === 'REQUEST_CALIBRATION') {
    if (trust === 'RED') return 'Twin drifted; calibration required.'
    return 'Evidence requests calibration before write.'
  }
  if (decision === 'REQUIRE_HUMAN_REVIEW') {
    if (trust === 'GREEN') return 'Twin trusted; eLog or policy evidence requires review.'
    return 'Caution state requires operator review.'
  }
  if (decision === 'APPROVE_SMALL_STEP') return 'Safe path is a clipped small step.'
  if (decision === 'APPROVE') return 'Low-risk action approved.'
  return 'Policy is waiting for an evaluated action.'
}

export function trustScore(record: DecisionRecord | null) {
  const vd = record?.virtual_diagnostic
  if (!vd) return 0
  const confidence = 1 - Math.min(vd.uncertainty * 4.0, 0.78)
  const agreement = 1 - Math.min(vd.ood_score / 12, 0.78)
  const lossSafety = 1 - Math.min(vd.predicted_beam_loss * 2.2, 0.78)
  return Math.max(0, Math.min(0.99, confidence * 0.38 + agreement * 0.42 + lossSafety * 0.2))
}

export function policyStrictness(record: DecisionRecord | null) {
  const gate = record?.gate_decision
  if (!gate) return 'Pending'
  if (gate.decision === 'BLOCK' || gate.decision === 'REQUEST_CALIBRATION') return 'High'
  if (gate.decision === 'REQUIRE_HUMAN_REVIEW' || gate.decision === 'APPROVE_SMALL_STEP') return 'Medium'
  return 'Low'
}
