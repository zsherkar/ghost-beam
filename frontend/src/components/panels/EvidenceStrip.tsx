import { useRef } from 'react'
import { DecisionRecord, ElogHit, ExperimentState } from '../../api/client'

interface Props {
  record: DecisionRecord | null
  experiment: ExperimentState | null
  viewAllOpen?: boolean
  onViewAll: () => void
}

function severity(hit: ElogHit) {
  if (hit.risk_tags.some((tag) => tag.includes('beam_loss') || tag.includes('calibration_required'))) return 'WARN'
  if (hit.risk_tags.some((tag) => tag.includes('quad_conflict') || tag.includes('halo'))) return 'WARN'
  return 'INFO'
}

function EvidenceStrip({ record, experiment, viewAllOpen = false, onViewAll }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const hits = record?.elog_hits ?? []
  const history = experiment?.history.slice(-4).reverse() ?? []
  const cards = [
    {
      time: '14:31:58',
      badge: 'INFO',
      title: 'Autonomous Tuning Step',
      summary: record?.proposed_action.intent ?? 'Waiting for proposed action.',
      source: `Agent: ${record?.proposed_action.source ?? 'Scenario'} v2.3.1`,
    },
    {
      time: '14:30:12',
      badge: 'INFO',
      title: 'Model Agreement Check',
      summary: record
        ? `Uncertainty ${record.virtual_diagnostic.uncertainty.toFixed(3)}, OOD ${record.virtual_diagnostic.ood_score.toFixed(2)}`
        : 'Waiting for diagnostic.',
      source: 'Agent: ModelGuard v1.4.0',
    },
    {
      time: '14:29:47',
      badge: record?.gate_decision.decision === 'BLOCK'
        ? 'CRIT'
        : record?.gate_decision.human_approval_required
          ? 'WARN'
          : 'INFO',
      title: 'Policy Gate Result',
      summary: record?.gate_decision.safe_next_step ?? 'Waiting for deterministic gate.',
      source: `Decision: ${record?.gate_decision.decision ?? 'Pending'}`,
    },
    {
      time: '14:28:33',
      badge: record?.vision_diagnostic.labels.some((label) => ['HALO', 'CLIPPED', 'DIFFUSE'].includes(label))
        ? 'WARN'
        : 'INFO',
      title: 'Beam Profile Analysis',
      summary: record ? record.vision_diagnostic.labels.join(', ') : 'Waiting for vision diagnostic.',
      source: 'Agent: VisionMoment v1.1.0',
    },
    ...history.map((event) => ({
      time: event.timestamp.slice(11, 19),
      badge: event.kind.includes('reject') ? 'WARN' : event.kind === 'apply' ? 'INFO' : event.kind === 'calibration' ? 'WARN' : 'INFO',
      title: event.title,
      summary: `Experiment step ${event.step} | ${event.kind}`,
      source: 'Session history',
    })),
    ...hits.map((hit, index) => ({
      time: `14:2${7 - index}:05`,
      badge: severity(hit),
      title: hit.title,
      summary: hit.recommended_action,
      source: `Similarity ${hit.similarity.toFixed(2)} | ${hit.risk_tags.slice(0, 2).join(', ')}`,
    })),
  ]

  function scrollCarousel(direction: -1 | 1) {
    trackRef.current?.scrollBy({
      left: direction * 276,
      behavior: 'smooth',
    })
  }

  return (
    <section className="glass-card evidence-panel">
      <div className="evidence-header">
        <div className="evidence-title-group">
          <h2 className="panel-title">EVIDENCE & eLOG</h2>
          <button className={`view-all-button ${viewAllOpen ? 'active' : ''}`} type="button" onClick={onViewAll}>
            {viewAllOpen ? 'Close' : 'View All'}
          </button>
        </div>
        <div className="carousel-controls" aria-label="Evidence carousel controls">
          <button type="button" aria-label="Scroll evidence left" onClick={() => scrollCarousel(-1)}>&lt;</button>
          <button type="button" aria-label="Scroll evidence right" onClick={() => scrollCarousel(1)}>&gt;</button>
        </div>
      </div>

      <div className="evidence-carousel-viewport">
        <div className="evidence-carousel-track" ref={trackRef}>
          {cards.map((card, index) => (
            <article className="evidence-card" key={`${index}-${card.time}-${card.title}-${card.source}`}>
              <div className="evidence-card-top">
                <span>{card.time}</span>
                <strong className={`badge badge-${card.badge.toLowerCase()}`}>{card.badge}</strong>
              </div>
              <h3 className="evidence-card-title">{card.title}</h3>
              <p className="evidence-card-summary">{card.summary}</p>
              <em className="evidence-card-agent">{card.source}</em>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default EvidenceStrip
