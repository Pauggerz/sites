import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { damp3 } from 'maath/easing'

// Named cinematic poses: [position, lookAt]. The +z side of the barn is open
// to the camera (stagecraft) — poses at z > 5 shoot into the interior.
export const POSES = {
  start: { pos: [0, 1.7, 9.0], look: [0, 1.6, 0] },
  // intro sweep — a slow arc across the barn before settling on overview
  introA: { pos: [4.6, 2.4, 6.4], look: [-2.5, 1.5, -3] },
  introB: { pos: [-4.4, 2.8, 5.6], look: [2, 1.6, -3.5] },
  overview: { pos: [0, 2.4, 6.6], look: [-0.4, 1.5, -1.5] },
  // 01 — the statue head to foot: 4.25 tall at (-1.9, 0, -1.1), so the camera
  // backs off to ~5.2m and sits LOW, looking up past his knee. The sight line
  // to the horns stays under every tie beam on the way in.
  bull: { pos: [0.695, 0.936, 3.31], look: [-1.9, 2.2, -1.1] },
  // 02 — the payoff: tight on the raised hand and what it holds, ~1.45m out,
  // front and just above it, angled to keep the bulb out of frame. Parallax is
  // damped hard here; at this distance the full swing would throw the subject
  // out of frame.
  drop: {
    pos: [-0.378, 3.155, 0.439],
    look: [-0.883, 2.866, -0.889],
    parallax: 0.22,
  },
  // 03 — genuinely past the barn door now, not just inside looking through
  // it: with the eyeline raised to near-level to show the horizon, staying
  // inside put the door header (y 4.15, only ~1.5m away) right in the top of
  // frame, cropping the sky. Stepping just past z -5 clears it entirely —
  // the header is behind the camera instead of between it and the field.
  field: { pos: [1.5, 2.9, -5.6], look: [1.5, 1.4, -75] },
  // 04 — the muck board: screens, pinned notes, the herd
  board: { pos: [3.2, 1.8, 0.4], look: [6.0, 2.0, 0.4] },
  // 05 — the drive-in: across the barn at the picture on the -x wall, the
  // beam crossing overhead from the loft, the CA post in the right foreground
  gate: { pos: [4.7, 1.6, 3.8], look: [-5.9, 2.45, 0.9] },
}

const INTRO = [
  ['introA', 2.2],
  ['introB', 4.4],
]

export default function CameraRig({ target, entered }) {
  const camera = useThree((s) => s.camera)
  const lookAt = useRef(new THREE.Vector3(0, 1.6, 0))
  const posGoal = useRef(new THREE.Vector3())
  const lookGoal = useRef(new THREE.Vector3())
  const introT = useRef(0)

  useFrame((state, delta) => {
    // the poses are framed for a wide desktop view — portrait phones crop the
    // sides hard, so open the FOV as the viewport narrows to keep each beat's
    // subject in frame (damped so device rotation eases instead of snapping)
    const aspect = state.size.width / state.size.height
    const targetFov = aspect < 0.75 ? 68 : aspect < 1 ? 61 : 55
    camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 4, delta)
    camera.updateProjectionMatrix()

    // the intro sweep advances on RENDERED frames, so shader-compile stalls
    // can't eat it — the user always sees the full arc
    let key = entered ? target : 'start'
    if (entered && introT.current < INTRO[INTRO.length - 1][1]) {
      introT.current += Math.min(delta, 0.05)
      key = INTRO.find(([, end]) => introT.current < end)?.[0] ?? target
    }
    const pose = POSES[key] || POSES.overview

    // mouse parallax drifts the goal, so the barn feels alive even at rest.
    // Tight poses scale it down — the closer the subject, the more a fixed
    // drift swings it across the frame.
    const k = pose.parallax ?? 1
    const px = state.pointer.x * k
    const py = state.pointer.y * k
    posGoal.current.set(
      pose.pos[0] + px * 0.55,
      pose.pos[1] + py * 0.3,
      pose.pos[2]
    )
    lookGoal.current.set(
      pose.look[0] + px * 0.9,
      pose.look[1] + py * 0.55,
      pose.look[2]
    )

    // slow breathing drift
    const t = state.clock.elapsedTime
    posGoal.current.y += Math.sin(t * 0.4) * 0.045

    const inIntro = entered && introT.current < INTRO[INTRO.length - 1][1]
    damp3(camera.position, posGoal.current, inIntro ? 1.9 : entered ? 1.1 : 3, delta)
    damp3(lookAt.current, lookGoal.current, inIntro ? 1.6 : entered ? 0.9 : 3, delta)
    camera.lookAt(lookAt.current)
  })

  return null
}
