# sites — working memory

This repo holds every site I've built. Each top-level folder is one project.
New projects go in here too, at the top level.

**Before starting or changing anything, read at least one existing project in
this repo and match it.** The conventions below were extracted from those
projects — they are the record of what actually shipped, not preferences.

Current reference projects:

- `Hoodrat-source-netlify/` — 3D token site. React Three Fiber scene, camera
  tour driven by scroll/swipe/keys, Netlify deploy. The most complete reference.

---

## Stack

Do not substitute without asking. These versions work together.

| | |
|---|---|
| Build | Vite 8, `@vitejs/plugin-react` |
| UI | React 19, plain JSX (no TypeScript) |
| 3D | three, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `maath` |
| Styling | one hand-written `src/index.css`. No Tailwind, no CSS-in-JS |
| Lint | **oxlint**, not ESLint. Config in `.oxlintrc.json` |
| Host | Netlify. `netlify.toml` at project root |
| Node | 22 |

Scripts are always `dev` / `build` / `lint` / `preview`. `build` is
`vite build` plus any post-build step.

## Layout

```
project-name/
  index.html            fonts + meta live here, not in JS
  netlify.toml
  .oxlintrc.json
  vite.config.js
  public/               static assets, served from /
    brand/  media/  models/
  scripts/              build-time node scripts, .mjs
  src/
    main.jsx
    App.jsx             all DOM/HUD/overlay UI
    index.css
    copy.js             every user-facing string
    device.js           device heuristics
    scene/              one file per 3D element
```

## Conventions that matter

**Copy lives in `copy.js`, never inline in components.** The file opens with a
comment stating the voice and what the writing is not allowed to say. Write that
brief before writing any copy.

**Device checks live in `device.js` and are evaluated once at module load.**
`IS_TOUCH` is `pointer: coarse` or `maxTouchPoints > 0` — never a width check
alone. `IS_MOBILE` is touch *and* smallest viewport dimension under 820. Import
these; don't re-derive them in components.

**CSS uses `:root` custom properties for the whole palette and both fonts.**
Media queries key off `(pointer: coarse)` first and width second. `html, body,
#root` get `overflow: hidden` and `overscroll-behavior: none` — these are
full-viewport experiences, not scrolling pages.

**Assets are vendored, not hot-linked.** `scripts/procure.mjs` downloads CC0
models from Poly Haven into `public/` once, skipping anything already on disk.
Runtime never depends on a third-party CDN. Fonts are the one exception (Google
Fonts, with `preconnect`).

**Post-build prune.** `scripts/prune-dist.mjs` deletes downloaded assets that
didn't make the final scene, from `dist/` only. `public/` keeps everything so
the set can change without re-downloading. Update the keep-list when the scene
changes.

## 3D performance rules

These were tuned against real devices. Changing them regresses phones.

- `antialias: false` on the canvas whenever `EffectComposer` is used — the
  scene renders offscreen, so MSAA on the default framebuffer is wasted. AA
  comes from composer `multisampling` (8 desktop, 0 mobile).
- DPR starts at 1.5 on mobile, 2 on desktop, then `PerformanceMonitor` walks it
  up or down in 0.25 steps until the frame rate holds.
- Full-screen grading passes (`ChromaticAberration`, `Noise`) are desktop-only.
  They're invisible at phone size and not free. A CSS grain overlay covers it.
- Use `fog` and a short camera `far` plane to bound what gets drawn.

## The "ready" signal

Loader progress lies — it hits a false 100% between asset batches. The
trustworthy signal is a component inside the `Suspense` boundary that fires on
its first `useFrame`: that means every sibling resolved *and* the GPU drew a
frame.

That signal never fires in a backgrounded tab, because rAF is throttled. So
also keep a fallback: if the loaders sit settled at 100% for ~800ms, treat it
as ready.

## Audio and video

One `<video>` element is the single source of both picture and sound — its
audio track is the song. Share the handle through a tiny module
(`screenMedia.js`) rather than duplicating elements, so picture and sound can
never drift.

It starts muted so autoplay policies let it warm up behind the loading gate.
The user's click on *enter* is the gesture that unlocks audio: rewind to 0 and
unmute on that click, so the show always starts from the top. Any WebAudio
graph is built lazily on that same gesture, never at load.

Later mute toggles mute *audio only* — the video keeps playing so the scene
stays live.

## Camera and navigation

Camera poses are a named map of `[position, lookAt]` pairs — beats are
referenced by name everywhere, never by raw coordinates. Poses are framed for a
wide desktop viewport, so widen the FOV as the viewport narrows or portrait
phones crop the subject out. Damp the change so rotating the device eases
instead of snapping.

Advance the intro sweep on *rendered frames*, not wall-clock time, so a
shader-compile stall can't eat part of it.

Navigation is scroll on desktop, swipe on touch, and always arrow keys plus
number keys. Wheel/swipe go through an accumulator with a cooldown so momentum
can't skip beats.

## Non-negotiables

- Never commit `node_modules`, `dist`, `.env`, or key files. `.gitignore`
  covers these; keep it.
- Every interactive element gets `touch-action: manipulation` and a
  transparent tap highlight.
- If a custom cursor is used, skip its listeners entirely on touch devices.
- Dev-only console hooks must be stripped from production builds.
- Run `npm run lint` before calling anything done.
