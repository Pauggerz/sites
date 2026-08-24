import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import Experience from './scene/Experience.jsx'
import {
  BEATS,
  NAV_ORDER,
  GATE_LINES,
  CONTRACT_ADDRESS,
  SOCIALS,
} from './copy.js'
import { screenMedia } from './screenMedia.js'
import { makeGateWoodTexture } from './gateWood.js'

// GREY-BOX BUILD: DOM layer is the minimum needed to fly the tour and judge
// the camera framing. Audio, video, custom cursor, CA pill, and the full gate
// treatment come after the scene is approved.

/* ---------- gate (loading / entry) ---------- */
function Gate({ open, ready, onEnter }) {
  // canvas-painted grain/knots/seams, not a CSS gradient standing in for
  // one — see gateWood.js. Generated once and handed to the stylesheet as
  // a custom property so the CSS still owns layering/repeat/vignette.
  const woodUrl = useMemo(() => makeGateWoodTexture(), [])
  return (
    <div className={`gate ${open ? 'is-open' : ''}`} style={{ '--gate-wood': `url(${woodUrl})` }}>
      {/* the shut fence gate standing in front of the barn — purely
          decorative, so it's hidden from the accessibility tree and never
          eats a click meant for the button underneath */}
      <div className="gate-panel gate-panel-left" aria-hidden="true">
        <div className="gate-rail gate-rail-top" />
        <div className="gate-rail gate-rail-bottom" />
        <div className="gate-brace" />
      </div>
      <div className="gate-panel gate-panel-right" aria-hidden="true">
        <div className="gate-rail gate-rail-top" />
        <div className="gate-rail gate-rail-bottom" />
        <div className="gate-brace" />
      </div>
      <div className="gate-latch" aria-hidden="true" />
      <div className="gate-content">
        <div className="gate-line">{GATE_LINES[0]}</div>
        <h1 className="gate-title">$BULLSHIT</h1>
        <div className="gate-sub">A black bull. A barn. A field that explains itself.</div>
        <button className="gate-enter" onClick={ready ? onEnter : undefined} disabled={!ready}>
          <span>{ready ? 'Enter the barn' : 'raising the barn…'}</span>
        </button>
      </div>
    </div>
  )
}

/* ---------- nav dock ---------- */
function NavDock({ focus, go }) {
  const ref = useRef()
  // the dock scrolls horizontally on phones — keep the active chip in view
  useEffect(() => {
    const active = ref.current?.querySelector('.is-active')
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [focus])
  return (
    <nav className="dock" ref={ref}>
      <button
        className={`dock-chip ${focus === null ? 'is-active' : ''}`}
        onClick={() => go(null)}
      >
        <b>00</b> THE BARN
      </button>
      {NAV_ORDER.map((key, i) => (
        <button
          key={key}
          className={`dock-chip ${focus === key ? 'is-active' : ''}`}
          onClick={() => go(key)}
        >
          <b>{String(i + 1).padStart(2, '0')}</b> {BEATS[key].nav}
        </button>
      ))}
    </nav>
  )
}

/* ---------- volume ---------- */
function VolumeControl({ volume, onChange }) {
  return (
    <div className="hud-volume">
      <span>{volume === 0 ? 'muted' : 'vol'}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={onChange}
        aria-label="Volume"
      />
    </div>
  )
}

/* ---------- HUD ---------- */
function Hud({ entered, focus, go, volume, onVolumeChange }) {
  const beat = focus ? BEATS[focus] : null
  if (!entered) return null
  return (
    <div className="hud">
      <div className="hud-brand">
        <img src="/brand/bullshit-mark.svg" alt="" />
        <span>$BULLSHIT</span>
      </div>

      <VolumeControl volume={volume} onChange={onVolumeChange} />

      {!focus && <div className="hud-hint">scroll to walk the barn</div>}
      {beat && (
        <div className="panel" key={focus}>
          <div className="panel-index">{beat.index}</div>
          <div className="panel-title">{beat.title}</div>
          <div className="panel-body">{beat.body}</div>
          {beat.cta && (
            /* the end of the tour is the launch hub — placeholders stay
               visible until the real values land (see copy.js) */
            <div className="launch">
              <div className="launch-ca">CA: {CONTRACT_ADDRESS}</div>
              <div className="socials">
                {SOCIALS.map((s) =>
                  s.url === '<<TBD>>' ? (
                    <span key={s.label} className="tbd">
                      {s.label} — {s.url}
                    </span>
                  ) : (
                    <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
                      {s.label}
                    </a>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <NavDock focus={focus} go={go} />
    </div>
  )
}

export default function App() {
  const [entered, setEntered] = useState(false)
  const [focus, setFocus] = useState(null)
  const [pose, setPose] = useState(null) // dev override
  const [sceneReady, setSceneReady] = useState(false)
  const [caCopied, setCaCopied] = useState(false)
  const [volume, setVolume] = useState(0.86)

  const onVolumeChange = useCallback((e) => {
    const v = Number(e.target.value)
    setVolume(v)
    const el = screenMedia.el
    if (el) {
      el.volume = v
      el.muted = v === 0
    }
  }, [])

  // tap on the CA ear tag in the gate scene → clipboard + this toast
  const copyTimer = useRef()
  const onCopyCa = useCallback(() => {
    setCaCopied(true)
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCaCopied(false), 1600)
  }, [])
  useEffect(() => () => clearTimeout(copyTimer.current), [])

  // Fallback readiness: rendered-first-frame is the primary signal, but in a
  // background tab rAF is throttled and no frame ever draws. If the loaders
  // stay settled at 100% for 800ms, consider the barn ready too.
  const { progress, active } = useProgress()
  useEffect(() => {
    if (sceneReady || active || progress < 100) return
    const t = setTimeout(() => setSceneReady(true), 800)
    return () => clearTimeout(t)
  }, [progress, active, sceneReady])

  const go = useCallback((key) => {
    setPose(null)
    setFocus(key)
  }, [])

  const enter = useCallback(() => {
    setEntered(true)
    // the board video has been warming up muted behind the gate — rewind it
    // to the top and unmute it (this click is the user gesture autoplay
    // policies need), so the show always starts from 0:00 with picture and
    // sound coming from the same element
    const el = screenMedia.el
    if (el) {
      try {
        el.currentTime = 0
      } catch {
        /* not seekable yet — it will still play from wherever it can */
      }
      el.muted = false
      el.volume = volume
      el.play().catch(() => {})
    }
  }, [volume])

  // scroll-to-walk: wheel (desktop) and swipe (touch) advance the tour
  // (barn → …beats… → gate) and retreat. Accumulator + cooldown so momentum
  // can't skip beats.
  const wheelAcc = useRef(0)
  const navLast = useRef(0)
  useEffect(() => {
    if (!entered) return
    const step = (dir) => {
      const now = performance.now()
      if (now - navLast.current < 1200) return // camera mid-flight
      navLast.current = now
      const seq = [null, ...NAV_ORDER]
      const idx = seq.indexOf(focus)
      const next = seq[Math.min(seq.length - 1, Math.max(0, idx + dir))]
      if (next !== focus) go(next)
    }
    const onWheel = (e) => {
      wheelAcc.current += e.deltaY
      if (Math.abs(wheelAcc.current) < 140) return
      const dir = wheelAcc.current > 0 ? 1 : -1
      wheelAcc.current = 0
      step(dir)
    }
    // touch swipe — mobile has no wheel events
    let touchY = null
    let consumed = false
    const onTouchStart = (e) => {
      touchY = e.touches[0].clientY
      consumed = false
    }
    const onTouchMove = (e) => {
      if (touchY == null || consumed) return
      const dy = touchY - e.touches[0].clientY
      if (Math.abs(dy) < 55) return
      consumed = true
      step(dy > 0 ? 1 : -1)
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [entered, focus, go])

  // keyboard: esc = barn, arrows cycle, 0-5 jump
  useEffect(() => {
    const onKey = (e) => {
      if (!entered && e.key === 'Enter' && sceneReady) {
        enter()
        return
      }
      if (!entered) return
      if (e.key === 'Escape') go(null)
      else if (e.key === 'ArrowRight') {
        const idx = focus ? NAV_ORDER.indexOf(focus) : -1
        go(idx >= NAV_ORDER.length - 1 ? null : NAV_ORDER[idx + 1])
      } else if (e.key === 'ArrowLeft') {
        const idx = focus ? NAV_ORDER.indexOf(focus) : NAV_ORDER.length
        go(idx <= 0 ? null : NAV_ORDER[idx - 1])
      } else if (/^[0-5]$/.test(e.key)) {
        const n = Number(e.key)
        go(n === 0 ? null : NAV_ORDER[n - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enter, entered, focus, go, sceneReady])

  // dev-only hook for driving the experience from the console (stripped from prod)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__bs = { setFocus: go, setEntered, setPose }
    return () => delete window.__bs
  }, [go])

  return (
    <>
      <Experience
        entered={entered}
        focus={focus}
        pose={pose}
        onReady={() => setSceneReady(true)}
        onCopyCa={onCopyCa}
        onSelect={go}
      />
      <Gate open={entered} ready={sceneReady} onEnter={enter} />
      <Hud
        entered={entered}
        focus={focus}
        go={go}
        volume={volume}
        onVolumeChange={onVolumeChange}
      />
      {caCopied && <div className="toast">CA COPIED</div>}
      {/* CSS grain stands in for the desktop-only Noise pass on phones */}
      <div className="filmgrain" />
    </>
  )
}
