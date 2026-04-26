import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react'
import { DecisionRecord } from '../../api/client'
import { decisionLabel, formatNumber } from '../../utils/format'
import { policyStrictness, trustScore, trustTone, twinTrustDisplay } from '../../utils/trust'

interface Props {
  record: DecisionRecord | null
  onOpenPolicy: () => void
  onOpenJson: () => void
  currentEvent?: string | null
}

function TrustGateCard({ record, onOpenPolicy, onOpenJson, currentEvent }: Props) {
  const vd = record?.virtual_diagnostic
  const gate = record?.gate_decision
  const label = twinTrustDisplay(record)
  const score = trustScore(record)
  const Icon = label === 'Trusted' ? ShieldCheck : label === 'Caution' ? AlertTriangle : ShieldAlert
  const twinTrustedReview = vd?.trust_state === 'GREEN' && gate?.decision === 'REQUIRE_HUMAN_REVIEW'

  return (
    <section className={`glass-card trust-gate ${trustTone(vd?.trust_state)} ${currentEvent === 'evaluating' ? 'event-evaluating' : ''}`}>
      <div className="card-header">
        <h2>Trust Gate</h2>
        <div className="card-actions">
          <button type="button" onClick={onOpenPolicy}>Review</button>
          <button type="button" onClick={onOpenJson} disabled={!record}>JSON</button>
        </div>
      </div>

      <div className="trust-headline">
        <div className="shield-mark">
          <Icon size={25} />
        </div>
        <div>
          <span>Twin Trust</span>
          <strong>{label}</strong>
        </div>
        <div className="trust-score">
          <span>Score</span>
          <strong>{score.toFixed(2)}</strong>
        </div>
      </div>

      <div className="trust-bar">
        <span style={{ left: `${Math.max(4, Math.min(96, score * 100))}%` }} />
      </div>

      <div className="trust-metrics">
        <div><span>Gate Decision</span><strong>{decisionLabel(gate?.decision)}</strong></div>
        <div><span>Model Confidence</span><strong>{vd ? (1 - Math.min(vd.uncertainty * 4, 0.8)).toFixed(2) : '--'}</strong></div>
        <div><span>Residual Risk</span><strong className="metric-warn">{formatNumber(vd?.predicted_beam_loss, 2)}</strong></div>
        <div><span>Policy Strictness</span><strong>{policyStrictness(record)}</strong></div>
        <div><span>OOD Score</span><strong>{formatNumber(vd?.ood_score, 2)}</strong></div>
        <div><span>Uncertainty</span><strong>{formatNumber(vd?.uncertainty, 3)}</strong></div>
      </div>

      <p className="trust-explainer">
        {twinTrustedReview
          ? 'Digital twin is trusted, but policy/eLog evidence requires human review.'
          : 'Twin trust measures model confidence; gate decision also includes limits, eLogs, vision, and policy.'}
      </p>
    </section>
  )
}

export default TrustGateCard
