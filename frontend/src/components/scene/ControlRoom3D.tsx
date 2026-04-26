import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import { ChevronDown, ChevronUp, Maximize2, Minimize2, Minus, Pin, PinOff, RotateCcw, Target, X, ZoomIn } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { DecisionRecord, ExperimentDevice, ExperimentState, ProposedAction } from '../../api/client'
import { formatNumber, signed } from '../../utils/format'
import { beamTone } from '../../utils/trust'

interface Props {
  record: DecisionRecord | null
  experiment: ExperimentState | null
  draftAction: ProposedAction
  selectedDevice: string
  onSelectDevice: (deviceId: string) => void
  onOpenPolicy: () => void
  onDeviceTrim: (deviceId: string) => void
  onEvaluate: () => void
  onApply: () => void
  onCalibrate: () => void
  onReset: () => void
  currentEvent?: ExperimentEventState
  twinLightingMode: TwinLightingMode
  onTwinLightingModeChange: (mode: TwinLightingMode) => void
  appTheme: 'dark' | 'light'
  busy?: boolean
  judgeMode?: boolean
}

const fallbackDevices: ExperimentDevice[] = [
  { id: 'Q7FF1', type: 'quadrupole', pv: 'quad_1', value: 0, unit: 'T/m', min: -2, max: 2, max_delta: 0.15, position: [0, 0, -3.35] },
  { id: 'Q7FF2', type: 'quadrupole', pv: 'quad_2', value: 0, unit: 'T/m', min: -2, max: 2, max_delta: 0.15, position: [0, 0, -1.55] },
  { id: 'RFCAV07', type: 'rf_cavity', pv: 'rf_phase', value: 0, unit: 'deg', min: -10, max: 10, max_delta: 1, position: [0, 0, 1.3] },
  { id: 'BPM07-06', type: 'bpm', pv: 'bpm_x_2', value: 0, unit: 'mm', min: null, max: null, max_delta: null, position: [0, 0, 2.55] },
  { id: 'BCM07-03', type: 'bcm', pv: 'beam_current_proxy', value: 0, unit: 'a.u.', min: null, max: null, max_delta: null, position: [0, 0, 3.55] },
  { id: 'OTR07', type: 'diagnostic_screen', pv: 'beam_quality', value: 0, unit: 'a.u.', min: null, max: null, max_delta: null, position: [0, 0, 4.55] },
]

type ViewPreset = 'isometric' | 'top' | 'side' | 'diagnostic' | 'selected'
type LabelMode = 'minimal' | 'active' | 'full'
type TwinMode = 'physical' | 'twin' | 'diagnostics' | 'policy'
type TwinLightingMode = 'control-room' | 'inspection' | 'presentation'
type ExperimentEventState = 'evaluating' | 'calibrating' | 'applying' | 'blocked' | null
type CameraCommand = { kind: 'reset' | 'zoom-in' | 'zoom-out'; nonce: number } | null

function safeLocalStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeLocalStorageSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // HUD state persistence must not be able to crash the 3D twin.
  }
}

const lightingConfigs: Record<TwinLightingMode, {
  background: string
  fogColor: string
  fogNear: number
  fogFar: number
  ambient: number
  hemi: number
  directional: number
  spot: number
  rim: number
  floor: string
  gridMain: string
  gridSub: string
}> = {
  'control-room': {
    background: '#070b0d',
    fogColor: '#05070a',
    fogNear: 11,
    fogFar: 20,
    ambient: 0.74,
    hemi: 0.72,
    directional: 2.2,
    spot: 2.4,
    rim: 3.4,
    floor: '#0b1115',
    gridMain: '#2c4145',
    gridSub: '#121d21',
  },
  inspection: {
    background: '#11181d',
    fogColor: '#11181d',
    fogNear: 18,
    fogFar: 34,
    ambient: 1.05,
    hemi: 1.1,
    directional: 3.2,
    spot: 3.4,
    rim: 2.7,
    floor: '#151f25',
    gridMain: '#4e6870',
    gridSub: '#243238',
  },
  presentation: {
    background: '#080d10',
    fogColor: '#05070a',
    fogNear: 14,
    fogFar: 27,
    ambient: 0.9,
    hemi: 0.96,
    directional: 2.8,
    spot: 3.0,
    rim: 3.8,
    floor: '#10171b',
    gridMain: '#3a5960',
    gridSub: '#17282c',
  },
}

const lightLightingConfigs: Record<TwinLightingMode, typeof lightingConfigs[TwinLightingMode]> = {
  'control-room': {
    background: '#182027',
    fogColor: '#182027',
    fogNear: 17,
    fogFar: 31,
    ambient: 0.9,
    hemi: 1.0,
    directional: 2.8,
    spot: 2.8,
    rim: 2.2,
    floor: '#202a32',
    gridMain: '#5f737d',
    gridSub: '#32424a',
  },
  inspection: {
    background: '#dfe6eb',
    fogColor: '#dfe6eb',
    fogNear: 26,
    fogFar: 48,
    ambient: 1.25,
    hemi: 1.35,
    directional: 3.8,
    spot: 3.5,
    rim: 1.8,
    floor: '#c7d0d7',
    gridMain: '#8aa0aa',
    gridSub: '#d8e0e5',
  },
  presentation: {
    background: '#eef3f5',
    fogColor: '#eef3f5',
    fogNear: 23,
    fogFar: 42,
    ambient: 1.16,
    hemi: 1.25,
    directional: 3.45,
    spot: 3.15,
    rim: 2.2,
    floor: '#d5dde3',
    gridMain: '#7c929c',
    gridSub: '#c6d0d6',
  },
}

function toScene(position: [number, number, number]): [number, number, number] {
  return [position[2], position[1], position[0]]
}

function deviceForPv(pv: string) {
  const map: Record<string, string> = {
    quad_1: 'Q7FF1',
    quad_2: 'Q7FF2',
    steer_x: 'STEER07-X',
    steer_y: 'STEER07-Y',
    rf_phase: 'RFCAV07',
    rf_amplitude: 'RFCAV07',
  }
  return map[pv]
}

function BeamPath({
  experiment,
  tone,
  record,
  twinMode,
  currentEvent,
}: {
  experiment: ExperimentState | null
  tone: string
  record: DecisionRecord | null
  twinMode: TwinMode
  currentEvent?: ExperimentEventState
}) {
  const group = useRef<THREE.Group>(null)
  const pulseRef = useRef<THREE.Mesh>(null)
  const color = tone === 'beam-green' ? '#65ff9d' : tone === 'beam-red' ? '#ff445e' : '#ff9c48'
  const policyOutline = record?.gate_decision.decision === 'REQUIRE_HUMAN_REVIEW' && record.virtual_diagnostic.trust_state === 'GREEN'
  const envelopeColor = policyOutline ? '#ffbc5e' : color
  const halo = record?.vision_diagnostic.labels.some((label) => label === 'HALO' || label === 'DIFFUSE') ?? false
  const envelopeOpacity = twinMode === 'twin' || twinMode === 'policy' ? 0.16 : halo ? 0.13 : 0.08
  const points = useMemo(() => {
    const trajectory = experiment?.trajectory?.length
      ? experiment.trajectory
      : [[0, 0, -4.8], [0, 0, -2.4], [0, 0, 0], [0, 0, 2.4], [0, 0, 4.8]]
    return trajectory.map((point) => new THREE.Vector3(point[2], point[1] * 4.5, point[0] * 4.5))
  }, [experiment?.trajectory])

  useFrame(({ clock }) => {
    if (!group.current) return
    const intensity = currentEvent ? 0.12 : tone === 'beam-red' ? 0.08 : 0.04
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 3.1) * intensity
    group.current.scale.set(1, pulse, pulse)
    if (pulseRef.current && points.length > 1) {
      const travel = (clock.getElapsedTime() * (currentEvent === 'evaluating' ? 0.9 : 1.25)) % 1
      const raw = travel * (points.length - 1)
      const index = Math.min(points.length - 2, Math.floor(raw))
      const local = raw - index
      pulseRef.current.position.copy(points[index].clone().lerp(points[index + 1], local))
      pulseRef.current.visible = Boolean(currentEvent)
    }
  })

  return (
    <group ref={group}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[halo ? 0.72 : 0.52, halo ? 0.72 : 0.52, 9.7, 64, 1, true]} />
        <meshStandardMaterial color={envelopeColor} emissive={envelopeColor} emissiveIntensity={0.1} transparent opacity={envelopeOpacity} side={THREE.DoubleSide} />
      </mesh>
      {policyOutline && (
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.62, 0.62, 9.8, 64, 1, true]} />
          <meshBasicMaterial color="#ffbc5e" transparent opacity={0.09} side={THREE.DoubleSide} />
        </mesh>
      )}
      <Line points={points} color={color} lineWidth={9} transparent opacity={0.24} />
      <Line points={points} color={color} lineWidth={4} transparent opacity={0.95} />
      <Line points={points} color="#ffffff" lineWidth={1} transparent opacity={0.35} />
      {points.filter((_, index) => index % 3 === 0).map((point, index) => (
        <mesh key={`${point.x}-${index}`} position={point}>
          <sphereGeometry args={[0.045, 14, 14]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} transparent opacity={0.85} />
        </mesh>
      ))}
      <mesh ref={pulseRef} visible={false}>
        <sphereGeometry args={[0.085, 20, 20]} />
        <meshStandardMaterial
          color={currentEvent === 'blocked' ? '#ff4d5e' : currentEvent === 'calibrating' ? '#ffbc5e' : color}
          emissive={currentEvent === 'blocked' ? '#ff4d5e' : currentEvent === 'calibrating' ? '#ffbc5e' : color}
          emissiveIntensity={2.4}
        />
      </mesh>
    </group>
  )
}

function Support({ x }: { x: number }) {
  return (
    <group position={[x, -0.55, 0]}>
      <mesh position={[0, -0.25, 0]}>
        <boxGeometry args={[0.45, 0.5, 0.45]} />
        <meshStandardMaterial color="#424d53" metalness={0.5} roughness={0.42} />
      </mesh>
      <mesh position={[0, -0.78, 0]}>
        <boxGeometry args={[0.7, 0.18, 0.55]} />
        <meshStandardMaterial color="#2e373d" metalness={0.38} roughness={0.46} />
      </mesh>
    </group>
  )
}

function BeamPipe() {
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 10.2, 48, 1, true]} />
        <meshStandardMaterial color="#aab4b7" metalness={0.88} roughness={0.18} transparent opacity={0.72} />
      </mesh>
      {[-4.4, -2.7, -1.1, 0.8, 2.5, 4.2].map((x) => (
        <Support x={x} key={x} />
      ))}
    </group>
  )
}

function DeviceMesh({
  device,
  selected,
  hovered,
  active,
  proposed,
  tone,
  labelMode,
  twinMode,
  currentEvent,
  onSelect,
  onHover,
}: {
  device: ExperimentDevice
  selected: boolean
  hovered: boolean
  active: boolean
  proposed: boolean
  tone: string
  labelMode: LabelMode
  twinMode: TwinMode
  currentEvent?: ExperimentEventState
  onSelect: (deviceId: string) => void
  onHover: (deviceId: string | null) => void
}) {
  const color = selected || proposed || hovered ? (tone === 'beam-red' ? '#ff4d5e' : tone === 'beam-amber' ? '#ffbc5e' : '#64f4a2') : '#56616a'
  const baseMetal = device.type === 'rf_cavity' ? '#b9845b' : device.type === 'quadrupole' ? '#7a858a' : '#667178'
  const policyBlocked = twinMode === 'policy' && tone === 'beam-red'
  const eventHighlight = Boolean(currentEvent && (selected || proposed || (currentEvent === 'calibrating' && device.type === 'diagnostic_screen')))
  const showLabel = labelMode === 'full' || selected || proposed || (labelMode === 'active' && active)
  const labelOpacity = selected || proposed || hovered ? 1 : labelMode === 'full' ? 0.72 : 0.55
  const position = toScene(device.position)
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelect(device.id)
  }

  let body = (
    <mesh onClick={handleClick}>
      <boxGeometry args={[0.42, 0.42, 0.42]} />
      <meshStandardMaterial color={selected || hovered ? color : baseMetal} metalness={0.68} roughness={0.25} emissive={eventHighlight || hovered ? color : selected ? color : '#000000'} emissiveIntensity={eventHighlight ? 0.34 : hovered ? 0.22 : selected ? 0.18 : 0} />
    </mesh>
  )

  if (device.type === 'quadrupole') {
    body = (
      <group onClick={handleClick}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.38, 0.62, 40]} />
          <meshStandardMaterial color={selected || hovered ? color : '#778287'} metalness={0.78} roughness={0.2} emissive={eventHighlight || hovered ? color : selected ? color : '#000000'} emissiveIntensity={eventHighlight ? 0.35 : hovered ? 0.24 : selected ? 0.14 : 0} />
        </mesh>
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle) => (
          <mesh key={angle} position={[0, Math.sin(angle) * 0.36, Math.cos(angle) * 0.36]}>
            <boxGeometry args={[0.72, 0.13, 0.13]} />
            <meshStandardMaterial color="#c0c8ca" metalness={0.88} roughness={0.16} />
          </mesh>
        ))}
      </group>
    )
  }

  if (device.type === 'rf_cavity') {
    body = (
      <group onClick={handleClick}>
        {[-0.24, 0, 0.24].map((offset) => (
          <mesh key={offset} position={[offset, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.34, 0.34, 0.18, 44]} />
            <meshStandardMaterial color={selected || hovered ? '#ffbc5e' : '#a17455'} metalness={0.9} roughness={0.16} emissive={eventHighlight || hovered ? '#ffbc5e' : selected ? '#ff9c48' : '#000000'} emissiveIntensity={eventHighlight ? 0.36 : hovered ? 0.24 : selected ? 0.16 : 0} />
          </mesh>
        ))}
      </group>
    )
  }

  if (device.type === 'bpm' || device.type === 'bcm') {
    body = (
      <mesh onClick={handleClick} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.25, 0.045, 16, 48]} />
        <meshStandardMaterial color={selected || hovered ? color : '#7f8b92'} metalness={0.82} roughness={0.2} emissive={eventHighlight || hovered ? color : selected ? color : '#122026'} emissiveIntensity={eventHighlight ? 0.65 : hovered ? 0.5 : selected ? 0.42 : 0.08} />
      </mesh>
    )
  }

  if (device.type === 'diagnostic_screen') {
    body = (
      <mesh onClick={handleClick} rotation={[0, -0.55, 0]}>
        <boxGeometry args={[0.08, 0.9, 0.72]} />
        <meshStandardMaterial color={eventHighlight ? '#ffbc5e' : selected || hovered ? '#73d7ff' : '#758895'} metalness={0.25} roughness={0.34} transparent opacity={eventHighlight ? 0.92 : 0.78} emissive={eventHighlight ? '#ffbc5e' : selected || hovered ? '#73d7ff' : '#112531'} emissiveIntensity={eventHighlight ? 0.54 : hovered ? 0.38 : selected ? 0.26 : 0.08} />
      </mesh>
    )
  }

  return (
    <group
      position={position}
      onPointerOver={(event) => {
        event.stopPropagation()
        onHover(device.id)
      }}
      onPointerOut={(event) => {
        event.stopPropagation()
        onHover(null)
      }}
    >
      {body}
      {(selected || proposed || hovered || policyBlocked || eventHighlight) && (
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[policyBlocked ? 0.6 : 0.52, eventHighlight ? 0.024 : 0.018, 12, 64]} />
          <meshBasicMaterial color={currentEvent === 'blocked' ? '#ff445e' : policyBlocked ? '#ff445e' : currentEvent === 'calibrating' ? '#ffbc5e' : color} transparent opacity={eventHighlight ? 0.88 : policyBlocked ? 0.62 : 0.78} />
        </mesh>
      )}
      {showLabel && (
        <>
          <Line points={[new THREE.Vector3(0, 0.26, 0), new THREE.Vector3(0, 0.58, 0)]} color={selected || proposed ? color : '#7f8b92'} lineWidth={1} transparent opacity={0.55} />
          <Html position={[0, 0.66, 0]} center distanceFactor={7}>
            <button
              className={`device-label ${selected ? 'selected' : ''} ${proposed ? 'proposed' : ''}`}
              style={{ opacity: labelOpacity }}
              type="button"
              onClick={() => onSelect(device.id)}
              onMouseEnter={() => onHover(device.id)}
              onMouseLeave={() => onHover(null)}
            >
              <strong>{device.id}</strong>
              <span>{formatNumber(device.value, 3)} {device.unit}</span>
            </button>
          </Html>
        </>
      )}
    </group>
  )
}

function TwinScene({
  record,
  experiment,
  selectedDevice,
  onSelectDevice,
  viewPreset,
  draftAction,
  labelMode,
  twinMode,
  currentEvent,
  twinLightingMode,
  appTheme,
  cameraCommand,
  autoRotate,
  hoveredDevice,
  onHoverDevice,
}: Pick<Props, 'record' | 'experiment' | 'selectedDevice' | 'onSelectDevice' | 'draftAction'> & {
  viewPreset: ViewPreset
  labelMode: LabelMode
  twinMode: TwinMode
  currentEvent?: ExperimentEventState
  twinLightingMode: TwinLightingMode
  appTheme: 'dark' | 'light'
  cameraCommand: CameraCommand
  autoRotate: boolean
  hoveredDevice: string | null
  onHoverDevice: (deviceId: string | null) => void
}) {
  const tone = beamTone(record)
  const lighting = (appTheme === 'light' ? lightLightingConfigs : lightingConfigs)[twinLightingMode] ?? lightingConfigs['control-room']
  const devices = experiment?.device_registry?.length ? experiment.device_registry : fallbackDevices
  const proposedDevices = new Set(
    Object.entries(draftAction.delta_settings)
      .filter(([, value]) => Math.abs(Number(value)) > 1e-12)
      .map(([pv]) => deviceForPv(pv))
      .filter(Boolean),
  )
  const activeDevices = new Set(['BPM07-06', 'BCM07-03', selectedDevice, ...proposedDevices])
  if (record?.gate_decision.decision === 'REQUEST_CALIBRATION') activeDevices.add('OTR07')

  return (
    <Canvas shadows camera={{ position: [5.6, 2.9, 4.5], fov: 35 }}>
      <color attach="background" args={[lighting.background]} />
      <fog attach="fog" args={[lighting.fogColor, lighting.fogNear, lighting.fogFar]} />
      <ambientLight intensity={lighting.ambient} />
      <hemisphereLight args={['#c8f2ff', '#071013', lighting.hemi]} />
      <directionalLight position={[3.8, 5.8, 4.2]} intensity={lighting.directional} castShadow />
      <spotLight position={[0, 4.8, 2.5]} angle={0.55} penumbra={0.8} intensity={lighting.spot} color="#d6f2ff" />
      <pointLight position={[-3.4, 1.6, 2.6]} intensity={lighting.rim} color="#65ff9d" />
      <pointLight position={[2.8, 1.2, -2.7]} intensity={2.2} color="#ff9c48" />
      <pointLight position={[4.6, 1.3, 0.5]} intensity={1.7} color={tone === 'beam-red' ? '#ff445e' : tone === 'beam-amber' ? '#ffbc5e' : '#65ff9d'} />
      <mesh position={[0, -0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 5.5]} />
        <meshStandardMaterial color={lighting.floor} metalness={0.28} roughness={0.48} />
      </mesh>
      <gridHelper args={[12, 24, lighting.gridMain, lighting.gridSub]} position={[0, -0.94, 0]} />
      <BeamPipe />
      <TwinModeOverlay mode={twinMode} record={record} devices={devices} proposedDevices={proposedDevices} />
      <BeamPath experiment={experiment} tone={tone} record={record} twinMode={twinMode} currentEvent={currentEvent} />
      {devices.map((device) => (
        <DeviceMesh
          key={device.id}
          device={device}
          tone={tone}
          selected={selectedDevice === device.id}
          hovered={hoveredDevice === device.id}
          proposed={proposedDevices.has(device.id)}
          active={activeDevices.has(device.id)}
          labelMode={labelMode}
          twinMode={twinMode}
          currentEvent={currentEvent}
          onSelect={onSelectDevice}
          onHover={onHoverDevice}
        />
      ))}
      <CameraController devices={devices} selectedDevice={selectedDevice} viewPreset={viewPreset} cameraCommand={cameraCommand} autoRotate={autoRotate} />
    </Canvas>
  )
}

function CameraController({
  devices,
  selectedDevice,
  viewPreset,
  cameraCommand,
  autoRotate,
}: {
  devices: ExperimentDevice[]
  selectedDevice: string
  viewPreset: ViewPreset
  cameraCommand: CameraCommand
  autoRotate: boolean
}) {
  const controls = useRef<any>(null)
  const { camera } = useThree()
  const selected = devices.find((device) => device.id === selectedDevice)
  const selectedTarget = selected ? new THREE.Vector3(...toScene(selected.position)) : new THREE.Vector3(0, 0, 0)

  useEffect(() => {
    const target = viewPreset === 'selected' || viewPreset === 'diagnostic'
      ? selectedTarget
      : new THREE.Vector3(0, -0.03, 0)
    const positions: Record<ViewPreset, THREE.Vector3> = {
      isometric: new THREE.Vector3(5.6, 2.9, 4.5),
      top: new THREE.Vector3(0.1, 7.3, 0.1),
      side: new THREE.Vector3(0, 1.15, 8.0),
      diagnostic: selectedTarget.clone().add(new THREE.Vector3(2.1, 1.1, 2.4)),
      selected: selectedTarget.clone().add(new THREE.Vector3(2.4, 1.4, 2.2)),
    }
    camera.position.copy(positions[viewPreset])
    camera.lookAt(target)
    controls.current?.target.copy(target)
    controls.current?.update()
  }, [camera, selectedTarget.x, selectedTarget.y, selectedTarget.z, viewPreset])

  useEffect(() => {
    if (!cameraCommand) return
    const target = controls.current?.target?.clone?.() ?? new THREE.Vector3(0, -0.03, 0)
    if (cameraCommand.kind === 'reset') {
      const defaultPosition = viewPreset === 'selected'
        ? selectedTarget.clone().add(new THREE.Vector3(2.4, 1.4, 2.2))
        : new THREE.Vector3(5.6, 2.9, 4.5)
      camera.position.copy(defaultPosition)
      camera.lookAt(viewPreset === 'selected' ? selectedTarget : new THREE.Vector3(0, -0.03, 0))
      controls.current?.target.copy(viewPreset === 'selected' ? selectedTarget : new THREE.Vector3(0, -0.03, 0))
    } else {
      const direction = camera.position.clone().sub(target)
      const distance = THREE.MathUtils.clamp(
        direction.length() * (cameraCommand.kind === 'zoom-in' ? 0.82 : 1.18),
        3.1,
        12,
      )
      camera.position.copy(target.clone().add(direction.normalize().multiplyScalar(distance)))
    }
    camera.updateProjectionMatrix()
    controls.current?.update()
  }, [camera, cameraCommand, selectedTarget.x, selectedTarget.y, selectedTarget.z, viewPreset])

  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} minDistance={3.1} maxDistance={12} autoRotate={autoRotate} autoRotateSpeed={0.55} />
}

function TwinModeOverlay({
  mode,
  record,
  devices,
  proposedDevices,
}: {
  mode: TwinMode
  record: DecisionRecord | null
  devices: ExperimentDevice[]
  proposedDevices: Set<string | undefined>
}) {
  if (mode === 'physical') return null
  const decision = record?.gate_decision.decision
  const trust = record?.virtual_diagnostic.trust_state
  const overlayColor = decision === 'BLOCK' ? '#ff445e' : trust === 'GREEN' ? '#65ff9d' : '#ffbc5e'

  if (mode === 'twin') {
    return (
      <group>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.88, 0.88, 10.0, 64, 1, true]} />
          <meshBasicMaterial color={overlayColor} transparent opacity={0.055} side={THREE.DoubleSide} />
        </mesh>
        <Line
          points={[new THREE.Vector3(-4.8, 0.82, 0), new THREE.Vector3(4.8, 0.82, 0)]}
          color={overlayColor}
          lineWidth={1}
          transparent
          opacity={0.48}
        />
      </group>
    )
  }

  if (mode === 'diagnostics') {
    return (
      <group>
        {devices.filter((device) => ['bpm', 'bcm', 'diagnostic_screen'].includes(device.type)).map((device) => (
          <mesh key={device.id} position={toScene(device.position)} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.44, 0.012, 12, 48]} />
            <meshBasicMaterial color="#73d7ff" transparent opacity={0.58} />
          </mesh>
        ))}
      </group>
    )
  }

  return (
    <group>
      {devices.filter((device) => proposedDevices.has(device.id) || decision === 'BLOCK').map((device) => (
        <mesh key={device.id} position={toScene(device.position)} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.72, 0.015, 12, 64]} />
          <meshBasicMaterial color={decision === 'BLOCK' ? '#ff445e' : '#ffbc5e'} transparent opacity={0.68} />
        </mesh>
      ))}
      <Line
        points={[new THREE.Vector3(-4.9, -0.72, 0), new THREE.Vector3(4.9, -0.72, 0)]}
        color={decision === 'BLOCK' ? '#ff445e' : '#ffbc5e'}
        lineWidth={2}
        transparent
        opacity={0.42}
      />
    </group>
  )
}

function ControlRoom3D({
  record,
  experiment,
  draftAction,
  selectedDevice,
  onSelectDevice,
  onOpenPolicy,
  onDeviceTrim,
  onEvaluate,
  onApply,
  onCalibrate,
  onReset,
  currentEvent = null,
  twinLightingMode = 'control-room',
  onTwinLightingModeChange,
  appTheme,
  busy = false,
  judgeMode = false,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const tone = beamTone(record)
  const selected = (experiment?.device_registry ?? fallbackDevices).find((device) => device.id === selectedDevice) ?? fallbackDevices[0]
  const decision = record?.gate_decision.decision
  const canApply = decision === 'APPROVE' || decision === 'APPROVE_SMALL_STEP'
  const proposedDelta = draftAction.delta_settings[selected.pv] ?? 0
  const [viewPreset, setViewPreset] = useState<ViewPreset>('isometric')
  const [labelMode, setLabelMode] = useState<LabelMode>('active')
  const [twinMode, setTwinMode] = useState<TwinMode>('physical')
  const [viewExpanded, setViewExpanded] = useState(() => safeLocalStorageGet('ghost-beam-view-hud') === 'expanded')
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [hoveredDevice, setHoveredDevice] = useState<string | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [inspectorPinned, setInspectorPinned] = useState(false)
  const trustStatus = record?.virtual_diagnostic.trust_state ?? 'PENDING'

  useEffect(() => {
    if (judgeMode) {
      setLabelMode('active')
      setTwinMode('twin')
      setViewExpanded(false)
    }
  }, [judgeMode])

  useEffect(() => {
    safeLocalStorageSet('ghost-beam-view-hud', viewExpanded ? 'expanded' : 'collapsed')
  }, [viewExpanded])

  useEffect(() => {
    document.body.style.cursor = hoveredDevice ? 'pointer' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [hoveredDevice])

  function sendCameraCommand(kind: NonNullable<CameraCommand>['kind']) {
    setCameraCommand({ kind, nonce: Date.now() })
  }

  function toggleFullscreen() {
    const element = sectionRef.current
    if (!element) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void element.requestFullscreen()
    }
  }

  function handleSelectDevice(deviceId: string) {
    onSelectDevice(deviceId)
    if (inspectorPinned) setInspectorOpen(true)
  }

  return (
    <section ref={sectionRef} className={`beamline-card ${tone} scene-theme-${appTheme} twin-lighting-${twinLightingMode} ${currentEvent ? `scene-event-${currentEvent}` : ''} ${judgeMode ? 'judge-scene' : ''}`}>
      <img className="beamline-image beamline-backdrop" src="/images/beamline-viewport.png" alt="" />
      <div className="beamline-vignette" />
      <div className="r3f-stage">
        <TwinScene
          record={record}
          experiment={experiment}
          draftAction={draftAction}
          selectedDevice={selectedDevice}
          onSelectDevice={handleSelectDevice}
          viewPreset={viewPreset}
          labelMode={labelMode}
          twinMode={twinMode}
          currentEvent={currentEvent}
          twinLightingMode={twinLightingMode}
          appTheme={appTheme}
          cameraCommand={cameraCommand}
          autoRotate={autoRotate}
          hoveredDevice={hoveredDevice}
          onHoverDevice={setHoveredDevice}
        />
      </div>

      <div className="beamline-title">
        <span>Beamline - Sector 07</span>
        <h2>L1 Transfer Line</h2>
      </div>

      <div className={`view-widget ${viewExpanded ? 'expanded' : 'collapsed'}`}>
        <button className="view-chip" type="button" onClick={() => setViewExpanded((open) => !open)} aria-expanded={viewExpanded}>
          <span>View</span>
          <strong>{viewPreset === 'selected' ? 'Selected' : viewPreset === 'diagnostic' ? 'Diag' : viewPreset === 'isometric' ? 'Iso' : viewPreset}</strong>
          <em>{labelMode === 'minimal' ? 'Min' : labelMode === 'active' ? 'Act' : 'Full'}</em>
          <em>{twinMode === 'physical' ? 'Phys' : twinMode === 'diagnostics' ? 'Diag' : twinMode === 'policy' ? 'Policy' : 'Twin'}</em>
          <em>{twinLightingMode === 'control-room' ? 'Ctrl' : twinLightingMode === 'inspection' ? 'Inspect' : 'Present'}</em>
          {viewExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {viewExpanded && (
          <div className="view-widget-body">
            <span>Camera</span>
            <div className="view-preset-buttons">
              <button className={viewPreset === 'isometric' ? 'active' : ''} type="button" aria-label="Isometric view" onClick={() => setViewPreset('isometric')}>Iso</button>
              <button className={viewPreset === 'top' ? 'active' : ''} type="button" aria-label="Top view" onClick={() => setViewPreset('top')}>Top</button>
              <button className={viewPreset === 'side' ? 'active' : ''} type="button" aria-label="Side view" onClick={() => setViewPreset('side')}>Side</button>
              <button className={viewPreset === 'diagnostic' ? 'active' : ''} type="button" aria-label="Diagnostic screen view" onClick={() => {
                onSelectDevice('OTR07')
                setViewPreset('diagnostic')
              }}>Diag</button>
              <button className={viewPreset === 'selected' ? 'active' : ''} type="button" aria-label="Focus selected device" onClick={() => setViewPreset('selected')}><Target size={13} /></button>
            </div>
            <span>Labels</span>
            <div className="view-preset-buttons compact-toggle">
              {(['minimal', 'active', 'full'] as LabelMode[]).map((mode) => (
                <button key={mode} className={labelMode === mode ? 'active' : ''} type="button" onClick={() => setLabelMode(mode)}>
                  {mode === 'minimal' ? 'Min' : mode === 'active' ? 'Act' : 'Full'}
                </button>
              ))}
            </div>
            <span>Twin Mode</span>
            <div className="view-preset-buttons twin-mode-buttons">
              {(['physical', 'twin', 'diagnostics', 'policy'] as TwinMode[]).map((mode) => (
                <button key={mode} className={twinMode === mode ? 'active' : ''} type="button" onClick={() => setTwinMode(mode)}>
                  {mode === 'physical' ? 'Phys' : mode === 'diagnostics' ? 'Diag' : mode === 'policy' ? 'Policy' : 'Twin'}
                </button>
              ))}
            </div>
            <span>Twin Lighting</span>
            <div className="view-preset-buttons twin-mode-buttons">
              {(['control-room', 'inspection', 'presentation'] as TwinLightingMode[]).map((mode) => (
                <button key={mode} className={twinLightingMode === mode ? 'active' : ''} type="button" disabled={busy} onClick={() => onTwinLightingModeChange(mode)}>
                  {mode === 'control-room' ? 'Ctrl' : mode === 'inspection' ? 'Inspect' : 'Present'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="selected-device-chip">
        <div>
          <strong>{selected.id}</strong>
          <span>{selected.type} | {formatNumber(selected.value, 3)} {selected.unit} | {trustStatus}</span>
        </div>
        <button type="button" onClick={() => setInspectorOpen(true)}>Expand</button>
      </div>

      {inspectorOpen && (
        <aside className={`device-inspector-drawer device-inspector ${inspectorPinned ? 'pinned' : ''}`}>
          <div className="inspector-header">
            <div>
              <span>Selected Device</span>
              <strong>{selected.id}</strong>
            </div>
            <div>
              <button type="button" aria-label={inspectorPinned ? 'Unpin inspector' : 'Pin inspector'} onClick={() => setInspectorPinned((value) => !value)}>
                {inspectorPinned ? <PinOff size={14} /> : <Pin size={14} />}
              </button>
              <button type="button" aria-label="Collapse inspector" onClick={() => setInspectorOpen(false)}>
                <Minimize2 size={14} />
              </button>
              <button type="button" aria-label="Close inspector" onClick={() => {
                setInspectorPinned(false)
                setInspectorOpen(false)
              }}>
                <X size={14} />
              </button>
            </div>
          </div>
          <span className="inspector-trust">Trust status: {trustStatus}</span>
          <dl>
            <div><dt>Type</dt><dd>{selected.type}</dd></div>
            <div><dt>PV</dt><dd>{selected.pv}</dd></div>
            <div><dt>Current</dt><dd>{formatNumber(selected.value, 3)} {selected.unit}</dd></div>
            <div><dt>Limits</dt><dd>{selected.min === null ? 'diagnostic only' : `${selected.min} to ${selected.max}`}</dd></div>
            <div><dt>Max step</dt><dd>{selected.max_delta ?? '--'}</dd></div>
            <div><dt>Draft delta</dt><dd>{signed(proposedDelta, 3)}</dd></div>
          </dl>
          <div className="related-elogs">
            <span>Related eLog evidence</span>
            {(record?.elog_hits ?? []).slice(0, 2).map((hit) => (
              <p key={hit.title}>{hit.title}</p>
            ))}
            {!record?.elog_hits.length && <p>No retrieved eLog evidence yet.</p>}
          </div>
          <div className="inspector-actions">
            <button type="button" disabled={busy} onClick={() => onDeviceTrim(selected.id)}>Propose small trim</button>
            <button type="button" disabled={busy} onClick={onEvaluate}>Evaluate action</button>
            <button type="button" disabled={busy || !canApply} onClick={onApply}>Apply if approved</button>
            {(selected.type === 'diagnostic_screen' || decision === 'REQUEST_CALIBRATION') && <button type="button" disabled={busy} onClick={onCalibrate}>Request calibration</button>}
            <button type="button" disabled={busy} onClick={onReset}>Reset</button>
            <button type="button" onClick={onOpenPolicy}>Open Policy Gate</button>
          </div>
        </aside>
      )}

      <div className="viewport-controls">
        <button type="button" aria-label="Reset camera" onClick={() => {
          setViewPreset('isometric')
          sendCameraCommand('reset')
        }}><RotateCcw size={15} /></button>
        <div>
          <button type="button" aria-label="Zoom out" onClick={() => sendCameraCommand('zoom-out')}><Minus size={15} /></button>
          <button className={autoRotate ? 'active' : ''} type="button" aria-label={autoRotate ? 'Stop auto orbit' : 'Start auto orbit'} onClick={() => setAutoRotate((value) => !value)}>Orbit</button>
          <button type="button" aria-label="Zoom in" onClick={() => sendCameraCommand('zoom-in')}><ZoomIn size={15} /></button>
        </div>
        <button type="button" aria-label="Fullscreen" onClick={toggleFullscreen}><Maximize2 size={15} /></button>
      </div>
    </section>
  )
}

export default ControlRoom3D
