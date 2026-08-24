import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  ChromaticAberration,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import Barn from './Barn.jsx'
import CameraRig, { POSES } from './CameraRig.jsx'
import { IS_MOBILE } from '../device.js'

// Lives INSIDE the Suspense boundary: its first rendered frame means every
// sibling resolved and the GPU actually drew the barn. That is the only
// trustworthy "ready" — loader progress has false-100% lulls between batches.
function ReadySignal({ onReady }) {
  const fired = useRef(false)
  useFrame(() => {
    if (!fired.current) {
      fired.current = true
      onReady()
    }
  })
  return null
}

// Phones can't hold 60fps at full retina DPR with the bloom chain, so start
// them lower and let PerformanceMonitor walk the DPR down (or back up) until
// the frame rate is stable.
const MAX_DPR = IS_MOBILE ? 1.5 : 2

export default function Experience({ entered, focus, pose, onReady, onCopyCa, onSelect }) {
  const [dpr, setDpr] = useState(() =>
    Math.min(MAX_DPR, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1)
  )

  return (
    <Canvas
      dpr={dpr}
      // MSAA on the default framebuffer is wasted with EffectComposer (the
      // scene renders offscreen); AA comes from the composer's multisampling.
      // toneMappingExposure is the base stop; Atmosphere damps it up further
      // for the pasture beat
      gl={{ antialias: false, powerPreference: 'high-performance', toneMappingExposure: 5.5 }}
      // far pushed out for the field beat's horizon treeline and sky backdrop
      // — everything else in the barn is close range, so the extra depth
      // buffer range doesn't cost precision where it matters
      camera={{ position: POSES.start.pos, fov: 55, near: 0.1, far: 190 }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <color attach="background" args={['#0c1512']} />
      {/* near/far bound what gets drawn — Atmosphere opens the far plane for
          the pasture beat and closes it again indoors */}
      <fog attach="fog" args={['#0c1512', 8, 30]} />

      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(MAX_DPR, d + 0.25))}
        flipflops={4}
        onFallback={() => setDpr(1)}
      />

      <Suspense fallback={null}>
        <Barn focus={focus} onCopyCa={onCopyCa} onSelect={onSelect} />
        <ReadySignal onReady={onReady} />
      </Suspense>

      <CameraRig target={pose || focus || 'overview'} entered={entered} />

      <EffectComposer multisampling={IS_MOBILE ? 0 : 8}>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.5}
          luminanceSmoothing={0.85}
          mipmapBlur
          radius={0.75}
        />
        {/* subtle full-screen grading passes are invisible at phone size but
            not free — the CSS filmgrain overlay covers the texture there.
            CA stays barely perceptible: anything more fringes every lit edge */}
        {!IS_MOBILE && <ChromaticAberration offset={[0.00015, 0.0001]} />}
        {!IS_MOBILE && (
          <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.5} />
        )}
        <Vignette eskil={false} offset={0.22} darkness={0.5} />
      </EffectComposer>
    </Canvas>
  )
}
