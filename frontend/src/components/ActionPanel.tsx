import { DecisionRecord } from '../api/client'

interface Props {
  record: DecisionRecord | null
  onApply: () => void
  onCalibrate: () => void
}

function ActionPanel({ record, onApply, onCalibrate }: Props) {
  const action = record?.proposed_action
  const decision = record?.gate_decision.decision
  const mayApply = decision === 'APPROVE' || decision === 'APPROVE_SMALL_STEP'
  const risk = decision === 'BLOCK' || decision === 'REQUEST_CALIBRATION' ? 'High Risk' : decision === 'REQUIRE_HUMAN_REVIEW' ? 'Review' : 'Low Risk'

  return (
    <section className="panel-block action-panel">
      <h2>Next Action</h2>
      <h3>{action?.intent ?? 'Waiting for scenario...'}</h3>
      <div className="action-meta">
        <div><span>Source</span><strong>{action?.source ?? '--'}</strong></div>
        <div><span>Impact</span><strong>{risk}</strong></div>
      </div>
      <div className="delta-grid">
        {Object.entries(action?.delta_settings ?? {}).map(([name, value]) => (
          <div key={name}>
            <span>{name}</span>
            <strong>{value > 0 ? '+' : ''}{value.toFixed(3)}</strong>
          </div>
        ))}
      </div>
      <div className="button-row">
        <button type="button" onClick={onApply} disabled={!mayApply}>Apply Sim</button>
        <button type="button" onClick={onCalibrate}>Calibrate</button>
      </div>
    </section>
  )
}

export default ActionPanel
