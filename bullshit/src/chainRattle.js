// Procedural chain rattle — a dense burst of bright metallic clacks with
// irregular timing, not an audio asset. Same reasoning as gateWood.js:
// everything on this landing screen is generated rather than vendored where
// it can be.
//
// Browsers only let an AudioContext actually produce sound once a real user
// gesture has unlocked it — a click, tap, or keypress qualify, hovering a
// mouse does not. To make hover-triggered rattles work as early as possible
// (not just after someone happens to click a chain), the very first trusted
// gesture anywhere on the page unlocks the context below, so every hover
// after that plays.
let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

function unlock() {
  const c = getCtx()
  if (c.state === 'suspended') c.resume().catch(() => {})
}

if (typeof window !== 'undefined') {
  ;['pointerdown', 'keydown', 'touchstart'].forEach((type) =>
    window.addEventListener(type, unlock, { once: true, passive: true }),
  )
}

// one link clacking against its neighbours: a short, sharp band+high-passed
// noise burst (the actual metal-on-metal contact) carries most of it, with a
// thin ringing overtone on roughly half the hits — real clatter isn't every
// link ringing, just some of them catching at an angle
function clack(c, at, baseFreq, amp) {
  const dur = 0.045 + Math.random() * 0.03

  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf

  const band = c.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = baseFreq
  band.Q.value = 2.4

  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 500

  const gain = c.createGain()
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(amp, at + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.001, at + dur)

  src.connect(band)
  band.connect(hp)
  hp.connect(gain)
  gain.connect(c.destination)
  src.start(at)
  src.stop(at + dur)

  if (Math.random() < 0.5) {
    const osc = c.createOscillator()
    osc.type = 'square'
    osc.frequency.value = baseFreq * (1 + Math.random() * 0.5)
    const g = c.createGain()
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(amp * 0.16, at + 0.003)
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.05)
    osc.connect(g)
    g.connect(c.destination)
    osc.start(at)
    osc.stop(at + 0.05)
  }
}

export function playChainRattle() {
  const c = getCtx()
  unlock()
  const now = c.currentTime

  // a dense burst of links clattering against each other and settling, not
  // a slow knock — lots of tight, irregular hits at a bright metallic pitch,
  // decaying amplitude as the rattle dies out
  const hits = 15 + Math.floor(Math.random() * 8)
  let t = 0
  for (let i = 0; i < hits; i++) {
    const amp = 0.42 * Math.pow(0.9, i) * (0.75 + Math.random() * 0.25)
    const freq = 550 + Math.random() * 1400
    clack(c, now + t, freq, amp)
    t += 0.012 + Math.random() * 0.028
  }
}
