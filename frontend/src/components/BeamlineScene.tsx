import { DecisionRecord } from '../api/client'
import BeamPath from './BeamPath'
import DiagnosticScreen from './DiagnosticScreen'
import Magnet from './Magnet'
import RFCavity from './RFCavity'
import TrustEnvelope from './TrustEnvelope'

interface Props {
  record: DecisionRecord | null
}

function BeamPipe() {
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 7.8, 48, 1, true]} />
        <meshStandardMaterial color="#d4d8d1" metalness={0.86} roughness={0.18} transparent opacity={0.34} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 7.82, 48, 1, true]} />
        <meshStandardMaterial color="#69d7a1" transparent opacity={0.08} roughness={0.4} />
      </mesh>
    </group>
  )
}

function ElectronGun() {
  return (
    <group position={[-3.9, 0, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.34, 0.7, 32]} />
        <meshStandardMaterial color="#c9a45b" metalness={0.6} roughness={0.26} />
      </mesh>
      <mesh position={[-0.42, 0, 0]}>
        <sphereGeometry args={[0.18, 24, 16]} />
        <meshStandardMaterial color="#f0d38a" emissive="#6c4b17" emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

function BPM({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.025, 12, 40]} />
        <meshStandardMaterial color="#8ec6c2" metalness={0.5} roughness={0.22} />
      </mesh>
      <mesh position={[0, -0.38, 0]}>
        <boxGeometry args={[0.34, 0.08, 0.16]} />
        <meshStandardMaterial color="#2c6461" />
      </mesh>
    </group>
  )
}

function BeamlineScene({ record }: Props) {
  const trust = record?.virtual_diagnostic.trust_state ?? 'YELLOW'
  const labels = record?.vision_diagnostic.labels ?? ['CENTERED']
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.93, 0]}>
        <planeGeometry args={[9.4, 4.8]} />
        <meshStandardMaterial color="#0c100f" metalness={0.2} roughness={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.925, 0]}>
        <ringGeometry args={[2.25, 2.27, 96]} />
        <meshStandardMaterial color="#36443d" transparent opacity={0.35} />
      </mesh>
      <TrustEnvelope trustState={trust} />
      <BeamPipe />
      <ElectronGun />
      <RFCavity position={[-2.15, 0, 0]} />
      <Magnet label="Q1" position={[-0.95, 0, 0]} tone="green" delta={record?.proposed_action.delta_settings.quad_1} />
      <BPM x={-0.2} />
      <Magnet label="Q2" position={[0.95, 0, 0]} tone="amber" delta={record?.proposed_action.delta_settings.quad_2} />
      <BPM x={1.85} />
      <DiagnosticScreen position={[3.25, 0, 0]} labels={labels} trustState={trust} />
      <BeamPath record={record} />
      <gridHelper args={[8.5, 18, '#2e3934', '#151b18']} position={[0, -0.9, 0]} />
    </group>
  )
}

export default BeamlineScene
