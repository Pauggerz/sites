import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useVideoTexture } from '@react-three/drei'
import * as THREE from 'three'
import { screenMedia } from '../screenMedia.js'
import { CONTRACT_ADDRESS, SOCIALS } from '../copy.js'
import { IS_TOUCH, IS_MOBILE } from '../device.js'
import {
  woodMaterial,
  metalMaterial,
  lightShaftMaterial,
  projectionMaterial,
  dustMaterial,
  makeDustGeometry,
  makeBoardIdleTexture,
  makeCaTagTexture,
  makeTagTexture,
  makeSignTexture,
} from '../materials.js'

// Beat 05: the barn is a drive-in. An old cased projector sits on a crate at
// the edge of the right loft and throws the film clear across the barn onto
// the big blank -x wall — the picture rides the boards (additive, so grain
// and batten seams read through it, see projectionMaterial) with a slight
// keystone from the off-axis throw. The show runs all the time at a low lamp
// level so the barn always flickers a little; the gate beat brings it to full
// while the lantern in front of that wall dims out of its way (Practicals).
//
// This component OWNS the site's single <video> element (see screenMedia.js:
// its audio track is the song; App rewinds and unmutes it on the enter
// click). The video branch suspends until the file plays, so it only mounts
// when the probe proves the mp4 is really there — Netlify's SPA fallback
// answers missing paths with index.html and a 200.

const SCREEN_VIDEO = '/media/bullshit-screen.mp4'

// the picture: 16:9, nearly the wall's full height, centred clear of the loft
const PIC_W = 6.4
const PIC_H = 3.6
const PIC_POS = [-5.93, 2.5, 0.9]

// projector lens, up on the right loft
const LENS = [4.55, 3.05, -2.1]

// slight keystone: the throw comes from above and from the -z side, so the
// bottom edge and the far (+z) side of the picture stretch a little
function makeKeystoneGeometry() {
  const g = new THREE.PlaneGeometry(PIC_W, PIC_H, 8, 8)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    pos.setX(i, x * (1 - (y / PIC_H) * 0.05))
    // after the mesh's y-rotation, local -x faces world +z (the far side)
    pos.setY(i, y * (1 - (x / (PIC_W / 2)) * 0.03))
  }
  pos.needsUpdate = true
  return g
}

function VideoFace({ geometry, gain }) {
  const nextPlayAttempt = useRef(0)
  const videoTexture = useVideoTexture(SCREEN_VIDEO, {
    muted: true,
    loop: true,
    start: true,
    playsInline: true,
  })
  const mat = useMemo(() => projectionMaterial(videoTexture), [videoTexture])

  useEffect(() => {
    videoTexture.colorSpace = THREE.SRGBColorSpace
    const el = videoTexture.image
    if (!el) return undefined
    // starts muted (autoplay policy); App unmutes this same element on enter
    // so the song IS the video's audio track — always in sync
    el.muted = true
    el.volume = 0
    el.loop = true
    el.playsInline = true
    el.play().catch(() => {})
    screenMedia.el = el
    return () => {
      if (screenMedia.el === el) screenMedia.el = null
    }
  }, [videoTexture])

  useFrame((state) => {
    mat.uniforms.uGain.value = gain.current
    // Some browsers reject the initial muted autoplay before the gate click.
    // Retry lightly from the render loop so the show wakes once interaction exists.
    const el = videoTexture.image
    if (el?.paused && state.clock.elapsedTime > nextPlayAttempt.current) {
      nextPlayAttempt.current = state.clock.elapsedTime + 0.75
      el.play().catch(() => {})
    }
  })

  return <mesh geometry={geometry} material={mat} />
}

function IdleFace({ geometry, gain }) {
  const mat = useMemo(() => projectionMaterial(makeBoardIdleTexture()), [])
  useFrame(() => {
    mat.uniforms.uGain.value = gain.current
  })
  return <mesh geometry={geometry} material={mat} />
}

/* ---------- projector, beam, and the picture on the wall ---------- */

function Projection({ focused }) {
  const beamMat = useMemo(() => lightShaftMaterial({ color: '#cfe4a2', intensity: 0.12 }), [])
  const dust = useMemo(() => dustMaterial(), [])
  const dustGeo = useMemo(() => makeDustGeometry(IS_MOBILE ? 140 : 300), [])
  const metal = useMemo(() => metalMaterial({ scale: 1.5, rustBias: 0.15 }), [])
  const crate = useMemo(
    () => woodMaterial({ boards: 4, len: 1, tone: [0.3, 0.21, 0.12], seed: 22 }),
    []
  )
  const lensGlow = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#e8f3c6').multiplyScalar(1.4),
        toneMapped: false,
      }),
    []
  )
  const geometry = useMemo(() => makeKeystoneGeometry(), [])

  // the throw: cylinder +y (narrow, v=1 = brightest) points back at the lens
  const beam = useMemo(() => {
    const from = new THREE.Vector3(...LENS)
    const to = new THREE.Vector3(...PIC_POS)
    const d = to.clone().sub(from)
    const len = d.length()
    const mid = from.clone().add(to).multiplyScalar(0.5)
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      d.clone().normalize().negate()
    )
    return { len, mid, q }
  }, [])

  const wash = useRef()
  const gain = useRef(0)
  const level = useRef(0)

  useFrame((_, delta) => {
    // the show never stops — focus just turns the lamp up
    level.current = THREE.MathUtils.damp(level.current, focused ? 1 : 0, 2.5, delta)
    const k = level.current
    gain.current = 0.26 + k * 0.32
    beamMat.uniforms.uIntensity.value = 0.1 + k * 0.2
    if (wash.current) wash.current.intensity = 1.0 + k * 2.6
  })

  const [source, setSource] = useState('probe')
  useEffect(() => {
    let alive = true
    fetch(SCREEN_VIDEO, { method: 'HEAD' })
      .then((r) => {
        const type = r.headers.get('content-type') || ''
        if (alive) setSource(r.ok && type.startsWith('video') ? 'video' : 'idle')
      })
      .catch(() => {
        if (alive) setSource('idle')
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <group>
      {/* crate on the loft edge, projector cased on top */}
      <group position={[4.85, 2.61, -2.15]}>
        <mesh position={[0, 0.27, 0]} material={crate}>
          <boxGeometry args={[0.62, 0.54, 0.6]} />
        </mesh>
        <group position={[0, 0.7, 0]} rotation={[0, Math.PI / 2 + 0.06, 0.05]}>
          {/* the cased unit: body, reels, snout */}
          <mesh material={metal}>
            <boxGeometry args={[0.34, 0.3, 0.52]} />
          </mesh>
          {[0.14, -0.14].map((z) => (
            <mesh key={z} position={[0, 0.24, z]} rotation={[0, 0, Math.PI / 2]} material={metal}>
              <cylinderGeometry args={[0.13, 0.13, 0.035, 14]} />
            </mesh>
          ))}
          <mesh position={[0, -0.02, 0.31]} rotation={[Math.PI / 2, 0, 0]} material={metal}>
            <cylinderGeometry args={[0.07, 0.055, 0.14, 12]} />
          </mesh>
          <mesh position={[0, -0.02, 0.385]} rotation={[Math.PI / 2, 0, 0]} material={lensGlow}>
            <circleGeometry args={[0.05, 12]} />
          </mesh>
        </group>
      </group>

      {/* warm spill where the throw lands, so the boards around the picture read */}
      <pointLight ref={wash} position={[-4.7, 2.5, 0.9]} color="#cfe4a2" intensity={1} distance={6} decay={2} />

      {/* the dusty throw across the whole barn */}
      <mesh position={beam.mid} quaternion={beam.q} material={beamMat}>
        <cylinderGeometry args={[0.09, 2.8, beam.len, 24, 1, true]} />
      </mesh>
      <points
        position={LENS}
        quaternion={beam.q}
        scale={[2.4, 3.5, 2.4]}
        geometry={dustGeo}
        material={dust}
      />

      {/* the picture, riding the boards */}
      <group position={PIC_POS} rotation={[0, Math.PI / 2, 0.008]}>
        {source === 'video' ? (
          <VideoFace geometry={geometry} gain={gain} />
        ) : (
          <IdleFace geometry={geometry} gain={gain} />
        )}
      </group>
    </group>
  )
}

/* ---------- the CA post: ear tag (tap to copy) + social planks ---------- */

function CaPost({ onCopyCa }) {
  const post = useMemo(
    () => woodMaterial({ boards: 2, len: 5, tone: [0.3, 0.21, 0.12], batten: 0, seed: 17 }),
    []
  )
  const smallTag = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: makeTagTexture(),
        transparent: true,
        roughness: 0.6,
        side: THREE.DoubleSide,
      }),
    []
  )
  const caTag = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: makeCaTagTexture(CONTRACT_ADDRESS),
        transparent: true,
        roughness: 0.6,
        side: THREE.DoubleSide,
      }),
    []
  )
  const signs = useMemo(
    () =>
      SOCIALS.map(
        (s) =>
          new THREE.MeshStandardMaterial({ map: makeSignTexture(s.label), roughness: 0.9 })
      ),
    []
  )

  const hover = (on) => {
    if (IS_TOUCH) return
    document.body.style.cursor = on ? 'pointer' : ''
  }
  const copy = (e) => {
    e.stopPropagation()
    navigator.clipboard?.writeText(CONTRACT_ADDRESS).catch(() => {})
    onCopyCa?.()
  }
  const open = (i) => (e) => {
    e.stopPropagation()
    const url = SOCIALS[i].url
    if (url && url !== '<<TBD>>') window.open(url, '_blank', 'noopener')
  }

  // Right foreground of the gate pose, quartered to face its camera. The
  // distance is load-bearing: pulled closer the tag crops off the gate frame,
  // pushed further it swings into the bull beat's frustum and plants a giant
  // yellow sign across the monument. This sits in the gap between the two.
  return (
    <group position={[2.33, 0, 1.09]} rotation={[0, 0.72, 0]}>
      <mesh position={[0, 1.0, 0]} material={post}>
        <boxGeometry args={[0.15, 2.0, 0.15]} />
      </mesh>
      <mesh position={[0.02, 1.86, 0.09]} rotation={[0, 0, -0.04]} material={smallTag}>
        <planeGeometry args={[0.3, 0.15]} />
      </mesh>
      <mesh
        position={[0, 1.5, 0.09]}
        rotation={[0, 0, 0.02]}
        material={caTag}
        onClick={copy}
        onPointerOver={() => hover(true)}
        onPointerOut={() => hover(false)}
      >
        <planeGeometry args={[0.72, 0.36]} />
      </mesh>
      {signs.map((mat, i) => (
        <mesh
          key={SOCIALS[i].label}
          position={[0, 1.14 - i * 0.2, 0.09]}
          rotation={[0, 0, (i % 2 ? -1 : 1) * 0.035]}
          material={mat}
          onClick={open(i)}
          onPointerOver={() => hover(true)}
          onPointerOut={() => hover(false)}
        >
          <planeGeometry args={[0.6, 0.15]} />
        </mesh>
      ))}
    </group>
  )
}

export default function GateShow({ focus, onCopyCa }) {
  return (
    <group>
      <Projection focused={focus === 'gate'} />
      <CaPost onCopyCa={onCopyCa} />
    </group>
  )
}
