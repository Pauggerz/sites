import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'

const LIME = new THREE.Color('#ccff00')
const MARK = '/brand/hoodrat-mark.png'

// The $HOODRAT monument — a giant gold medallion stamped with the official
// mark, floating over the plinth inside its spinning neon halo. The mark
// glows lime off the gold and flares when you pay respects.
export default function Monument({ position = [6.55, 0, 1.5], focused }) {
  const halo = useRef()
  const coin = useRef()
  const keylight = useRef()
  const mark = useTexture(MARK)

  const goldEdge = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#a5832a',
        roughness: 0.4,
        metalness: 0.85,
      }),
    []
  )
  const goldFace = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d9b13b',
        roughness: 0.32,
        metalness: 0.85,
      }),
    []
  )
  // the mark, luminous on both faces
  const markMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: mark,
        transparent: true,
        toneMapped: false,
        depthWrite: false,
        color: LIME.clone().multiplyScalar(1.2),
      }),
    [mark]
  )

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (halo.current) {
      halo.current.rotation.z += delta * (focused ? 0.9 : 0.25)
      halo.current.material.emissiveIntensity = focused
        ? 3.2 + Math.sin(t * 6) * 0.6
        : 1.4
    }
    if (coin.current) {
      coin.current.rotation.y += delta * (focused ? 1.05 : 0.28)
      coin.current.position.y = 0.95 + Math.sin(t * 0.9) * 0.045
    }
    const glow = focused ? 2.6 : 1.15
    markMat.color.copy(LIME).multiplyScalar(glow + Math.sin(t * 2.4) * 0.12)
    if (keylight.current)
      keylight.current.intensity = THREE.MathUtils.damp(
        keylight.current.intensity,
        focused ? 7 : 3.5,
        4,
        delta
      )
  })

  const plinthH = 1.05
  const R = 0.72 // medallion radius
  const T = 0.11 // medallion thickness

  return (
    <group position={position} rotation={[0, -Math.PI / 2, 0]}>
      {/* plinth */}
      <mesh position={[0, plinthH / 2, 0]}>
        <boxGeometry args={[1.15, plinthH, 1.15]} />
        <meshStandardMaterial color="#0c0f0d" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, plinthH + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.54, 48]} />
        <meshStandardMaterial
          color="#1a2100"
          emissive={LIME}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>

      {/* the medallion — floats and slowly turns above the plinth */}
      <group position={[0, plinthH, 0]}>
        <group ref={coin} position={[0, 0.95, 0]}>
          {/* coin body */}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={[goldEdge, goldFace, goldFace]}>
            <cylinderGeometry args={[R, R, T, 64]} />
          </mesh>
          {/* raised rim */}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={goldEdge}>
            <torusGeometry args={[R - 0.02, 0.028, 12, 72]} />
          </mesh>
          {/* the mark, stamped on both faces */}
          <mesh position={[0, 0, T / 2 + 0.004]} material={markMat}>
            <circleGeometry args={[R * 0.82, 48]} />
          </mesh>
          <mesh
            position={[0, 0, -T / 2 - 0.004]}
            rotation={[0, Math.PI, 0]}
            material={markMat}
          >
            <circleGeometry args={[R * 0.82, 48]} />
          </mesh>
        </group>
      </group>

      {/* neon halo behind the medallion */}
      <mesh ref={halo} position={[0, plinthH + 0.95, -0.5]}>
        <torusGeometry args={[1.05, 0.02, 12, 72]} />
        <meshStandardMaterial
          color="#1a2100"
          emissive={LIME}
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>

      {/* engraved plate */}
      <Text
        position={[0, plinthH - 0.28, 0.58]}
        fontSize={0.11}
        letterSpacing={0.35}
        color="#ccff00"
        anchorX="center"
        material-toneMapped={false}
      >
        $HOODRAT
      </Text>

      {/* warm key light so the gold reads gold, not green */}
      <pointLight
        ref={keylight}
        position={[0.9, plinthH + 1.9, 1.6]}
        color="#ffd977"
        intensity={3.5}
        distance={7}
        decay={2}
      />
      {/* faint lime rim from below for scene cohesion */}
      <pointLight
        position={[-0.6, 0.3, 1]}
        color={LIME}
        intensity={1.2}
        distance={4}
        decay={2}
      />
    </group>
  )
}
useTexture.preload(MARK)
