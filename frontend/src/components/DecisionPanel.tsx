import { DecisionRecord } from '../api/client'

interface Props {
  record: DecisionRecord | null
  onToggleJson: () => void
  onDownload: () => void
}

function trustLabel(record: DecisionRecord | null) {
  const trust = record?.virtual_diagnostic.trust_state
  if (trust === 'GREEN') return 'Trusted'
  if (trust === 'YELLOW') return 'Caution'
  if (trust === 'RED') return 'Calibration Needed'
  return 'Pending'
}

function DecisionPanel({ record, onToggleJson, onDownload }: Props) {
  const vd = record?.virtual_diagnostic
  const gate = record?.gate_decision
  const score = vd ? Math.max(0, Math.min(1, 1 - vd.uncertainty - Math.min(vd.ood_score / 12, 0.42))) : 0
  const policyStrictness = gate?.human_approval_required ? 'High' : gate?.decision === 'APPROVE_SMALL_STEP' ? 'Medium' : 'Low'

  return (
    <section className="panel-block trust-panel">
      <div className="panel-title-row">
        <h2>Trust Gate</h2>
        <button type="button" onClick={onToggleJson}>×</button>
      </div>
      <div className="trust-headline">
        <div className="shield-mark">◇</div>
        <div>
          <span>Current Trust State</span>
          <strong>{trustLabel(record)}</strong>
        </div>
        <div className="trust-score">
          <span>Score</span>
          <strong>{score.toFixed(2)}</strong>
        </div>
      </div>
      <div className="trust-scale">
        <span style={{ width: `${Math.max(8, score * 100)}%` }} />
      </div>
      <div className="trust-metrics">
        <div><span>Twin Agreement</span><strong>{vd ? (1 - Math.min(vd.ood_score / 12, 0.72)).toFixed(2) : '--'}</strong></div>
        <div><span>Model Confidence</span><strong>{vd ? (1 - Math.min(vd.uncertainty * 4, 0.8)).toFixed(2) : '--'}</strong></div>
        <div><span>Residual Risk</span><strong className="warn">{vd ? vd.predicted_beam_loss.toFixed(2) : '--'}</strong></div>
        <div><span>Policy Strictness</span><strong>{policyStrictness}</strong></div>
      </div>
      <p className="next-step">{gate?.safe_next_step ?? 'Waiting for backend decision.'}</p>
      <div className="button-row">
        <button type="button" onClick={onToggleJson} disabled={!record}>Decision JSON</button>
        <button type="button" onClick={onDownload} disabled={!record}>Download</button>
      </div>
    </section>
  )
}

export default DecisionPanel
