import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { DecisionRecord } from '../api/client'

interface Props {
  record: DecisionRecord | null
}

function trustColor(decision?: string) {
  if (decision === 'BLOCK' || decision === 'REQUEST_CALIBRATION') return '#ff5d5d'
  if (decision === 'REQUIRE_HUMAN_REVIEW' || decision === 'APPROVE_SMALL_STEP') return '#f4c86a'
  return '#5ff0a2'
}

function BeamPath({ record }: Props) {
  const particle = useRef<THREE.Mesh>(null)
  const decision = record?.gate_decision.decision
  const vision = record?.vision_diagnostic
  const color = trustColor(decision)
  const offsetX = (vision?.centroid_x ?? 0) * 0.45
  const offsetY = (vision?.centroid_y ?? 0) * 0.45

  const points = useMemo(
    () => [
      new THREE.Vector3(-3.85, 0, 0),
      new THREE.Vector3(-2.3, 0.04, 0.02),
      new THREE.Vector3(-0.8, offsetY * 0.3, offsetX * 0.2),
      new THREE.Vector3(0.9, offsetY * 0.65, offsetX * 0.55),
      new THREE.Vector3(3.15, offsetY, offsetX),
    ],
    [offsetX, offsetY],
  )

  useFrame(({ clock }) => {
    if (!particle.current) return
    const t = (clock.getElapsedTime() * 0.35) % 1
    const curve = new THREE.CatmullRomCurve3(points)
    const point = curve.getPoint(t)
    particle.current.position.copy(point)
  })

  return (
    <group>
      <Line points={points} color={color} lineWidth={4} transparent opacity={0.82} />
      <mesh ref={particle}>
        <sphereGeometry args={[0.08, 20, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
      </mesh>
    </group>
  )
}

export default BeamPath
