import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { boardFrameMaterial, corkboardMaterial } from '../materials.js'

// The herd's bulletin: a dark, weathered notice board on the wall — wild-west
// general-store style, not a screen. The herd's actual receipts (real
// screenshots, vendored in public/media) are pinned up like printed clippings
// rather than displayed on glass.
//
// Everything around this board is raw barn timber: warm brown, grained,
// board-and-batten. A first pass built the frame/backing from woodMaterial
// with a different tone, and it still read as "more barn wood" — that
// shader bakes in the same warm colour cast and grain pattern on every call
// regardless of tone. This uses dedicated materials (boardFrameMaterial,
// corkboardMaterial) with no grain at all and a cool near-black instead of
// warm brown, a mounting board standing it proud of the wall with a real
// shadow gap, and its own always-on light — distinction needs to be visible
// as well as textural, and the barn is dim enough that subtle colour
// differences alone don't survive contact with the lighting.

const W = 3.05
const H = 2.05

// each photo's own aspect ratio (measured from the source jpg) drives its
// plane size so nothing gets stretched to fit a slot. Positions keep a hard
// margin in from the board edge (checked against the paper backing's larger
// footprint, not just the photo) so nothing crowds or crosses the frame.
const PHOTOS = [
  { src: '/media/pumpfun-verified.jpg', aspect: 3.587, w: 1.0, x: -0.68, y: 0.62, rot: -0.03 },
  { src: '/media/ansem-gold.jpg', aspect: 0.83, w: 0.55, x: 0.78, y: 0.3, rot: 0.045 },
  { src: '/media/most-traded.jpg', aspect: 1, w: 0.78, x: -0.55, y: -0.18, rot: -0.02 },
  { src: '/media/ansem-burn.jpg', aspect: 4.84, w: 1.15, x: 0.35, y: -0.72, rot: 0.025 },
  { src: '/media/leaderboard.jpg', aspect: 4.612, w: 0.8, x: 0.92, y: -0.15, rot: -0.035 },
]
useTexture.preload(PHOTOS.map((p) => p.src))

function Photo({ w, aspect, x, y, rot, tex }) {
  const h = w / aspect
  return (
    <group position={[x, y, 0.05]} rotation={[0, 0, rot]}>
      {/* aged paper margin the clipping is mounted on */}
      <mesh position={[0, 0, -0.003]}>
        <planeGeometry args={[w * 1.14, h * 1.14]} />
        <meshStandardMaterial color="#cdbd91" roughness={1} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.92} metalness={0} />
      </mesh>
      {/* a nail through the top, not a pushpin — fits the barn's tools */}
      <mesh position={[0, h / 2 + 0.016, 0.01]}>
        <sphereGeometry args={[0.017, 8, 6]} />
        <meshStandardMaterial color="#4a4136" roughness={0.35} metalness={0.75} />
      </mesh>
    </group>
  )
}

// diamond-set corner brace, like an old sign bolted together at the joints —
// plain dark iron rather than the barn's procedural rust shader, so its flat
// specular highlight reads clearly against the matte frame/backing even at
// this small a scale, where a big fbm rust pattern would just be noise
function CornerBrace({ x, y }) {
  return (
    <mesh position={[x, y, 0.014]} rotation={[0, 0, Math.PI / 4]}>
      <boxGeometry args={[0.22, 0.22, 0.016]} />
      <meshStandardMaterial color="#141210" roughness={0.3} metalness={0.8} />
    </mesh>
  )
}

export default function ScreenBoard() {
  const frame = useMemo(() => boardFrameMaterial(), [])
  const backing = useMemo(() => corkboardMaterial(), [])
  const textures = useTexture(PHOTOS.map((p) => p.src))
  useEffect(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 4
    })
  }, [textures])

  const light = useRef()
  useFrame((state) => {
    // a faint, slow flicker — reads as lamp-lit rather than static/flat,
    // without needing the beat's own focus to be visible at all
    if (light.current) {
      light.current.intensity = 2.6 + Math.sin(state.clock.elapsedTime * 1.7) * 0.15
    }
  })

  const cornerX = (W + 0.18) / 2 - 0.16
  const cornerY = (H + 0.18) / 2 - 0.16

  return (
    <group position={[5.92, 2.1, 0.4]} rotation={[0, -Math.PI / 2, 0]}>
      {/* mounting board: larger and darker than the frame itself, standing it
          proud of the wall with a real shadow gap so it reads as an object
          hung on the wall rather than a patch of the wall */}
      <mesh position={[0, 0, -0.11]}>
        <boxGeometry args={[W + 0.38, H + 0.38, 0.04]} />
        <meshStandardMaterial color="#020202" roughness={0.95} />
      </mesh>
      {/* frame */}
      <mesh position={[0, 0, -0.06]} material={frame}>
        <boxGeometry args={[W + 0.18, H + 0.18, 0.07]} />
      </mesh>
      {/* the board itself */}
      <mesh position={[0, 0, -0.018]} material={backing}>
        <boxGeometry args={[W, H, 0.045]} />
      </mesh>
      {[
        [-cornerX, cornerY],
        [cornerX, cornerY],
        [-cornerX, -cornerY],
        [cornerX, -cornerY],
      ].map(([x, y]) => (
        <CornerBrace key={`${x}${y}`} x={x} y={y} />
      ))}
      {PHOTOS.map((p, i) => (
        <Photo key={p.src} {...p} tex={textures[i]} />
      ))}
      {/* always-on wash, independent of beat focus — without it, the board's
          own material distinction can't be seen in the barn's ambient dusk */}
      <pointLight ref={light} position={[0.3, 0, 0.9]} color="#e9dcae" intensity={2.6} distance={3.2} decay={2} />
    </group>
  )
}
