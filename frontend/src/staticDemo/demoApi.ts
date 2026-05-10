import type {
  BenchmarkResult,
  DataSourcesRegistryResponse,
  DataSourcesSummaryResponse,
  DecisionRecord,
  DemoHealthCheckResult,
  EvidenceBundleResponse,
  ExperimentApplyResult,
  ExperimentState,
  GateDecision,
  MachineSettings,
  MissionReportResponse,
  PlatformAdaptersResponse,
  PlatformCapabilitiesResponse,
  PlatformVersionResponse,
  ProposedAction,
  PublicDataAnalysisArtifact,
  PublicDataImportResponse,
  PublicDataSourcesResponse,
  RecordedRunLoadResponse,
  RecordedRunsResponse,
  RecordedRunStepResponse,
  ReplayArtifact,
  ScenarioLoad,
  ScenarioSummary,
  TrustState,
  VirtualDiagnosticResult,
  VisionDiagnosticResult,
} from '../api/client'

const timestamp = () => new Date().toISOString()

const scenarios: ScenarioLoad[] = [
  {
    scenario_id: 'green_zone',
    description: 'Trusted operating region with a small safe quadrupole trim.',
    drift: 0.05,
    current_settings: { quad_1: 0.1, quad_2: -0.05, steer_x: 0, steer_y: 0, rf_phase: 0, rf_amplitude: 1 },
    proposed_action: { intent: 'small green-envelope quad_1 trim', delta_settings: { quad_1: 0.03 }, source: 'scenario' },
    expected_behavior: 'APPROVE',
  },
  {
    scenario_id: 'drifted_twin',
    description: 'Aging injector drift places the state outside the virtual diagnostic trust envelope.',
    drift: 1.45,
    current_settings: { quad_1: 0.35, quad_2: -0.25, steer_x: 0, steer_y: 0, rf_phase: 0.4, rf_amplitude: 1 },
    proposed_action: { intent: 'increase quad_2 to improve diffuse beam halo', delta_settings: { quad_2: 0.25 }, source: 'scenario' },
    expected_behavior: 'REQUEST_CALIBRATION',
  },
  {
    scenario_id: 'elog_conflict',
    description: 'A plausible optics action conflicts with similar synthetic operator-memory evidence.',
    drift: 0.62,
    current_settings: { quad_1: 0.22, quad_2: 0.18, steer_x: 0.01, steer_y: -0.01, rf_phase: 0.18, rf_amplitude: 1 },
    proposed_action: { intent: 'increase quad_2 despite prior halo warning', delta_settings: { quad_2: 0.18 }, source: 'scenario' },
    expected_behavior: 'REQUIRE_HUMAN_REVIEW',
  },
  {
    scenario_id: 'unsafe_write',
    description: 'Naive action violates hard PV limits.',
    drift: 0.1,
    current_settings: { quad_1: 1.95, quad_2: 0, steer_x: 0, steer_y: 0, rf_phase: 0, rf_amplitude: 1 },
    proposed_action: { intent: 'unsafe hard-limit quadrupole probe', delta_settings: { quad_1: 99 }, source: 'scenario' },
    expected_behavior: 'BLOCK',
  },
  {
    scenario_id: 'calibration_recovery',
    description: 'Calibration restores trust enough for a small RF correction.',
    drift: 1.1,
    current_settings: { quad_1: 0.2, quad_2: -0.16, steer_x: 0, steer_y: 0, rf_phase: 0.35, rf_amplitude: 1 },
    proposed_action: { intent: 'verify calibration before RF correction', delta_settings: { rf_phase: -0.25 }, source: 'scenario' },
    expected_behavior: 'REQUEST_CALIBRATION then APPROVE_SMALL_STEP',
  },
]

const scenarioById = new Map(scenarios.map((scenario) => [scenario.scenario_id, scenario]))

let currentScenario = 'green_zone'
let stepNumber = 0
let calibrationFreshness = 0
let latestAction: ProposedAction = { ...scenarios[0].proposed_action }
let latestRecord: DecisionRecord | null = null
let latestRecordId: string | null = null
let recordCounter = 0
let history: ExperimentState['history'] = []

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function scenario(id = currentScenario): ScenarioLoad {
  return clone(scenarioById.get(id) ?? scenarios[0])
}

function decisionFor(scenarioId: string, action: ProposedAction): GateDecision {
  const touchesHardLimit = Object.values(action.delta_settings).some((value) => Math.abs(value) > 10)
  if (touchesHardLimit || scenarioId === 'unsafe_write') {
    return {
      decision: 'BLOCK',
      reasons: ['hard PV limit violation', 'simulated hardware writes remain disabled outside the policy envelope'],
      safe_next_step: 'Reject the write and keep the simulated machine state unchanged.',
      human_approval_required: true,
      approved_delta_settings: {},
      blocked_delta_settings: action.delta_settings,
    }
  }
  if (scenarioId === 'elog_conflict') {
    return {
      decision: 'REQUIRE_HUMAN_REVIEW',
      reasons: ['synthetic eLog memory conflicts with the proposed action', 'similar diffuse-beam case worsened halo'],
      safe_next_step: 'Pause autonomy and ask an operator to review the evidence.',
      human_approval_required: true,
      approved_delta_settings: {},
      blocked_delta_settings: action.delta_settings,
    }
  }
  if ((scenarioId === 'drifted_twin' || scenarioId === 'calibration_recovery') && calibrationFreshness < 1) {
    return {
      decision: 'REQUEST_CALIBRATION',
      reasons: ['virtual diagnostic is outside its trusted envelope', 'OOD is high for the current synthetic twin state'],
      safe_next_step: 'Acquire one synthetic calibration screen before allowing an autonomous write.',
      human_approval_required: false,
      approved_delta_settings: {},
      blocked_delta_settings: action.delta_settings,
    }
  }
  if (scenarioId === 'calibration_recovery' || action.delta_settings.rf_phase !== undefined) {
    return {
      decision: 'APPROVE_SMALL_STEP',
      reasons: ['calibration freshness restored twin trust', 'RF correction is clipped to a safer small step'],
      safe_next_step: 'Apply approved small simulated correction and continue monitoring.',
      human_approval_required: false,
      approved_delta_settings: { rf_phase: Math.max(-0.35, Math.min(0.35, action.delta_settings.rf_phase ?? -0.25)) },
      blocked_delta_settings: {},
    }
  }
  return {
    decision: 'APPROVE',
    reasons: ['trust state GREEN', 'no hard limit or eLog conflict'],
    safe_next_step: 'Apply approved simulated action.',
    human_approval_required: false,
    approved_delta_settings: action.delta_settings,
    blocked_delta_settings: {},
  }
}

function trustFor(decision: GateDecision): TrustState {
  if (decision.decision === 'APPROVE') return 'GREEN'
  if (decision.decision === 'BLOCK' || decision.decision === 'REQUEST_CALIBRATION') return 'RED'
  return 'YELLOW'
}

function virtualDiagnostic(decision: GateDecision): VirtualDiagnosticResult {
  const trust = trustFor(decision)
  const ood = trust === 'GREEN' ? 1.28 : trust === 'YELLOW' ? 3.74 : 10.74
  return {
    predicted_quality: trust === 'GREEN' ? 0.82 : trust === 'YELLOW' ? 0.64 : 0.44,
    predicted_size_x: trust === 'GREEN' ? 0.18 : 0.24,
    predicted_size_y: trust === 'GREEN' ? 0.19 : 0.25,
    predicted_beam_loss: trust === 'GREEN' ? 0.012 : trust === 'YELLOW' ? 0.021 : 0.19,
    uncertainty: trust === 'GREEN' ? 0.018 : trust === 'YELLOW' ? 0.046 : 0.14,
    ood_score: ood,
    trust_state: trust,
    reasons: decision.reasons,
  }
}

function visionDiagnostic(decision: GateDecision): VisionDiagnosticResult {
  const trust = trustFor(decision)
  return {
    centroid_x: trust === 'GREEN' ? 0.02 : 0.12,
    centroid_y: trust === 'GREEN' ? -0.01 : -0.16,
    sigma_x: trust === 'GREEN' ? 0.18 : 0.24,
    sigma_y: trust === 'GREEN' ? 0.19 : 0.25,
    ellipticity: trust === 'GREEN' ? 0.06 : 0.18,
    halo_score: trust === 'GREEN' ? 0.04 : 0.31,
    clipping_score: decision.decision === 'BLOCK' ? 0.32 : 0.02,
    labels: trust === 'GREEN' ? ['CENTERED'] : decision.decision === 'BLOCK' ? ['INTERLOCK', 'CLIPPED'] : ['HALO', 'UNCERTAIN'],
  }
}

function elogHits(scenarioId: string, decision: GateDecision): DecisionRecord['elog_hits'] {
  if (scenarioId === 'drifted_twin') {
    return [{
      date: '2026-04-23T14:31:00Z',
      title: 'Diffuse beam spot after quad_2 drift',
      text: 'Synthetic eLog: similar diffuse-beam case was corrected by RF phase calibration, not by increasing quad_2.',
      recommended_action: 'Request calibration, then approve only a small RF correction.',
      similarity: 0.87,
      risk_tags: ['drifted_twin', 'rf_phase', 'halo'],
    }]
  }
  if (scenarioId === 'elog_conflict') {
    return [{
      date: '2026-04-22T09:12:00Z',
      title: 'Operator memory conflict: quad correction worsened halo',
      text: 'Synthetic eLog: same correction family increased halo during a similar optics state.',
      recommended_action: 'Require human review before allowing the write.',
      similarity: 0.82,
      risk_tags: ['operator_memory', 'halo', 'human_review'],
    }]
  }
  if (decision.decision === 'BLOCK') {
    return [{
      date: '2026-04-21T18:44:00Z',
      title: 'Hard PV limit policy',
      text: 'Synthetic policy memory: do not apply writes that exceed configured PV limits.',
      recommended_action: 'Block and keep state unchanged.',
      similarity: 0.76,
      risk_tags: ['hard_limit', 'interlock'],
    }]
  }
  return [{
    date: '2026-04-20T15:20:00Z',
    title: 'Quad_1 safe small step',
    text: 'Synthetic eLog: approve small green-envelope quad_1 changes.',
    recommended_action: 'Apply small simulated trim and monitor.',
    similarity: 0.71,
    risk_tags: ['green_zone', 'low_risk'],
  }]
}

function buildRecord(action = latestAction, scenarioId = currentScenario): DecisionRecord {
  const active = scenario(scenarioId)
  const gate = decisionFor(scenarioId, action)
  return {
    scenario_id: scenarioId,
    current_settings: active.current_settings,
    safe_signals: safeSignals(active.current_settings),
    proposed_action: clone(action),
    virtual_diagnostic: virtualDiagnostic(gate),
    vision_diagnostic: visionDiagnostic(gate),
    elog_hits: elogHits(scenarioId, gate),
    gate_decision: gate,
    simulated_outcome_if_applied: {
      beam_quality: gate.decision === 'BLOCK' ? 0.22 : gate.decision === 'REQUEST_CALIBRATION' ? 0.44 : 0.83,
      beam_size_x: 0.18,
      beam_size_y: 0.19,
      beam_loss: gate.decision === 'BLOCK' ? 0.46 : gate.decision === 'REQUEST_CALIBRATION' ? 0.19 : 0.02,
      emittance_proxy: 0.16,
    },
  }
}

function safeSignals(settings: MachineSettings): Record<string, number> {
  return {
    bpm_x_1: Number((settings.steer_x * 0.4 + 0.012).toFixed(4)),
    bpm_y_1: Number((settings.steer_y * 0.4 - 0.013).toFixed(4)),
    bpm_x_2: Number((settings.steer_x * 0.6 + 0.024).toFixed(4)),
    bpm_y_2: Number((settings.steer_y * 0.6 - 0.016).toFixed(4)),
    charge: 0.91,
    temperature: 34.1,
    rf_readback: Number((1 + settings.rf_phase * 0.002).toFixed(4)),
    beam_current_proxy: 0.82,
  }
}

function deviceRegistry(settings: MachineSettings): ExperimentState['device_registry'] {
  return [
    { id: 'Q7FF1', type: 'quadrupole', pv: 'quad_1', value: settings.quad_1, unit: '1/m', min: -2, max: 2, max_delta: 0.15, position: [0, 0, -3.35] },
    { id: 'Q7FF2', type: 'quadrupole', pv: 'quad_2', value: settings.quad_2, unit: '1/m', min: -2, max: 2, max_delta: 0.15, position: [0, 0, -1.55] },
    { id: 'STEER07-X', type: 'steerer', pv: 'steer_x', value: settings.steer_x, unit: 'mrad', min: -1, max: 1, max_delta: 0.1, position: [0, 0, -0.55] },
    { id: 'STEER07-Y', type: 'steerer', pv: 'steer_y', value: settings.steer_y, unit: 'mrad', min: -1, max: 1, max_delta: 0.1, position: [0, 0, 0.35] },
    { id: 'RFCAV07', type: 'rf_cavity', pv: 'rf_phase', value: settings.rf_phase, unit: 'deg', min: -10, max: 10, max_delta: 1, position: [0, 0, 1.3] },
    { id: 'BPM07-06', type: 'bpm', pv: 'bpm_x_2', value: 0.024, unit: 'mm', min: null, max: null, max_delta: null, position: [0, 0, 2.55] },
    { id: 'BCM07-03', type: 'bcm', pv: 'beam_current_proxy', value: 0.82, unit: 'a.u.', min: null, max: null, max_delta: null, position: [0, 0, 3.55] },
    { id: 'OTR07', type: 'diagnostic_screen', pv: 'beam_quality', value: 0.83, unit: 'a.u.', min: null, max: null, max_delta: null, position: [0, 0, 4.55] },
  ]
}

function trajectory(decision?: GateDecision): [number, number, number][] {
  const red = decision?.decision === 'REQUEST_CALIBRATION' || decision?.decision === 'BLOCK'
  return Array.from({ length: 15 }, (_, index) => {
    const z = -4.8 + index * 0.685
    const offset = red ? Math.sin(index / 4) * 0.08 : Math.sin(index / 5) * 0.018
    return [Number(offset.toFixed(4)), Number((-offset * 0.55).toFixed(4)), Number(z.toFixed(4))]
  })
}

function beamProfile(): number[][] {
  return Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => {
    const dx = (x - 8) / 3.2
    const dy = (y - 8) / 3.2
    return Number(Math.exp(-0.5 * (dx * dx + dy * dy)).toFixed(4))
  }))
}

function currentState(): ExperimentState {
  const active = scenario()
  const decision = latestRecord?.gate_decision
  return {
    scenario_id: currentScenario,
    data_source: currentScenario === 'recorded_fixture' ? 'recorded_fixture' : 'synthetic_live_twin',
    recorded_run_id: null,
    recorded_step: null,
    recorded_manifest: null,
    step_number: stepNumber,
    drift: active.drift,
    calibration_freshness: calibrationFreshness,
    current_settings: active.current_settings,
    safe_signals: safeSignals(active.current_settings),
    beam_truth: {
      beam_quality: decision?.decision === 'BLOCK' ? 0.24 : decision?.decision === 'REQUEST_CALIBRATION' ? 0.44 : 0.83,
      beam_size_x: 0.18,
      beam_size_y: 0.19,
      beam_loss: decision?.decision === 'BLOCK' ? 0.45 : decision?.decision === 'REQUEST_CALIBRATION' ? 0.19 : 0.02,
      emittance_proxy: 0.16,
    },
    latest_proposed_action: clone(latestAction),
    latest_decision_record_id: latestRecordId,
    latest_decision_record: latestRecord ? clone(latestRecord) : null,
    latest_diagnostic: latestRecord?.virtual_diagnostic ? clone(latestRecord.virtual_diagnostic) : null,
    latest_vision_diagnostic: latestRecord?.vision_diagnostic ? clone(latestRecord.vision_diagnostic) : null,
    latest_elog_hits: latestRecord?.elog_hits ? clone(latestRecord.elog_hits) : [],
    latest_gate_decision: latestRecord?.gate_decision ? clone(latestRecord.gate_decision) : null,
    history: clone(history),
    trajectory: trajectory(decision),
    beam_profile: beamProfile(),
    device_registry: deviceRegistry(active.current_settings),
  }
}

function storeRecord(record: DecisionRecord) {
  recordCounter += 1
  latestRecord = record
  latestRecordId = `STATIC-DR-${String(recordCounter).padStart(4, '0')}`
}

function appendHistory(kind: string, title: string, payload: Record<string, unknown> = {}) {
  history = [{ step: stepNumber, timestamp: timestamp(), kind, title, payload }, ...history].slice(0, 80)
}

function start(id: string): ExperimentState {
  const active = scenario(id)
  currentScenario = active.scenario_id
  stepNumber = 0
  calibrationFreshness = 0
  latestAction = clone(active.proposed_action)
  history = []
  const record = buildRecord(latestAction, currentScenario)
  storeRecord(record)
  appendHistory('scenario_start', `Static demo loaded ${currentScenario}`, { expected_behavior: active.expected_behavior })
  appendHistory('evaluate', `Static Ghost Beam decision: ${record.gate_decision.decision}`, { decision: record.gate_decision.decision })
  return currentState()
}

export async function fetchHealth() {
  return { status: 'ok', service: 'ghost-beam-static-demo' }
}

export async function fetchScenarios(): Promise<ScenarioSummary[]> {
  return scenarios.map(({ scenario_id, description, expected_behavior }) => ({ scenario_id, description, expected_behavior }))
}

export async function loadScenario(scenarioId: string): Promise<ScenarioLoad> {
  return scenario(scenarioId)
}

export async function startExperiment(scenarioId: string): Promise<ExperimentState> {
  return start(scenarioId)
}

export async function fetchExperimentState(): Promise<ExperimentState> {
  if (!latestRecord) start(currentScenario)
  return currentState()
}

export async function proposeExperimentAction(request: { intent: string; source?: ProposedAction['source']; delta_settings?: Record<string, number> }): Promise<ProposedAction> {
  latestAction = request.delta_settings
    ? { intent: request.intent, source: request.source ?? 'optimizer', delta_settings: request.delta_settings }
    : clone(scenario().proposed_action)
  appendHistory('propose', `Static proposal: ${latestAction.intent}`, latestAction as unknown as Record<string, unknown>)
  return clone(latestAction)
}

export async function evaluateExperimentAction(action: ProposedAction): Promise<DecisionRecord> {
  latestAction = clone(action)
  const record = buildRecord(action)
  storeRecord(record)
  appendHistory('evaluate', `Static Ghost Beam decision: ${record.gate_decision.decision}`, { decision: record.gate_decision.decision })
  return clone(record)
}

export async function applyExperimentAction(): Promise<ExperimentApplyResult> {
  if (!latestRecord || !['APPROVE', 'APPROVE_SMALL_STEP'].includes(latestRecord.gate_decision.decision)) {
    return { applied: false, reason: 'Static demo: action is not applyable.', state: currentState() }
  }
  stepNumber += 1
  latestAction = { intent: 'post-apply verification monitor', delta_settings: {}, source: 'scenario' }
  const record = buildRecord(latestAction)
  storeRecord(record)
  appendHistory('apply', 'Static approved simulated action applied', { decision: latestRecord.gate_decision.decision })
  return { applied: true, applied_delta_settings: latestRecord.gate_decision.approved_delta_settings, state: currentState() }
}

export async function calibrateExperiment() {
  calibrationFreshness = 1
  stepNumber += 1
  latestAction = { intent: 'post-calibration RF correction verification', delta_settings: { rf_phase: -0.25 }, source: 'scenario' }
  const record = buildRecord(latestAction)
  storeRecord(record)
  appendHistory('calibration', 'Static synthetic calibration screen acquired', { ood_after: 2.74 })
  return { calibration_applied: true, measurement: { ood_before: 9.74, ood_after: 2.74, source: 'static_fixture' }, state: currentState() }
}

export async function resetExperiment(): Promise<ExperimentState> {
  return start(currentScenario)
}

export async function exportExperiment() {
  return {
    exported_at: timestamp(),
    engine: 'ghost-beam-static-demo',
    schema_version: '0.1.0',
    scenario_id: currentScenario,
    state: currentState(),
    decision_records: latestRecordId && latestRecord ? { [latestRecordId]: latestRecord } : {},
    history,
    synthetic_data_disclosure: 'Static visual demo uses embedded synthetic fixtures. No backend or hardware writes are active.',
  }
}

export async function runDryRunHealthCheck(): Promise<DemoHealthCheckResult> {
  const items = [
    ['backend', 'Static demo shell', 'Fixture API is available in browser memory.'],
    ['scenarios', 'Scenario fixtures', 'Local scenario fixtures are loaded.'],
    ['green', 'Green-zone evaluate/apply', 'Green-zone fixture returns APPROVE.'],
    ['unsafe', 'Unsafe write blocks', 'Unsafe-write fixture returns BLOCK.'],
    ['drift', 'Drifted twin calibrates', 'Drifted fixture requests calibration.'],
    ['elog', 'eLog conflict path', 'eLog fixture requires human review.'],
    ['export', 'Session export works', 'Static export fixture can be downloaded.'],
  ] as const
  return {
    checked_at: timestamp(),
    dry_run: true,
    mutates_active_session: false,
    active_session: { scenario_id: currentScenario, static_demo: true },
    summary: { status: 'pass', passed: items.length, total: items.length },
    items: items.map(([id, label, detail]) => ({ id, label, detail, status: 'pass' as const })),
  }
}

export async function runBenchmark(): Promise<BenchmarkResult> {
  return {
    benchmark_id: 'STATIC-BENCHMARK-50',
    created_at: timestamp(),
    benchmark_version: '0.1.0-static',
    name: 'Static Naive Optimizer vs Ghost Beam Benchmark',
    summary: 'Across 50 synthetic fixture trials, Ghost Beam prevented or modified 41 risky naive actions while allowing 9 safe actions.',
    metrics: {
      total_trials: 50,
      naive_actions_applied: 50,
      ghostbeam_approved: 9,
      ghostbeam_approved_small_step: 0,
      ghostbeam_blocked: 9,
      ghostbeam_requested_calibration: 16,
      ghostbeam_required_human_review: 16,
      hard_limit_violations_prevented: 9,
      elog_conflicts_caught: 16,
      unsafe_actions_prevented: 41,
      average_naive_projected_quality: 0.6381,
      average_ghostbeam_projected_quality: 0.7038,
      average_naive_projected_beam_loss: 0.1874,
      average_ghostbeam_projected_beam_loss: 0.0206,
      average_ood_before_calibration: 9.741,
      average_ood_after_calibration: 2.741,
      percent_actions_modified_or_blocked: 82,
      percent_safe_actions_allowed: 18,
      benchmark_runtime_ms: 0,
    },
    trial_table: [
      { category: 'green safe trim', naive_decision: 'APPLY', ghostbeam_decision: 'APPROVE' },
      { category: 'unsafe hard-limit action', naive_decision: 'APPLY', ghostbeam_decision: 'BLOCK' },
      { category: 'drifted twin', naive_decision: 'APPLY', ghostbeam_decision: 'REQUEST_CALIBRATION' },
      { category: 'eLog conflict', naive_decision: 'APPLY', ghostbeam_decision: 'REQUIRE_HUMAN_REVIEW' },
    ],
    top_interventions: [
      { rank: 1, intervention: 'Blocked hard-limit quadrupole write', impact: 'Prevented unsafe simulated PV write.' },
      { rank: 2, intervention: 'Requested calibration for drifted twin', impact: 'Reduced OOD from 9.74 to 2.74.' },
      { rank: 3, intervention: 'Required human review for eLog conflict', impact: 'Surfaced operator-memory risk.' },
    ],
    synthetic_data_disclosure: 'Static benchmark uses embedded synthetic fixture metrics.',
  }
}

export async function fetchLatestBenchmark() { return runBenchmark() }

export async function fetchDriftedTwinReplay(): Promise<ReplayArtifact> {
  return {
    replay_id: 'static-drifted-twin-replay',
    artifact_type: 'static_replay_fixture',
    created_for: 'GitHub Pages visual demo',
    disclosure: 'Replay artifact is static and read-only.',
    sequence: ['Nominal Baseline', 'Drift Appears', 'Naive Proposal', 'Ghost Beam Evaluation', 'Calibration', 'Safer Correction', 'Export Artifact']
      .map((title, index) => ({ step: index, title, note: 'Static visual demo step.' })),
  }
}

export async function generateBackendMissionReport(): Promise<MissionReportResponse> {
  const report = {
    report_id: `STATIC-REPORT-${Date.now()}`,
    demo_title: 'Static Drifted Twin Test',
    synthetic_data_disclosure: 'Static visual demo uses embedded synthetic fixtures.',
    executive_summary: 'Ghost Beam requests calibration when the twin is drifted, then approves a safer correction after trust is restored.',
  }
  return {
    report_id: report.report_id,
    created_at: timestamp(),
    report_source: 'static fixture',
    json: report,
    markdown: `# Ghost Beam Static Mission Report\n\n${report.executive_summary}\n`,
    filename_suggestions: { json: 'ghostbeam_static_report.json', markdown: 'ghostbeam_static_report.md' },
    paths: { json: 'static://mission-report.json', markdown: 'static://mission-report.md' },
  }
}

export async function exportEvidenceBundle(): Promise<EvidenceBundleResponse> {
  const bundle = {
    bundle_id: `STATIC-BUNDLE-${Date.now()}`,
    created_at: timestamp(),
    data_source: 'static_visual_demo',
    latest_decision_record: latestRecord,
    latest_benchmark: await runBenchmark(),
    data_sources_registry: await fetchDataSourcesRegistry(),
    README_BUNDLE: 'Static GitHub Pages evidence bundle preview. Use Render for live backend artifacts.',
  }
  return {
    exported: true,
    bundle_id: bundle.bundle_id,
    created_at: bundle.created_at,
    filename: 'ghostbeam_static_evidence_bundle.json',
    path: 'static://ghostbeam_static_evidence_bundle.json',
    bundle,
  }
}

export async function fetchPlatformAdapters(): Promise<PlatformAdaptersResponse> {
  return {
    active_adapter_id: 'static_fixture_adapter',
    adapters: [
      { id: 'static_fixture_adapter', name: 'Static Fixture Adapter', status: 'active_static_demo', read_enabled: true, write_enabled: false, real_hardware: false, description: 'Browser-local fixture adapter for GitHub Pages.' },
      { id: 'epics_archiver_stub', name: 'EPICS Archiver Read-Only Stub', status: 'disabled', read_enabled: false, write_enabled: false, real_hardware: false, description: 'Future archived PV connector shape. No network calls.' },
    ],
  }
}

export async function fetchPlatformCapabilities(): Promise<PlatformCapabilitiesResponse> {
  return {
    adapter_mode: 'static_visual_demo',
    real_hardware_writes_enabled: false,
    capabilities: {
      experiment_runner: 'fixture_mode',
      benchmark: true,
      mission_report: true,
      evidence_bundle: true,
      recorded_run_ingestion: true,
      public_data_registry: true,
      static_demo_mode: true,
    },
    public_data_adapters: ['boostr', 'fermilab_bpm_ipm'],
    public_data_status: await fetchPublicDataSources(),
    safety_notice: 'Static GitHub Pages mode is read-only and cannot write to hardware.',
  }
}

export async function fetchSyntheticDataManifest() {
  return {
    manifest_id: 'static-synthetic-data-manifest',
    disclosure: 'Embedded synthetic fixture data only. No real facility data.',
    generated_by: 'Ghost Beam static visual demo',
  }
}

export async function fetchDecisionRecordSchema() {
  return { $schema: 'https://json-schema.org/draft/2020-12/schema', title: 'Ghost Beam Decision Record', version: '0.1.0-static' }
}

export async function fetchPlatformVersion(): Promise<PlatformVersionResponse> {
  return {
    app_name: 'Ghost Beam',
    version: '0.1.0-static',
    schema_version: '0.1.0',
    backend_started_at: timestamp(),
    route_groups_available: ['static-fixtures'],
    adapter_mode: 'static_visual_demo',
    real_hardware_writes_enabled: false,
    synthetic_data_manifest_available: true,
    report_persistence_enabled: false,
    benchmark_enabled: true,
    evidence_bundle_enabled: true,
    replay_enabled: true,
    recorded_run_ingestion_enabled: true,
    public_data_adapters_enabled: true,
    public_data_adapters: ['boostr', 'fermilab_bpm_ipm'],
    boostr_manifest_available: true,
    data_sources_registry_enabled: true,
    epics_archiver_stub_enabled: true,
    standards_manifests_enabled: true,
    safety_notice: 'Static visual demo. Use Render for backend-powered operation.',
  }
}

export async function fetchRecordedRuns(): Promise<RecordedRunsResponse> {
  return {
    data_source: 'static_recorded_fixture',
    disclosure: 'Recorded fixture is synthetic and embedded for static demo mode.',
    runs: [{ run_id: 'sample_recorded_drifted_twin', title: 'Sample Recorded Drifted Twin', description: 'Synthetic recorded-run fixture preview.', source: 'static_fixture', disclosure: 'No real facility data.', steps: 7 }],
  }
}

export async function loadRecordedRun(runId: string): Promise<RecordedRunLoadResponse> {
  currentScenario = 'drifted_twin'
  calibrationFreshness = 0
  const state = start('drifted_twin')
  state.data_source = 'recorded_fixture'
  state.recorded_run_id = runId
  state.recorded_step = 0
  return {
    run_id: runId,
    loaded_step: 0,
    manifest: { run_id: runId, source: 'static_recorded_fixture' },
    available_steps: [0, 1, 2, 3, 4, 5, 6],
    recorded_elogs: elogHits('drifted_twin', state.latest_gate_decision!).map((entry) => ({ ...entry })),
    state,
  }
}

export async function evaluateRecordedRunStep(runId: string, step: number): Promise<RecordedRunStepResponse> {
  const state = start('drifted_twin')
  state.data_source = 'recorded_fixture'
  state.recorded_run_id = runId
  state.recorded_step = step
  return {
    run_id: runId,
    step,
    row: { step: String(step), event_type: 'static_fixture_step' },
    manifest: { run_id: runId, source: 'static_recorded_fixture' },
    recorded_elogs: elogHits('drifted_twin', state.latest_gate_decision!).map((entry) => ({ ...entry })),
    decision_record_id: state.latest_decision_record_id,
    decision_record: state.latest_decision_record!,
    state,
    disclosure: 'Static recorded fixture generated from synthetic Ghost Beam data.',
  }
}

export async function fetchPublicDataSources(): Promise<PublicDataSourcesResponse> {
  return {
    adapters_enabled: true,
    latest_public_data_artifact: null,
    sources: [{
      dataset_id: 'boostr',
      name: 'BOOSTR: A Dataset for Accelerator Control Systems',
      facility: 'Fermilab Booster',
      doi: '10.5281/zenodo.4382663',
      license: 'CC BY 4.0',
      status: 'not_installed',
      default_local_path: 'backend/data/public_datasets/boostr/local_sample.csv',
      local_slices: [],
      disclosure: 'Static mode does not bundle or download BOOSTR data. Local slices are supported only in the full Render/local backend.',
    }],
  }
}

export async function importBoostrLocal(): Promise<PublicDataImportResponse> {
  return {
    run_id: '',
    dataset_id: 'boostr',
    source_path: 'backend/data/public_datasets/boostr/local_sample.csv',
    row_count: 0,
    stored_row_count: 0,
    column_list: [],
    timestamp_range: null,
    detected_numeric_signals: [],
    mapping_status: 'NO_LOCAL_SLICE',
    import_status: 'NO_LOCAL_SLICE',
    decision: 'NO_LOCAL_SLICE',
    allowed_actions: ['WINDOW_OK', 'ANALYZE', 'FLAG_FOR_REVIEW', 'IMPORT_ERROR', 'NO_LOCAL_SLICE'],
    disclosure: 'Static GitHub Pages mode is read-only and has no local BOOSTR slice installed.',
  }
}

export async function evaluateBoostrWindow(): Promise<PublicDataAnalysisArtifact> {
  return {
    artifact_type: 'PublicDataAnalysisRecord',
    schema_version: '0.1.0-static',
    run_id: 'static_boostr_window',
    dataset_id: 'boostr',
    data_source: 'public_boostr',
    created_at: timestamp(),
    window: { start_index: 0, window_size: 100 },
    numeric_metrics: { device_01: { mean: 0.12, std: 0.03 }, device_02: { mean: -0.04, std: 0.02 } },
    anomaly_score: 0.18,
    trust_score: 0.82,
    trust_assessment: 'WINDOW_OK',
    decision: 'WINDOW_OK',
    recommended_action: 'Read-only public-data analysis only. No apply path exists.',
    policy_language: 'Recorded public data analysis only - no writes permitted.',
    allowed_actions: ['WINDOW_OK', 'ANALYZE', 'FLAG_FOR_REVIEW', 'IMPORT_ERROR', 'NO_LOCAL_SLICE'],
    writes_allowed: false,
    hardware_write_permitted: false,
    disclosure: 'Static BOOSTR-shaped analysis preview. No dataset is bundled or downloaded.',
  }
}

export async function fetchDataSourcesSummary(): Promise<DataSourcesSummaryResponse> {
  return {
    core_demo_sources: ['synthetic_jax_twin', 'synthetic_recorded_fixture'],
    public_dataset_adapters: ['boostr', 'fermilab_bpm_ipm'],
    facility_connector_stubs: ['epics_archiver_stub', 'pyarchappl_compatible'],
    artifact_standards: ['openpmd', 'ro_crate'],
    validation_standards: ['frictionless'],
    future_extensions: ['workflowhub', 'materials_project'],
    active_sources: ['static_visual_demo', 'ro_crate'],
    counts_by_category: { core_demo: 2, public_dataset: 2, facility_connector: 2, artifact_standard: 2, validation_standard: 1, future_extension: 2 },
    no_real_hardware: true,
    no_runtime_downloads: true,
    no_external_runtime_calls: true,
    evidence_bundle_includes_registry: true,
  }
}

export async function fetchDataSourcesRegistry(): Promise<DataSourcesRegistryResponse> {
  const summary = await fetchDataSourcesSummary()
  return {
    registry_version: '0.1.0-static',
    generated_at: timestamp(),
    safety_disclosure: 'Static data-source registry. External sources are read-only manifests or disabled stubs.',
    summary,
    sources: [
      { id: 'synthetic_jax_twin', name: 'Synthetic JAX Digital Twin', category: 'core_demo', role: 'live demo fixture preview', status: 'active_static_fixture', active: true, writes_allowed: 'simulated_only', local_only: true, runtime_network_required: false, description: 'Static representation of Ghost Beam synthetic twin output.', safety_disclosure: 'No real hardware.' },
      { id: 'boostr', name: 'BOOSTR: A Dataset for Accelerator Control Systems', category: 'public_dataset', role: 'public accelerator-control local-slice adapter', status: 'adapter_ready', active: false, writes_allowed: false, local_only: true, runtime_network_required: false, doi: '10.5281/zenodo.4382663', license: 'CC BY 4.0', expected_format: 'local CSV/parquet slice', description: 'Public dataset adapter path. No full dataset is bundled.', safety_disclosure: 'Read-only; no hardware writes.' },
      { id: 'fermilab_bpm_ipm', name: 'Fermilab BPM/IPM Booster diagnostics dataset', category: 'public_dataset', role: 'beam diagnostics manifest', status: 'manifest_ready', active: false, writes_allowed: false, local_only: true, runtime_network_required: false, doi: '10.5281/zenodo.17429707', description: 'Manifest-only public diagnostics source.', safety_disclosure: 'No files bundled.' },
      { id: 'epics_archiver_stub', name: 'EPICS Archiver Appliance read-only connector stub', category: 'facility_connector', role: 'future archived PV retrieval', status: 'stub_disabled', active: false, writes_allowed: false, local_only: true, runtime_network_required: false, description: 'Disabled interface shape only.', safety_disclosure: 'No network calls.' },
      { id: 'ro_crate', name: 'RO-Crate evidence bundle', category: 'artifact_standard', role: 'evidence/provenance packaging', status: 'active', active: true, writes_allowed: false, local_only: true, runtime_network_required: false, description: 'Evidence bundle metadata layer.', safety_disclosure: 'Artifact standard only.' },
      { id: 'frictionless', name: 'Frictionless Data validation', category: 'validation_standard', role: 'tabular validation status', status: 'manifest_ready', active: false, writes_allowed: false, local_only: true, runtime_network_required: false, description: 'Validation status layer.', safety_disclosure: 'No external calls.' },
      { id: 'openpmd', name: 'openPMD compatibility', category: 'artifact_standard', role: 'future beam physics artifact compatibility', status: 'manifest_ready', active: false, writes_allowed: false, local_only: true, runtime_network_required: false, description: 'Manifest-only compatibility layer.', safety_disclosure: 'No hardware writes.' },
      { id: 'workflowhub', name: 'WorkflowHub / Workflow RO-Crate', category: 'future_extension', role: 'future workflow publication compatibility', status: 'manifest_ready', active: false, writes_allowed: false, local_only: true, runtime_network_required: false, description: 'Future workflow registry compatibility.', safety_disclosure: 'Inactive in demo.' },
      { id: 'materials_project', name: 'Materials Project', category: 'future_extension', role: 'future materials context adapter', status: 'manifest_ready', active: false, writes_allowed: false, local_only: true, runtime_network_required: false, description: 'Future Genesis context only; not accelerator control.', safety_disclosure: 'No API key or runtime call.' },
    ],
  }
}

export async function fetchRegistry() {
  return { pvs: deviceRegistry(scenario().current_settings) }
}

export async function fetchLatestArtifact() {
  return { latest_decision_record: latestRecord, static_demo: true }
}

export async function exportLatestArtifact() {
  return { exported: true, artifact: latestRecord, static_demo: true }
}

export async function evaluateScenario(scenarioLoad: ScenarioLoad) {
  currentScenario = scenarioLoad.scenario_id
  latestAction = clone(scenarioLoad.proposed_action)
  const record = buildRecord(latestAction, currentScenario)
  storeRecord(record)
  return clone(record)
}

export async function applyCalibration() {
  return calibrateExperiment()
}

export async function applySimulated() {
  return { applied: true, current_settings: scenario().current_settings, applied_delta_settings: latestRecord?.gate_decision.approved_delta_settings ?? {} }
}
