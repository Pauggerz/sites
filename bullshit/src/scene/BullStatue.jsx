import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { IS_TOUCH } from '../device.js'

// The hand-modeled statue, holding the drop up in his raised hand as one
// piece: a single node ("tripo_node_ef3cf402…"), one merged mesh, 1.93M tris,
// one material with basecolor / roughness-metallic / normal maps.
//
// Two things about this file are measured off the vertex data rather than
// eyeballed, and both matter if the model is ever replaced:
//
//   HEIGHT   the export is 0.9788 units tall, so SCALE puts the top of his
//            head just under the loft ledge line (the trim spans y 2.42..2.62)
//   DROP_*   the held drop sits at local (0.215, 0.66, 0.105) — the mass on
//            his raised side peaks there and tapers away above 0.74
//
// The material ships lit like a product render, so it is re-graded to dark
// stone here. The bulb is the key light, so the sheen and rim track its real
// position in every pose.

const BULL_URL = '/models/bull/bull.glb'

// resolves inside the existing Suspense boundary, so the ready signal cannot
// fire before the statue is on the GPU
useGLTF.preload(BULL_URL)

const MODEL_H = 0.97882080078125
// Measured against the barn, not guessed. The overhead beam line that caps the
// bay is the trusses' tie beam, underside y 4.34 (Roof: y 4.42, 0.16 thick);
// horns at 4.25 clear it by 9cm and the roof at his x is 5.26+, so nothing
// clips. Checked slice by slice against the vertex data: his rearmost point at
// loft height is z -2.14, and the loft ledge trim's face is z -2.28, so he
// stands clear in front of it rather than through it.
// (The loft ledge itself is only y 2.42 — sizing to that is the ~2.3m version
// that read as human height.)
const HEIGHT = 4.25
const SCALE = HEIGHT / MODEL_H

export const STATUE_POS = [-1.9, 0, -1.1]
export const STATUE_YAW = 0.25

const DROP_LOCAL = [0.215, 0.66, 0.105]
const DROP_R_LOCAL = 0.105

// world position of the drop, for the lights and the camera pose that frame it
export const DROP_WORLD = (() => {
  const v = new THREE.Vector3(...DROP_LOCAL)
    .multiplyScalar(SCALE)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), STATUE_YAW)
    .add(new THREE.Vector3(...STATUE_POS))
  return [v.x, v.y, v.z]
})()
export const DROP_RADIUS = DROP_R_LOCAL * SCALE

// Weathered bronze gone to verdigris: green-dominant with a little blue and
// almost no red, dark enough to fall to near-black in shadow while the lit
// edges pick up green. This multiplies the basecolor map, so it is a grade,
// not a flat tint.
const HIDE_BASE = new THREE.Color(0.028, 0.062, 0.045)
const HIDE_HOVER = new THREE.Color(0.062, 0.132, 0.098)

// The eyes are green in the model, but the GLTF carries NO emissive channel —
// the colour is baked into the basecolor jpg. Grading the hide down to stone
// would take the eyes with it, so the green is lifted back out into a real
// emissive map: sample the basecolor, keep only the green-dominant pixels, and
// hand that back as emissiveMap. Returns null if the texture yields nothing
// green, in which case the statue simply has no glow rather than a wrong one.
function buildEyeEmissiveMap(sourceTexture) {
  const img = sourceTexture?.image
  if (!img?.width) return null
  const w = Math.min(2048, img.width)
  const h = Math.min(2048, img.height)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, w, h)
  let frame
  try {
    frame = ctx.getImageData(0, 0, w, h)
  } catch {
    return null // tainted canvas — skip the glow rather than break the scene
  }
  const px = frame.data
  let hits = 0
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i]
    const g = px[i + 1]
    const b = px[i + 2]
    if (g > 54 && g > r * 1.25 && g > b * 1.25) {
      // cooler than the body's verdigris so the eyes stay separate from it
      px[i] = 40
      px[i + 1] = 255
      px[i + 2] = 205
      hits++
    } else {
      px[i] = 0
      px[i + 1] = 0
      px[i + 2] = 0
    }
    px[i + 3] = 255
  }
  if (!hits) return null
  ctx.putImageData(frame, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.flipY = false // glTF UV convention — CanvasTexture defaults the other way
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

export default function BullStatue({ onSelect }) {
  const { scene } = useGLTF(BULL_URL)

  const statue = useMemo(() => {
    let src = null
    scene.traverse((o) => {
      if (o.isMesh && !src) src = o
    })
    if (import.meta.env.DEV) {
      const names = []
      scene.traverse((o) => names.push(`${o.type}:${o.name || '(unnamed)'}`))
      console.log('[bull.glb]', names.join(' > '), `| ${src.geometry.index.count / 3} tris`)
    }
    const material = src.material
    material.color.copy(HIDE_BASE)
    material.roughness = 0.88
    material.metalness = 0.0
    if (material.normalScale) material.normalScale.setScalar(0.8)
    const eyes = buildEyeEmissiveMap(material.map)
    if (eyes) {
      material.emissiveMap = eyes
      material.emissive = new THREE.Color(0xffffff)
      material.emissiveIntensity = 0.62
      material.needsUpdate = true
    }
    return { geometry: src.geometry, material, hasEyes: !!eyes }
  }, [scene])

  const group = useRef()
  const glow = useRef()
  const hoverBody = useRef(false)
  const hoverDrop = useRef(false)

  useFrame((state, delta) => {
    // slow breathing — the idle the procedural figurine had
    const breath = Math.sin(state.clock.elapsedTime * 1.1)
    if (group.current) {
      group.current.scale.set(
        SCALE,
        SCALE * (1 + breath * 0.012),
        SCALE * (1 + breath * 0.008)
      )
    }
    // hover tells: the hide catches more light, the drop lifts out of the dark
    const lit = hoverBody.current || hoverDrop.current
    statue.material.color.lerp(lit ? HIDE_HOVER : HIDE_BASE, 1 - Math.exp(-8 * delta))
    if (glow.current) {
      glow.current.intensity = THREE.MathUtils.damp(
        glow.current.intensity,
        hoverDrop.current ? 5 : 0,
        8,
        delta
      )
    }
  })

  const cursor = (on) => {
    if (!IS_TOUCH) document.body.style.cursor = on ? 'pointer' : ''
  }

  return (
    <group ref={group} position={STATUE_POS} rotation={[0, STATUE_YAW, 0]} scale={SCALE}>
      {/* the statue itself carries NO pointer handlers: R3F only raycasts
          objects that have them, and a 1.9M-triangle raycast on every pointer
          move would cost more than the whole render. The two proxies below are
          the hit targets. */}
      <mesh geometry={statue.geometry} material={statue.material} />

      {/* body → the bull beat */}
      <mesh
        position={[0, 0.49, 0]}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.('bull')
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          hoverBody.current = true
          cursor(true)
        }}
        onPointerOut={() => {
          hoverBody.current = false
          cursor(false)
        }}
      >
        <capsuleGeometry args={[0.2, 0.6, 4, 8]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* what he is holding → the shit beat. Sits in front of the body proxy,
          so the nearer intersection wins and this claims the click. */}
      <mesh
        position={DROP_LOCAL}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.('drop')
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          hoverDrop.current = true
          cursor(true)
        }}
        onPointerOut={() => {
          hoverDrop.current = false
          cursor(false)
        }}
      >
        <sphereGeometry args={[DROP_R_LOCAL * 1.2, 12, 10]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* hover glow on the drop — distance is world units, unaffected by the
          group's scale */}
      <pointLight
        ref={glow}
        position={[DROP_LOCAL[0], DROP_LOCAL[1], DROP_LOCAL[2] + 0.12]}
        color="#cfe89a"
        intensity={0}
        distance={1.6}
        decay={2}
      />
    </group>
  )
}
