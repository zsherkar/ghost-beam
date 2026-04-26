import { DecisionRecord } from '../api/client'

interface Props {
  record: DecisionRecord | null
}

function ControlRoom3D({ record }: Props) {
  const settings = record?.current_settings
  const signal = record?.safe_signals
  const vd = record?.virtual_diagnostic
  const vision = record?.vision_diagnostic

  return (
    <section className="beamline-card">
      <img className="beamline-image" src="/images/beamline-viewport.png" alt="" />
      <div className="beamline-vignette" />

      <div className="beamline-title">
        <span>Beamline · Sector 07</span>
        <h2>L1 Transfer Line</h2>
      </div>

      <div className="view-widget">
        <span>View</span>
        <strong>Isometric</strong>
        <div>
          <button type="button">⌖</button>
          <button type="button">◇</button>
          <button type="button">◌</button>
          <button type="button">⤢</button>
        </div>
      </div>

      <div className="device-callout callout-q1">
        <strong>Q7FF1</strong>
        <span>{settings ? `${settings.quad_1.toFixed(2)} T/m` : '--'}</span>
        <em>Nominal</em>
      </div>

      <div className="device-callout callout-bpm">
        <strong>BPM07-06</strong>
        <span>Δx {vision ? `${vision.centroid_x >= 0 ? '+' : ''}${vision.centroid_x.toFixed(2)} mm` : '--'}</span>
        <em>Δy {vision ? `${vision.centroid_y >= 0 ? '+' : ''}${vision.centroid_y.toFixed(2)} mm` : '--'}</em>
      </div>

      <div className="device-callout callout-bcm">
        <strong>BCM07-03</strong>
        <span>{signal ? `${(signal.beam_current_proxy * 2.8).toFixed(2)} e10` : '--'}</span>
        <em>{vd ? `${(vd.predicted_beam_loss * 100).toFixed(1)} %` : '--'}</em>
      </div>

      <div className="viewport-controls">
        <button type="button">↺</button>
        <div>
          <button type="button">−</button>
          <span>+</span>
          <button type="button">＋</button>
        </div>
        <button type="button">⤢</button>
      </div>
    </section>
  )
}

export default ControlRoom3D
