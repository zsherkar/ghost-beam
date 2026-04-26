import { useState } from 'react'
import { Copy, Download, X } from 'lucide-react'
import { DecisionRecord, ExperimentState } from '../../api/client'

interface Props {
  record: DecisionRecord | null
  experiment?: ExperimentState | null
  open: boolean
  onClose: () => void
  onDownload: () => void
  onExportSession?: () => void
  onExportEvidenceBundle?: () => void
  exportNotice?: string
}

function DecisionRecordDrawer({
  record,
  experiment,
  open,
  onClose,
  onDownload,
  onExportSession,
  onExportEvidenceBundle,
  exportNotice,
}: Props) {
  const [copied, setCopied] = useState(false)
  if (!open || !record) return null

  async function copyJson() {
    if (!record) return
    await navigator.clipboard.writeText(JSON.stringify(record, null, 2))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const timestamp = new Date().toLocaleString()

  return (
    <div className="drawer-backdrop">
      <aside className="drawer json-drawer glass-card">
        <div className="drawer-header">
          <div>
            <h2>DecisionRecord JSON</h2>
            <p>Machine-readable Ghost Beam decision artifact.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close JSON drawer">
            <X size={18} />
          </button>
        </div>
        <div className="artifact-meta-grid">
          <div><span>Scenario</span><strong>{record.scenario_id}</strong></div>
          <div><span>Step</span><strong>{experiment?.step_number ?? 0}</strong></div>
          <div><span>Generated</span><strong>{timestamp}</strong></div>
          <div><span>Decision</span><strong>{record.gate_decision.decision}</strong></div>
        </div>
        <div className="drawer-actions">
          <button type="button" onClick={() => void copyJson()}><Copy size={15} /> {copied ? 'Copied' : 'Copy JSON'}</button>
          <button type="button" onClick={onDownload}><Download size={15} /> Export Latest Decision</button>
          {onExportSession && <button type="button" onClick={onExportSession}><Download size={15} /> Export Full Session</button>}
          {onExportEvidenceBundle && <button type="button" onClick={onExportEvidenceBundle}><Download size={15} /> Export Evidence Bundle</button>}
        </div>
        {exportNotice && <p className="export-notice">{exportNotice}</p>}
        <pre>{JSON.stringify(record, null, 2)}</pre>
      </aside>
    </div>
  )
}

export default DecisionRecordDrawer
