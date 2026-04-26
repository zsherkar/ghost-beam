import { AlertTriangle, CheckCircle2, Download, FileText, FlaskConical, Lock, Pause, Play, Radio, RotateCcw, Send, SkipBack, SkipForward, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { DecisionRecord, ExperimentState, MachineSettings, ProposedAction } from '../../api/client'
import { decisionLabel } from '../../utils/format'

interface GuidedRunnerStep {
  title: string
  explanation: string
  focus?: string
}

interface Props {
  experiment: ExperimentState | null
  record: DecisionRecord | null
  draftAction: ProposedAction
  onDraftActionChange: (action: ProposedAction) => void
  onPropose: () => void
  onEvaluate: () => void
  onApply: () => void
  onCalibrate: () => void
  onReset: () => void
  onExportSession: () => void
  onStartGuidedDemo: () => void
  busy?: boolean
  guidedConfirmOpen?: boolean
  modeLabelOverride?: string
  scenarioLabelOverride?: string
  readOnlyMode?: boolean
  guidedActive?: boolean
  guidedSteps?: GuidedRunnerStep[]
  guidedStep?: number
  guidedPlaying?: boolean
  guidedBusy?: boolean
  guidedReportReady?: boolean
  guidedReportNotice?: string
  onGuidedPrevious?: () => void
  onGuidedNext?: () => void
  onGuidedAutoPlay?: () => void
  onGuidedPause?: () => void
  onGuidedReset?: () => void
  onGuidedGenerateReport?: () => void
  onGuidedExit?: () => void
  onGuidedConfirmStart?: () => void
  onGuidedCancel?: () => void
}

const settingNames: (keyof MachineSettings)[] = [
  'quad_1',
  'quad_2',
  'steer_x',
  'steer_y',
  'rf_phase',
  'rf_amplitude',
]

function ExperimentControlPanel({
  experiment,
  record,
  draftAction,
  onDraftActionChange,
  onPropose,
  onEvaluate,
  onApply,
  onCalibrate,
  onReset,
  onExportSession,
  onStartGuidedDemo,
  busy = false,
  guidedConfirmOpen = false,
  modeLabelOverride,
  scenarioLabelOverride,
  readOnlyMode = false,
  guidedActive = false,
  guidedSteps = [],
  guidedStep = 0,
  guidedPlaying = false,
  guidedBusy = false,
  guidedReportReady = false,
  guidedReportNotice = '',
  onGuidedPrevious,
  onGuidedNext,
  onGuidedAutoPlay,
  onGuidedPause,
  onGuidedReset,
  onGuidedGenerateReport,
  onGuidedExit,
  onGuidedConfirmStart,
  onGuidedCancel,
}: Props) {
  const [manualExpanded, setManualExpanded] = useState(false)
  const decision = record?.gate_decision.decision
  const canApply = decision === 'APPROVE' || decision === 'APPROVE_SMALL_STEP'
  const needsCalibration = decision === 'REQUEST_CALIBRATION'
  const isBlocked = decision === 'BLOCK'
  const needsReview = decision === 'REQUIRE_HUMAN_REVIEW'
  const PrimaryIcon = readOnlyMode ? Lock : canApply ? CheckCircle2 : needsCalibration ? Radio : isBlocked ? Lock : needsReview ? AlertTriangle : Play
  const primaryLabel = readOnlyMode
    ? 'Read-only Analysis'
    : canApply
    ? 'Apply Approved Action'
    : needsCalibration
      ? 'Request Calibration'
      : isBlocked
        ? 'Blocked'
        : needsReview
          ? 'Needs Human Review'
          : 'Evaluate First'
  const affectedPvs = Object.entries(draftAction.delta_settings).filter(([, value]) => Math.abs(Number(value)) > 1e-12)
  const activeStep = guidedSteps[guidedStep] ?? guidedSteps[0]
  const stepCount = guidedSteps.length || 1
  const stepNumber = Math.min(stepCount, guidedStep + 1)
  const guidedProgress = `${Math.round((stepNumber / stepCount) * 100)}%`
  const oneSentence = activeStep?.explanation?.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() ?? activeStep?.explanation ?? ''
  const modeLabel = modeLabelOverride ?? (guidedActive ? 'Guided Drifted Twin Test' : 'Live Scenario')
  const scenarioLabel = scenarioLabelOverride ?? (experiment?.data_source === 'recorded_fixture'
    ? `Recorded Fixture${experiment.recorded_step !== null && experiment.recorded_step !== undefined ? ` step ${experiment.recorded_step}` : ''}`
    : (experiment?.scenario_id ?? 'not loaded').replaceAll('_', ' '))

  function updateDelta(name: keyof MachineSettings, value: string) {
    const parsed = Number(value)
    onDraftActionChange({
      ...draftAction,
      source: 'human',
      delta_settings: {
        ...draftAction.delta_settings,
        [name]: Number.isFinite(parsed) ? parsed : 0,
      },
    })
  }

  return (
    <section className={`glass-card experiment-panel ${guidedActive ? 'guided-inline-mode' : ''}`}>
      <div className="card-header">
        <h2>Experiment Runner</h2>
        <span className="step-pill">{guidedActive ? `Guided ${stepNumber}/${stepCount}` : `Step ${experiment?.step_number ?? 0}`}</span>
      </div>

      <div className="runner-mode-card">
        <div>
          <span>Mode</span>
          <strong>{modeLabel}</strong>
        </div>
        <div>
          <span>{guidedActive ? 'Current step' : 'Scenario'}</span>
          <strong>{guidedActive && activeStep ? `${stepNumber} / ${stepCount} - ${activeStep.title}` : scenarioLabel}</strong>
        </div>
      </div>
      {readOnlyMode && (
        <p className="synthetic-data-note">Public data mode is read-only analysis. Live scenario Apply controls are disabled and no hardware actions are available.</p>
      )}

      {guidedConfirmOpen && !guidedActive && (
        <div className="guided-inline-card guided-confirm-card" aria-live="polite">
          <div className="guided-inline-badge-row">
            <span className="guided-inline-badge">Guided: Drifted Twin Test</span>
            <strong>Scenario switch</strong>
          </div>
          <div className="guided-inline-copy">
            <h3>Guided Demo will switch to Drifted Twin Test.</h3>
            <p>The Scenario selector remains live for normal scenarios; Guided is a fixed judging story.</p>
          </div>
          <div className="guided-inline-actions primary-guided-actions">
            <button type="button" disabled={busy} onClick={onGuidedConfirmStart}>Start Guided Demo</button>
            <button type="button" onClick={onGuidedCancel}>Cancel</button>
          </div>
        </div>
      )}

      {guidedActive && activeStep && (
        <div className="guided-inline-card" aria-live="polite">
          <div className="guided-inline-badge-row">
            <span className="guided-inline-badge">Guided Drifted Twin Test</span>
            <strong>Step {stepNumber} of {stepCount}</strong>
          </div>
          <div className="guided-inline-copy">
            <h3>{activeStep.title}</h3>
            <p>{oneSentence}</p>
          </div>
          <div className="guided-inline-progress" aria-label={`Guided demo progress ${guidedProgress}`}>
            <span style={{ width: guidedProgress }} />
          </div>
          <div className="guided-inline-actions primary-guided-actions">
            <button type="button" disabled={guidedBusy || guidedStep <= 0} onClick={onGuidedPrevious}>
              <SkipBack size={14} /> Previous
            </button>
            <button type="button" disabled={guidedBusy || guidedStep >= stepCount - 1} onClick={onGuidedNext}>
              Next <SkipForward size={14} />
            </button>
          </div>
          <div className="guided-inline-actions secondary-guided-actions">
            <button type="button" disabled={guidedBusy} onClick={guidedPlaying ? onGuidedPause : onGuidedAutoPlay}>
              {guidedPlaying ? <Pause size={14} /> : <Play size={14} />} {guidedPlaying ? 'Pause' : 'Auto Play'}
            </button>
            <button type="button" disabled={guidedBusy} onClick={onGuidedReset}><RotateCcw size={14} /> Reset Demo</button>
            <button type="button" disabled={guidedBusy} onClick={onGuidedGenerateReport}><FileText size={14} /> Generate Report</button>
            <button type="button" onClick={onGuidedExit}><X size={14} /> Exit Guided</button>
          </div>
          {(guidedReportNotice || guidedReportReady) && (
            <p className="guided-inline-report-note">
              {guidedReportNotice || 'Mission report is ready for export.'}
            </p>
          )}
          <button className="manual-controls-toggle" type="button" onClick={() => setManualExpanded((expanded) => !expanded)}>
            {manualExpanded ? 'Hide manual controls' : 'Show manual controls'}
          </button>
        </div>
      )}

      <div className={`experiment-manual-controls ${guidedActive && !manualExpanded ? 'collapsed' : ''}`}>
        <label className="intent-field">
          <span>Current proposed action</span>
          <input
            value={draftAction.intent}
            disabled={busy || readOnlyMode}
            onChange={(event) => onDraftActionChange({ ...draftAction, intent: event.target.value, source: 'human' })}
          />
        </label>

        <div className="runner-action-summary">
          <div>
            <span>Action Source</span>
            <strong>{draftAction.source}</strong>
          </div>
          <div>
            <span>Ghost Beam Decision</span>
            <strong>{decisionLabel(decision)}</strong>
          </div>
        </div>

        <div className="affected-pvs runner-pv-chips">
          {affectedPvs.length > 0
            ? affectedPvs.map(([name, value]) => (
              <span key={name}>{name} {Number(value) >= 0 ? '+' : ''}{Number(value).toFixed(3)}</span>
            ))
            : <span>No active delta</span>}
        </div>

        <div className="delta-grid">
          {settingNames.map((name) => (
            <label key={name}>
              <span>{name}</span>
              <input
                type="number"
                step="0.01"
                value={draftAction.delta_settings[name] ?? 0}
                disabled={busy || readOnlyMode}
                onChange={(event) => updateDelta(name, event.target.value)}
              />
            </label>
          ))}
        </div>

        <button
          className="primary-action runner-primary"
          type="button"
          disabled={readOnlyMode || busy || isBlocked || needsReview || (!canApply && !needsCalibration)}
          onClick={canApply ? onApply : onCalibrate}
        >
          <PrimaryIcon size={16} />
          {primaryLabel}
        </button>

        <div className="experiment-actions">
          {!guidedActive && <button type="button" className="guided-action-button" disabled={busy} onClick={onStartGuidedDemo}><Play size={14} /> Guided: Drifted Twin Test</button>}
          <button type="button" disabled={busy || readOnlyMode} onClick={onPropose}><Send size={14} /> Propose</button>
          <button type="button" disabled={busy || readOnlyMode} onClick={onEvaluate}><SlidersHorizontal size={14} /> Evaluate</button>
          <button type="button" disabled={busy || readOnlyMode} className={needsCalibration ? 'needs-attention' : ''} onClick={onCalibrate}>
            <FlaskConical size={14} /> Calibrate
          </button>
          <button type="button" disabled={busy} onClick={onReset}><RotateCcw size={14} /> Reset</button>
          <button type="button" disabled={busy} onClick={onExportSession}><Download size={14} /> Export</button>
        </div>
      </div>

      <p className="synthetic-data-note">
        Demo uses synthetic accelerator-control data generated from Ghost Beam's JAX digital twin. No real facility logs or live EPICS data are used.
      </p>
    </section>
  )
}

export default ExperimentControlPanel
