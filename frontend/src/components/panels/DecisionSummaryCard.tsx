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
}

function DecisionSummaryCard({ record, experiment, onApply, onCalibrate, currentEvent, busy = false }: Props) {
  const decision = record?.gate_decision.decision
  const canApply = decision === 'APPROVE' || decision === 'APPROVE_SMALL_STEP'
  const needsCalibration = decision === 'REQUEST_CALIBRATION'
  const Icon = canApply ? CheckCircle2 : needsCalibration ? Radio : decision === 'BLOCK' ? Lock : ShieldAlert

  return (
    <section className={`glass-card decision-summary-card ${trustTone(record?.virtual_diagnostic.trust_state)} ${currentEvent ? `event-${currentEvent}` : ''}`}>
      <div>
        <h2>Decision Summary</h2>
        <strong>{decisionLabel(decision)}</strong>
        <span>
          Step {experiment?.step_number ?? 0} | Twin {twinTrustDisplay(record)} | Score {trustScore(record).toFixed(2)}
        </span>
        <p>{decisionReason(record)}</p>
      </div>
      <button
        type="button"
        disabled={busy || (!canApply && !needsCalibration)}
        onClick={canApply ? onApply : onCalibrate}
      >
        <Icon size={16} />
        {canApply ? 'Apply' : needsCalibration ? 'Calibrate' : 'Hold'}
      </button>
    </section>
  )
}

export default DecisionSummaryCard
