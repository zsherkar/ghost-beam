import { DecisionRecord, ExperimentState, ProposedAction } from '../api/client'
import { decisionLabel, formatNumber, scenarioLabel } from './format'
import { fileTimestamp, syntheticDisclosure } from './missionReport'
import { policyStrictness, trustScore, twinTrustDisplay } from './trust'

export interface GhostBeamTimelineItem {
  title: string
  detail: string
}

export interface GhostBeamDiagnosis {
  title: string
  summary: string
  whatHappened: string
  whyIntervened: string
  evidenceUsed: string[]
  decision: string
  actionTaken: string
  outcome: string
  nextStep: string
  timeline: GhostBeamTimelineItem[]
  markdown: string
}

function formatAction(action: ProposedAction | null | undefined) {
  if (!action) return 'No proposed action recorded.'
  const deltas = Object.entries(action.delta_settings ?? {})
    .filter(([, value]) => Math.abs(Number(value)) > 1e-12)
    .map(([name, value]) => `${name} ${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(3)}`)
    .join(', ')
  return `${action.intent}${deltas ? ` (${deltas})` : ''}`
}

function decisionAction(record: DecisionRecord) {
  const decision = record.gate_decision.decision
  if (decision === 'APPROVE' || decision === 'APPROVE_SMALL_STEP') {
    return 'Approved the simulated action path, with Ghost Beam preserving the audit trail before any write.'
  }
  if (decision === 'REQUEST_CALIBRATION') {
    return 'Requested a calibration measurement before allowing the proposed write.'
  }
  if (decision === 'REQUIRE_HUMAN_REVIEW') {
    return 'Held the action for operator review because policy or eLog memory raised risk.'
  }
  if (decision === 'BLOCK') {
    return 'Blocked the write because the action violated a hard safety or policy constraint.'
  }
  return 'Recorded the gate decision for review.'
}

function interventionReason(record: DecisionRecord) {
  const decision = record.gate_decision.decision
  const top = record.elog_hits?.[0]
  const reasons = record.gate_decision.reasons ?? []
  if (decision === 'BLOCK') return 'The proposed action violated a hard PV limit or deterministic safety rule.'
  if (decision === 'REQUEST_CALIBRATION') return 'The virtual diagnostic was outside its trusted envelope, so Ghost Beam required fresh calibration evidence.'
  if (decision === 'REQUIRE_HUMAN_REVIEW') {
    return top
      ? `The digital twin could still be usable, but retrieved eLog memory raised a conflict: "${top.title}".`
      : 'Policy required a human review before allowing the proposed action.'
  }
  if (reasons.length) return reasons[0]
  return 'The action remained within the trusted envelope and policy allowed a safe step.'
}

function outcomeText(record: DecisionRecord, experiment: ExperimentState | null | undefined) {
  const decision = record.gate_decision.decision
  const beamLoss = record.simulated_outcome_if_applied?.beam_loss
  const quality = record.simulated_outcome_if_applied?.beam_quality
  const calibrated = (experiment?.calibration_freshness ?? 0) > 0.5
  if (decision === 'REQUEST_CALIBRATION') {
    return `Calibration is required before applying the action. Current OOD is ${formatNumber(record.virtual_diagnostic.ood_score, 2)}.`
  }
  if (decision === 'BLOCK') {
    return 'No simulated write was applied; the current beam state remains protected while the unsafe target device is highlighted.'
  }
  if (decision === 'REQUIRE_HUMAN_REVIEW') {
    return 'The current beam remains under review; Ghost Beam shows the policy/eLog conflict without applying the proposed trajectory.'
  }
  if (calibrated) {
    return `Post-intervention state is stabilized after calibration. Projected quality is ${formatOptional(quality, 3)} and projected beam loss is ${formatOptional(beamLoss, 3)}.`
  }
  return `Low-risk path accepted. Projected quality is ${formatOptional(quality, 3)} and projected beam loss is ${formatOptional(beamLoss, 3)}.`
}

function formatOptional(value: unknown, digits = 2) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? formatNumber(parsed, digits) : 'not recorded'
}

function buildTimeline(record: DecisionRecord, experiment: ExperimentState | null | undefined): GhostBeamTimelineItem[] {
  const top = record.elog_hits?.[0]
  const decision = record.gate_decision.decision
  const calibrationFreshness = experiment?.calibration_freshness ?? 0
  return [
    {
      title: 'Proposed Action',
      detail: formatAction(record.proposed_action),
    },
    {
      title: 'Virtual Diagnostic Check',
      detail: `Twin trust ${twinTrustDisplay(record)}; OOD ${formatNumber(record.virtual_diagnostic.ood_score, 2)}; uncertainty ${formatNumber(record.virtual_diagnostic.uncertainty, 3)}.`,
    },
    {
      title: 'eLog Memory Check',
      detail: top
        ? `Retrieved "${top.title}" with similarity ${formatNumber(top.similarity, 2)} and tags ${top.risk_tags.join(', ') || 'none'}.`
        : 'No conflicting synthetic operator memory was retrieved.',
    },
    {
      title: 'Policy Gate',
      detail: `Gate returned ${decisionLabel(decision)} with ${policyStrictness(record).toLowerCase()} policy strictness.`,
    },
    {
      title: 'Calibration',
      detail: calibrationFreshness > 0.5
        ? `Calibration evidence is fresh (${formatNumber(calibrationFreshness, 2)}), reducing OOD risk before the next action.`
        : decision === 'REQUEST_CALIBRATION'
          ? 'Ghost Beam requested calibration before any simulated write.'
          : 'No calibration was required for this decision.',
    },
    {
      title: 'Safer Action',
      detail: decision === 'APPROVE_SMALL_STEP'
        ? 'Ghost Beam constrained the action to an approved small step.'
        : decision === 'APPROVE'
          ? 'Ghost Beam approved the proposed low-risk action.'
          : 'Ghost Beam did not apply the proposed action automatically.',
    },
    {
      title: 'Outcome',
      detail: outcomeText(record, experiment),
    },
  ]
}

function scenarioSpecificNextStep(record: DecisionRecord) {
  const decision = record.gate_decision.decision
  if (decision === 'REQUEST_CALIBRATION') return 'Acquire the calibration measurement, then re-evaluate a smaller correction.'
  if (decision === 'REQUIRE_HUMAN_REVIEW') return 'Review the eLog conflict and policy evidence before approving any write.'
  if (decision === 'BLOCK') return 'Do not apply this action; revise the proposed PV delta within hard limits.'
  if (decision === 'APPROVE_SMALL_STEP') return 'Proceed with the approved small correction and monitor the beam profile.'
  return 'Proceed with the approved simulated action and keep the audit trail attached.'
}

export function buildGhostBeamDiagnosis(
  record: DecisionRecord | null,
  experiment: ExperimentState | null | undefined,
): GhostBeamDiagnosis | null {
  if (!record) return null
  const top = record.elog_hits?.[0]
  const scenario = scenarioLabel(record.scenario_id)
  const evidence = [
    `OOD score: ${formatNumber(record.virtual_diagnostic.ood_score, 2)}`,
    `Uncertainty: ${formatNumber(record.virtual_diagnostic.uncertainty, 3)}`,
    `Twin trust: ${twinTrustDisplay(record)} (${formatNumber(trustScore(record), 2)})`,
    `Vision diagnostic: ${record.vision_diagnostic.labels.join(', ') || 'none'}`,
    top ? `Top eLog: "${top.title}" (${formatNumber(top.similarity, 2)})` : 'Top eLog: no conflict found',
    top ? `Risk tags: ${top.risk_tags.join(', ') || 'none'}` : 'Risk tags: none',
    `Policy rule: ${record.gate_decision.reasons?.[0] ?? record.gate_decision.safe_next_step}`,
  ]
  const timeline = buildTimeline(record, experiment)
  const diagnosis: Omit<GhostBeamDiagnosis, 'markdown'> = {
    title: 'Ghost Beam Diagnosis',
    summary: `${decisionLabel(record.gate_decision.decision)} for ${scenario}: ${interventionReason(record)}`,
    whatHappened: `The autonomous action source proposed ${formatAction(record.proposed_action)} in ${scenario}.`,
    whyIntervened: interventionReason(record),
    evidenceUsed: evidence,
    decision: decisionLabel(record.gate_decision.decision),
    actionTaken: decisionAction(record),
    outcome: outcomeText(record, experiment),
    nextStep: scenarioSpecificNextStep(record),
    timeline,
  }
  return {
    ...diagnosis,
    markdown: diagnosisToMarkdown(diagnosis, record, experiment),
  }
}

export function diagnosisFilename(record: DecisionRecord | null) {
  return `ghostbeam_${record?.scenario_id ?? 'session'}_diagnosis_${fileTimestamp()}.md`
}

function diagnosisToMarkdown(
  diagnosis: Omit<GhostBeamDiagnosis, 'markdown'>,
  record: DecisionRecord,
  experiment: ExperimentState | null | undefined,
) {
  return [
    '# Ghost Beam Diagnosis',
    '',
    '## Scenario',
    `${scenarioLabel(record.scenario_id)} | Step ${experiment?.step_number ?? 0}`,
    '',
    '## Proposed Action',
    formatAction(record.proposed_action),
    '',
    '## Decision',
    diagnosis.decision,
    '',
    '## Why Ghost Beam Acted',
    diagnosis.whyIntervened,
    '',
    '## Evidence',
    ...diagnosis.evidenceUsed.map((item) => `- ${item}`),
    '',
    '## What Ghost Beam Did',
    ...diagnosis.timeline.map((item) => `- **${item.title}:** ${item.detail}`),
    '',
    '## Outcome',
    diagnosis.outcome,
    '',
    '## Next Recommended Step',
    diagnosis.nextStep,
    '',
    '## Synthetic Data Disclosure',
    syntheticDisclosure,
    '',
  ].join('\n')
}
