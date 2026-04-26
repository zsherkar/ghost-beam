import axios from 'axios'

const baseURL = import.meta.env.VITE_GHOST_BEAM_API ?? 'http://127.0.0.1:8000'

export const api = axios.create({ baseURL, timeout: 60000 })

export type DecisionType =
  | 'APPROVE'
  | 'APPROVE_SMALL_STEP'
  | 'REQUIRE_HUMAN_REVIEW'
  | 'REQUEST_CALIBRATION'
  | 'BLOCK'

export type TrustState = 'GREEN' | 'YELLOW' | 'RED'

export interface MachineSettings {
  quad_1: number
  quad_2: number
  steer_x: number
  steer_y: number
  rf_phase: number
  rf_amplitude: number
}

export interface ProposedAction {
  intent: string
  delta_settings: Record<string, number>
  source: 'human' | 'llm' | 'optimizer' | 'scenario'
}

export interface ScenarioSummary {
  scenario_id: string
  description: string
  expected_behavior: string
}

export interface ScenarioLoad {
  scenario_id: string
  description: string
  drift: number
  current_settings: MachineSettings
  proposed_action: ProposedAction
  expected_behavior: string
}

export interface VirtualDiagnosticResult {
  predicted_quality: number
  predicted_size_x: number
  predicted_size_y: number
  predicted_beam_loss: number
  uncertainty: number
  ood_score: number
  trust_state: TrustState
  reasons: string[]
}

export interface VisionDiagnosticResult {
  centroid_x: number
  centroid_y: number
  sigma_x: number
  sigma_y: number
  ellipticity: number
  halo_score: number
  clipping_score: number
  labels: string[]
}

export interface ElogHit {
  date: string
  title: string
  text: string
  recommended_action: string
  similarity: number
  risk_tags: string[]
}

export interface GateDecision {
  decision: DecisionType
  reasons: string[]
  safe_next_step: string
  human_approval_required: boolean
  approved_delta_settings: Record<string, number>
  blocked_delta_settings: Record<string, number>
}

export interface BeamTruth {
  beam_quality: number
  beam_size_x: number
  beam_size_y: number
  beam_loss: number
  emittance_proxy: number
}

export interface DecisionRecord {
  scenario_id: string
  current_settings: MachineSettings
  safe_signals: Record<string, number>
  proposed_action: ProposedAction
  virtual_diagnostic: VirtualDiagnosticResult
  vision_diagnostic: VisionDiagnosticResult
  elog_hits: ElogHit[]
  gate_decision: GateDecision
  simulated_outcome_if_applied: Record<string, number> | null
}

export interface ExperimentDevice {
  id: string
  type: string
  pv: string
  value: number
  unit: string
  min: number | null
  max: number | null
  max_delta: number | null
  position: [number, number, number]
}

export interface ExperimentEvent {
  step: number
  timestamp: string
  kind: string
  title: string
  payload: Record<string, unknown>
}

export interface ExperimentState {
  scenario_id: string
  step_number: number
  drift: number
  calibration_freshness: number
  current_settings: MachineSettings
  safe_signals: Record<string, number>
  beam_truth: BeamTruth
  latest_proposed_action: ProposedAction | null
  latest_decision_record_id: string | null
  latest_decision_record: DecisionRecord | null
  latest_diagnostic: VirtualDiagnosticResult | null
  latest_vision_diagnostic: VisionDiagnosticResult | null
  latest_elog_hits: ElogHit[]
  latest_gate_decision: GateDecision | null
  history: ExperimentEvent[]
  trajectory: [number, number, number][]
  beam_profile: number[][]
  device_registry: ExperimentDevice[]
}

export interface ExperimentApplyResult {
  applied: boolean
  reason?: string
  applied_delta_settings?: Record<string, number>
  violations?: Record<string, number>
  state: ExperimentState
}

export interface DemoHealthCheckResult {
  checked_at: string
  dry_run: boolean
  mutates_active_session: boolean
  active_session: Record<string, unknown>
  summary: {
    status: 'pass' | 'fail'
    passed: number
    total: number
  }
  items: Array<{
    id: string
    label: string
    status: 'pass' | 'fail'
    detail: string
    expected?: string
    observed?: unknown
  }>
}

export interface PlatformAdapter {
  id: string
  name: string
  status: string
  read_enabled: boolean
  write_enabled: boolean
  real_hardware: boolean
  description: string
}

export interface PlatformAdaptersResponse {
  active_adapter_id: string
  adapters: PlatformAdapter[]
}

export interface PlatformCapabilitiesResponse {
  adapter_mode: string
  real_hardware_writes_enabled: boolean
  capabilities: Record<string, boolean | string | number>
  safety_notice: string
}

export interface MissionReportResponse {
  report_id: string
  created_at: string
  report_source: string
  json: Record<string, unknown>
  markdown: string
  filename_suggestions: {
    json: string
    markdown: string
  }
  paths: {
    json: string
    markdown: string
  }
}

export interface BenchmarkResult {
  benchmark_id: string
  created_at: string
  benchmark_version: string
  name: string
  summary: string
  metrics: Record<string, number | string | null>
  trial_table: Array<Record<string, unknown>>
  top_interventions: Array<Record<string, unknown>>
  synthetic_data_disclosure: string
}

export interface ReplayArtifact {
  replay_id: string
  artifact_type: string
  created_for: string
  disclosure: string
  sequence: Array<Record<string, unknown>>
}

export interface PlatformVersionResponse {
  app_name: string
  version: string
  schema_version: string
  backend_started_at: string
  route_groups_available: string[]
  adapter_mode: string
  real_hardware_writes_enabled: boolean
  synthetic_data_manifest_available: boolean
  report_persistence_enabled: boolean
  benchmark_enabled: boolean
  evidence_bundle_enabled: boolean
  replay_enabled: boolean
  safety_notice: string
}

export interface EvidenceBundleResponse {
  exported: boolean
  bundle_id: string
  created_at: string
  filename: string
  path: string
  bundle: Record<string, unknown>
}

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  const response = await api.get('/health')
  return response.data
}

export async function fetchRegistry(): Promise<Record<string, unknown>> {
  const response = await api.get('/registry')
  return response.data
}

export async function fetchScenarios(): Promise<ScenarioSummary[]> {
  const response = await api.get('/scenarios')
  return response.data.scenarios
}

export async function loadScenario(scenarioId: string): Promise<ScenarioLoad> {
  const response = await api.post('/scenarios/load', { scenario_id: scenarioId })
  return response.data
}

export async function evaluateScenario(scenario: ScenarioLoad): Promise<DecisionRecord> {
  const response = await api.post('/plan/evaluate', {
    scenario_id: scenario.scenario_id,
    current_settings: scenario.current_settings,
    proposed_action: scenario.proposed_action,
  })
  return response.data
}

export async function applyCalibration(scenario: ScenarioLoad) {
  const response = await api.post('/calibration/apply', {
    scenario_id: scenario.scenario_id,
    current_settings: scenario.current_settings,
  })
  return response.data
}

export async function applySimulated(record: DecisionRecord) {
  const response = await api.post('/control/apply-simulated', record)
  return response.data
}

export async function fetchLatestArtifact() {
  const response = await api.get('/artifacts/latest')
  return response.data
}

export async function exportLatestArtifact() {
  const response = await api.post('/artifacts/export')
  return response.data
}

export async function fetchExperimentState(): Promise<ExperimentState> {
  const response = await api.get('/experiment/state')
  return response.data
}

export async function startExperiment(scenarioId: string): Promise<ExperimentState> {
  const response = await api.post('/experiment/start', { scenario_id: scenarioId })
  return response.data
}

export async function proposeExperimentAction(request: {
  intent: string
  source?: ProposedAction['source']
  delta_settings?: Record<string, number>
}): Promise<ProposedAction> {
  const response = await api.post('/experiment/propose', {
    intent: request.intent,
    source: request.source ?? 'optimizer',
    delta_settings: request.delta_settings,
  })
  return response.data
}

export async function evaluateExperimentAction(proposedAction: ProposedAction): Promise<DecisionRecord> {
  const response = await api.post('/experiment/evaluate', {
    proposed_action: proposedAction,
  })
  return response.data
}

export async function applyExperimentAction(decisionRecordId: string | null, force = false): Promise<ExperimentApplyResult> {
  const response = await api.post('/experiment/apply', {
    decision_record_id: decisionRecordId,
    force,
  })
  return response.data
}

export async function calibrateExperiment(): Promise<{ calibration_applied: boolean; measurement: Record<string, unknown>; state: ExperimentState }> {
  const response = await api.post('/experiment/calibrate')
  return response.data
}

export async function resetExperiment(): Promise<ExperimentState> {
  const response = await api.post('/experiment/reset')
  return response.data
}

export async function exportExperiment() {
  const response = await api.post('/experiment/export')
  return response.data
}

export async function runDryRunHealthCheck(): Promise<DemoHealthCheckResult> {
  const response = await api.post('/experiment/health-check')
  return response.data
}

export async function generateBackendMissionReport(request: {
  guided_transcript: Record<string, unknown>[]
  latest_decision_record: Record<string, unknown> | null
  session_export: Record<string, unknown> | null
  frontend_metadata?: Record<string, unknown>
}): Promise<MissionReportResponse> {
  const response = await api.post('/experiment/report/generate', request)
  return response.data
}

export async function fetchPlatformAdapters(): Promise<PlatformAdaptersResponse> {
  const response = await api.get('/platform/adapters')
  return response.data
}

export async function fetchPlatformCapabilities(): Promise<PlatformCapabilitiesResponse> {
  const response = await api.get('/platform/capabilities')
  return response.data
}

export async function fetchSyntheticDataManifest(): Promise<Record<string, unknown>> {
  const response = await api.get('/platform/data-manifest')
  return response.data
}

export async function fetchDecisionRecordSchema(): Promise<Record<string, unknown>> {
  const response = await api.get('/artifacts/schemas/decision-record')
  return response.data
}

export async function fetchPlatformVersion(): Promise<PlatformVersionResponse> {
  const response = await api.get('/platform/version')
  return response.data
}

export async function runBenchmark(totalTrials = 50, seed = 42): Promise<BenchmarkResult> {
  const response = await api.post('/benchmark/run', {
    total_trials: totalTrials,
    seed,
  })
  return response.data
}

export async function fetchLatestBenchmark(): Promise<BenchmarkResult> {
  const response = await api.get('/benchmark/latest')
  return response.data
}

export async function fetchDriftedTwinReplay(): Promise<ReplayArtifact> {
  const response = await api.get('/experiment/replay/drifted-twin')
  return response.data
}

export async function exportEvidenceBundle(request: {
  guided_transcript?: Record<string, unknown>[]
  frontend_metadata?: Record<string, unknown>
}): Promise<EvidenceBundleResponse> {
  const response = await api.post('/experiment/evidence-bundle', request)
  return response.data
}
