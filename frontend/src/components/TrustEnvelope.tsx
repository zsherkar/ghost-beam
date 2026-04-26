import { TrustState } from '../api/client'

interface Props {
  trustState: TrustState
}

function TrustEnvelope({ trustState }: Props) {
  const color = trustState === 'GREEN' ? '#3ee486' : trustState === 'YELLOW' ? '#f6bf5b' : '#ff5656'
  const opacity = trustState === 'GREEN' ? 0.1 : trustState === 'YELLOW' ? 0.16 : 0.22
  return (
    <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.58, 0.58, 7.2, 48, 1, true]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.5} />
    </mesh>
  )
}

export default TrustEnvelope
