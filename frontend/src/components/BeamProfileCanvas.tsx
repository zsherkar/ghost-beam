import { useEffect, useRef } from 'react'
import { TrustState, VisionDiagnosticResult } from '../api/client'

interface Props {
  diagnostic: VisionDiagnosticResult | null
  trustState: TrustState
}

function colorFor(trustState: TrustState) {
  if (trustState === 'GREEN') return [95, 235, 156]
  if (trustState === 'YELLOW') return [244, 200, 106]
  return [255, 95, 95]
}

function BeamProfileCanvas({ diagnostic, trustState }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = canvas.width
    const height = canvas.height
    const image = ctx.createImageData(width, height)
    const [r, g, b] = colorFor(trustState)
    const cx = width * (0.5 + (diagnostic?.centroid_x ?? 0) * 0.38)
    const cy = height * (0.5 + (diagnostic?.centroid_y ?? 0) * 0.38)
    const sx = width * Math.max(0.06, diagnostic?.sigma_x ?? 0.16)
    const sy = height * Math.max(0.06, diagnostic?.sigma_y ?? 0.16)
    const labels = diagnostic?.labels ?? []

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const dx = (x - cx) / sx
        const dy = (y - cy) / sy
        const core = Math.exp(-0.5 * (dx * dx + dy * dy))
        const dist = Math.sqrt(dx * dx + dy * dy)
        const halo = labels.includes('HALO') ? Math.exp(-Math.pow(dist - 3.0, 2) / 0.65) * 0.28 : 0
        const clip = labels.includes('CLIPPED') && (x > width - 10 || y > height - 10) ? 0.35 : 0
        const intensity = Math.min(1, core + halo + clip)
        const index = (y * width + x) * 4
        image.data[index] = Math.floor(r * intensity)
        image.data[index + 1] = Math.floor(g * intensity)
        image.data[index + 2] = Math.floor(b * intensity)
        image.data[index + 3] = Math.floor(255 * Math.min(1, intensity + 0.04))
      }
    }
    ctx.putImageData(image, 0, 0)
  }, [diagnostic, trustState])

  return (
    <div className="beam-profile-heatmap">
      <canvas ref={ref} width={240} height={180} />
    </div>
  )
}

export default BeamProfileCanvas
