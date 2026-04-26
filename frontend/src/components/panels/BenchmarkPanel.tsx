import { Download, Play, X } from 'lucide-react'
import { BenchmarkResult } from '../../api/client'
import { formatNumber } from '../../utils/format'

interface Props {
  open: boolean
  busy: boolean
  result: BenchmarkResult | null
  onRun: () => void
  onExport: () => void
  onClose: () => void
}

const metricLabels: Record<string, string> = {
  total_trials: 'Trials',
  ghostbeam_approved: 'Approved',
  ghostbeam_approved_small_step: 'Small Step',
  ghostbeam_blocked: 'Blocked',
  ghostbeam_requested_calibration: 'Calibration',
  ghostbeam_required_human_review: 'Human Review',
  unsafe_actions_prevented: 'Risk Prevented',
  percent_actions_modified_or_blocked: 'Modified / Held',
  percent_safe_actions_allowed: 'Safe Allowed',
}

function metricValue(value: unknown) {
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : formatNumber(value, 2)
  return value === null || value === undefined ? '--' : String(value)
}

function BenchmarkPanel({ open, busy, result, onRun, onExport, onClose }: Props) {
  if (!open) return null
  const metrics = result?.metrics ?? {}
  const metricKeys = Object.keys(metricLabels)

  return (
    <aside className="benchmark-panel glass-card" aria-label="Naive versus Ghost Beam benchmark">
      <div className="demo-health-header">
        <div>
          <span>Benchmark</span>
          <strong>Naive vs Ghost Beam</strong>
          <p>Deterministic synthetic trials. No real EPICS or facility data.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close benchmark panel">
          <X size={17} />
        </button>
      </div>

      <div className="benchmark-actions">
        <button type="button" onClick={onRun} disabled={busy}>
          <Play size={14} />
          {busy ? 'Running...' : 'Run Benchmark'}
        </button>
        <button type="button" onClick={onExport} disabled={!result}>
          <Download size={14} />
          Export Benchmark JSON
        </button>
      </div>

      {result ? (
        <>
          <p className="benchmark-summary">{result.summary}</p>
          <div className="benchmark-metric-grid">
            {metricKeys.map((key) => (
              <div key={key}>
                <span>{metricLabels[key]}</span>
                <strong>{metricValue(metrics[key])}</strong>
              </div>
            ))}
          </div>

          <div className="benchmark-table">
            <h3>Top Interventions</h3>
            {(result.top_interventions ?? []).map((trial) => (
              <div key={String(trial.trial_id)} className="benchmark-row">
                <span>{String(trial.trial_id)} / {String(trial.category)}</span>
                <strong>{String(trial.ghostbeam_decision)}</strong>
                <p>{String(trial.top_elog_title ?? trial.policy_reasons ?? 'Policy intervention')}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="benchmark-summary">Run the benchmark to quantify how often Ghost Beam allows safe autonomy, blocks hard-limit actions, requests calibration, and catches eLog conflicts.</p>
      )}
    </aside>
  )
}

export default BenchmarkPanel
