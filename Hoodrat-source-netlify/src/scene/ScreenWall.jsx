import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useVideoTexture } from '@react-three/drei'
import * as THREE from 'three'
import { screenMedia } from '../screenMedia.js'

const SCREEN_VIDEO = '/media/hoodrat-screen.mp4'

// A glyph atlas drawn once to a canvas — random dense symbols, deliberately unreadable.
function makeGlyphAtlas() {
  const N = 12 // 12x12 glyphs
  const CELL = 64
  const c = document.createElement('canvas')
  c.width = c.height = N * CELL
  const g = c.getContext('2d')
  g.fillStyle = '#000'
  g.fillRect(0, 0, c.width, c.height)
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const chars =
    'アイウエオカキクケコサシスセsoタチツテト0123456789$#%&+=<>/\\|ΔΣΞΨΩ鼠ネズミ日月火水木金土'
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const ch = chars[Math.floor(Math.random() * chars.length)]
      g.font = `${CELL * 0.72}px "IBM Plex Mono", monospace`
      g.fillText(ch, x * CELL + CELL / 2, y * CELL + CELL / 2)
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  return tex
}

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Rain of glyphs over an 8x3 monitor grid. When uFocus rises, the wall wakes up:
// the rain accelerates and the center monitors become a block-party video wall.
const fragment = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uTime;
  uniform float uFocus;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    // --- monitor grid: 8 x 3 bezels
    vec2 mon = vec2(8.0, 3.0);
    vec2 monId = floor(vUv * mon);
    vec2 monUv = fract(vUv * mon);
    float bezel = step(0.03, monUv.x) * step(monUv.x, 0.97) *
                  step(0.05, monUv.y) * step(monUv.y, 0.95);

    float mSeed = hash(monId + 7.0);
    float alive = step(0.08, mSeed);
    float flick = 0.85 + 0.15 * sin(uTime * (6.0 + mSeed * 30.0) + mSeed * 60.0);
    flick *= 1.0 - 0.35 * step(0.985, hash(vec2(floor(uTime * 9.0), mSeed)));

    // --- glyph rain (speeds up under focus)
    float rush = 1.0 + uFocus * 2.5;
    vec2 cells = vec2(14.0, 9.0);
    vec2 cUv = monUv * cells;
    float col = floor(cUv.x);
    float speed = (0.6 + hash(vec2(col, mSeed)) * 2.4) * rush;
    cUv.y += uTime * speed;
    vec2 cellId = floor(cUv);
    vec2 inCell = fract(cUv);

    float swap = floor(uTime * (0.5 + hash(cellId + mSeed) * 2.0));
    float gi = floor(hash(cellId + swap + mSeed * 13.0) * 144.0);
    vec2 gOff = vec2(mod(gi, 12.0), floor(gi / 12.0)) / 12.0;
    float glyph = texture2D(uAtlas, gOff + inCell / 12.0).r;

    float head = fract(hash(vec2(col, monId.x + monId.y * 8.0)) + uTime * speed * 0.11);
    float trail = fract(cellId.y / cells.y - head);
    float bright = pow(1.0 - trail, 3.0);

    vec3 lime = vec3(0.8, 1.0, 0.0);
    vec3 white = vec3(1.0, 0.9, 0.5);
    vec3 color = mix(lime * 0.9, white, step(0.94, bright)) * glyph * bright;
    color += vec3(0.025, 0.018, 0.006);
    color *= bezel * alive * flick;
    color += (1.0 - alive) * bezel * vec3(0.018, 0.01, 0.004);

    // warm up the center monitors so the video plane reads like a broadcast
    float centerBank = smoothstep(0.08, 0.3, vUv.x) * smoothstep(0.92, 0.7, vUv.x);
    color += centerBank * vec3(0.08, 0.03, 0.0) * (0.3 + uFocus * 0.5);

    gl_FragColor = vec4(color * 1.6, 1.0);
  }
`

export default function ScreenWall({
  position = [0, 2.55, -9.82],
  width = 13,
  height = 3.6,
  focused = false,
}) {
  const mat = useRef()
  const videoMat = useRef()
  const nextPlayAttempt = useRef(0)
  const atlas = useMemo(() => makeGlyphAtlas(), [])
  const videoTexture = useVideoTexture(SCREEN_VIDEO, {
    muted: true,
    loop: true,
    start: true,
    playsInline: true,
  })
  const uniforms = useMemo(
    () => ({
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uFocus: { value: 0 },
    }),
    [atlas]
  )

  useEffect(() => {
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

  useFrame((state, delta) => {
    if (mat.current) {
      mat.current.uniforms.uTime.value += delta
      const u = mat.current.uniforms.uFocus
      u.value = THREE.MathUtils.damp(u.value, focused ? 1 : 0, 2.5, delta)
    }
    if (videoMat.current) {
      videoMat.current.opacity = THREE.MathUtils.damp(
        videoMat.current.opacity,
        focused ? 1 : 0.78,
        3,
        delta
      )
    }

    // Some browsers reject the initial muted autoplay before the gate click.
    // Retry lightly from the render loop so the screen wakes once interaction exists.
    const el = videoTexture.image
    if (el?.paused && state.clock.elapsedTime > nextPlayAttempt.current) {
      nextPlayAttempt.current = state.clock.elapsedTime + 0.75
      el.play().catch(() => {})
    }
  })

  const videoWidth = width * 0.58
  const videoHeight = videoWidth / (16 / 9)

  return (
    <group position={position}>
      {/* frame behind the monitors */}
      <mesh position={[0, 0, -0.08]}>
        <boxGeometry args={[width + 0.5, height + 0.5, 0.12]} />
        <meshStandardMaterial color="#050705" roughness={0.6} metalness={0.6} />
      </mesh>
      <mesh>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={vertex}
          fragmentShader={fragment}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[videoWidth, videoHeight]} />
        <meshBasicMaterial
          ref={videoMat}
          map={videoTexture}
          toneMapped={false}
          transparent
          opacity={0.78}
        />
      </mesh>
      {[
        [0, videoHeight / 2 + 0.05, videoWidth + 0.16, 0.08],
        [0, -videoHeight / 2 - 0.05, videoWidth + 0.16, 0.08],
        [-videoWidth / 2 - 0.05, 0, 0.08, videoHeight + 0.16],
        [videoWidth / 2 + 0.05, 0, 0.08, videoHeight + 0.16],
      ].map(([x, y, w, h], i) => (
        <mesh key={`frame-${i}`} position={[x, y, 0.08]}>
          <boxGeometry args={[w, h, 0.035]} />
          <meshStandardMaterial
            color="#140805"
            emissive="#ff8a1c"
            emissiveIntensity={1.5}
            roughness={0.35}
            metalness={0.35}
            toneMapped={false}
          />
        </mesh>
      ))}
      {[-0.25, 0.25].map((x) => (
        <mesh key={`v-${x}`} position={[x * videoWidth, 0, 0.08]}>
          <boxGeometry args={[0.055, videoHeight, 0.025]} />
          <meshBasicMaterial color="#010201" toneMapped={false} />
        </mesh>
      ))}
      {[-0.5, 0, 0.5].map((y) => (
        <mesh key={`h-${y}`} position={[0, y * videoHeight * 0.5, 0.08]}>
          <boxGeometry args={[videoWidth, 0.055, 0.025]} />
          <meshBasicMaterial color="#010201" toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}
