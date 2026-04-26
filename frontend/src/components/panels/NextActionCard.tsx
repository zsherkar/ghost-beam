import { AlertTriangle, CheckCircle2, Lock, Radio } from 'lucide-react'
import { DecisionRecord } from '../../api/client'
import { decisionLabel } from '../../utils/format'

interface Props {
  record: DecisionRecord | null
  onApply: () => void
  onCalibrate: () => void
  onOpenPolicy: () => void
}

function actionButton(record: DecisionRecord | null) {
  const decision = record?.gate_decision.decision
  if (decision === 'APPROVE' || decision === 'APPROVE_SMALL_STEP') return ['Apply Approved Action', CheckCircle2] as const
  if (decision === 'REQUEST_CALIBRATION') return ['Request Calibration', Radio] as const
  if (decision === 'BLOCK') return ['Blocked', Lock] as const
  return ['Needs Human Review', AlertTriangle] as const
}

function riskText(record: DecisionRecord | null) {
  const decision = record?.gate_decision.decision
  if (decision === 'BLOCK' || decision === 'REQUEST_CALIBRATION') return 'High Risk'
  if (decision === 'REQUIRE_HUMAN_REVIEW') return 'Review'
  if (decision === 'APPROVE_SMALL_STEP') return 'Low-Medium'
  return 'Low Risk'
}

function NextActionCard({ record, onApply, onCalibrate, onOpenPolicy }: Props) {
  const [label, Icon] = actionButton(record)
  const decision = record?.gate_decision.decision
  const canApply = decision === 'APPROVE' || decision === 'APPROVE_SMALL_STEP'
  const needsCalibration = decision === 'REQUEST_CALIBRATION'
  const onPrimary = canApply ? onApply : needsCalibration ? onCalibrate : onOpenPolicy

  return (
    <section className="glass-card next-action-card">
      <h2>Next Action (Autonomous Agent)</h2>
      <h3>{record?.proposed_action.intent ?? 'Waiting for proposed action'}</h3>
      <div className="action-meta">
        <div><span>Objective</span><strong>{decisionLabel(record?.gate_decision.decision)}</strong></div>
        <div><span>Impact</span><strong>{riskText(record)}</strong></div>
      </div>
      <div className="affected-pvs">
        {Object.entries(record?.proposed_action.delta_settings ?? {}).map(([name, value]) => (
          <span key={name}>{name} {value >= 0 ? '+' : ''}{value.toFixed(3)}</span>
        ))}
      </div>
      <button className="primary-action" type="button" disabled={decision === 'BLOCK'} onClick={onPrimary}>
        <Icon size={17} />
        {label}
      </button>
    </section>
  )
}

export default NextActionCard
