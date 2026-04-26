import { DecisionRecord } from '../../api/client'
import { decisionLabel, formatNumber } from '../../utils/format'

interface Props {
  record: DecisionRecord | null
}

function NaiveComparisonCard({ record }: Props) {
  const outcome = record?.simulated_outcome_if_applied
  return (
    <section className="glass-card naive-card">
      <h2>Naive vs Ghost Beam</h2>
      <div className="comparison-grid">
        <div>
          <span>Naive optimizer would apply</span>
          <strong>{record?.proposed_action.intent ?? '--'}</strong>
          <em>Projected quality {formatNumber(outcome?.beam_quality, 3)}</em>
        </div>
        <div>
          <span>Ghost Beam decision</span>
          <strong>{decisionLabel(record?.gate_decision.decision)}</strong>
          <em>{record?.gate_decision.safe_next_step ?? '--'}</em>
        </div>
      </div>
    </section>
  )
}

export default NaiveComparisonCard
