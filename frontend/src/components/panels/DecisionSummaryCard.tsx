import { CheckCircle2, Lock, Radio, ShieldAlert } from 'lucide-react'
import { DecisionRecord, ExperimentState } from '../../api/client'
import { decisionLabel } from '../../utils/format'
import { decisionReason, trustScore, trustTone, twinTrustDisplay } from '../../utils/trust'

interface Props {
  record: DecisionRecord | null
  experiment: ExperimentState | null
  onApply: () => void
  onCalibrate: () => void
  currentEvent?: string | null
  busy?: boolean
  readOnlyMode?: boolean
}

function DecisionSummaryCard({ record, experiment, onApply, onCalibrate, currentEvent, busy = false, readOnlyMode = false }: Props) {
  const decision = record?.gate_decision.decision
  const canApply = decision === 'APPROVE' || decision === 'APPROVE_SMALL_STEP'
  const needsCalibration = decision === 'REQUEST_CALIBRATION'
  const Icon = readOnlyMode ? Lock : canApply ? CheckCircle2 : needsCalibration ? Radio : decision === 'BLOCK' ? Lock : ShieldAlert

  return (
    <section className={`glass-card decision-summary-card ${trustTone(record?.virtual_diagnostic.trust_state)} ${currentEvent ? `event-${currentEvent}` : ''}`}>
      <div>
        <h2>Decision Summary</h2>
        <strong>{decisionLabel(decision)}</strong>
        <span>
        Step {experiment?.step_number ?? 0} | Twin {twinTrustDisplay(record)} | Score {trustScore(record).toFixed(2)}
        </span>
        <p>{readOnlyMode ? 'Public data mode is read-only; no Apply action is available.' : decisionReason(record)}</p>
      </div>
      <button
        type="button"
        disabled={readOnlyMode || busy || (!canApply && !needsCalibration)}
        onClick={canApply ? onApply : onCalibrate}
      >
        <Icon size={16} />
        {readOnlyMode ? 'Read-only' : canApply ? 'Apply' : needsCalibration ? 'Calibrate' : 'Hold'}
      </button>
    </section>
  )
}

export default DecisionSummaryCard
