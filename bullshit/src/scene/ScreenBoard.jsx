import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { makeBoardIdleTexture, woodMaterial } from '../materials.js'

// The herd's bulletin screen. The film itself plays at the gate beat now
// (GateShow owns the site's single <video> element) — this board runs the
// idle card full-time, brightening when the board beat has focus.

// 16:9, matches the board-idle art (1280×720)
const W = 2.6
const H = 1.4625

export default function ScreenBoard({ focused }) {
  const frame = useMemo(
    () => woodMaterial({ boards: 3, len: 4, tone: [0.34, 0.24, 0.13], batten: 0, seed: 19 }),
    []
  )
  const tex = useMemo(() => makeBoardIdleTexture(), [])
  const mat = useRef()
  useFrame((_, delta) => {
    if (mat.current) {
      mat.current.opacity = THREE.MathUtils.damp(
        mat.current.opacity,
        focused ? 1 : 0.82,
        3,
        delta
      )
    }
  })

  return (
    <group position={[5.92, 2.1, 0.4]} rotation={[0, -Math.PI / 2, 0]}>
      {/* wooden frame behind the screen */}
      <mesh position={[0, 0, -0.045]} material={frame}>
        <boxGeometry args={[2.85, 1.72, 0.06]} />
      </mesh>
      <mesh>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial ref={mat} map={tex} toneMapped={false} transparent opacity={0.82} />
      </mesh>
    </group>
  )
}
