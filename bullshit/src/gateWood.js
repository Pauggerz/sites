// Procedural dark-oak plank texture for the landing gate, canvas-drawn the
// same way every surface in the 3D scene is (see materials.js) rather than
// stood in for with flat CSS gradient banding — banded stripes read as a
// UI element; painted grain, knots and seams read as an actual board.
// Tileable horizontally (PLANKS boards fit exactly in the canvas width) so
// the CSS side can repeat-x it across a gate leaf of any width.
function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

const PLANK_W = 150
const PLANKS = 4
const W = PLANK_W * PLANKS
const H = 1100

export function makeGateWoodTexture(seed = 1) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')

  for (let i = 0; i < PLANKS; i++) {
    const x0 = i * PLANK_W
    // near-black brown base, a hair of per-plank tonal variation so
    // neighbouring boards don't read as one solid slab
    const r = 16 + hash(i, seed) * 14
    const gr = 11 + hash(i, seed + 5) * 9
    const b = 7 + hash(i, seed + 9) * 6
    g.fillStyle = `rgb(${r}, ${gr}, ${b})`
    g.fillRect(x0, 0, PLANK_W, H)

    // long vertical grain streaks — thin, wavy, mostly darker than the
    // base (wood grain reads as shadow far more than highlight), with a
    // few warmer fibres catching light so the grain doesn't just crush to
    // black at this darkness
    for (let s = 0; s < 34; s++) {
      const sx = x0 + hash(i * 97 + s, seed) * PLANK_W
      const amp = 2.5 + hash(s, i) * 5
      const dark = hash(s, seed + i) > 0.25
      g.strokeStyle = dark
        ? `rgba(0, 0, 0, ${0.22 + hash(s, i * 3) * 0.28})`
        : `rgba(96, 72, 46, ${0.14 + hash(s, i * 7) * 0.16})`
      g.lineWidth = 0.6 + hash(s, seed) * 1.3
      g.beginPath()
      g.moveTo(sx, 0)
      for (let y = 0; y <= H; y += 36) {
        const wob = Math.sin(y * 0.021 + s * 1.7) * amp
        g.lineTo(sx + wob, y)
      }
      g.stroke()
    }

    // the odd knot — a dark whorled ellipse, not every board gets one
    if (hash(i, seed + 21) > 0.5) {
      const kx = x0 + PLANK_W * (0.25 + hash(i, seed + 1) * 0.5)
      const ky = H * (0.12 + hash(i, seed + 4) * 0.76)
      const kr = 9 + hash(i, seed + 7) * 12
      const grad = g.createRadialGradient(kx, ky, 0, kx, ky, kr)
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.6)')
      grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.32)')
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      g.fillStyle = grad
      g.beginPath()
      g.ellipse(kx, ky, kr, kr * 1.7, 0, 0, Math.PI * 2)
      g.fill()
    }

    // faint horizontal weathering / water-stain bands
    for (let bd = 0; bd < 4; bd++) {
      const by = hash(i, bd + 40) * H
      g.fillStyle = `rgba(0, 0, 0, ${0.04 + hash(i, bd) * 0.07})`
      g.fillRect(x0, by, PLANK_W, 5 + hash(i, bd + 2) * 18)
    }

    // the seam — the gap between boards, darkest thing on the panel
    g.fillStyle = 'rgba(0, 0, 0, 0.8)'
    g.fillRect(x0 + PLANK_W - 2, 0, 2, H)
  }

  // NO per-tile vignette here on purpose: a radial gradient baked into a
  // 600px tile darkens toward THAT tile's own edges, and repeat-x then
  // stamps a dark seam every 600px instead of one continuous door — on any
  // panel wider than one tile (i.e. every desktop viewport) it read as the
  // wood cutting off partway across the leaf. The gate already gets a
  // single continuous edge vignette from the DOM side (.gate::after in
  // index.css), which doesn't have this problem because it's sized to the
  // whole gate, not to one tile.
  return c.toDataURL('image/png')
}
