import { AlertTriangle, CheckCircle2, Database, Radio } from 'lucide-react'
import { DecisionRecord } from '../../api/client'
import { formatNumber } from '../../utils/format'

interface Props {
  record: DecisionRecord | null
  currentEvent?: string | null
}

function evidenceImpact(record: DecisionRecord | null) {
  const decision = record?.gate_decision.decision
  const tags = record?.elog_hits[0]?.risk_tags ?? []
  if (!record) return { label: 'Waiting for evidence', Icon: Database, tone: 'neutral' }
  if (decision === 'REQUEST_CALIBRATION' || tags.includes('calibration_required')) {
    return { label: 'Supports calibration', Icon: Radio, tone: 'warn' }
  }
  if (decision === 'REQUIRE_HUMAN_REVIEW' || tags.some((tag) => tag.includes('conflict') || tag.includes('check'))) {
    return { label: 'Requires human review', Icon: AlertTriangle, tone: 'warn' }
  }
  if (decision === 'BLOCK') return { label: 'Safety block context', Icon: AlertTriangle, tone: 'crit' }
  return { label: 'No conflict found', Icon: CheckCircle2, tone: 'ok' }
}

function GateEvidenceCard({ record, currentEvent }: Props) {
  const topHit = record?.elog_hits[0]
  const impact = evidenceImpact(record)
  const Icon = impact.Icon

  return (
    <section className={`glass-card gate-evidence-card evidence-${impact.tone} ${currentEvent === 'evaluating' || currentEvent === 'blocked' ? `event-${currentEvent}` : ''}`}>
      <div className="card-header">
        <h2>Gate Evidence</h2>
        <span className="evidence-impact"><Icon size={13} /> {impact.label}</span>
      </div>

      {topHit ? (
        <>
          <strong className="evidence-title">Top eLog Match: {topHit.title}</strong>
          <div className="evidence-metrics">
            <span>Similarity {formatNumber(topHit.similarity, 2)}</span>
            <span>{topHit.risk_tags.slice(0, 3).join(', ') || 'no risk tags'}</span>
          </div>
          <p>{topHit.recommended_action}</p>
        </>
      ) : (
        <p>No conflicting operator memory found.</p>
      )}
    </section>
  )
}

export default GateEvidenceCard
