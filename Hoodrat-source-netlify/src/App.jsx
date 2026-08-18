import { useCallback, useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import Experience from './scene/Experience.jsx'
import {
  BEATS,
  NAV_ORDER,
  GATE_LINES,
  JOIN_URL,
  CONTRACT_ADDRESS,
  TOKEN_URL,
  SOCIALS,
} from './copy.js'
import { startAudio, setMuted, whoosh, squeak } from './audio.js'
import { IS_TOUCH } from './device.js'
import { screenMedia } from './screenMedia.js'

/* ---------- custom cursor ---------- */
function Cursor() {
  const ref = useRef()
  useEffect(() => {
    const el = ref.current
    const move = (e) => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
    }
    const over = (e) => {
      const hot =
        e.target.closest('button, a, .spot-label') ||
        document.body.classList.contains('spot-hover')
      el.classList.toggle('is-hover', !!hot)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerover', over)
    const obs = new MutationObserver(() =>
      el.classList.toggle(
        'is-hover',
        document.body.classList.contains('spot-hover')
      )
    )
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      obs.disconnect()
    }
  }, [])
  return <div ref={ref} className="cursor" />
}

/* ---------- contract address pill ---------- */
// the official mark, masked so it inherits the pill's current text color
function RatIcon() {
  return <span className="ca-mark" aria-hidden="true" />
}

function ContractPill({ className = '' }) {
  const [copied, setCopied] = useState(false)
  const short = `${CONTRACT_ADDRESS.slice(0, 6)}…${CONTRACT_ADDRESS.slice(-4)}`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = CONTRACT_ADDRESS
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <button
      className={`ca-pill ${copied ? 'is-copied' : ''} ${className}`}
      onClick={copy}
      title={CONTRACT_ADDRESS}
    >
      <span className="ca-paw">
        <RatIcon />
      </span>
      <span className="ca-label">CA</span>
      <span className="ca-addr">{copied ? 'COPIED TO CLIPBOARD' : short}</span>
      <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" className="ca-copy">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          d="M8 8V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-3M4 8h11a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"
        />
      </svg>
    </button>
  )
}

/* ---------- gate (loading / entry) ---------- */
function Gate({ open, ready, onEnter }) {
  const [typed, setTyped] = useState('')
  const [stage, setStage] = useState(0)
  const line = GATE_LINES[0]

  useEffect(() => {
    let i = 0
    const iv = setInterval(() => {
      i++
      setTyped(line.slice(0, i))
      if (i >= line.length) {
        clearInterval(iv)
        setTimeout(() => setStage(1), 500)
        setTimeout(() => setStage(2), 1100)
      }
    }, 42)
    return () => clearInterval(iv)
  }, [line])

  return (
    <div className={`gate ${open ? 'is-open' : ''}`}>
      <div className="gate-scanline" />
      <div className="gate-typed">
        {typed}
        <span className="caret" />
      </div>
      <img
        className={`gate-logo ${stage >= 1 ? 'is-in' : ''}`}
        src="/brand/hoodrat-mark.png"
        alt="Hoodrat"
      />
      <h1 className={`gate-title ${stage >= 1 ? 'is-in' : ''}`}>$HOODRAT</h1>
      <div className={`gate-sub ${stage >= 1 ? 'is-in' : ''}`}>
        The gold-plated menace of the Robinhood chain
      </div>
      <button
        className={`gate-enter ${stage >= 2 ? 'is-in' : ''}`}
        onClick={ready ? onEnter : undefined}
        disabled={!ready}
      >
        <span>{ready ? 'Open' : 'waking the rat…'}</span>
      </button>
      <div className={`gate-ca ${stage >= 2 ? 'is-in' : ''}`}>
        <ContractPill />
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
        <b>00</b> THE BURROW
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

/* ---------- HUD ---------- */
function Hud({ entered, focus, go, muted, onToggleMute }) {
  const beat = focus ? BEATS[focus] : null
  if (!entered) return null
  return (
    <div className="hud">
      <div className="hud-brand">
        <img src="/brand/hoodrat-mark.png" alt="" />
        <span>
          $<em>HOODRAT</em>
        </span>
      </div>
      <div className="hud-ca">
        <ContractPill />
      </div>
      <button
        className={`hud-sound ${muted ? 'is-muted' : ''}`}
        onClick={onToggleMute}
        aria-pressed={muted}
        title={muted ? 'Turn audio on' : 'Mute all audio'}
      >
        <span className="bars">
          <i />
          <i />
          <i />
        </span>
        <span className="sound-copy">
          <strong>{muted ? 'Sound off' : 'Sound on'}</strong>
          <small>{muted ? 'tap to play' : 'tap to mute'}</small>
        </span>
      </button>

      {!focus && <div className="hud-hint">scroll to scurry the block</div>}
      {beat && (
        <div className="panel" key={focus}>
          <div className="panel-index">{beat.index}</div>
          <div className="panel-title">{beat.title}</div>
          <div className="panel-body">{beat.body}</div>
          {beat.cta ? (
            /* the end of the tour is the launch hub: CA, token, community, socials */
            <div className="launch">
              <ContractPill />
              <div className="panel-actions">
                <a className="btn btn-primary" href={TOKEN_URL} target="_blank" rel="noreferrer">
                  <span>$HOODRAT ↗</span>
                </a>
                <a className="btn btn-ghost" href={JOIN_URL} target="_blank" rel="noreferrer">
                  <span>Join the mischief</span>
                </a>
              </div>
              <div className="socials">
                {SOCIALS.map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="panel-actions">
              <button className="btn btn-ghost" onClick={() => go(null)}>
                <span>Back to the burrow</span>
              </button>
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
  const [muted, setMutedState] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)

  // Fallback readiness: rendered-first-frame is the primary signal, but in a
  // background tab rAF is throttled and no frame ever draws. If the loaders
  // stay settled at 100% for 800ms (long enough to bridge between-batch
  // lulls), consider the burrow ready too.
  const { progress, active } = useProgress()
  useEffect(() => {
    if (sceneReady || active || progress < 100) return
    const t = setTimeout(() => setSceneReady(true), 800)
    return () => clearTimeout(t)
  }, [progress, active, sceneReady])

  const go = useCallback(
    (key) => {
      setPose(null)
      setFocus((cur) => {
        if (cur !== key) {
          whoosh()
          if (key === 'rat') squeak()
        }
        return key
      })
    },
    []
  )

  const enter = useCallback(() => {
    setEntered(true)
    startAudio()
    // the screen-wall video has been warming up muted behind the gate —
    // rewind it to the top and unmute it (this click is the user gesture
    // autoplay policies need), so the show always starts from 0:00 with
    // picture and sound coming from the same element
    const el = screenMedia.el
    if (el) {
      try {
        el.currentTime = 0
      } catch {
        /* not seekable yet — it will still play from wherever it can */
      }
      el.muted = false
      el.volume = 0.86
      el.play().catch(() => {})
    }
    // the intro camera sweep is driven by CameraRig, frame-accurately
  }, [])

  const toggleMute = () => {
    setMutedState((m) => {
      const next = !m
      setMuted(next)
      const el = screenMedia.el
      if (el) {
        // mute only the sound — the video keeps playing so the wall stays live
        el.muted = next
        el.volume = next ? 0 : 0.86
        if (!next) el.play().catch(() => {})
      }
      return next
    })
  }

  useEffect(() => {
    const el = screenMedia.el
    if (!el || !entered) return
    el.muted = muted
    el.volume = muted ? 0 : 0.86
    if (!muted) el.play().catch(() => {})
  }, [entered, muted])

  // scroll-to-scurry: wheel (desktop) and swipe (touch) advance the tour
  // (burrow → …beats… → door) and retreat. Accumulator + cooldown so momentum
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

  // keyboard: esc = den, arrows cycle, 0-5 jump
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
    window.__hq = { setFocus: go, setEntered, setPose }
    return () => delete window.__hq
  }, [go])

  return (
    <>
      <Experience
        entered={entered}
        focus={focus}
        pose={pose}
        onReady={() => setSceneReady(true)}
      />
      <Gate open={entered} ready={sceneReady} onEnter={enter} />
      <Hud
        entered={entered}
        focus={focus}
        go={go}
        muted={muted}
        onToggleMute={toggleMute}
      />
      <div className="filmgrain" />
      {/* touch devices have no cursor to follow — skip the listeners entirely */}
      {!IS_TOUCH && <Cursor />}
    </>
  )
}
