import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { damp3 } from 'maath/easing'

// Named cinematic poses: [position, lookAt]
export const POSES = {
  start: { pos: [0, 1.7, 9.2], look: [0, 1.7, 0] },
  // intro sweep — a slow arc through the burrow before settling on overview
  introA: { pos: [4.8, 2.1, 6.6], look: [-3, 1.5, -5] },
  introB: { pos: [-4.6, 2.9, 5.2], look: [3, 1.6, -6] },
  overview: { pos: [0, 2.5, 7.2], look: [0, 1.4, -3] },
  rat: { pos: [3.1, 1.4, 1.5], look: [6.6, 1.9, 1.5] },
  wall: { pos: [0, 2.1, -4.2], look: [0, 2.5, -10] },
  lounge: { pos: [4.1, 2.6, 3.8], look: [-0.8, 1.2, -1] },
  desk: { pos: [-2.4, 1.9, -4.4], look: [-7.6, 2.3, -6.3] },
  door: { pos: [0, 1.7, 5.4], look: [0, 1.9, 10] },
}

const INTRO = [
  ['introA', 2.2],
  ['introB', 4.4],
]

export default function CameraRig({ target, entered }) {
  const camera = useThree((s) => s.camera)
  const lookAt = useRef(new THREE.Vector3(0, 1.7, 0))
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

    // mouse parallax drifts the goal, so the room feels alive even at rest
    const px = state.pointer.x
    const py = state.pointer.y
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
