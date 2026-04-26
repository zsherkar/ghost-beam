import { DecisionRecord, ExperimentState, ProposedAction } from '../api/client'
import { decisionLabel, formatNumber } from './format'
import { trustScore, twinTrustDisplay } from './trust'

export interface GuidedTranscriptEntry {
  step_index: number
  title: string
  timestamp: string
  endpoint_called: string
  scenario_id?: string
  note: string
  decision?: string
  decision_record_id?: string | null
  trust_state?: string
  trust_score?: number
  ood_score?: number
  uncertainty?: number
  predicted_quality?: number
  beam_quality?: number
  proposed_action?: ProposedAction | null
  top_elog_title?: string
  top_elog_similarity?: number
  risk_tags?: string[]
}

export interface GuidedDemoReport {
  demo_title: string
  generated_at: string
  session_id: string
  scenario_ids_used: string[]
  synthetic_data_disclosure: string
  executive_summary: string
  initial_trust_metrics: Partial<GuidedTranscriptEntry> | null
  naive_proposal: ProposedAction | null
  ghost_beam_decision: Partial<GuidedTranscriptEntry> | null
  top_elog_match: {
    title?: string
    similarity?: number
    risk_tags?: string[]
    recommendation?: string
  } | null
  calibration_event: Partial<GuidedTranscriptEntry> | null
  post_calibration_metrics: Partial<GuidedTranscriptEntry> | null
  safer_action: ProposedAction | null
  final_decision: Partial<GuidedTranscriptEntry> | null
  final_beam_metrics: {
    beam_quality?: number
    beam_size_x?: number
    beam_size_y?: number
    beam_loss?: number
  } | null
  decision_record_ids: string[]
  transcript: GuidedTranscriptEntry[]
}

export const syntheticDisclosure =
  "Demo uses synthetic accelerator-control data generated from Ghost Beam's JAX digital twin. No live EPICS writes, real facility logs, or real accelerator hardware are used."

export function fileTimestamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

export function createTranscriptEntry({
  stepIndex,
  title,
  endpoint,
  note,
  state,
  record,
  action,
}: {
  stepIndex: number
  title: string
  endpoint: string
  note: string
  state?: ExperimentState | null
  record?: DecisionRecord | null
  action?: ProposedAction | null
}): GuidedTranscriptEntry {
  const activeRecord = record ?? state?.latest_decision_record ?? null
  const topElog = activeRecord?.elog_hits?.[0]
  return {
    step_index: stepIndex,
    title,
    timestamp: new Date().toISOString(),
    endpoint_called: endpoint,
    scenario_id: state?.scenario_id ?? activeRecord?.scenario_id,
    note,
    decision: activeRecord?.gate_decision.decision,
    decision_record_id: state?.latest_decision_record_id,
    trust_state: activeRecord?.virtual_diagnostic.trust_state,
    trust_score: activeRecord ? trustScore(activeRecord) : undefined,
    ood_score: activeRecord?.virtual_diagnostic.ood_score,
    uncertainty: activeRecord?.virtual_diagnostic.uncertainty,
    predicted_quality: activeRecord?.virtual_diagnostic.predicted_quality,
    beam_quality: state?.beam_truth?.beam_quality ?? activeRecord?.simulated_outcome_if_applied?.beam_quality,
    proposed_action: action ?? activeRecord?.proposed_action ?? state?.latest_proposed_action ?? null,
    top_elog_title: topElog?.title,
    top_elog_similarity: topElog?.similarity,
    risk_tags: topElog?.risk_tags,
  }
}

export function buildGuidedDemoReport(
  transcript: GuidedTranscriptEntry[],
  latestRecord: DecisionRecord | null,
  latestState: ExperimentState | null,
): GuidedDemoReport {
  const scenarioIds = Array.from(new Set(transcript.map((entry) => entry.scenario_id).filter(Boolean))) as string[]
  const naive = transcript.find((entry) => entry.step_index === 2)
  const evaluation = transcript.find((entry) => entry.step_index === 3)
  const calibration = transcript.find((entry) => entry.step_index === 4)
  const safer = transcript.find((entry) => entry.step_index === 5)
  const initial = transcript.find((entry) => entry.step_index === 0)
  const drift = transcript.find((entry) => entry.step_index === 1)
  const finalEntry = [...transcript].reverse().find((entry) => entry.decision) ?? safer ?? evaluation ?? null
  const topHit = latestRecord?.elog_hits?.[0]
    ?? (evaluation?.top_elog_title ? {
      title: evaluation.top_elog_title,
      similarity: evaluation.top_elog_similarity,
      risk_tags: evaluation.risk_tags ?? [],
      recommended_action: undefined,
    } : undefined)
  const decisionIds = Array.from(new Set(transcript.map((entry) => entry.decision_record_id).filter(Boolean))) as string[]
  const executiveSummary = [
    'Ghost Beam blocked or held the naive quadrupole correction because the virtual diagnostic was outside its trusted envelope or operator memory warned against that action class.',
    'After one synthetic calibration measurement, Ghost Beam evaluated a smaller RF correction and preserved the audit trail as a DecisionRecord/session artifact.',
  ].join(' ')

  return {
    demo_title: 'Drifted Twin Test',
    generated_at: new Date().toISOString(),
    session_id: `ghostbeam-guided-${fileTimestamp()}`,
    scenario_ids_used: scenarioIds,
    synthetic_data_disclosure: syntheticDisclosure,
    executive_summary: executiveSummary,
    initial_trust_metrics: initial ?? null,
    naive_proposal: naive?.proposed_action ?? null,
    ghost_beam_decision: evaluation ?? drift ?? null,
    top_elog_match: topHit ? {
      title: topHit.title,
      similarity: topHit.similarity,
      risk_tags: topHit.risk_tags,
      recommendation: 'recommended_action' in topHit ? topHit.recommended_action : undefined,
    } : null,
    calibration_event: calibration ?? null,
    post_calibration_metrics: calibration ?? safer ?? null,
    safer_action: safer?.proposed_action ?? null,
    final_decision: finalEntry,
    final_beam_metrics: latestState?.beam_truth ? {
      beam_quality: latestState.beam_truth.beam_quality,
      beam_size_x: latestState.beam_truth.beam_size_x,
      beam_size_y: latestState.beam_truth.beam_size_y,
      beam_loss: latestState.beam_truth.beam_loss,
    } : null,
    decision_record_ids: decisionIds,
    transcript,
  }
}

export function missionReportToMarkdown(report: GuidedDemoReport) {
  const top = report.top_elog_match
  const final = report.final_decision
  const lines = [
    `# Ghost Beam Mission Report: ${report.demo_title}`,
    '',
    `Generated: ${report.generated_at}`,
    '',
    '## Executive Summary',
    '',
    report.executive_summary,
    '',
    `> ${report.synthetic_data_disclosure}`,
    '',
    '## Key Results',
    '',
    `- Scenarios used: ${report.scenario_ids_used.join(', ') || 'not recorded'}`,
    `- Initial OOD score: ${formatOptional(report.initial_trust_metrics?.ood_score, 2)}`,
    `- Initial trust: ${report.initial_trust_metrics?.trust_state ?? 'not recorded'} (${formatOptional(report.initial_trust_metrics?.trust_score, 2)})`,
    `- Naive action: ${formatAction(report.naive_proposal)}`,
    `- Ghost Beam decision: ${report.ghost_beam_decision?.decision ?? 'not recorded'}`,
    `- Top eLog match: ${top?.title ?? 'not recorded'} (${formatOptional(top?.similarity, 2)})`,
    `- Risk tags: ${top?.risk_tags?.join(', ') || 'not recorded'}`,
    `- Post-calibration OOD score: ${formatOptional(report.post_calibration_metrics?.ood_score, 2)}`,
    `- Safer action: ${formatAction(report.safer_action)}`,
    `- Final decision: ${final?.decision ?? 'not recorded'}`,
    `- Final trust: ${final?.trust_state ?? 'not recorded'} (${formatOptional(final?.trust_score, 2)})`,
    `- Final beam quality: ${formatOptional(report.final_beam_metrics?.beam_quality, 3)}`,
    '',
    '## Guided Transcript',
    '',
    ...report.transcript.flatMap((entry) => [
      `### ${entry.step_index + 1}. ${entry.title}`,
      '',
      `- Endpoint: \`${entry.endpoint_called}\``,
      `- Scenario: ${entry.scenario_id ?? 'not recorded'}`,
      `- Decision: ${entry.decision ?? 'not evaluated'}`,
      `- OOD: ${formatOptional(entry.ood_score, 2)}`,
      `- Trust: ${entry.trust_state ?? 'not recorded'} (${formatOptional(entry.trust_score, 2)})`,
      `- Top eLog: ${entry.top_elog_title ?? 'none'}`,
      `- Note: ${entry.note}`,
      '',
    ]),
    '## Artifact IDs',
    '',
    report.decision_record_ids.length ? report.decision_record_ids.map((id) => `- ${id}`).join('\n') : '- Not recorded',
    '',
  ]
  return lines.join('\n')
}

export function missionReportSummary(report: GuidedDemoReport) {
  const final = report.final_decision
  return [
    `Ghost Beam Mission Report: ${report.demo_title}`,
    report.executive_summary,
    `Naive action: ${formatAction(report.naive_proposal)}.`,
    `Top eLog: ${report.top_elog_match?.title ?? 'not recorded'} (${formatOptional(report.top_elog_match?.similarity, 2)}).`,
    `Final decision: ${final?.decision ?? 'not recorded'}; final trust ${final?.trust_state ?? 'not recorded'}; OOD ${formatOptional(final?.ood_score, 2)}.`,
    syntheticDisclosure,
  ].join('\n')
}

export function downloadTextFile(filename: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function formatOptional(value: number | undefined, digits = 2) {
  return value === undefined || Number.isNaN(value) ? 'not recorded' : formatNumber(value, digits)
}

function formatAction(action: ProposedAction | null) {
  if (!action) return 'not recorded'
  const deltas = Object.entries(action.delta_settings)
    .map(([name, value]) => `${name}=${value >= 0 ? '+' : ''}${Number(value).toFixed(3)}`)
    .join(', ')
  return `${action.intent}${deltas ? ` (${deltas})` : ''}`
}

export function displayDecision(record: DecisionRecord | null) {
  if (!record) return 'Pending'
  return `${decisionLabel(record.gate_decision.decision)} / Twin ${twinTrustDisplay(record)}`
}
