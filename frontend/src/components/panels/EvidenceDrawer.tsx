import { useMemo, useState } from 'react'
import { Copy, Download, Search, X } from 'lucide-react'
import { DecisionRecord, ExperimentState } from '../../api/client'
import { decisionLabel } from '../../utils/format'
import { downloadTextFile, fileTimestamp } from '../../utils/missionReport'

type Filter = 'all' | 'info' | 'warning' | 'block' | 'calibration' | 'human_review' | 'elog'

interface Props {
  open: boolean
  record: DecisionRecord | null
  experiment: ExperimentState | null
  onClose: () => void
  onOpenDecisionRecord: () => void
}

function eventSeverity(kind: string) {
  if (kind.includes('reject') || kind.includes('block')) return 'block'
  if (kind.includes('calibration')) return 'calibration'
  if (kind.includes('review')) return 'human_review'
  return 'info'
}

function EvidenceDrawer({ open, record, experiment, onClose, onOpenDecisionRecord }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState(false)

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const eventRows = (experiment?.history ?? []).map((event) => ({
      id: `event-${event.step}-${event.timestamp}-${event.kind}`,
      type: eventSeverity(event.kind) as Filter,
      title: event.title,
      meta: `${event.timestamp.slice(11, 19)} | ${event.kind} | step ${event.step}`,
      detail: JSON.stringify(event.payload ?? {}),
      source: 'Event History',
    }))
    const elogRows = (record?.elog_hits ?? []).map((hit, index) => ({
      id: `elog-${index}-${hit.date}-${hit.title}`,
      type: 'elog' as Filter,
      title: hit.title,
      meta: `Similarity ${hit.similarity.toFixed(2)} | ${hit.risk_tags.join(', ') || 'no risk tags'}`,
      detail: hit.recommended_action,
      source: `Synthetic eLog | ${hit.date}`,
    }))
    const decisionRows = record
      ? [{
          id: `decision-${record.scenario_id}-${record.gate_decision.decision}`,
          type: record.gate_decision.decision === 'BLOCK'
            ? 'block' as Filter
            : record.gate_decision.decision === 'REQUEST_CALIBRATION'
              ? 'calibration' as Filter
              : record.gate_decision.decision === 'REQUIRE_HUMAN_REVIEW'
                ? 'human_review' as Filter
                : 'info' as Filter,
          title: `Decision Record: ${decisionLabel(record.gate_decision.decision)}`,
          meta: `${record.scenario_id} | ${record.proposed_action.source}`,
          detail: record.gate_decision.safe_next_step,
          source: 'Decision Records',
        }]
      : []
    return [...decisionRows, ...eventRows.reverse(), ...elogRows].filter((row) => {
      const filterMatch = filter === 'all' || row.type === filter || (filter === 'warning' && ['calibration', 'human_review'].includes(row.type))
      if (!filterMatch) return false
      if (!normalizedQuery) return true
      return `${row.title} ${row.meta} ${row.detail} ${row.source}`.toLowerCase().includes(normalizedQuery)
    })
  }, [experiment?.history, filter, query, record])

  if (!open) return null

  const exportPayload = {
    scenario_id: experiment?.scenario_id ?? record?.scenario_id ?? 'unknown',
    step_number: experiment?.step_number ?? 0,
    event_history: experiment?.history ?? [],
    retrieved_elogs: record?.elog_hits ?? [],
    latest_decision_record: record,
    synthetic_data_disclosure: 'Demo uses synthetic accelerator-control data from the Ghost Beam JAX digital twin. No live EPICS data or real facility logs are used.',
  }

  async function copyEvidence() {
    await navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  function downloadEvidence() {
    downloadTextFile(
      `ghostbeam_evidence_${fileTimestamp()}.json`,
      JSON.stringify(exportPayload, null, 2),
      'application/json',
    )
  }

  return (
    <div className="drawer-backdrop evidence-backdrop" onClick={onClose}>
      <aside className="drawer evidence-drawer glass-card" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h2>Evidence & eLog</h2>
            <p>Session history, retrieved operator memory, and Decision Record artifacts.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close evidence drawer">
            <X size={18} />
          </button>
        </div>

        <div className="evidence-drawer-toolbar">
          <label className="evidence-search">
            <Search size={15} />
            <input value={query} placeholder="Search evidence..." onChange={(event) => setQuery(event.currentTarget.value)} />
          </label>
          <div className="evidence-filter-row" aria-label="Evidence filters">
            {(['all', 'info', 'warning', 'block', 'calibration', 'human_review', 'elog'] as Filter[]).map((item) => (
              <button key={item} className={filter === item ? 'active' : ''} type="button" onClick={() => setFilter(item)}>
                {item.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="evidence-drawer-actions">
          <button type="button" onClick={onOpenDecisionRecord}>Open Decision Record</button>
          <button type="button" onClick={() => void copyEvidence()}><Copy size={14} /> {copied ? 'Copied' : 'Copy Evidence JSON'}</button>
          <button type="button" onClick={downloadEvidence}><Download size={14} /> Download Evidence</button>
        </div>

        <div className="evidence-drawer-section">
          <h3>Event History</h3>
          <p>{experiment?.history.length ?? 0} session events in the current simulated experiment.</p>
        </div>

        <div className="evidence-drawer-list">
          {rows.map((row) => (
            <article className={`evidence-drawer-row evidence-row-${row.type}`} key={row.id}>
              <div>
                <span>{row.source}</span>
                <strong>{row.title}</strong>
                <p>{row.detail}</p>
              </div>
              <em>{row.meta}</em>
            </article>
          ))}
          {!rows.length && (
            <article className="evidence-drawer-row">
              <div>
                <span>No matching evidence</span>
                <strong>Try a broader filter or clear the search box.</strong>
              </div>
            </article>
          )}
        </div>
      </aside>
    </div>
  )
}

export default EvidenceDrawer
