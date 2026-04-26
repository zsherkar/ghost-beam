import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import {
  BenchmarkResult,
  DecisionRecord,
  EvidenceBundleResponse,
  ExperimentState,
  MissionReportResponse,
  PlatformAdaptersResponse,
  PlatformCapabilitiesResponse,
  PlatformVersionResponse,
  ProposedAction,
  ReplayArtifact,
  ScenarioLoad,
  ScenarioSummary,
  applyExperimentAction,
  calibrateExperiment,
  evaluateExperimentAction,
  exportEvidenceBundle,
  exportExperiment,
  fetchDriftedTwinReplay,
  fetchHealth,
  fetchExperimentState,
  fetchPlatformAdapters,
  fetchPlatformCapabilities,
  fetchPlatformVersion,
  fetchScenarios,
  fetchSyntheticDataManifest,
  generateBackendMissionReport,
  loadScenario,
  proposeExperimentAction,
  runBenchmark,
  runDryRunHealthCheck,
  resetExperiment,
  startExperiment,
} from './api/client'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import DecisionSummaryCard from './components/panels/DecisionSummaryCard'
import BeamProfileCard from './components/panels/BeamProfileCard'
import BenchmarkPanel from './components/panels/BenchmarkPanel'
import DemoHealthCheckPanel, { DemoHealthItem } from './components/panels/DemoHealthCheckPanel'
import DecisionRecordDrawer from './components/panels/DecisionRecordDrawer'
import EvidenceDrawer from './components/panels/EvidenceDrawer'
import EvidenceStrip from './components/panels/EvidenceStrip'
import ExperimentControlPanel from './components/panels/ExperimentControlPanel'
import GateEvidenceCard from './components/panels/GateEvidenceCard'
import GuidedDemoPanel from './components/panels/GuidedDemoPanel'
import NaiveComparisonCard from './components/panels/NaiveComparisonCard'
import NavigationPanelDrawer from './components/panels/NavigationPanelDrawer'
import PolicyBreakdownDrawer from './components/panels/PolicyBreakdownDrawer'
import ReplayPanel from './components/panels/ReplayPanel'
import ScenarioPicker from './components/panels/ScenarioPicker'
import TrustGateCard from './components/panels/TrustGateCard'
import TwinStateCard from './components/panels/TwinStateCard'
import ErrorBoundary from './components/system/ErrorBoundary'
import {
  GuidedDemoReport,
  GuidedTranscriptEntry,
  buildGuidedDemoReport,
  createTranscriptEntry,
  downloadTextFile,
  fileTimestamp,
  missionReportSummary,
  missionReportToMarkdown,
  syntheticDisclosure,
} from './utils/missionReport'

const ControlRoom3D = lazy(() => import('./components/scene/ControlRoom3D'))

type ThemeMode = 'dark' | 'light' | 'system'
type TwinLightingMode = 'control-room' | 'inspection' | 'presentation'
type ExperimentEventState = 'evaluating' | 'calibrating' | 'applying' | 'blocked' | null

function safeLocalStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeLocalStorageSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Local storage is only a convenience; it must never block the control room.
  }
}

function clearGhostBeamLocalUiState() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('ghost-beam'))
      .forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Ignore storage access failures and reset React state below.
  }
}

const guidedDemoSteps = [
  {
    title: 'Nominal Baseline',
    explanation: 'Start from green_zone so the judge sees a trusted twin and stable green beam before drift appears.',
    focus: 'Decision Summary',
  },
  {
    title: 'Drift Appears',
    explanation: 'Move into the drifted twin condition: diffuse beam, elevated OOD score, and calibration pressure.',
    focus: 'Twin State + Beam Profile',
  },
  {
    title: 'Naive Proposal',
    explanation: 'A naive optimizer proposes increasing quad_2 focusing. The quadrupole is highlighted in the twin.',
    focus: 'Q7FF2',
  },
  {
    title: 'Ghost Beam Evaluation',
    explanation: 'Run the full policy gate: uncertainty, OOD, vision labels, eLog memory, and hard limits.',
    focus: 'Trust Gate + Gate Evidence',
  },
  {
    title: 'Calibration',
    explanation: 'Take a simulated calibration screen measurement so the model can refresh trust near the current state.',
    focus: 'Diagnostic Screen',
  },
  {
    title: 'Safer Correction',
    explanation: 'Evaluate and apply a smaller RF-phase correction only if Ghost Beam approves it after calibration.',
    focus: 'RF cavity',
  },
  {
    title: 'Export Artifact',
    explanation: 'Open the structured DecisionRecord and session export path for auditability.',
    focus: 'DecisionRecord JSON',
  },
]

function storedThemeMode(): ThemeMode {
  const value = safeLocalStorageGet('ghost-beam-theme-mode')
  return value === 'light' || value === 'system' ? value : 'dark'
}

function storedTwinLightingMode(): TwinLightingMode {
  const value = safeLocalStorageGet('ghost-beam-twin-lighting')
  if (value === 'inspection' || value === 'presentation') return value
  return 'control-room'
}

function App() {
  const booted = useRef(false)
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([])
  const [selected, setSelected] = useState<ScenarioLoad | null>(null)
  const [experiment, setExperiment] = useState<ExperimentState | null>(null)
  const [record, setRecord] = useState<DecisionRecord | null>(null)
  const [draftAction, setDraftAction] = useState<ProposedAction>({
    intent: 'improve beam quality',
    delta_settings: {},
    source: 'human',
  })
  const [selectedDevice, setSelectedDevice] = useState('BPM07-06')
  const [status, setStatus] = useState('Connecting to Ghost Beam API...')
  const [backendConnected, setBackendConnected] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)
  const [jsonOpen, setJsonOpen] = useState(false)
  const [navPanel, setNavPanel] = useState<string | null>(null)
  const [themeMode, setThemeMode] = useState<ThemeMode>(storedThemeMode)
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark')
  const [twinLightingMode, setTwinLightingMode] = useState<TwinLightingMode>(storedTwinLightingMode)
  const [currentEvent, setCurrentEvent] = useState<ExperimentEventState>(null)
  const [guidedOpen, setGuidedOpen] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)
  const [guidedPlaying, setGuidedPlaying] = useState(false)
  const [guidedBusy, setGuidedBusy] = useState(false)
  const [exportNotice, setExportNotice] = useState('')
  const [guidedTranscript, setGuidedTranscript] = useState<GuidedTranscriptEntry[]>([])
  const [missionReport, setMissionReport] = useState<GuidedDemoReport | null>(null)
  const [backendMissionReport, setBackendMissionReport] = useState<MissionReportResponse | null>(null)
  const [reportNotice, setReportNotice] = useState('')
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [appError, setAppError] = useState('')
  const [healthOpen, setHealthOpen] = useState(false)
  const [healthBusy, setHealthBusy] = useState(false)
  const [healthItems, setHealthItems] = useState<DemoHealthItem[]>([])
  const [judgeMode, setJudgeMode] = useState(false)
  const [sceneRetryKey, setSceneRetryKey] = useState(0)
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [platformAdapters, setPlatformAdapters] = useState<PlatformAdaptersResponse | null>(null)
  const [platformCapabilities, setPlatformCapabilities] = useState<PlatformCapabilitiesResponse | null>(null)
  const [syntheticManifest, setSyntheticManifest] = useState<Record<string, unknown> | null>(null)
  const [platformVersion, setPlatformVersion] = useState<PlatformVersionResponse | null>(null)
  const [benchmarkOpen, setBenchmarkOpen] = useState(false)
  const [benchmarkBusy, setBenchmarkBusy] = useState(false)
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null)
  const [replayOpen, setReplayOpen] = useState(false)
  const [replayArtifact, setReplayArtifact] = useState<ReplayArtifact | null>(null)
  const [replayStep, setReplayStep] = useState(0)
  const [evidenceBundle, setEvidenceBundle] = useState<EvidenceBundleResponse | null>(null)

  function triggerEvent(event: ExperimentEventState, duration = 1400) {
    if (!event) {
      setCurrentEvent(null)
      return
    }
    setCurrentEvent(event)
    window.setTimeout(() => {
      setCurrentEvent((active) => (active === event ? null : active))
    }, duration)
  }

  function appendGuidedEntry(entry: GuidedTranscriptEntry) {
    setGuidedTranscript((previous) => [
      ...previous.filter((item) => item.step_index < entry.step_index),
      entry,
    ])
  }

  function setHealthItem(id: string, patch: Partial<DemoHealthItem>) {
    setHealthItems((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  async function runUiAction(label: string, task: () => Promise<unknown>) {
    if (pendingAction) return
    setPendingAction(label)
    setAppError('')
    try {
      await task()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      setAppError(`${label} failed: ${message}`)
      setStatus(`${label} failed: ${message}`)
    } finally {
      setPendingAction(null)
    }
  }

  async function chooseScenario(scenarioId: string) {
    setStatus(`Loading ${scenarioId}...`)
    const [loaded, state] = await Promise.all([loadScenario(scenarioId), startExperiment(scenarioId)])
    setSelected(loaded)
    setExperiment(state)
    setRecord(state.latest_decision_record)
    setDraftAction(state.latest_proposed_action ?? loaded.proposed_action)
    setBackendConnected(true)
    setStatus('Experiment session started from live backend.')
    return { loaded, state }
  }

  async function refreshExperiment() {
    const state = await fetchExperimentState()
    setExperiment(state)
    setRecord(state.latest_decision_record)
    if (state.latest_proposed_action) setDraftAction(state.latest_proposed_action)
    return state
  }

  async function runPropose() {
    setStatus('Optimizer proposing a bounded action...')
    const action = await proposeExperimentAction({ intent: draftAction.intent || 'improve beam quality' })
    setDraftAction(action)
    await refreshExperiment()
    setStatus('Optimizer proposal is ready for Ghost Beam evaluation.')
  }

  async function runEvaluate(action = draftAction) {
    setStatus('Evaluating action through Ghost Beam...')
    triggerEvent('evaluating', 1300)
    const decision = await evaluateExperimentAction(action)
    setRecord(decision)
    const state = await refreshExperiment()
    if (decision.gate_decision.decision === 'BLOCK' || decision.gate_decision.decision === 'REQUIRE_HUMAN_REVIEW') {
      triggerEvent('blocked', 1500)
    }
    setStatus(`DecisionRecord ${state.latest_decision_record_id ?? ''}: ${decision.gate_decision.decision}.`)
    return decision
  }

  async function runCalibration() {
    setStatus('Applying synthetic calibration screen measurement...')
    triggerEvent('calibrating', 1700)
    const result = await calibrateExperiment()
    setExperiment(result.state)
    setRecord(result.state.latest_decision_record)
    if (result.state.latest_proposed_action) setDraftAction(result.state.latest_proposed_action)
    setStatus('Calibration applied; experiment state and trust diagnostics refreshed.')
  }

  async function runApply() {
    if (!experiment) return
    triggerEvent('applying', 1500)
    const result = await applyExperimentAction(experiment.latest_decision_record_id)
    setExperiment(result.state)
    setRecord(result.state.latest_decision_record)
    if (result.state.latest_proposed_action) setDraftAction(result.state.latest_proposed_action)
    if (!result.applied) triggerEvent('blocked', 1500)
    setStatus(result.applied ? 'Approved simulated write applied and state recomputed.' : result.reason ?? 'Apply rejected.')
    return result
  }

  async function runReset() {
    setStatus('Resetting scenario state...')
    const state = await resetExperiment()
    setExperiment(state)
    setRecord(state.latest_decision_record)
    if (state.latest_proposed_action) setDraftAction(state.latest_proposed_action)
    setStatus('Scenario reset to initial condition.')
  }

  async function runExportSession(download = true) {
    const payload = await exportExperiment()
    const packagedPayload = {
      ...payload,
      frontend_package: {
        session_id: `ghostbeam-session-${fileTimestamp()}`,
        frontend_version: 'ghost-beam-frontend-0.1.0',
        guided_transcript: guidedTranscript,
        guided_mission_report: missionReport,
        synthetic_data_disclosure: syntheticDisclosure,
        current_theme_mode: themeMode,
        current_twin_lighting_mode: twinLightingMode,
      },
    }
    if (download) {
      downloadTextFile(
        `ghostbeam_session_${fileTimestamp()}.json`,
        JSON.stringify(packagedPayload, null, 2),
        'application/json',
      )
    }
    const message = `Session export ready: ${payload.scenario_id ?? experiment?.scenario_id ?? 'active session'} step ${payload.step_number ?? experiment?.step_number ?? 0}.`
    setExportNotice(message)
    setStatus(message)
    return packagedPayload
  }

  async function runBenchmarkPanel() {
    if (benchmarkBusy) return
    setBenchmarkBusy(true)
    setAppError('')
    try {
      const result = await runBenchmark(50, 42)
      setBenchmarkResult(result)
      setBenchmarkOpen(true)
      setStatus(`Benchmark complete: ${result.metrics.total_trials} trials, ${result.metrics.unsafe_actions_prevented} risky actions prevented.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      setAppError(`Benchmark failed: ${message}`)
      setStatus(`Benchmark failed: ${message}`)
    } finally {
      setBenchmarkBusy(false)
    }
  }

  function exportBenchmarkJson() {
    if (!benchmarkResult) return
    downloadTextFile(
      `ghostbeam_benchmark_${fileTimestamp()}.json`,
      JSON.stringify(benchmarkResult, null, 2),
      'application/json',
    )
    setStatus('Benchmark JSON exported.')
  }

  async function openReplayMode() {
    try {
      const artifact = replayArtifact ?? await fetchDriftedTwinReplay()
      setReplayArtifact(artifact)
      setReplayStep(0)
      setReplayOpen(true)
      setStatus('Replay artifact loaded. This viewer does not mutate the live experiment session.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      setAppError(`Replay load failed: ${message}`)
    }
  }

  async function runEvidenceBundleExport() {
    try {
      const result = await exportEvidenceBundle({
        guided_transcript: guidedTranscript as unknown as Record<string, unknown>[],
        frontend_metadata: {
          theme_mode: themeMode,
          twin_lighting_mode: twinLightingMode,
          judge_mode: judgeMode,
          latest_benchmark_id: benchmarkResult?.benchmark_id,
          latest_report_id: backendMissionReport?.report_id,
        },
      })
      setEvidenceBundle(result)
      downloadTextFile(result.filename, JSON.stringify(result.bundle, null, 2), 'application/json')
      setExportNotice(`Evidence bundle exported: ${result.bundle_id}.`)
      setStatus(`Evidence bundle exported: ${result.bundle_id}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      setAppError(`Evidence bundle export failed: ${message}`)
      setStatus(`Evidence bundle export failed: ${message}`)
    }
  }

  async function runGuidedStep(stepIndex: number) {
    const nextIndex = Math.max(0, Math.min(guidedDemoSteps.length - 1, stepIndex))
    setGuidedBusy(true)
    setGuidedStep(nextIndex)
    setStatus(`Guided demo: ${guidedDemoSteps[nextIndex].title}`)
    setAppError('')
    try {
      if (nextIndex === 0) {
        const { state } = await chooseScenario('green_zone')
        setSelectedDevice('BPM07-06')
        triggerEvent('applying', 1100)
        appendGuidedEntry(createTranscriptEntry({
          stepIndex: nextIndex,
          title: guidedDemoSteps[nextIndex].title,
          endpoint: 'POST /experiment/start green_zone',
          note: 'Nominal baseline loaded. Twin is expected to be trusted and the beam should be green.',
          state,
          record: state.latest_decision_record,
        }))
      } else if (nextIndex === 1) {
        const { state } = await chooseScenario('drifted_twin')
        setSelectedDevice('BPM07-06')
        triggerEvent('evaluating', 1300)
        appendGuidedEntry(createTranscriptEntry({
          stepIndex: nextIndex,
          title: guidedDemoSteps[nextIndex].title,
          endpoint: 'POST /experiment/start drifted_twin',
          note: 'Drifted state loaded. OOD and calibration pressure should increase.',
          state,
          record: state.latest_decision_record,
        }))
      } else if (nextIndex === 2) {
        const action = await proposeExperimentAction({
          intent: 'naive optimizer increase quad_2 focusing',
          source: 'optimizer',
          delta_settings: { quad_2: 0.22 },
        })
        setDraftAction(action)
        const state = await refreshExperiment()
        setSelectedDevice('Q7FF2')
        triggerEvent('evaluating', 1300)
        appendGuidedEntry(createTranscriptEntry({
          stepIndex: nextIndex,
          title: guidedDemoSteps[nextIndex].title,
          endpoint: 'POST /experiment/propose',
          note: 'Naive optimizer proposes increasing quad_2 focusing before checking twin trust and operator memory.',
          state,
          record: state.latest_decision_record,
          action,
        }))
      } else if (nextIndex === 3) {
        const decision = await runEvaluate(draftAction)
        const state = await fetchExperimentState()
        appendGuidedEntry(createTranscriptEntry({
          stepIndex: nextIndex,
          title: guidedDemoSteps[nextIndex].title,
          endpoint: 'POST /experiment/evaluate',
          note: 'Ghost Beam runs uncertainty, OOD, vision, eLog retrieval, hard limits, and deterministic policy.',
          state,
          record: decision,
          action: draftAction,
        }))
      } else if (nextIndex === 4) {
        setSelectedDevice('OTR07')
        await runCalibration()
        const state = await fetchExperimentState()
        appendGuidedEntry(createTranscriptEntry({
          stepIndex: nextIndex,
          title: guidedDemoSteps[nextIndex].title,
          endpoint: 'POST /experiment/calibrate',
          note: 'Synthetic calibration measurement refreshes the twin near the drifted machine state.',
          state,
          record: state.latest_decision_record,
        }))
      } else if (nextIndex === 5) {
        const saferAction = await proposeExperimentAction({
          intent: 'correct RF phase after calibration verification',
          source: 'human',
          delta_settings: { rf_phase: -0.35 },
        })
        setDraftAction(saferAction)
        setSelectedDevice('RFCAV07')
        const decision = await runEvaluate(saferAction)
        const stateAfterEvaluation = await refreshExperiment()
        if (decision.gate_decision.decision === 'APPROVE' || decision.gate_decision.decision === 'APPROVE_SMALL_STEP') {
          triggerEvent('applying', 1500)
          const result = await applyExperimentAction(stateAfterEvaluation.latest_decision_record_id)
          setExperiment(result.state)
          setRecord(result.state.latest_decision_record)
          if (result.state.latest_proposed_action) setDraftAction(result.state.latest_proposed_action)
          setStatus(result.applied ? 'Guided safer correction applied.' : result.reason ?? 'Guided apply rejected.')
        }
        const finalState = await fetchExperimentState()
        appendGuidedEntry(createTranscriptEntry({
          stepIndex: nextIndex,
          title: guidedDemoSteps[nextIndex].title,
          endpoint: 'POST /experiment/propose -> POST /experiment/evaluate -> POST /experiment/apply when approved',
          note: 'Safer RF correction is evaluated after calibration and applied only if Ghost Beam approves the small step.',
          state: finalState,
          record: finalState.latest_decision_record ?? decision,
          action: saferAction,
        }))
      } else if (nextIndex === 6) {
        await runExportSession(false)
        setJsonOpen(true)
        const state = await fetchExperimentState()
        appendGuidedEntry(createTranscriptEntry({
          stepIndex: nextIndex,
          title: guidedDemoSteps[nextIndex].title,
          endpoint: 'POST /experiment/export',
          note: 'Structured session artifact and latest DecisionRecord are ready for judge inspection.',
          state,
          record: state.latest_decision_record,
        }))
      }
    } catch (error) {
      const message = `Guided demo step failed: ${error instanceof Error ? error.message : 'unknown error'}`
      setStatus(message)
      setAppError(message)
      setGuidedPlaying(false)
    } finally {
      setGuidedBusy(false)
    }
  }

  async function advanceGuided(delta: number) {
    const target = Math.max(0, Math.min(guidedDemoSteps.length - 1, guidedStep + delta))
    await runGuidedStep(target)
  }

  async function resetGuidedDemo(autoPlay = false) {
    setGuidedTranscript([])
    setMissionReport(null)
    setReportNotice('')
    setGuidedOpen(true)
    setGuidedPlaying(false)
    await runGuidedStep(0)
    if (autoPlay) setGuidedPlaying(true)
  }

  function enableJudgeDemoMode() {
    setJudgeMode((enabled) => {
      const next = !enabled
      if (next) {
        setThemeMode('dark')
        setTwinLightingMode('presentation')
        setGuidedOpen(true)
        if (!guidedTranscript.length) void resetGuidedDemo(false)
        setStatus('Judge Demo Mode enabled: dark theme, presentation lighting, guided controller visible.')
      } else {
        setStatus('Judge Demo Mode disabled; live experiment state preserved.')
      }
      return next
    })
  }

  async function generateMissionReport() {
    const report = buildGuidedDemoReport(guidedTranscript, record, experiment)
    setMissionReport(report)
    setBackendMissionReport(null)
    setReportNotice('Generating backend mission report artifact...')
    try {
      const sessionExport = await runExportSession(false)
      const backendReport = await generateBackendMissionReport({
        guided_transcript: guidedTranscript as unknown as Record<string, unknown>[],
        latest_decision_record: record as unknown as Record<string, unknown> | null,
        session_export: sessionExport as Record<string, unknown>,
        frontend_metadata: {
          theme_mode: themeMode,
          twin_lighting_mode: twinLightingMode,
          judge_mode: judgeMode,
        },
      })
      setBackendMissionReport(backendReport)
      setReportNotice(`Report source: backend artifact ${backendReport.report_id}.`)
      setStatus(`Guided Demo Mission Report persisted: ${backendReport.report_id}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      setReportNotice(`Report source: frontend fallback. Backend artifact failed: ${message}`)
      setStatus('Guided Demo Mission Report generated with frontend fallback.')
    }
    return report
  }

  function downloadMissionReportJson() {
    if (!missionReport) {
      void generateMissionReport()
      return
    }
    if (backendMissionReport) {
      downloadTextFile(
        backendMissionReport.filename_suggestions.json,
        JSON.stringify(backendMissionReport.json, null, 2),
        'application/json',
      )
      setReportNotice(`Downloaded backend artifact ${backendMissionReport.report_id} JSON.`)
      return
    }
    const report = missionReport
    downloadTextFile(
      `ghostbeam_drifted_twin_report_${fileTimestamp()}.json`,
      JSON.stringify(report, null, 2),
      'application/json',
    )
    setReportNotice('Mission Report JSON downloaded.')
  }

  function downloadMissionReportMarkdown() {
    if (!missionReport) {
      void generateMissionReport()
      return
    }
    if (backendMissionReport) {
      downloadTextFile(
        backendMissionReport.filename_suggestions.markdown,
        backendMissionReport.markdown,
        'text/markdown',
      )
      setReportNotice(`Downloaded backend artifact ${backendMissionReport.report_id} Markdown.`)
      return
    }
    const report = missionReport
    downloadTextFile(
      `ghostbeam_drifted_twin_report_${fileTimestamp()}.md`,
      missionReportToMarkdown(report),
      'text/markdown',
    )
    setReportNotice('Mission Report Markdown downloaded.')
  }

  async function copyMissionReportSummary() {
    const report = missionReport ?? await generateMissionReport()
    await navigator.clipboard.writeText(missionReportSummary(report))
    setReportNotice('Mission Report summary copied.')
  }

  const defaultHealthItems: DemoHealthItem[] = [
    { id: 'backend', label: 'Backend reachable', status: 'pending', detail: 'Waiting to call /health.' },
    { id: 'registry', label: 'Registry and scenarios reachable', status: 'pending', detail: 'Waiting to verify scenario list and PV registry.' },
    { id: 'green', label: 'Green-zone evaluate/apply', status: 'pending', detail: 'Waiting to verify a safe trim can be evaluated and applied.' },
    { id: 'unsafe', label: 'Unsafe write blocks', status: 'pending', detail: 'Waiting to verify hard-limit block path.' },
    { id: 'drift', label: 'Drifted twin calibrates', status: 'pending', detail: 'Waiting to verify calibration reduces OOD risk.' },
    { id: 'elog', label: 'eLog conflict path', status: 'pending', detail: 'Waiting to verify operator-memory human-review path.' },
    { id: 'export', label: 'Session export works', status: 'pending', detail: 'Waiting to verify export package endpoint.' },
    { id: 'frontend', label: 'Frontend settings', status: 'pending', detail: 'Waiting to capture theme and twin lighting mode.' },
  ]

  async function runDemoHealthCheck() {
    if (healthBusy) return
    setHealthOpen(true)
    setHealthBusy(true)
    setAppError('')
    setHealthItems(defaultHealthItems)
    try {
      setHealthItem('backend', { status: 'running', detail: 'Calling GET /health before dry-run checks...' })
      const health = await fetchHealth()
      setHealthItem('backend', { status: 'pass', detail: `${health.service} returned ${health.status}.` })

      for (const item of defaultHealthItems.filter((entry) => entry.id !== 'backend' && entry.id !== 'frontend')) {
        setHealthItem(item.id, { status: 'running', detail: 'Backend dry-run health check is executing in an isolated temporary session.' })
      }
      const result = await runDryRunHealthCheck()
      for (const item of result.items) {
        const id = item.id === 'scenarios' ? 'registry' : item.id
        setHealthItem(id, {
          status: item.status === 'pass' ? 'pass' : 'fail',
          detail: `${item.detail} Dry-run: ${result.mutates_active_session ? 'mutating' : 'non-mutating'}.`,
        })
      }

      setHealthItem('frontend', {
        status: 'pass',
        detail: `Frontend connected. Theme ${themeMode}; twin lighting ${twinLightingMode}; Judge Mode ${judgeMode ? 'on' : 'off'}. Dry-run health check does not alter the visible experiment session.`,
      })
      setStatus(`Dry-run Demo Health Check completed: ${result.summary.passed}/${result.summary.total} checks passed without mutating the active session.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      setAppError(`Demo Health Check failed: ${message}`)
      setStatus(`Demo Health Check failed: ${message}`)
      setHealthItems((items) => items.map((item) => item.status === 'running' ? { ...item, status: 'fail', detail: message } : item))
    } finally {
      setHealthBusy(false)
    }
  }

  function proposeDeviceTrim(deviceId: string) {
    const device = experiment?.device_registry.find((item) => item.id === deviceId)
    const pv = device?.pv
    let delta: Record<string, number> = {}
    if (pv === 'quad_1' || pv === 'quad_2') delta = { [pv]: 0.03 }
    else if (pv === 'steer_x' || deviceId === 'BPM07-06') delta = { steer_x: -0.025 }
    else if (pv === 'steer_y') delta = { steer_y: -0.025 }
    else if (deviceId === 'RFCAV07' || pv === 'rf_phase') delta = { rf_phase: -0.25 }
    else if (deviceId === 'OTR07') delta = {}
    else delta = { rf_amplitude: -0.01 }
    setDraftAction({
      intent: `manual trim from ${deviceId}`,
      source: 'human',
      delta_settings: delta,
    })
    setStatus(`Draft action prepared from ${deviceId}; evaluate it in Ghost Beam before applying.`)
  }

  function handleNavigate(item: string) {
    if (item === 'Trust Gate') {
      setPolicyOpen((open) => !open)
      setNavPanel(null)
      return
    }
    if (item === 'Evidence') {
      setEvidenceOpen((open) => !open)
      setNavPanel(null)
      setPolicyOpen(false)
      return
    }
    if (item === 'Beamline') {
      setNavPanel(null)
      setStatus('Beamline focused. Click a device in the L1 Transfer Line twin to inspect it.')
      return
    }
    setPolicyOpen(false)
    setEvidenceOpen(false)
    setNavPanel((current) => (current === item ? null : item))
  }

  function downloadJson() {
    if (!record) return
    downloadTextFile(
      `ghostbeam_${record.scenario_id}_decision_${fileTimestamp()}.json`,
      JSON.stringify(record, null, 2),
      'application/json',
    )
  }

  function clearLocalUiStateFromSettings() {
    clearGhostBeamLocalUiState()
    setThemeMode('dark')
    setTwinLightingMode('control-room')
    setJudgeMode(false)
    setGuidedOpen(false)
    setReplayOpen(false)
    setBenchmarkOpen(false)
    setHealthOpen(false)
    setNavPanel(null)
    setAppError('')
    setStatus('Local UI state cleared. Live experiment data was not modified.')
  }

  useEffect(() => {
    async function boot() {
      if (booted.current) return
      booted.current = true
      try {
        await fetchHealth()
        setBackendConnected(true)
        const items = await fetchScenarios()
        try {
          const [adapters, capabilities, manifest, version] = await Promise.all([
            fetchPlatformAdapters(),
            fetchPlatformCapabilities(),
            fetchSyntheticDataManifest(),
            fetchPlatformVersion(),
          ])
          setPlatformAdapters(adapters)
          setPlatformCapabilities(capabilities)
          setSyntheticManifest(manifest)
          setPlatformVersion(version)
        } catch {
          setPlatformAdapters(null)
          setPlatformCapabilities(null)
          setSyntheticManifest(null)
          setPlatformVersion(null)
        }
        setScenarios(items)
        const defaultScenario = items.find((item) => item.scenario_id === 'green_zone')?.scenario_id
          ?? items[0]?.scenario_id
          ?? 'green_zone'
        await chooseScenario(defaultScenario)
      } catch (error) {
        setBackendConnected(false)
        const message = `Backend disconnected: ${error instanceof Error ? error.message : 'unknown error'}`
        setStatus(message)
        setAppError(message)
      }
    }
    void boot()
  }, [])

  useEffect(() => {
    safeLocalStorageSet('ghost-beam-theme-mode', themeMode)
    const applyTheme = () => {
      let prefersLight = false
      try {
        prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
      } catch {
        prefersLight = false
      }
      const resolved = themeMode === 'system' ? (prefersLight ? 'light' : 'dark') : themeMode
      document.documentElement.dataset.theme = resolved
      setResolvedTheme(resolved)
      document.documentElement.dataset.themeMode = themeMode
    }
    applyTheme()
    try {
      const query = window.matchMedia('(prefers-color-scheme: light)')
      query.addEventListener('change', applyTheme)
      return () => query.removeEventListener('change', applyTheme)
    } catch {
      return undefined
    }
  }, [themeMode])

  useEffect(() => {
    safeLocalStorageSet('ghost-beam-twin-lighting', twinLightingMode)
  }, [twinLightingMode])

  useEffect(() => {
    function closeOverlays(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setPolicyOpen(false)
      setJsonOpen(false)
      setNavPanel(null)
      setEvidenceOpen(false)
      setHealthOpen(false)
    }
    window.addEventListener('keydown', closeOverlays)
    return () => window.removeEventListener('keydown', closeOverlays)
  }, [])

  useEffect(() => {
    if (!guidedOpen || !guidedPlaying || guidedBusy) return
    if (guidedStep >= guidedDemoSteps.length - 1) {
      setGuidedPlaying(false)
      return
    }
    const timer = window.setTimeout(() => {
      void advanceGuided(1)
    }, 3200)
    return () => window.clearTimeout(timer)
  }, [guidedOpen, guidedPlaying, guidedBusy, guidedStep])

  const uiBusy = Boolean(pendingAction || guidedBusy || healthBusy)

  return (
    <main className={`app-shell ${judgeMode ? 'judge-mode' : ''}`}>
      <Sidebar
        status={status}
        activePanel={policyOpen ? 'Trust Gate' : evidenceOpen ? 'Evidence' : navPanel ?? 'Beamline'}
        onNavigate={handleNavigate}
      />
      <TopBar
        record={record}
        selectedScenarioId={selected?.scenario_id}
        scenarios={scenarios}
        backendConnected={backendConnected}
        themeMode={themeMode}
        judgeMode={judgeMode}
        onThemeModeChange={setThemeMode}
        onScenarioChange={(scenarioId) => void runUiAction('Start scenario', () => chooseScenario(scenarioId))}
        onRunGuidedDemo={() => {
          setGuidedOpen(true)
          void runGuidedStep(0)
        }}
        onJudgeDemoMode={enableJudgeDemoMode}
        onRunHealthCheck={() => void runDemoHealthCheck()}
      />
      {appError && (
        <div className="app-error-banner" role="alert">
          <span>{appError}</span>
          <button type="button" onClick={() => setAppError('')}>Dismiss</button>
        </div>
      )}
      {!backendConnected && (
        <div className="backend-offline-banner" role="status">
          <span>Backend disconnected. Start http://127.0.0.1:8000 and reload.</span>
          <a href="http://127.0.0.1:8000/health" target="_blank" rel="noreferrer">Health</a>
          <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">API Docs</a>
        </div>
      )}

      <section className="workspace">
        <div className="viewport">
          <ErrorBoundary
            key={sceneRetryKey}
            fallback={(error, reset) => (
              <section className="glass-card scene-error-card">
                <h2>3D twin failed to render.</h2>
                <p>Engine remains available. {error.message}</p>
                <button type="button" onClick={() => {
                  reset()
                  setSceneRetryKey((value) => value + 1)
                }}>Retry 3D Twin</button>
              </section>
            )}
          >
            <Suspense
              fallback={(
                <section className="glass-card scene-loading-card">
                  <span>Loading 3D digital twin</span>
                  <strong>L1 Transfer Line</strong>
                  <p>Bringing up the procedural beamline geometry and trust overlays.</p>
                </section>
              )}
            >
              <ControlRoom3D
                record={record}
                experiment={experiment}
                draftAction={draftAction}
                selectedDevice={selectedDevice}
                onSelectDevice={setSelectedDevice}
                onOpenPolicy={() => setPolicyOpen(true)}
                onDeviceTrim={proposeDeviceTrim}
                onEvaluate={() => void runUiAction('Evaluate action', () => runEvaluate())}
                onApply={() => void runUiAction('Apply action', () => runApply())}
                onCalibrate={() => void runUiAction('Calibration', () => runCalibration())}
                onReset={() => void runUiAction('Reset scenario', () => runReset())}
                currentEvent={currentEvent}
                twinLightingMode={twinLightingMode}
                onTwinLightingModeChange={setTwinLightingMode}
                appTheme={resolvedTheme}
                busy={uiBusy}
                judgeMode={judgeMode}
              />
            </Suspense>
          </ErrorBoundary>
        </div>

        <aside className="right-rail">
          <DecisionSummaryCard
            record={record}
            experiment={experiment}
            onApply={() => void runUiAction('Apply action', () => runApply())}
            onCalibrate={() => void runUiAction('Calibration', () => runCalibration())}
            currentEvent={currentEvent}
            busy={uiBusy}
          />
          <ExperimentControlPanel
            experiment={experiment}
            record={record}
            draftAction={draftAction}
            onDraftActionChange={setDraftAction}
            onPropose={() => void runUiAction('Propose action', () => runPropose())}
            onEvaluate={() => void runUiAction('Evaluate action', () => runEvaluate())}
            onApply={() => void runUiAction('Apply action', () => runApply())}
            onCalibrate={() => void runUiAction('Calibration', () => runCalibration())}
            onReset={() => void runUiAction('Reset scenario', () => runReset())}
            onExportSession={() => void runUiAction('Export session', () => runExportSession())}
            onStartGuidedDemo={() => {
              setGuidedOpen(true)
              void runGuidedStep(0)
            }}
            busy={uiBusy}
          />
          <TrustGateCard
            record={record}
            onOpenPolicy={() => setPolicyOpen(true)}
            onOpenJson={() => setJsonOpen(true)}
            currentEvent={currentEvent}
          />
          <GateEvidenceCard record={record} currentEvent={currentEvent} />
          <NaiveComparisonCard record={record} />
          <BeamProfileCard record={record} />
          <TwinStateCard record={record} currentEvent={currentEvent} />
          <ScenarioPicker
            scenarios={scenarios}
            selectedId={selected?.scenario_id ?? ''}
            onSelect={(id) => void chooseScenario(id)}
          />
        </aside>

        <EvidenceStrip
          record={record}
          experiment={experiment}
          viewAllOpen={evidenceOpen}
          onViewAll={() => setEvidenceOpen((open) => !open)}
        />
      </section>

      <PolicyBreakdownDrawer record={record} open={policyOpen} onClose={() => setPolicyOpen(false)} />
      <DecisionRecordDrawer
        record={record}
        open={jsonOpen}
        onClose={() => setJsonOpen(false)}
        onDownload={downloadJson}
        onExportSession={runExportSession}
        onExportEvidenceBundle={() => void runEvidenceBundleExport()}
        experiment={experiment}
        exportNotice={exportNotice}
      />
      <NavigationPanelDrawer
        panel={navPanel}
        record={record}
        experiment={experiment}
        scenarios={scenarios}
        platformAdapters={platformAdapters}
        platformCapabilities={platformCapabilities}
        platformVersion={platformVersion}
        syntheticManifest={syntheticManifest}
        onClearLocalUiState={clearLocalUiStateFromSettings}
        onClose={() => setNavPanel(null)}
        onOpenPolicy={() => {
          setNavPanel(null)
          setPolicyOpen(true)
        }}
      />
      <EvidenceDrawer
        open={evidenceOpen}
        record={record}
        experiment={experiment}
        onClose={() => setEvidenceOpen(false)}
        onOpenDecisionRecord={() => {
          setEvidenceOpen(false)
          setJsonOpen(true)
        }}
      />
      <GuidedDemoPanel
        open={guidedOpen}
        steps={guidedDemoSteps}
        activeStep={guidedStep}
        playing={guidedPlaying}
        busy={guidedBusy}
        transcript={guidedTranscript}
        reportReady={Boolean(missionReport)}
        reportNotice={reportNotice}
        onNext={() => void advanceGuided(1)}
        onPrevious={() => void advanceGuided(-1)}
        onAutoPlay={() => setGuidedPlaying(true)}
        onPause={() => setGuidedPlaying(false)}
        onReset={() => void resetGuidedDemo(false)}
        onReplayFromStart={() => void resetGuidedDemo(true)}
        onGoToStep={(index) => void runGuidedStep(index)}
        onGenerateReport={() => { void generateMissionReport() }}
        onDownloadMarkdown={downloadMissionReportMarkdown}
        onDownloadJson={downloadMissionReportJson}
        onCopySummary={() => void copyMissionReportSummary()}
        onRunHealthCheck={() => void runDemoHealthCheck()}
        onRunBenchmark={() => {
          setBenchmarkOpen(true)
          void runBenchmarkPanel()
        }}
        onLoadReplay={() => void openReplayMode()}
        onExportEvidenceBundle={() => void runEvidenceBundleExport()}
        onExit={() => {
          setGuidedOpen(false)
          setGuidedPlaying(false)
        }}
      />
      <BenchmarkPanel
        open={benchmarkOpen}
        busy={benchmarkBusy}
        result={benchmarkResult}
        onRun={() => void runBenchmarkPanel()}
        onExport={exportBenchmarkJson}
        onClose={() => setBenchmarkOpen(false)}
      />
      <ReplayPanel
        open={replayOpen}
        artifact={replayArtifact}
        activeStep={replayStep}
        onStep={setReplayStep}
        onClose={() => setReplayOpen(false)}
      />
      <DemoHealthCheckPanel
        open={healthOpen}
        busy={healthBusy}
        items={healthItems}
        onRun={() => void runDemoHealthCheck()}
        onClose={() => setHealthOpen(false)}
      />
    </main>
  )
}

export default App
