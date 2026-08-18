import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Coin face drawn to a canvas: double rim + wordmark, with the official
// Hoodrat mark dropped into the middle once the image loads.
function makeEmblem() {
  const S = 512
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  g.clearRect(0, 0, S, S)
  g.strokeStyle = '#ffffff'
  g.lineWidth = 10
  g.lineCap = 'round'

  // outer rim (double ring, coin-like)
  g.beginPath()
  g.arc(S / 2, S / 2, S * 0.46, 0, Math.PI * 2)
  g.stroke()
  g.lineWidth = 4
  g.beginPath()
  g.arc(S / 2, S / 2, S * 0.415, 0, Math.PI * 2)
  g.stroke()

  // wordmark
  g.font = `700 ${S * 0.075}px "IBM Plex Mono", monospace`
  g.textAlign = 'center'
  g.fillStyle = '#ffffff'
  g.fillText('$ H O O D R A T', S / 2, S * 0.84)

  const tex = new THREE.CanvasTexture(c)
  tex.anisotropy = 4

  const img = new Image()
  img.onload = () => {
    const s = S * 0.56
    g.drawImage(img, (S - s) / 2, S * 0.15, s, s)
    tex.needsUpdate = true
  }
  img.src = '/brand/hoodrat-mark.png'

  return tex
}

// Spinning holographic coin — the centerpiece above the lounge table.
export default function CoinHologram({ position = [0, 1.95, -0.9], focused }) {
  const spin = useRef()
  const group = useRef()
  const light = useRef()
  const emblem = useMemo(() => makeEmblem(), [])
  const faceMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: emblem,
        alphaMap: emblem,
        color: new THREE.Color('#ccff00').multiplyScalar(2.2),
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [emblem]
  )

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (spin.current) spin.current.rotation.y += delta * (focused ? 2.4 : 0.8)
    if (group.current) {
      group.current.position.y = position[1] + Math.sin(t * 1.1) * 0.06
      const target = focused ? 1.45 : 1
      group.current.scale.setScalar(
        THREE.MathUtils.damp(group.current.scale.x, target, 3, delta)
      )
    }
    if (light.current)
      light.current.intensity = (focused ? 5 : 2.2) + Math.sin(t * 2.2) * 0.5
  })

  return (
    <group ref={group} position={position}>
      <group ref={spin}>
        {/* two emblem faces back-to-back */}
        <mesh material={faceMat}>
          <circleGeometry args={[0.42, 48]} />
        </mesh>
        <mesh material={faceMat} rotation={[0, Math.PI, 0]} position={[0, 0, -0.001]}>
          <circleGeometry args={[0.42, 48]} />
        </mesh>
        {/* coin edge */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.012, 8, 64]} />
          <meshStandardMaterial
            color="#1a2100"
            emissive={new THREE.Color('#ccff00')}
            emissiveIntensity={2.5}
            toneMapped={false}
          />
        </mesh>
      </group>
      {/* projection beam from the table below */}
      <mesh position={[0, -0.55, 0]}>
        <coneGeometry args={[0.34, 1.1, 24, 1, true]} />
        <meshBasicMaterial
          color="#ccff00"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight ref={light} color="#ccff00" distance={5} decay={2} />
    </group>
  )
}
