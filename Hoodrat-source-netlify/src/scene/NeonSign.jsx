import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'

const LIME = new THREE.Color('#ccff00')
const MARK = '/brand/hoodrat-mark.png'

// The official Hoodrat mark as a wall-mounted neon lightbox — the logo glows
// off a dark backing panel with a $HOODRAT wordmark underneath. Flickers like
// street neon; surges when it's the focus.
export default function NeonSign({
  position = [7.82, 3, -3.5],
  rotation = [0, -Math.PI / 2, 0],
  focused = false,
}) {
  const tex = useTexture(MARK)
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        toneMapped: false,
        depthWrite: false,
        color: LIME.clone().multiplyScalar(2),
      }),
    [tex]
  )
  const light = useRef()
  const flickState = useRef({ t: 0, until: 0, low: false })

  useFrame((state, delta) => {
    const f = flickState.current
    f.t += delta
    if (f.t > f.until) {
      f.low = !f.low && Math.random() < (focused ? 0.02 : 0.12)
      f.until = f.t + (f.low ? 0.05 + Math.random() * 0.12 : 0.4 + Math.random() * 2.2)
    }
    const base = f.low ? 0.55 : focused ? 3.1 : 2
    const buzz = 1 + Math.sin(state.clock.elapsedTime * 43) * 0.06
    mat.color.copy(LIME).multiplyScalar(base * buzz)
    if (light.current) light.current.intensity = base * 2.6
  })

  return (
    <group position={position} rotation={rotation}>
      {/* backing panel */}
      <mesh position={[0, -0.15, -0.09]}>
        <boxGeometry args={[3.1, 2.9, 0.08]} />
        <meshStandardMaterial color="#040604" roughness={0.85} metalness={0.3} />
      </mesh>

      {/* the mark */}
      <mesh position={[0, 0.28, 0.02]}>
        <planeGeometry args={[2.05, 2.05]} />
        <primitive object={mat} attach="material" />
      </mesh>

      {/* wordmark */}
      <Text
        position={[0, -1.15, 0.02]}
        fontSize={0.3}
        letterSpacing={0.2}
        color="#ccff00"
        anchorX="center"
        material-toneMapped={false}
      >
        $HOODRAT
      </Text>

      <pointLight ref={light} color={LIME} intensity={5} distance={9} decay={2} position={[0, 0, 0.8]} />
    </group>
  )
}
useTexture.preload(MARK)
