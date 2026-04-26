import { CheckCircle2, Loader2, Play, RefreshCw, XCircle } from 'lucide-react'

export interface DemoHealthItem {
  id: string
  label: string
  status: 'pending' | 'running' | 'pass' | 'warn' | 'fail'
  detail: string
}

interface Props {
  open: boolean
  busy: boolean
  items: DemoHealthItem[]
  onRun: () => void
  onClose: () => void
}

function statusIcon(status: DemoHealthItem['status']) {
  if (status === 'pass') return <CheckCircle2 size={15} />
  if (status === 'running') return <Loader2 size={15} className="spin-icon" />
  if (status === 'fail') return <XCircle size={15} />
  return <RefreshCw size={15} />
}

function DemoHealthCheckPanel({ open, busy, items, onRun, onClose }: Props) {
  if (!open) return null

  return (
    <aside className="demo-health-panel glass-card" aria-label="Demo Health Check">
      <div className="demo-health-header">
        <div>
          <span>Pre-demo</span>
          <strong>Health Check</strong>
          <p>Dry-run health check: does not alter current experiment session.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close health check">
          <XCircle size={17} />
        </button>
      </div>

      <div className="health-check-list">
        {items.map((item) => (
          <div key={item.id} className={`health-check-row health-${item.status}`}>
            <span>{statusIcon(item.status)}</span>
            <div>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="health-run-button" type="button" onClick={onRun} disabled={busy}>
        <Play size={14} />
        {busy ? 'Running checks...' : 'Run Demo Health Check'}
      </button>
    </aside>
  )
}

export default DemoHealthCheckPanel
