import { AlertTriangle, CheckCircle2, Download, FlaskConical, Lock, Play, Radio, RotateCcw, Send, SlidersHorizontal } from 'lucide-react'
import { DecisionRecord, ExperimentState, MachineSettings, ProposedAction } from '../../api/client'
import { decisionLabel } from '../../utils/format'

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
}: Props) {
  const decision = record?.gate_decision.decision
  const canApply = decision === 'APPROVE' || decision === 'APPROVE_SMALL_STEP'
  const needsCalibration = decision === 'REQUEST_CALIBRATION'
  const isBlocked = decision === 'BLOCK'
  const needsReview = decision === 'REQUIRE_HUMAN_REVIEW'
  const PrimaryIcon = canApply ? CheckCircle2 : needsCalibration ? Radio : isBlocked ? Lock : needsReview ? AlertTriangle : Play
  const primaryLabel = canApply
    ? 'Apply Approved Action'
    : needsCalibration
      ? 'Request Calibration'
      : isBlocked
        ? 'Blocked'
        : needsReview
          ? 'Needs Human Review'
          : 'Evaluate First'
  const affectedPvs = Object.entries(draftAction.delta_settings).filter(([, value]) => Math.abs(Number(value)) > 1e-12)

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
    <section className="glass-card experiment-panel">
      <div className="card-header">
        <h2>Experiment Runner</h2>
        <span className="step-pill">Step {experiment?.step_number ?? 0}</span>
      </div>

      <label className="intent-field">
        <span>Current proposed action</span>
        <input
          value={draftAction.intent}
          disabled={busy}
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
              disabled={busy}
              onChange={(event) => updateDelta(name, event.target.value)}
            />
          </label>
        ))}
      </div>

      <button
        className="primary-action runner-primary"
        type="button"
        disabled={busy || isBlocked || needsReview || (!canApply && !needsCalibration)}
        onClick={canApply ? onApply : onCalibrate}
      >
        <PrimaryIcon size={16} />
        {primaryLabel}
      </button>

      <div className="experiment-actions">
        <button type="button" className="guided-action-button" disabled={busy} onClick={onStartGuidedDemo}><Play size={14} /> Guided</button>
        <button type="button" disabled={busy} onClick={onPropose}><Send size={14} /> Propose</button>
        <button type="button" disabled={busy} onClick={onEvaluate}><SlidersHorizontal size={14} /> Evaluate</button>
        <button type="button" disabled={busy} className={needsCalibration ? 'needs-attention' : ''} onClick={onCalibrate}>
          <FlaskConical size={14} /> Calibrate
        </button>
        <button type="button" disabled={busy} onClick={onReset}><RotateCcw size={14} /> Reset</button>
        <button type="button" disabled={busy} onClick={onExportSession}><Download size={14} /> Export</button>
      </div>

      <p className="synthetic-data-note">
        Demo uses synthetic accelerator-control data generated from Ghost Beam's JAX digital twin. No real facility logs or live EPICS data are used.
      </p>
    </section>
  )
}

export default ExperimentControlPanel
