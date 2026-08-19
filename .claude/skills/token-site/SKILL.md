---
name: token-site
description: Scaffold and build immersive single-page 3D promo sites — token/memecoin landing pages, brand experiences, product showcases — using Vite, React 19, and React Three Fiber, deployed to Netlify. Use this skill whenever the user asks for a new site in this repo, mentions a 3D scene, a scroll or camera tour, a landing page for a token or brand, or asks to add a new project alongside the existing ones. Also use it when reviewing or extending an existing project here, since it carries the load-gate, audio-unlock, and mobile-performance patterns that these sites depend on.
---

# Token site

Builds the kind of site this repo is full of: one page, one 3D scene, a camera
tour through named beats, audio that unlocks on entry, tuned to hold frame rate
on a phone.

Read the root `CLAUDE.md` first — it has the stack, the layout, and the
performance rules. This skill covers the build order and the parts that are
easy to get subtly wrong.

## Build order

Working in this sequence avoids the rewrites. Each step is verifiable before
the next one depends on it.

1. **Brief.** No code until `BRIEF.md` exists and the user has approved it. Run
   `/goal` if there isn't one.
2. **Scaffold.** Vite + React, the exact dependency set from `CLAUDE.md`,
   `netlify.toml`, `.oxlintrc.json`, `.gitignore`, fonts in `index.html`.
   Confirm `npm run dev` and `npm run build` both work while there's nothing to
   debug.
3. **Copy and tokens.** `src/copy.js` with the voice brief as its header
   comment, and `:root` custom properties in `index.css`. Do this before
   building UI, so nothing gets hardcoded.
4. **Assets.** `scripts/procure.mjs` to pull what's needed into `public/`.
   Over-fetch — pruning is cheap, re-sourcing mid-build isn't.
5. **Scene, grey-box first.** Camera poses and the room in primitives, no
   materials. Fly the tour and confirm the framing works before anything gets
   expensive.
6. **Materials, lighting, post.** Now it can look like something.
7. **DOM layer.** Gate, HUD, nav dock, cursor.
8. **Input.** Wheel, swipe, keys.
9. **Audio.**
10. **Prune, lint, build.** Then `/loop`.

## The parts that bite

### Loading gate

Three states: loading → ready → entered. The user clicks *enter* on a gate that
covers everything. That click is load-bearing — it's the browser gesture that
unlocks audio. There is no auto-enter.

"Ready" comes from a component inside `<Suspense>` firing on its first
`useFrame`, plus an ~800ms settled-loader fallback for backgrounded tabs where
rAF never runs. Both, always. Progress numbers alone are not ready.

### Audio unlock

The scene's `<video>` element is the only source of both picture and sound.
Share its handle through a one-line module. On the enter click: seek to 0,
unmute, play — wrapped in try/catch, because it may not be seekable yet and
that's survivable.

Build any WebAudio graph lazily inside that same click handler. An
`AudioContext` created at module load starts suspended and stays that way.

### Camera

Poses are a named export map — `{ start: [pos, lookAt], overview: [...] }` —
and every other file references beats by name. Damp toward the target rather
than setting it, so parallax and viewport changes ease.

Widen FOV as aspect ratio narrows. Poses framed for desktop crop their subject
out of frame on a portrait phone otherwise.

Drive the intro sweep off rendered frames so a shader-compile stall shortens
nothing.

### Input

Wheel and swipe both feed one accumulator with a threshold and a cooldown, so
trackpad momentum advances one beat rather than four. Keyboard is not optional:
arrows to step, digits to jump, escape to return.

### Mobile

Assume it's the primary target and desktop is the easy case.

- Branch on `IS_MOBILE` from `device.js`. One source of truth.
- Cap DPR lower and let `PerformanceMonitor` adjust from there.
- Composer multisampling to 0; drop the grading passes.
- Every hover affordance needs a tap equivalent.
- Test landscape. Short viewports break HUD layouts that portrait hides.

## Content boundaries

These sites sell a feeling, not an investment. Keep copy to voice, story, and
community. No price talk, no return or gain language, no "utility" or roadmap
claims that imply financial upside, no urgency-to-buy framing.

If the brief asks for something that reads as a financial promise, flag it and
offer the vibe-led version instead. Contract addresses and official social
links are fine — reproduce them character-exact, and never invent one. If a
value isn't supplied, leave a clearly marked placeholder rather than a guess.