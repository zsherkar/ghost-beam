import { MoreHorizontal } from 'lucide-react'
import BeamProfileCanvas from '../BeamProfileCanvas'
import { DecisionRecord } from '../../api/client'
import { formatNumber, signed } from '../../utils/format'

interface Props {
  record: DecisionRecord | null
}

function BeamProfileCard({ record }: Props) {
  const vision = record?.vision_diagnostic ?? null
  const trust = record?.virtual_diagnostic.trust_state ?? 'YELLOW'
  const outcome = record?.simulated_outcome_if_applied

  return (
    <section className="glass-card beam-profile-card">
      <div className="card-header">
        <h2>Beam Profile (BPM07-06)</h2>
        <button type="button" aria-label="More">
          <MoreHorizontal size={16} />
        </button>
      </div>
      <div className="beam-profile-layout">
        <BeamProfileCanvas diagnostic={vision} trustState={trust} />
        <div className="beam-profile-metrics">
          <div><span>sigma x</span><strong>{formatNumber(vision?.sigma_x, 3)} mm</strong></div>
          <div><span>sigma y</span><strong>{formatNumber(vision?.sigma_y, 3)} mm</strong></div>
          <div><span>emit.</span><strong>{formatNumber(outcome?.emittance_proxy, 2)} um</strong></div>
          <div><span>halo</span><strong>{formatNumber(vision?.halo_score, 2)}</strong></div>
          <div><span>dx</span><strong>{signed(vision?.centroid_x, 2)} mm</strong></div>
          <div><span>dy</span><strong>{signed(vision?.centroid_y, 2)} mm</strong></div>
        </div>
      </div>
      <div className="tag-row">
        {(vision?.labels ?? ['WAITING']).map((label) => <span key={label}>{label}</span>)}
      </div>
    </section>
  )
}

export default BeamProfileCard
