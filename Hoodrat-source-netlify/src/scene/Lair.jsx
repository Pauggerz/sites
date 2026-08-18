import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  MeshReflectorMaterial,
  useGLTF,
  Clone,
  Sparkles,
  Text,
} from '@react-three/drei'
import * as THREE from 'three'
import ScreenWall from './ScreenWall.jsx'
import NeonSign from './NeonSign.jsx'
import CoinHologram from './CoinHologram.jsx'
import Monument from './Monument.jsx'
import { IS_MOBILE } from '../device.js'

const LIME = '#ccff00'

/* ---------------- room shell ---------------- */
const W = 16 // x: -8..8
const D = 20 // z: -10..10
const H = 5.5

function Shell() {
  const wall = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0b0e0c',
        roughness: 0.92,
        metalness: 0.08,
      }),
    []
  )
  return (
    <group>
      <mesh position={[0, H / 2, -D / 2]} material={wall}>
        <boxGeometry args={[W, H, 0.3]} />
      </mesh>
      <mesh position={[0, H / 2, D / 2]} material={wall}>
        <boxGeometry args={[W, H, 0.3]} />
      </mesh>
      <mesh position={[-W / 2, H / 2, 0]} material={wall}>
        <boxGeometry args={[0.3, H, D]} />
      </mesh>
      <mesh position={[W / 2, H / 2, 0]} material={wall}>
        <boxGeometry args={[0.3, H, D]} />
      </mesh>
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} material={wall}>
        <planeGeometry args={[W, D]} />
      </mesh>
    </group>
  )
}

function Floor() {
  // the reflector re-renders the whole scene into its buffer every frame —
  // on phones a small blurred buffer reads the same and costs a fraction
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[W, D]} />
      <MeshReflectorMaterial
        resolution={IS_MOBILE ? 256 : 1024}
        blur={IS_MOBILE ? [180, 60] : [400, 120]}
        mixBlur={0.9}
        mixStrength={14}
        depthScale={1.1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.3}
        roughness={0.85}
        metalness={0.55}
        color="#070a08"
        mirror={0.6}
      />
    </mesh>
  )
}

/* ---------------- neon trim ---------------- */
function neonMat(intensity = 3) {
  return new THREE.MeshStandardMaterial({
    color: '#1a2100',
    emissive: new THREE.Color(LIME),
    emissiveIntensity: intensity,
    toneMapped: false,
  })
}

function Trim() {
  const mat = useMemo(() => neonMat(2.6), [])
  const dimMat = useMemo(() => neonMat(1.2), [])
  const t = 0.035
  return (
    <group>
      <mesh position={[-W / 2 + 0.25, H - 0.25, 0]} material={mat}>
        <boxGeometry args={[t, t, D - 0.6]} />
      </mesh>
      <mesh position={[W / 2 - 0.25, H - 0.25, 0]} material={mat}>
        <boxGeometry args={[t, t, D - 0.6]} />
      </mesh>
      <mesh position={[-W / 2 + 0.18, 0.06, 0]} material={dimMat}>
        <boxGeometry args={[t, t, D - 0.6]} />
      </mesh>
      <mesh position={[W / 2 - 0.18, 0.06, 0]} material={dimMat}>
        <boxGeometry args={[t, t, D - 0.6]} />
      </mesh>
      <mesh position={[0, 0.06, -D / 2 + 0.18]} material={dimMat}>
        <boxGeometry args={[W - 0.6, t, t]} />
      </mesh>
    </group>
  )
}

function Column({ position }) {
  const strip = useMemo(() => neonMat(2.2), [])
  return (
    <group position={position}>
      <mesh position={[0, H / 2, 0]}>
        <boxGeometry args={[0.55, H, 0.55]} />
        <meshStandardMaterial color="#0a0d0b" roughness={0.7} metalness={0.4} />
      </mesh>
      <mesh position={[0, H / 2, 0.29]} material={strip}>
        <boxGeometry args={[0.05, H - 0.8, 0.015]} />
      </mesh>
    </group>
  )
}

/* ---------------- scrolling ticker ---------------- */
const TICKER = '$HOODRAT — GOLD-PLATED MENACE — NO DAYS OFF — RAT IN THE HOOD — STAY LOW — '
function Ticker() {
  const a = useRef()
  const b = useRef()
  const runW = useRef(16) // measured from the real glyphs on sync
  useFrame((_, delta) => {
    const W2 = runW.current
    for (const [i, r] of [a, b].entries()) {
      if (!r.current) continue
      if (r.current.userData.init !== W2) {
        r.current.userData.init = W2
        r.current.position.x = i * W2
      }
      r.current.position.x -= delta * 1.1
      if (r.current.position.x < -W2) r.current.position.x += W2 * 2
    }
  })
  return (
    <group position={[0, 4.75, -9.8]}>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[W - 1, 0.55, 0.05]} />
        <meshStandardMaterial color="#020402" roughness={0.5} metalness={0.5} />
      </mesh>
      {[a, b].map((ref, i) => (
        <Text
          key={i}
          ref={ref}
          position={[i * 16, 0, 0.02]}
          fontSize={0.3}
          letterSpacing={0.24}
          color={LIME}
          anchorX="left"
          anchorY="middle"
          material-toneMapped={false}
          onSync={(t) => {
            const b3 = t.textRenderInfo?.blockBounds
            if (b3) runW.current = b3[2] - b3[0]
          }}
        >
          {TICKER}
        </Text>
      ))}
    </group>
  )
}

/* ---------------- the door (CTA) — opens when focused ---------------- */
function Door({ open }) {
  const seam = useMemo(() => neonMat(3.5), [])
  const beyond = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#eaffa3').multiplyScalar(4),
        toneMapped: false,
      }),
    []
  )
  const slab = useRef()
  const pulse = useRef()
  useFrame((state, delta) => {
    const s = 2.2 + Math.sin(state.clock.elapsedTime * 1.6) * 1.2
    seam.emissiveIntensity = open ? 5 : s
    if (pulse.current)
      pulse.current.intensity = THREE.MathUtils.damp(
        pulse.current.intensity,
        open ? 14 : s * 1.5,
        3,
        delta
      )
    if (slab.current) {
      // the slab slides up into the wall when the door is the focus
      slab.current.position.y = THREE.MathUtils.damp(
        slab.current.position.y,
        open ? 4.75 : 1.6,
        2,
        delta
      )
    }
  })
  return (
    <group position={[0, 0, D / 2 - 0.16]}>
      {/* the light beyond — revealed as the slab lifts */}
      <mesh position={[0, 1.6, -0.02]} rotation={[0, Math.PI, 0]} material={beyond}>
        <planeGeometry args={[2.1, 3.1]} />
      </mesh>
      {/* rushing particles in the doorway */}
      {open && (
        <Sparkles
          count={60}
          size={3}
          speed={2.2}
          opacity={0.7}
          color="#f0ffbb"
          scale={[1.8, 3, 0.6]}
          position={[0, 1.6, -0.3]}
        />
      )}
      <mesh ref={slab} position={[0, 1.6, 0]}>
        <boxGeometry args={[2.2, 3.2, 0.18]} />
        <meshStandardMaterial color="#0d100e" roughness={0.35} metalness={0.85} />
      </mesh>
      {/* glowing frame */}
      <mesh position={[0, 3.22, 0]} material={seam}>
        <boxGeometry args={[2.3, 0.05, 0.06]} />
      </mesh>
      <mesh position={[-1.14, 1.6, 0]} material={seam}>
        <boxGeometry args={[0.05, 3.2, 0.06]} />
      </mesh>
      <mesh position={[1.14, 1.6, 0]} material={seam}>
        <boxGeometry args={[0.05, 3.2, 0.06]} />
      </mesh>
      <pointLight ref={pulse} color={LIME} distance={7} decay={2} position={[0, 1.8, -0.8]} />
    </group>
  )
}

/* ---------------- rat-print trail: door → monument ---------------- */
function Paw({ position, rotation = 0, scale = 1 }) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1a2100',
        emissive: new THREE.Color(LIME),
        emissiveIntensity: 0.75,
        toneMapped: false,
      }),
    []
  )
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, rotation]} scale={scale}>
      <mesh material={mat}>
        <circleGeometry args={[0.09, 20]} />
      </mesh>
      {[-1, 0, 1].map((i) => (
        <mesh key={i} material={mat} position={[i * 0.085, 0.13 - Math.abs(i) * 0.03, 0]}>
          <circleGeometry args={[0.035, 12]} />
        </mesh>
      ))}
    </group>
  )
}

function PawTrail() {
  // a lazy S-curve from the door toward the monument
  const steps = [
    [0.3, 7.6, 0.1],
    [-0.4, 6.2, -0.15],
    [0.5, 4.9, 0.3],
    [1.6, 3.8, 0.7],
    [3, 3, 1],
    [4.4, 2.4, 1.25],
    [5.5, 1.9, 1.4],
  ]
  return (
    <group>
      {steps.map(([x, z, r], i) => (
        <Paw key={i} position={[x, 0.012, z]} rotation={r} scale={0.9 + (i % 2) * 0.2} />
      ))}
    </group>
  )
}

/* ---------------- the prowl clock — day counter over the desk ---------------- */
function DayCounter({ position = [-6.1, 2.6, -6.3], focused }) {
  const textRef = useRef()
  const progress = useRef(0)
  const TARGET = 2847
  useFrame((_, delta) => {
    progress.current = THREE.MathUtils.damp(progress.current, focused ? 1 : 0, focused ? 1.6 : 8, delta)
    if (textRef.current) {
      const n = Math.round(TARGET * progress.current)
      textRef.current.text = `DAY ${String(focused ? n : TARGET).padStart(4, '0')}`
    }
  })
  return (
    <group position={position} rotation={[0, Math.PI / 2, 0]}>
      <Text
        ref={textRef}
        fontSize={0.42}
        letterSpacing={0.18}
        color="#eeffb0"
        anchorX="center"
        material-toneMapped={false}
        outlineWidth={0.012}
        outlineColor="#ccff00"
        outlineBlur={0.12}
      >
        DAY 2847
      </Text>
      <Text
        position={[0, -0.42, 0]}
        fontSize={0.14}
        letterSpacing={0.5}
        color="#8fb300"
        anchorX="center"
        material-toneMapped={false}
      >
        ON THE BLOCK — NO DAYS OFF
      </Text>
    </group>
  )
}

/* ---------------- corner clocks above the desk ---------------- */
function WorldClocks() {
  const clock = useGLTF('/models/wall_clock/wall_clock.gltf')
  const cities = [
    ['UPTOWN', -7.6],
    ['THE BLOCK', -6.3],
    ['THE SEWER', -5.0],
  ]
  return (
    <group>
      {cities.map(([city, z]) => (
        <group key={city} position={[-7.82, 3.6, z]} rotation={[0, Math.PI / 2, 0]}>
          <Clone object={clock.scene} scale={1.5} />
          <Text
            position={[0, -0.42, 0.02]}
            fontSize={0.09}
            letterSpacing={0.4}
            color="#8fb300"
            anchorX="center"
            material-toneMapped={false}
          >
            {city}
          </Text>
        </group>
      ))}
    </group>
  )
}

/* ---------------- wall tags / street texture ---------------- */
function StreetTags() {
  const tags = [
    {
      text: 'NO TRAPS',
      position: [4.35, 1.25, -9.58],
      rotation: [0, 0, 0.08],
      size: 0.26,
      color: '#ccff00',
    },
    {
      text: 'RAT IN THE HOOD',
      position: [-7.82, 2.1, 2.2],
      rotation: [0, Math.PI / 2, -0.06],
      size: 0.24,
      color: '#f4ffd6',
    },
  ]

  return (
    <group>
      {tags.map((tag) => (
        <Text
          key={tag.text}
          position={tag.position}
          rotation={tag.rotation}
          fontSize={tag.size}
          letterSpacing={0.12}
          color={tag.color}
          anchorX="center"
          material-toneMapped={false}
          outlineWidth={0.012}
          outlineColor="#0a0b06"
          outlineBlur={0.08}
        >
          {tag.text}
        </Text>
      ))}
    </group>
  )
}

/* ---------------- procured props ---------------- */
const M = (n) => `/models/${n}/${n}.gltf`

function Props() {
  const sofa = useGLTF(M('sofa_03'))
  const chair = useGLTF(M('mid_century_lounge_chair'))
  const table = useGLTF(M('modern_coffee_table_01'))
  const desk = useGLTF(M('metal_office_desk'))
  const laptop = useGLTF(M('classic_laptop'))
  const shelves = useGLTF(M('steel_frame_shelves_02'))

  return (
    <group>
      {/* lounge — sofa faces the screen wall, with two chairs holding the room shape */}
      <Clone object={sofa.scene} position={[0, 0, 0.9]} rotation={[0, Math.PI, 0]} />
      <Clone object={chair.scene} position={[-2.9, 0, -0.6]} rotation={[0, Math.PI / 2.4, 0]} />
      <Clone object={chair.scene} position={[2.9, 0, -0.6]} rotation={[0, -Math.PI / 2.4, 0]} />
      <Clone object={table.scene} position={[0, 0, -0.9]} />

      {/* command desk (left wall) */}
      <Clone object={desk.scene} position={[-5.9, 0, -6.3]} rotation={[0, Math.PI / 2, 0]} />
      <Clone object={laptop.scene} position={[-5.9, 0.77, -6.5]} rotation={[0, Math.PI / 2 + 0.2, 0]} />

      {/* shelves along the back-right */}
      <Clone object={shelves.scene} position={[7.6, 0, -7.8]} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  )
}
for (const n of [
  'sofa_03',
  'mid_century_lounge_chair',
  'modern_coffee_table_01',
  'metal_office_desk',
  'classic_laptop',
  'steel_frame_shelves_02',
  'wall_clock',
]) {
  useGLTF.preload(M(n))
}

/* ---------------- assembled burrow ---------------- */
export default function Lair({ focus }) {
  return (
    <group>
      <Shell />
      <Floor />
      <Trim />
      <Column position={[-5.5, 0, -4]} />
      <Column position={[5.5, 0, -4]} />
      <Column position={[-5.5, 0, 4]} />
      <Column position={[5.5, 0, 4]} />
      <ScreenWall focused={focus === 'wall'} />
      <Ticker />
      <StreetTags />
      <NeonSign focused={focus === 'rat'} />
      <Monument focused={focus === 'rat'} />
      <CoinHologram focused={focus === 'lounge'} />
      <DayCounter focused={focus === 'desk'} />
      <WorldClocks />
      <Door open={focus === 'door'} />
      <PawTrail />
      <Props />

      {/* dust motes */}
      <Sparkles
        count={IS_MOBILE ? 110 : 220}
        size={1.6}
        speed={0.18}
        opacity={0.28}
        color="#dcf58a"
        scale={[14, 4.5, 18]}
        position={[0, 2.4, 0]}
      />

      {/* key lights */}
      <spotLight
        position={[0, 5.2, -0.2]}
        angle={0.55}
        penumbra={0.9}
        intensity={22}
        color="#f0ffc8"
        distance={12}
        decay={2}
        target-position={[0, 0, -0.5]}
      />
      <pointLight position={[0, 3, -8.5]} color={LIME} intensity={6} distance={10} decay={2} />
      <pointLight position={[-5.9, 2.6, -6.3]} color="#cfe96a" intensity={4} distance={6} decay={2} />
      <ambientLight intensity={0.035} color="#aacc33" />
    </group>
  )
}
