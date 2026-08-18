// Synthesized ambient bed layered under the MP4 song. Low drone + slow sub-pulse + air.
// Built lazily on the gate interaction (user gesture unlocks AudioContext).
let ctx = null
let master = null
let pulseTimer = null

export function startAudio() {
  if (ctx) return
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)
  // fade in
  master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 4)

  // --- drone: two detuned oscillators through a dark lowpass
  const droneFilter = ctx.createBiquadFilter()
  droneFilter.type = 'lowpass'
  droneFilter.frequency.value = 140
  droneFilter.Q.value = 0.7
  const droneGain = ctx.createGain()
  droneGain.gain.value = 0.5
  droneFilter.connect(droneGain).connect(master)

  for (const [freq, type] of [[55, 'sawtooth'], [55.6, 'triangle'], [110.3, 'sine']]) {
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.value = type === 'sine' ? 0.12 : 0.3
    o.connect(g).connect(droneFilter)
    o.start()
  }

  // slow LFO breathing on the drone filter
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.05
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 45
  lfo.connect(lfoGain).connect(droneFilter.frequency)
  lfo.start()

  // --- air: filtered noise hiss, barely audible
  const len = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  noise.buffer = buf
  noise.loop = true
  const noiseFilter = ctx.createBiquadFilter()
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.value = 2600
  noiseFilter.Q.value = 0.4
  const noiseGain = ctx.createGain()
  noiseGain.gain.value = 0.012
  noise.connect(noiseFilter).connect(noiseGain).connect(master)
  noise.start()

  // --- heartbeat: a deep thump every ~1.9s
  const thump = () => {
    if (!ctx) return
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(52, ctx.currentTime)
    o.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
    o.connect(g).connect(master)
    o.start()
    o.stop(ctx.currentTime + 0.6)
  }
  pulseTimer = setInterval(thump, 1900)
}

// short filtered-noise sweep — plays on every camera move so navigation feels physical
export function whoosh() {
  if (!ctx || !master) return
  const len = ctx.sampleRate * 0.7
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = 1.2
  f.frequency.setValueAtTime(180, ctx.currentTime)
  f.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.45)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.08)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.65)
  src.connect(f).connect(g).connect(master)
  src.start()
}

// a quick double squeak — high sine chirps with fast pitch drops. Plays at the monument.
export function squeak() {
  if (!ctx || !master) return
  const now = ctx.currentTime
  for (const [t0, f0, f1] of [
    [0, 2600, 1700],
    [0.16, 3100, 1950],
  ]) {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(f0, now + t0)
    o.frequency.exponentialRampToValueAtTime(f1, now + t0 + 0.11)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, now + t0)
    g.gain.exponentialRampToValueAtTime(0.16, now + t0 + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + 0.13)
    o.connect(g).connect(master)
    o.start(now + t0)
    o.stop(now + t0 + 0.15)
  }
}

export function setMuted(muted) {
  if (!ctx || !master) return
  master.gain.cancelScheduledValues(ctx.currentTime)
  master.gain.linearRampToValueAtTime(muted ? 0 : 0.16, ctx.currentTime + 0.6)
}

export function stopAudio() {
  if (pulseTimer) clearInterval(pulseTimer)
  if (ctx) ctx.close()
  ctx = null
  master = null
  pulseTimer = null
}
