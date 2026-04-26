import { Text } from '@react-three/drei'
import { TrustState } from '../api/client'

interface Props {
  position: [number, number, number]
  labels: string[]
  trustState: TrustState
}

function DiagnosticScreen({ position, labels, trustState }: Props) {
  const color = trustState === 'GREEN' ? '#65e6a0' : trustState === 'YELLOW' ? '#f4c86a' : '#ff6464'
  const clipped = labels.includes('CLIPPED')
  return (
    <group position={position} rotation={[0, -0.28, 0]}>
      <mesh>
        <boxGeometry args={[0.08, 1.2, 1.2]} />
        <meshStandardMaterial color="#3b4240" metalness={0.25} roughness={0.38} />
      </mesh>
      <mesh position={[-0.055, 0, 0]}>
        <planeGeometry args={[1.0, 1.0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} transparent opacity={clipped ? 0.45 : 0.65} />
      </mesh>
      <Text position={[0.02, -0.78, 0]} fontSize={0.12} color="#dce5df" anchorX="center">
        OTR
      </Text>
    </group>
  )
}

export default DiagnosticScreen
