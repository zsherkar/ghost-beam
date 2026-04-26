import { Text } from '@react-three/drei'

interface Props {
  label: string
  position: [number, number, number]
  tone: 'green' | 'amber'
  delta?: number
}

function Magnet({ label, position, tone, delta }: Props) {
  const color = tone === 'green' ? '#4fb285' : '#c59a46'
  const active = Math.abs(delta ?? 0) > 0.0001
  return (
    <group position={position}>
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.48, 0.38, 0.6]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.38} emissive={active ? color : '#000000'} emissiveIntensity={active ? 0.22 : 0} />
      </mesh>
      <mesh position={[0, -0.32, 0]}>
        <boxGeometry args={[0.48, 0.38, 0.6]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.38} />
      </mesh>
      <Text position={[0, 0.78, 0]} fontSize={0.16} color="#e8eee8" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  )
}

export default Magnet
