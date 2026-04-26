import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { ReplayArtifact } from '../../api/client'

interface Props {
  open: boolean
  artifact: ReplayArtifact | null
  activeStep: number
  onStep: (index: number) => void
  onClose: () => void
}

function ReplayPanel({ open, artifact, activeStep, onStep, onClose }: Props) {
  if (!open) return null
  const sequence = artifact?.sequence ?? []
  const step = sequence[activeStep] ?? sequence[0]

  return (
    <aside className="replay-panel glass-card" aria-label="Replay artifact viewer">
      <div className="demo-health-header">
        <div>
          <span>Replay Artifact</span>
          <strong>{artifact?.created_for ?? 'Drifted Twin Test'}</strong>
          <p>Replay artifact - not a live backend action. Switch back to live mode by closing this panel.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close replay mode">
          <X size={17} />
        </button>
      </div>

      <div className="replay-timeline">
        {sequence.map((item, index) => (
          <button
            key={`${index}-${String(item.title)}`}
            type="button"
            className={index === activeStep ? 'active' : ''}
            onClick={() => onStep(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {step && (
        <div className="replay-card">
          <span>Step {activeStep + 1}</span>
          <h3>{String(step.title ?? 'Replay Step')}</h3>
          <p>{String(step.operator_story ?? artifact?.disclosure ?? '')}</p>
          <dl>
            {Object.entries(step)
              .filter(([key]) => !['title', 'operator_story'].includes(key))
              .map(([key, value]) => (
                <div key={key}>
                  <dt>{key.replaceAll('_', ' ')}</dt>
                  <dd>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd>
                </div>
              ))}
          </dl>
        </div>
      )}

      <div className="replay-controls">
        <button type="button" disabled={activeStep === 0} onClick={() => onStep(Math.max(0, activeStep - 1))}>
          <ChevronLeft size={14} /> Previous
        </button>
        <button type="button" disabled={activeStep >= sequence.length - 1} onClick={() => onStep(Math.min(sequence.length - 1, activeStep + 1))}>
          Next <ChevronRight size={14} />
        </button>
      </div>
    </aside>
  )
}

export default ReplayPanel
