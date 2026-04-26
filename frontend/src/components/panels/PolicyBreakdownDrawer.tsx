import { X } from 'lucide-react'
import { DecisionRecord } from '../../api/client'
import { decisionLabel } from '../../utils/format'

interface Props {
  record: DecisionRecord | null
  open: boolean
  onClose: () => void
}

function status(pass: boolean) {
  return pass ? 'PASS' : 'CHECK'
}

function PolicyBreakdownDrawer({ record, open, onClose }: Props) {
  if (!open) return null
  const gate = record?.gate_decision
  const vd = record?.virtual_diagnostic
  const vision = record?.vision_diagnostic
  const checklist = [
    ['Hard limits check', gate?.decision !== 'BLOCK'],
    ['Trust state check', vd?.trust_state !== 'RED'],
    ['OOD check', (vd?.ood_score ?? 99) < 4],
    ['Beam loss check', (vd?.predicted_beam_loss ?? 1) < 0.34],
    ['Vision diagnostic check', !(vision?.labels ?? []).includes('CLIPPED')],
    ['eLog conflict check', gate?.decision !== 'REQUIRE_HUMAN_REVIEW'],
    ['Human approval requirement', !gate?.human_approval_required],
  ] as const

  return (
    <div className="drawer-backdrop">
      <aside className="drawer glass-card">
        <div className="drawer-header">
          <div>
            <h2>Policy Breakdown</h2>
            <p>Final decision: {decisionLabel(gate?.decision)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close policy drawer">
            <X size={18} />
          </button>
        </div>
        <div className="policy-checklist">
          {checklist.map(([label, passed]) => (
            <div key={label}>
              <span>{label}</span>
              <strong className={passed ? 'check-pass' : 'check-warn'}>{status(Boolean(passed))}</strong>
            </div>
          ))}
        </div>
        <h3>Reasons</h3>
        <ul>
          {(gate?.reasons ?? ['Waiting for backend DecisionRecord.']).map((reason, index) => (
            <li key={`${index}-${reason}`}>{reason}</li>
          ))}
        </ul>
      </aside>
    </div>
  )
}

export default PolicyBreakdownDrawer
