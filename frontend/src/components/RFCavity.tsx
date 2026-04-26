interface Props {
  position: [number, number, number]
}

function RFCavity({ position }: Props) {
  return (
    <group position={position}>
      {[-0.28, 0, 0.28].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 0.18, 32]} />
          <meshStandardMaterial color="#8f9a98" metalness={0.85} roughness={0.18} />
        </mesh>
      ))}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.86, 32]} />
        <meshStandardMaterial color="#3f5552" metalness={0.7} roughness={0.24} />
      </mesh>
    </group>
  )
}

export default RFCavity
