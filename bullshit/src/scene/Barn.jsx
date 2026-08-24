import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import BullStatue, { DROP_WORLD } from './BullStatue.jsx'
import ScreenBoard from './ScreenBoard.jsx'
import GateShow from './GateShow.jsx'
import { IS_MOBILE } from '../device.js'
import {
  MOON,
  tickTime,
  woodMaterial,
  dirtMaterial,
  metalMaterial,
  hayMaterial,
  muckMaterial,
  fieldGroundMaterial,
  shrubMaterial,
  grassBladeMaterial,
  makeBladeGeometry,
  skyMaterial,
  FOG_COLOR,
  FOG_FAR,
  lightShaftMaterial,
  mistMaterial,
  dustMaterial,
  makeDustGeometry,
  makePosterHerdTexture,
  makePosterFeedTexture,
  makeNoteTexture,
  makeSackTexture,
  makeTreeTexture,
  makeFloorMarksTexture,
} from '../materials.js'

// Timber barn. x -6..6, z -5..5, eaves 4.5, ridge 6.3 along z; the +z side
// is open to the camera. Sliding door bay in the -z wall (x -0.5..3.5),
// pasture beyond. Hayloft across the back third with a cutout over the door
// bay so the field beat flies through clean.
//
// Blue hour, not midnight. One bare bulb is still the warm hero, joined by
// practicals (lantern, work light, tack-room spill); cool dusk presses in
// through wall gaps, the loft opening, and the open door — warm against cold
// is what makes it read as evening in a barn instead of a dark room. Every
// surface comes from materials.js; the dressing is placed like a working
// barn, some of it in shadow on purpose.

const GOLD = '#b9d94e'
const COOL = '#7fb5aa'
const ROOF_PITCH = Math.atan2(1.8, 6)

// spotlight whose target actually lives in the scene graph — a bare
// `target-position` never gets its matrixWorld updated and quietly aims at
// the origin instead
function Spot({ lightRef, position, targetPos, ...props }) {
  const target = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(...targetPos)
    return o
  }, [targetPos])
  return (
    <>
      <primitive object={target} />
      <spotLight ref={lightRef} position={position} target={target} {...props} />
    </>
  )
}

/* ================= structure ================= */

function Shell() {
  const dirt = useMemo(() => dirtMaterial({ scale: 6 }), [])
  // board-and-batten, vertical boards. The -x wall is the projection surface
  // now, so its grain runs continuous — no open seams to read as a break in
  // the picture (the moonlight shafts stay; they read as light from the eaves)
  const wallLeft = useMemo(() => woodMaterial({ boards: 32, len: 3, seed: 2 }), [])
  const wallPlain = useMemo(() => woodMaterial({ boards: 32, len: 3, seed: 3 }), [])
  const backL = useMemo(() => woodMaterial({ boards: 17, len: 3, gaps: 0.6, seed: 4 }), [])
  const backR = useMemo(() => woodMaterial({ boards: 8, len: 3, seed: 5 }), [])
  const header = useMemo(() => woodMaterial({ boards: 12, len: 0.6, seed: 6 }), [])
  const beam = useMemo(
    () => woodMaterial({ boards: 2, len: 8, tone: [0.3, 0.21, 0.12], batten: 0, seed: 7 }),
    []
  )
  const frame = useMemo(
    () => woodMaterial({ boards: 2, len: 6, tone: [0.34, 0.24, 0.13], batten: 0, seed: 8 }),
    []
  )
  const gable = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-6, 4.5)
    s.lineTo(6, 4.5)
    s.lineTo(0, 6.3)
    s.closePath()
    return new THREE.ShapeGeometry(s)
  }, [])
  return (
    <group>
      {/* packed dirt floor */}
      <mesh position={[0, -0.05, 0]} material={dirt}>
        <boxGeometry args={[12, 0.1, 10]} />
      </mesh>

      {/* side walls */}
      <mesh position={[-6, 2.25, 0]} material={wallLeft}>
        <boxGeometry args={[0.1, 4.5, 10]} />
      </mesh>
      <mesh position={[6, 2.25, 0]} material={wallPlain}>
        <boxGeometry args={[0.1, 4.5, 10]} />
      </mesh>

      {/* back wall around the door bay (x -0.5..3.5, 3.8 high) */}
      <mesh position={[-3.25, 2.25, -5]} material={backL}>
        <boxGeometry args={[5.5, 4.5, 0.1]} />
      </mesh>
      <mesh position={[4.75, 2.25, -5]} material={backR}>
        <boxGeometry args={[2.5, 4.5, 0.1]} />
      </mesh>
      <mesh position={[1.5, 4.15, -5]} material={header}>
        <boxGeometry args={[4.0, 0.7, 0.1]} />
      </mesh>
      {/* back gable infill — without it the sky shows through the roof peak */}
      <mesh geometry={gable} position={[0, 0, -4.97]} material={backR} />
      <mesh geometry={gable} position={[0, 0, -4.98]} rotation={[0, Math.PI, 0]} material={backR} />

      {/* door frame */}
      <mesh position={[-0.56, 1.9, -5]} material={frame}>
        <boxGeometry args={[0.16, 3.8, 0.26]} />
      </mesh>
      <mesh position={[3.56, 1.9, -5]} material={frame}>
        <boxGeometry args={[0.16, 3.8, 0.26]} />
      </mesh>

      {/* girt line at stall height */}
      <mesh position={[-5.88, 1.15, 0]} material={beam}>
        <boxGeometry args={[0.06, 0.14, 9.9]} />
      </mesh>
      <mesh position={[5.88, 1.15, 0]} material={beam}>
        <boxGeometry args={[0.06, 0.14, 9.9]} />
      </mesh>
      <mesh position={[-3.25, 1.15, -4.9]} material={beam}>
        <boxGeometry args={[5.4, 0.14, 0.06]} />
      </mesh>
      <mesh position={[4.75, 1.15, -4.9]} material={beam}>
        <boxGeometry args={[2.4, 0.14, 0.06]} />
      </mesh>

      {/* heavy corner posts */}
      {[
        [-5.75, -4.78],
        [5.75, -4.78],
        [-5.75, 4.78],
        [5.75, 4.78],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 2.25, z]} material={beam}>
          <boxGeometry args={[0.28, 4.5, 0.28]} />
        </mesh>
      ))}
    </group>
  )
}

function Roof() {
  const skin = useMemo(
    () => woodMaterial({ boards: 20, len: 3, tone: [0.22, 0.16, 0.1], batten: 0, across: true, seed: 9 }),
    []
  )
  const beam = useMemo(
    () => woodMaterial({ boards: 2, len: 8, tone: [0.3, 0.21, 0.12], batten: 0, seed: 10 }),
    []
  )
  const TRUSS_Z = [-4.5, -2.25, 0, 2.25, 4.5]
  return (
    <group>
      {/* roof skin above the frame */}
      <mesh position={[-3, 5.52, 0]} rotation={[0, 0, ROOF_PITCH]} material={skin}>
        <boxGeometry args={[6.3, 0.07, 10]} />
      </mesh>
      <mesh position={[3, 5.52, 0]} rotation={[0, 0, -ROOF_PITCH]} material={skin}>
        <boxGeometry args={[6.3, 0.07, 10]} />
      </mesh>

      {/* A-frame trusses: rafters, tie beam, king post, struts */}
      {TRUSS_Z.map((z) => (
        <group key={z}>
          <mesh position={[-3, 5.4, z]} rotation={[0, 0, ROOF_PITCH]} material={beam}>
            <boxGeometry args={[6.26, 0.16, 0.12]} />
          </mesh>
          <mesh position={[3, 5.4, z]} rotation={[0, 0, -ROOF_PITCH]} material={beam}>
            <boxGeometry args={[6.26, 0.16, 0.12]} />
          </mesh>
          <mesh position={[0, 4.42, z]} material={beam}>
            <boxGeometry args={[12, 0.16, 0.14]} />
          </mesh>
          <mesh position={[0, 5.35, z]} material={beam}>
            <boxGeometry args={[0.12, 1.75, 0.12]} />
          </mesh>
          <mesh position={[-0.85, 5.1, z]} rotation={[0, 0, -0.5]} material={beam}>
            <boxGeometry args={[1.9, 0.09, 0.09]} />
          </mesh>
          <mesh position={[0.85, 5.1, z]} rotation={[0, 0, 0.5]} material={beam}>
            <boxGeometry args={[1.9, 0.09, 0.09]} />
          </mesh>
        </group>
      ))}

      {/* purlins along the slopes */}
      {[
        [-4.5, 4.95],
        [-2.7, 5.49],
        [-0.9, 6.03],
        [4.5, 4.95],
        [2.7, 5.49],
        [0.9, 6.03],
      ].map(([x, y]) => (
        <mesh key={`${x}`} position={[x, y, 0]} material={beam}>
          <boxGeometry args={[0.1, 0.1, 10]} />
        </mesh>
      ))}

      {/* cross-bracing between trusses, overhead */}
      {[-3.375, -1.125, 1.125, 3.375].map((z, i) => (
        <mesh
          key={z}
          position={[0.4 * (i % 2 ? 1 : -1), 5.4, z]}
          rotation={[i % 2 ? 0.72 : -0.72, 0, 0]}
          material={beam}
        >
          <boxGeometry args={[0.07, 2.6, 0.07]} />
        </mesh>
      ))}
    </group>
  )
}

function Loft() {
  const planks = useMemo(
    () => woodMaterial({ boards: 10, len: 4, tone: [0.33, 0.24, 0.14], batten: 0, across: true, seed: 11 }),
    []
  )
  const beam = useMemo(
    () => woodMaterial({ boards: 2, len: 8, tone: [0.3, 0.21, 0.12], batten: 0, seed: 12 }),
    []
  )
  const hay = useMemo(() => hayMaterial(), [])
  return (
    <group>
      {/* Platform across the back third, cut out over the door bay. Its front
          edge sits at z -2.3: the statue's mid-height mass reaches z -2.04,
          and its old edge at -1.75 ran through his shoulder. */}
      <mesh position={[-3.3, 2.55, -3.65]} material={planks}>
        <boxGeometry args={[5.4, 0.12, 2.7]} />
      </mesh>
      <mesh position={[4.8, 2.55, -3.65]} material={planks}>
        <boxGeometry args={[2.4, 0.12, 2.7]} />
      </mesh>
      {/* edge trim + joists + support posts */}
      <mesh position={[-3.3, 2.52, -2.33]} material={beam}>
        <boxGeometry args={[5.4, 0.2, 0.1]} />
      </mesh>
      <mesh position={[4.8, 2.52, -2.33]} material={beam}>
        <boxGeometry args={[2.4, 0.2, 0.1]} />
      </mesh>
      {[-4.6, -2.6].map((z) => (
        <mesh key={z} position={[-3.3, 2.42, z]} material={beam}>
          <boxGeometry args={[5.4, 0.12, 0.12]} />
        </mesh>
      ))}
      {[
        [-5.4, -2.45],
        [-0.85, -2.45],
        [4.0, -2.45],
      ].map(([x, z]) => (
        <mesh key={`${x}`} position={[x, 1.25, z]} material={beam}>
          <boxGeometry args={[0.16, 2.5, 0.16]} />
        </mesh>
      ))}

      {/* ladder up to the loft, leaning on the edge — parked by the hay,
          clear of the statue, and set a few degrees off square */}
      <group position={[-4.55, 0, -1.72]} rotation={[-0.23, 0.14, 0.03]}>
        {[-0.225, 0.225].map((x) => (
          <mesh key={x} position={[x, 1.45, 0]} material={beam}>
            <boxGeometry args={[0.07, 2.95, 0.05]} />
          </mesh>
        ))}
        {[0.3, 0.75, 1.2, 1.65, 2.1, 2.55].map((y) => (
          <mesh key={y} position={[0, y, 0.03]} material={beam}>
            <boxGeometry args={[0.5, 0.05, 0.04]} />
          </mesh>
        ))}
      </group>

      {/* loose hay, some of it hanging over the edge */}
      <mesh position={[-1.3, 2.7, -2.65]} rotation={[0, 0.4, 0.05]} material={hay}>
        <boxGeometry args={[0.75, 0.16, 0.5]} />
      </mesh>
      <mesh position={[-2.6, 2.68, -2.55]} rotation={[0, -0.7, 0]} material={hay}>
        <boxGeometry args={[0.7, 0.14, 0.55]} />
      </mesh>
      <mesh position={[-1.05, 2.6, -2.27]} rotation={[0.55, 0.2, 0]} material={hay}>
        <boxGeometry args={[0.5, 0.1, 0.55]} />
      </mesh>
      {[-0.9, -1.4, -1.85, -2.45, -2.9].map((x, i) => (
        <mesh key={x} position={[x, 2.35 - (i % 2) * 0.08, -2.25]} rotation={[0.15, 0, 0.1]} material={hay}>
          <coneGeometry args={[0.015, 0.45, 4]} />
        </mesh>
      ))}
    </group>
  )
}

function Stalls() {
  const wood = useMemo(
    () => woodMaterial({ boards: 6, len: 2, tone: [0.32, 0.23, 0.13], batten: 0, seed: 13 }),
    []
  )
  const metal = useMemo(() => metalMaterial({ scale: 1.6, rustBias: 0.12 }), [])
  const gate = (hingeZ, ajar) => (
    <group key={hingeZ} position={[-4.3, 0, hingeZ]} rotation={[0, -Math.PI / 2 + ajar, 0]}>
      {[0.35, 0.62, 0.89].map((y) => (
        <mesh key={y} position={[0.62, y, 0]} material={metal}>
          <boxGeometry args={[1.24, 0.05, 0.04]} />
        </mesh>
      ))}
      {[0.08, 1.18].map((x) => (
        <mesh key={x} position={[x, 0.62, 0]} material={metal}>
          <boxGeometry args={[0.05, 0.62, 0.05]} />
        </mesh>
      ))}
      <mesh position={[0.62, 0.62, 0]} rotation={[0, 0, 0.42]} material={metal}>
        <boxGeometry args={[1.3, 0.045, 0.03]} />
      </mesh>
    </group>
  )
  return (
    <group>
      {[1.0, 2.5, 4.0].map((z) => (
        <group key={z}>
          <mesh position={[-5.15, 0.55, z]} material={wood}>
            <boxGeometry args={[1.7, 1.1, 0.07]} />
          </mesh>
          <mesh position={[-5.15, 1.15, z]} material={wood}>
            <boxGeometry args={[1.8, 0.09, 0.13]} />
          </mesh>
          <mesh position={[-4.3, 0.72, z]} material={wood}>
            <boxGeometry args={[0.13, 1.45, 0.13]} />
          </mesh>
        </group>
      ))}
      {/* gates hang ajar — nobody bothered closing them */}
      {gate(1.06, 0.24)}
      {gate(2.56, -0.35)}
    </group>
  )
}

function SlidingDoor() {
  const leaf = useMemo(
    () => woodMaterial({ boards: 12, len: 2.6, tone: [0.31, 0.22, 0.125], seed: 14 }),
    []
  )
  const brace = useMemo(
    () => woodMaterial({ boards: 2, len: 6, tone: [0.34, 0.24, 0.13], batten: 0, seed: 15 }),
    []
  )
  const metal = useMemo(() => metalMaterial({ scale: 3, rustBias: 0.2 }), [])
  return (
    <group>
      {/* the leaf, slid open and parked left of the bay */}
      <mesh position={[-2.55, 1.95, -4.75]} material={leaf}>
        <boxGeometry args={[3.9, 3.65, 0.09]} />
      </mesh>
      <mesh position={[-2.55, 1.95, -4.69]} rotation={[0, 0, 0.75]} material={brace}>
        <boxGeometry args={[4.6, 0.12, 0.03]} />
      </mesh>
      {/* the rail it hangs from, and its rollers */}
      <mesh position={[0, 4.02, -4.72]} material={metal}>
        <boxGeometry args={[8.4, 0.07, 0.05]} />
      </mesh>
      {[-3.9, -1.2].map((x) => (
        <group key={x} position={[x, 3.85, -4.72]}>
          <mesh material={metal}>
            <boxGeometry args={[0.08, 0.32, 0.04]} />
          </mesh>
          <mesh position={[0, 0.17, 0]} rotation={[0, 0, Math.PI / 2]} material={metal}>
            <cylinderGeometry args={[0.055, 0.055, 0.04, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ================= the bulb: hero light, dust in the beam ================= */

function Bulb({ focus }) {
  const glow = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#e4f0b4').multiplyScalar(1.6),
        toneMapped: false,
      }),
    []
  )
  const dust = useMemo(() => dustMaterial(), [])
  const dustGeo = useMemo(() => makeDustGeometry(IS_MOBILE ? 180 : 380), [])
  const dropSpot = useRef()
  const dropKick = useRef()
  useFrame((_, delta) => {
    // beat 02: the light on what he is holding SNAPS on (fast in, slow out)
    const on = focus === 'drop'
    if (dropSpot.current) {
      dropSpot.current.intensity = THREE.MathUtils.damp(
        dropSpot.current.intensity,
        on ? 22 : 0,
        on ? 10 : 4,
        delta
      )
    }
    if (dropKick.current) {
      dropKick.current.intensity = THREE.MathUtils.damp(
        dropKick.current.intensity,
        on ? 9 : 0,
        on ? 10 : 4,
        delta
      )
    }
  })
  return (
    <group>
      {/* hung off the tie beam at z 0, clear of the statue (his shoulder
          reaches z 0.17 at this height) and raking across his front */}
      <mesh position={[0.75, 3.95, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 1.1, 6]} />
        <meshStandardMaterial color="#0e0b08" roughness={0.9} />
      </mesh>
      <mesh position={[0.75, 3.34, 0]} material={glow}>
        <sphereGeometry args={[0.12, 16, 12]} />
      </mesh>

      <Spot
        position={[0.75, 3.3, 0]}
        targetPos={[-1.4, 0, -0.6]}
        angle={0.72}
        penumbra={0.9}
        intensity={28}
        color="#cfe38c"
        distance={15}
        decay={2}
      />
      <pointLight position={[0.75, 3.2, 0]} color={GOLD} intensity={3} distance={6} decay={2} />

      {/* keyed onto what he holds up, from above and in front */}
      <Spot
        lightRef={dropSpot}
        position={[DROP_WORLD[0] + 0.35, DROP_WORLD[1] + 1.5, DROP_WORLD[2] + 0.8]}
        targetPos={DROP_WORLD}
        angle={0.3}
        penumbra={0.55}
        intensity={0}
        color="#dff0b2"
        distance={8}
        decay={2}
      />
      {/* short-throw kicker so it separates from the dark hide behind it */}
      <pointLight
        ref={dropKick}
        position={[DROP_WORLD[0] + 0.5, DROP_WORLD[1] + 0.12, DROP_WORLD[2] + 0.55]}
        color="#d6ecab"
        intensity={0}
        distance={1.9}
        decay={2}
      />

      {/* dust falls inside the cone — motion lives in the shader */}
      <points position={[0.75, 3.25, 0]} geometry={dustGeo} material={dust} />
    </group>
  )
}

/* ================= beat 03: the pasture ================= */

// deterministic PRNG — same field every load
function makeRand(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// scatter helper: fills an InstancedMesh with blades via a per-index placer
function scatterBlades(mesh, count, place) {
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const p = new THREE.Vector3()
  const s = new THREE.Vector3()
  for (let i = 0; i < count; i++) {
    place(i, p, e, s)
    mesh.setMatrixAt(i, m.compose(p, q.setFromEuler(e), s))
  }
  mesh.instanceMatrix.needsUpdate = true
}

function GrassField() {
  const mat = useMemo(() => grassBladeMaterial(), [])
  const geo = useMemo(() => makeBladeGeometry(), [])
  // the carpet now runs the full depth of the vista — wide enough that the
  // side treelines are the only thing bounding it, deep enough to fade into
  // the horizon haze rather than end on a visible edge
  const count = IS_MOBILE ? 2200 : 9000
  const ref = useRef()
  useLayoutEffect(() => {
    const rand = makeRand(4242)
    scatterBlades(ref.current, count, (i, p, e, s) => {
      // denser near the door, thinning toward the horizon — starts a little
      // further out than the old doorway camera so the field pose (now
      // standing just past the door) doesn't sit inside the carpet
      p.set(-30 + rand() * 60, 0, -7.4 - Math.pow(rand(), 1.35) * 58)
      // every blade gets its own lean as well as its own yaw
      e.set((rand() - 0.5) * 0.45, rand() * Math.PI, (rand() - 0.5) * 0.45)
      const k = 0.7 + rand() * 0.6
      // the carpet stays waist-high so the pile tufts stand proud of it
      s.set(k, 0.4 + rand() * 0.85, k)
    })
  }, [count])
  return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} />
}

// the whole point of the beat: piles out in the field, each with a burst of
// taller, greener growth erupting around it
const FIELD_PILES = [
  [3.4, -8.2],
  [-2.6, -10.3],
  [8.5, -16.5],
  [-6.8, -19],
  [1.6, -23],
  [12.5, -13],
  // the growth keeps going past the near cluster — piles thinning toward
  // the horizon so the whole field reads as seeded, not just the doorway
  [-14.5, -27],
  [17.0, -31],
  [-4.0, -39],
]
const TUFTS_PER_PILE = IS_MOBILE ? 10 : 18

function FieldPiles() {
  const muck = useMemo(() => muckMaterial(), [])
  const tuftMat = useMemo(
    () => grassBladeMaterial({ root: [0.03, 0.07, 0.018], tip: [0.16, 0.31, 0.065], sway: 1.15 }),
    []
  )
  const geo = useMemo(() => makeBladeGeometry(), [])
  const count = FIELD_PILES.length * TUFTS_PER_PILE
  const ref = useRef()
  useLayoutEffect(() => {
    const rand = makeRand(777)
    scatterBlades(ref.current, count, (i, p, e, s) => {
      const [px, pz] = FIELD_PILES[Math.floor(i / TUFTS_PER_PILE)]
      const ang = rand() * Math.PI * 2
      const r = 0.4 + rand() * 0.75
      p.set(px + Math.cos(ang) * r, 0, pz + Math.sin(ang) * r)
      // tufts lean away from the pile they grew out of
      e.set(Math.sin(ang) * 0.3, rand() * Math.PI, -Math.cos(ang) * 0.3)
      s.set(0.9 + rand() * 0.5, 1.5 + rand() * 1.1, 0.9 + rand() * 0.5)
    })
  }, [count])
  return (
    <group>
      <instancedMesh ref={ref} args={[geo, tuftMat, count]} frustumCulled={false} />
      {FIELD_PILES.map(([x, z], i) => (
        <group key={`${x}${z}`} position={[x, 0, z]} rotation={[0, i * 1.7, 0]}>
          <mesh position={[0, 0.18, 0]} scale={[1, 0.42, 1]} material={muck}>
            <sphereGeometry args={[0.5, 9, 7]} />
          </mesh>
          <mesh position={[0.03, 0.42, 0]} scale={[1, 0.5, 1]} material={muck}>
            <sphereGeometry args={[0.34, 8, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// scrub bushes scattered through the growth — smaller and far more numerous
// than the piles, so the field reads as overrun rather than just seeded.
// GrassField's blades stand 0.38-1.19m tall (0.95 local height * 0.4-1.25
// scale) — the old h range here (0.45-1.1, top at 0.92h) topped out at
// ~1.0m and averaged well under grass height, so most shrubs sat *inside*
// the carpet instead of standing proud of it and read as having vanished.
// Sized so even the smallest instance clears the tallest blade.
const SHRUB_COUNT = IS_MOBILE ? 55 : 130

function Shrubs() {
  const mat = useMemo(() => shrubMaterial(), [])
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.5, 1), [])
  const ref = useRef()
  useLayoutEffect(() => {
    const rand = makeRand(3131)
    scatterBlades(ref.current, SHRUB_COUNT, (i, p, e, s) => {
      const x = -30 + rand() * 60
      const z = -9 - Math.pow(rand(), 1.2) * 60
      const h = 1.3 + rand() * 0.9
      p.set(x, h * 0.46, z)
      e.set((rand() - 0.5) * 0.4, rand() * Math.PI, (rand() - 0.5) * 0.4)
      s.set(1.0 + rand() * 0.7, h, 1.0 + rand() * 0.7)
    })
  }, [])
  return <instancedMesh ref={ref} args={[geo, mat, SHRUB_COUNT]} frustumCulled={false} />
}

// post-and-wire fence running away toward the treeline
const FENCE_A = [-6.8, -7.5]
const FENCE_B = [4.5, -52]

function FenceLine() {
  const post = useMemo(
    () => woodMaterial({ boards: 2, len: 4, tone: [0.24, 0.18, 0.11], batten: 0, seed: 21 }),
    []
  )
  const wire = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#3a3f46', roughness: 0.5, metalness: 0.6 }),
    []
  )
  const dx = FENCE_B[0] - FENCE_A[0]
  const dz = FENCE_B[1] - FENCE_A[1]
  const len = Math.hypot(dx, dz)
  const yaw = Math.atan2(dx, dz)
  const posts = 17
  return (
    <group>
      {Array.from({ length: posts }, (_, i) => {
        const t = i / (posts - 1)
        const h = 1.02 + ((i * 37) % 7) * 0.022
        return (
          <mesh
            key={i}
            position={[FENCE_A[0] + dx * t, h / 2, FENCE_A[1] + dz * t]}
            rotation={[((i * 13) % 5) * 0.012 - 0.024, 0, ((i * 29) % 5) * 0.014 - 0.028]}
            material={post}
          >
            <boxGeometry args={[0.11, h, 0.11]} />
          </mesh>
        )
      })}
      {[0.58, 0.9].map((y) => (
        <mesh
          key={y}
          position={[FENCE_A[0] + dx / 2, y, FENCE_A[1] + dz / 2]}
          rotation={[0, yaw, 0]}
          material={wire}
        >
          <boxGeometry args={[0.016, 0.016, len]} />
        </mesh>
      ))}
    </group>
  )
}

// flat tree silhouettes between the fence and the sky backdrop
// clustered left, thinning toward the moon's side so the path stays clear
const TREES_NEAR = [
  [-16, -27, 7, 1],
  [-9.5, -28, 8.5, 2],
  [-1, -29, 6.2, 3],
  [12, -27.5, 9, 4],
  [19, -26, 6.5, 5],
  [-22.5, -31, 7.5, 6],
  [-28, -35, 8.5, 7],
  [26, -33, 7, 8],
  [-5.5, -37, 9, 9],
]

// mid distance: scattered procedurally rather than hand-placed since it
// needs to read as a continuous treeline rather than a handful of props.
// Individual meshes are still worth it out to here — silhouettes are still
// distinguishable from each other at this range.
function scatterTrees(count, seed, { xRange, zRange, sizeRange }) {
  const rand = makeRand(seed)
  const trees = []
  for (let i = 0; i < count; i++) {
    const x = xRange[0] + rand() * (xRange[1] - xRange[0])
    const z = zRange[0] + rand() * (zRange[1] - zRange[0])
    const size = sizeRange[0] + rand() * (sizeRange[1] - sizeRange[0])
    trees.push([x, z, size, (i % 8) + 1])
  }
  return trees
}
const TREES_MID = scatterTrees(IS_MOBILE ? 16 : 34, 5151, {
  xRange: [-45, 45],
  zRange: [-42, -55],
  sizeRange: [3.6, 6.4],
})

function TreeLine({ trees }) {
  const mats = useMemo(
    () =>
      trees.map(
        ([, , , seed]) =>
          new THREE.MeshBasicMaterial({
            map: makeTreeTexture(seed),
            transparent: true,
            alphaTest: 0.35,
            fog: true,
          })
      ),
    [trees]
  )
  return (
    <group>
      {trees.map(([x, z, size], i) => (
        <mesh key={`${x}-${z}-${i}`} position={[x, size / 2 - 0.2, z]} material={mats[i]}>
          <planeGeometry args={[size, size]} />
        </mesh>
      ))}
    </group>
  )
}

/* the horizon itself: hundreds of tiny trees, instanced. A shared silhouette
   is indistinguishable from individual variety at this distance, and
   instancing is what makes "hundreds" affordable — one draw call per band
   however many trees are in it. Fog (fog:true, synced from scene.fog by
   three automatically) fades the furthest band to almost nothing, which is
   what actually sells "the treeline never ends" instead of showing an edge. */
function makeTreeBillboardGeometry() {
  const g = new THREE.PlaneGeometry(1, 1)
  g.translate(0, 0.5, 0) // local origin at the trunk base, not centre
  return g
}

function TreeCloud({ count, seed, textureSeed, xRange, zRange, sizeRange }) {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: makeTreeTexture(textureSeed),
        transparent: true,
        alphaTest: 0.3,
        depthWrite: false,
        fog: true,
      }),
    [textureSeed]
  )
  const geo = useMemo(() => makeTreeBillboardGeometry(), [])
  const ref = useRef()
  useLayoutEffect(() => {
    const rand = makeRand(seed)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      p.set(
        xRange[0] + rand() * (xRange[1] - xRange[0]),
        0,
        zRange[0] + rand() * (zRange[1] - zRange[0])
      )
      const size = sizeRange[0] + rand() * (sizeRange[1] - sizeRange[0])
      s.set(size, size, size)
      m.compose(p, q, s)
      ref.current.setMatrixAt(i, m)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [count, seed, xRange, zRange, sizeRange])
  return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} />
}

const TREES_FAR_COUNT = IS_MOBILE ? 45 : 110
const TREES_HORIZON_COUNT = IS_MOBILE ? 70 : 170

const MIST_LAYERS = IS_MOBILE
  ? [
      [1.5, -14, 20, 0],
      [2, -32, 36, 3],
    ]
  : [
      [0, -9.5, 16, 0],
      [4, -16, 24, 3],
      [-2, -24, 32, 6],
      [3, -38, 46, 9],
      [-4, -54, 60, 12],
    ]

function GroundMist() {
  const layers = MIST_LAYERS
  const mats = useMemo(
    () => layers.map(([, , , seed], i) => mistMaterial({ intensity: 0.18 + i * 0.04, seed })),
    [layers]
  )
  return (
    <group>
      {layers.map(([x, z, w], i) => (
        <mesh key={`${x}${z}`} position={[x, 0.65, z]} material={mats[i]}>
          <planeGeometry args={[w, 1.7]} />
        </mesh>
      ))}
    </group>
  )
}

function Pasture({ focus }) {
  // the ground now runs to a hazy horizon rather than ending at the near
  // treeline — scale climbs with it so the fbm blotches stay the same
  // physical size instead of stretching thin
  const ground = useMemo(() => fieldGroundMaterial({ scale: 42 }), [])
  const sky = useMemo(() => skyMaterial(), [])
  // the moon's path across the grass, laid flat and aimed at where the moon
  // sits on the backdrop
  const moonPath = useMemo(() => lightShaftMaterial({ color: '#a6c9bd', intensity: 0.22 }), [])
  const moon = useRef()
  useFrame((_, delta) => {
    // the green wash comes up when the field has focus; at blue hour a real
    // trickle stays on always so the doorway reads as dusk, not a black slab
    const out = focus === 'field'
    if (moon.current) {
      moon.current.intensity = THREE.MathUtils.damp(moon.current.intensity, out ? 3.2 : 1.0, 2.5, delta)
    }
    MOON.value = THREE.MathUtils.damp(MOON.value, out ? 1 : 0.45, 2.5, delta)
  })
  return (
    <group>
      <mesh position={[0, -0.06, -60]} material={ground}>
        <boxGeometry args={[170, 0.1, 130]} />
      </mesh>
      {/* sized for the frustum, not eyeballed: at ~130m out, the widest pose
          (68° vertical FOV on portrait phones) needs ~170m of vertical
          coverage to fill frame — this is more than double that, plus the
          bottom edge dips below y=0 so it's never a visible seam against the
          ground, only ever hidden behind it */}
      <mesh position={[1.5, 100, -132]} material={sky}>
        <planeGeometry args={[632, 220]} />
      </mesh>
      <GrassField />
      <FieldPiles />
      <Shrubs />
      <FenceLine />
      <TreeLine trees={TREES_NEAR} />
      <TreeLine trees={TREES_MID} />
      {/* far band: a proper forest edge, still individually resolvable */}
      <TreeCloud
        count={TREES_FAR_COUNT}
        seed={7171}
        textureSeed={2}
        xRange={[-70, 70]}
        zRange={[-58, -80]}
        sizeRange={[2.2, 4.2]}
      />
      {/* horizon band: dense and tiny, fading almost fully into the fog —
          this is what makes the field read as endless rather than walled in */}
      <TreeCloud
        count={TREES_HORIZON_COUNT}
        seed={8181}
        textureSeed={5}
        xRange={[-130, 130]}
        zRange={[-85, -125]}
        sizeRange={[1.1, 2.3]}
      />
      <GroundMist />
      {/* moonlight path: v=1 (brightest) at the horizon under the moon */}
      <mesh position={[6.0, 0.02, -17]} rotation={[-Math.PI / 2, 0, -0.38]} material={moonPath}>
        <planeGeometry args={[6, 48]} />
      </mesh>
      {/* decay 0: physical falloff from 12m up would eat the whole wash.
          distance widened so the cutoff sphere still reaches the new horizon */}
      <Spot
        lightRef={moon}
        position={[1.5, 12, -15]}
        targetPos={[1.5, 0, -15]}
        angle={1.05}
        penumbra={0.9}
        intensity={1.0}
        color="#b2d977"
        distance={55}
        decay={0}
      />
      {/* cool steady moon key so the field reads even off-focus — aimed and
          reaching further now that the field runs so much deeper */}
      <Spot
        position={[10, 10, -26]}
        targetPos={[0, 0, -34]}
        angle={1.15}
        penumbra={0.9}
        intensity={2.4}
        color="#9bc5b6"
        distance={80}
        decay={0}
      />
      {/* fireflies — warm, slow, thickest near the piles, spread with the
          wider, deeper field */}
      <Sparkles
        count={IS_MOBILE ? 55 : 120}
        size={3}
        speed={0.12}
        opacity={0.7}
        color="#d9ec7c"
        scale={[36, 2.4, 40]}
        position={[1.5, 1.1, -24]}
      />
      <Sparkles
        count={IS_MOBILE ? 12 : 24}
        size={3.6}
        speed={0.1}
        opacity={0.8}
        color="#deef95"
        scale={[3, 1.4, 3]}
        position={[4.6, 0.9, -9.5]}
      />
      <Sparkles
        count={IS_MOBILE ? 12 : 24}
        size={3.6}
        speed={0.1}
        opacity={0.8}
        color="#deef95"
        scale={[3, 1.4, 3]}
        position={[-3.8, 0.9, -12]}
      />
    </group>
  )
}

/* ================= beat 04: the muck board ================= */

const PAIL_TINTS = [
  [0.63, 0.45, 0.23],
  [0.94, 0.71, 0.16],
  [0.49, 0.69, 0.16],
  [0.95, 0.9, 0.81],
]

function Pail({ z, tint }) {
  const metal = useMemo(() => metalMaterial({ tint, scale: 1.2 }), [tint])
  return (
    <group position={[5.72, 1.12, z]}>
      <mesh material={metal}>
        <cylinderGeometry args={[0.13, 0.1, 0.26, 10]} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[0, Math.PI / 2, 0]} material={metal}>
        <torusGeometry args={[0.11, 0.012, 6, 12, Math.PI]} />
      </mesh>
    </group>
  )
}

function MuckBoard({ focus }) {
  const paper = useMemo(
    () => [0, 1, 2].map((i) => new THREE.MeshStandardMaterial({ map: makeNoteTexture(i), roughness: 1 })),
    []
  )
  const rail = useMemo(
    () => woodMaterial({ boards: 2, len: 6, tone: [0.3, 0.21, 0.12], batten: 0, seed: 16 }),
    []
  )
  const glow = useRef()
  useFrame((_, delta) => {
    if (glow.current) {
      glow.current.intensity = THREE.MathUtils.damp(
        glow.current.intensity,
        focus === 'board' ? 5 : 1.2,
        3,
        delta
      )
    }
  })
  return (
    <group>
      <ScreenBoard />
      <pointLight ref={glow} position={[5.2, 2.1, 0.4]} color={GOLD} intensity={1.2} distance={4.5} decay={2} />

      {/* pinned notes — the herd keeps its own records */}
      <mesh position={[5.93, 2.35, -1.15]} rotation={[0, -Math.PI / 2, 0.06]} material={paper[0]}>
        <planeGeometry args={[0.24, 0.3]} />
      </mesh>
      <mesh position={[5.93, 1.8, -0.95]} rotation={[0, -Math.PI / 2, -0.08]} material={paper[1]}>
        <planeGeometry args={[0.24, 0.3]} />
      </mesh>
      <mesh position={[5.93, 2.5, 2.05]} rotation={[0, -Math.PI / 2, 0.04]} material={paper[2]}>
        <planeGeometry args={[0.24, 0.3]} />
      </mesh>

      {/* pail rail — four pails, one per beat */}
      <mesh position={[5.75, 0.95, 0.35]} material={rail}>
        <boxGeometry args={[0.06, 0.06, 2.0]} />
      </mesh>
      {[-0.35, 0.1, 0.55, 1.0].map((z, i) => (
        <Pail key={z} z={z} tint={PAIL_TINTS[i]} />
      ))}
    </group>
  )
}

/* ================= dressing ================= */

function Posters() {
  const herd = useMemo(
    () => new THREE.MeshStandardMaterial({ map: makePosterHerdTexture(), roughness: 1 }),
    []
  )
  const feed = useMemo(
    () => new THREE.MeshStandardMaterial({ map: makePosterFeedTexture(), roughness: 1 }),
    []
  )
  return (
    <group>
      {/* herd poster under the loft — half-seen unless the board glow is up */}
      <mesh position={[4.7, 2.0, -4.89]} rotation={[0, 0, 0.03]} material={herd}>
        <planeGeometry args={[0.8, 1.07]} />
      </mesh>
      {/* feed poster sits past the picture's edge, near the front corner */}
      <mesh position={[-5.92, 2.4, 4.5]} rotation={[0, Math.PI / 2, -0.04]} material={feed}>
        <planeGeometry args={[0.8, 1.07]} />
      </mesh>
    </group>
  )
}

function Dressing() {
  const hay = useMemo(() => hayMaterial(), [])
  const metal = useMemo(() => metalMaterial({ scale: 2, rustBias: 0.15 }), [])
  const wood = useMemo(
    () => woodMaterial({ boards: 2, len: 5, tone: [0.34, 0.25, 0.14], batten: 0, seed: 18 }),
    []
  )
  const sack = useMemo(
    () => new THREE.MeshStandardMaterial({ map: makeSackTexture(), roughness: 1 }),
    []
  )
  const rope = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#7a6238', roughness: 1 }),
    []
  )
  const water = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0b1114', roughness: 0.08, metalness: 0.5 }),
    []
  )
  const feed = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#8a6f39', roughness: 1, flatShading: true }),
    []
  )
  const rubber = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1d2320', roughness: 0.75 }),
    []
  )
  const beamWood = useMemo(
    () => woodMaterial({ boards: 2, len: 4, tone: [0.28, 0.2, 0.11], batten: 0, seed: 23 }),
    []
  )
  return (
    <group>
      {/* Hay: an uneven stack in the back-left corner. The top course is
          offset and out of square, and one bale has been tipped on its end
          against the pile — nobody stacks hay in a grid. */}
      {[
        [-5.15, 0.225, -4.35, [0, 0.12, 0.02]],
        [-4.28, 0.225, -4.5, [0, -0.26, -0.03]],
        [-5.3, 0.225, -3.5, [0, 0.38, 0.01]],
        [-4.72, 0.675, -4.12, [0.03, 0.55, -0.04]],
        [-5.05, 0.66, -3.42, [-0.02, -0.18, 0.06]],
        [-4.5, 1.1, -3.85, [0.05, 0.9, 0.03]],
      ].map(([x, y, z, r]) => (
        <mesh key={`${x}${z}`} position={[x, y, z]} rotation={r} material={hay}>
          <boxGeometry args={[0.9, 0.45, 0.45]} />
        </mesh>
      ))}
      {/* one on its end, leaning on the stack */}
      <mesh position={[-3.85, 0.44, -3.62]} rotation={[0, 0.75, 1.42]} material={hay}>
        <boxGeometry args={[0.9, 0.45, 0.45]} />
      </mesh>

      {/* wheelbarrow, nosed into the front-right corner post and left there */}
      <group position={[5.0, 0, 4.1]} rotation={[0, 2.42, 0]}>
        <mesh position={[0, 0.38, 0]} material={metal}>
          <boxGeometry args={[0.72, 0.05, 0.46]} />
        </mesh>
        {[0.26, -0.26].map((z) => (
          <mesh key={z} position={[0, 0.5, z]} rotation={[z > 0 ? 0.35 : -0.35, 0, 0]} material={metal}>
            <boxGeometry args={[0.72, 0.3, 0.04]} />
          </mesh>
        ))}
        {[-0.4, 0.4].map((x) => (
          <mesh key={x} position={[x, 0.5, 0]} rotation={[0, 0, x > 0 ? 0.35 : -0.35]} material={metal}>
            <boxGeometry args={[0.04, 0.3, 0.46]} />
          </mesh>
        ))}
        <mesh position={[-0.55, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]} material={metal}>
          <cylinderGeometry args={[0.17, 0.17, 0.05, 12]} />
        </mesh>
        {[0.24, -0.24].map((z) => (
          <mesh key={z} position={[0.35, 0.33, z]} rotation={[0, 0, 0.12]} material={wood}>
            <boxGeometry args={[1.25, 0.04, 0.04]} />
          </mesh>
        ))}
        {[0.22, -0.22].map((z) => (
          <mesh key={z} position={[0.5, 0.15, z]} material={metal}>
            <boxGeometry args={[0.04, 0.3, 0.04]} />
          </mesh>
        ))}
      </group>

      {/* coiled rope on a hook, under the loft */}
      <group position={[5.9, 1.55, -2.7]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.22, -0.05]} material={metal}>
          <boxGeometry args={[0.04, 0.14, 0.08]} />
        </mesh>
        {[0.16, 0.15, 0.14].map((r, i) => (
          <mesh key={r} position={[0, 0, i * 0.035]} material={rope}>
            <torusGeometry args={[r, 0.028, 6, 16]} />
          </mesh>
        ))}
      </group>

      {/* pitchfork leaning under the tool wall, with the rest of the tools */}
      <group position={[5.5, 0, -3.95]} rotation={[0.07, 0.42, 0.21]}>
        <mesh position={[0, 0.85, 0]} material={wood}>
          <cylinderGeometry args={[0.02, 0.02, 1.65, 6]} />
        </mesh>
        <mesh position={[0, 1.64, 0]} material={metal}>
          <boxGeometry args={[0.2, 0.03, 0.03]} />
        </mesh>
        {[-0.07, 0, 0.07].map((x) => (
          <mesh key={x} position={[x, 1.78, 0]} material={metal}>
            <cylinderGeometry args={[0.008, 0.008, 0.32, 5]} />
          </mesh>
        ))}
      </group>

      {/* Feed sacks, slumped against the stall posts where the feed is
          actually used — one has gone over and spilled */}
      <mesh position={[-4.52, 0.34, 2.72]} rotation={[0, -0.34, 0.07]} material={sack}>
        <boxGeometry args={[0.55, 0.68, 0.28]} />
      </mesh>
      <mesh position={[-4.4, 0.32, 3.22]} rotation={[0, 0.52, -0.11]} material={sack}>
        <boxGeometry args={[0.55, 0.64, 0.28]} />
      </mesh>
      <mesh position={[-4.72, 0.15, 3.62]} rotation={[-1.42, 0.26, 0.1]} material={sack}>
        <boxGeometry args={[0.55, 0.66, 0.28]} />
      </mesh>
      {/* the spill out of the tipped one */}
      <mesh position={[-4.3, 0.03, 3.92]} rotation={[0, 0.4, 0]} scale={[1, 0.16, 0.72]} material={feed}>
        <sphereGeometry args={[0.34, 10, 7]} />
      </mesh>
      <mesh position={[-4.02, 0.02, 4.12]} rotation={[0, -0.6, 0]} scale={[1, 0.12, 0.65]} material={feed}>
        <sphereGeometry args={[0.19, 8, 6]} />
      </mesh>

      {/* two pails by the sacks, one knocked onto its side */}
      <group position={[-3.92, 0.13, 2.42]} rotation={[0, 0.3, 0]}>
        <mesh material={metal}>
          <cylinderGeometry args={[0.14, 0.11, 0.27, 10]} />
        </mesh>
        <mesh position={[0, 0.11, 0]} rotation={[0, 0.5, 0]} material={metal}>
          <torusGeometry args={[0.12, 0.012, 6, 12, Math.PI]} />
        </mesh>
      </group>
      <group position={[-3.68, 0.14, 3.12]} rotation={[1.5, 0.6, 0.2]}>
        <mesh material={metal}>
          <cylinderGeometry args={[0.14, 0.11, 0.27, 10]} />
        </mesh>
      </group>

      {/* water trough along the stalls, set a few degrees off the wall */}
      <group position={[-4.95, 0, 1.5]} rotation={[0, 0.08, 0]}>
        <mesh position={[0, 0.21, 0]} material={metal}>
          <boxGeometry args={[1.5, 0.42, 0.55]} />
        </mesh>
        <mesh position={[0, 0.425, 0]} rotation={[-Math.PI / 2, 0, 0]} material={water}>
          <planeGeometry args={[1.36, 0.42]} />
        </mesh>
      </group>

      {/* The tool wall: everything that hangs, hung in one place on the +x
          wall behind the board, with the long-handled tools leaning below. */}
      <group position={[5.92, 2.0, -3.15]} rotation={[0, -Math.PI / 2, 0.06]}>
        <mesh material={wood}>
          <cylinderGeometry args={[0.016, 0.016, 1.1, 6]} />
        </mesh>
        <mesh position={[0, -0.62, 0]} material={metal}>
          <boxGeometry args={[0.14, 0.24, 0.02]} />
        </mesh>
      </group>
      <group position={[5.92, 1.98, -3.72]} rotation={[0, -Math.PI / 2, -0.1]}>
        <mesh material={metal}>
          <boxGeometry args={[0.5, 0.13, 0.012]} />
        </mesh>
        <mesh position={[0.3, 0, 0]} material={wood}>
          <boxGeometry args={[0.12, 0.16, 0.03]} />
        </mesh>
      </group>
      {/* a hand saw, hung by its handle */}
      <group position={[5.92, 2.12, -4.2]} rotation={[0, -Math.PI / 2, 0.14]}>
        <mesh material={metal}>
          <boxGeometry args={[0.42, 0.1, 0.008]} />
        </mesh>
        <mesh position={[-0.26, 0.03, 0]} material={wood}>
          <boxGeometry args={[0.14, 0.14, 0.026]} />
        </mesh>
      </group>
      {/* shovel leaning beside the pitchfork */}
      <group position={[5.42, 0, -3.35]} rotation={[0.06, -0.38, -0.19]}>
        <mesh position={[0, 0.8, 0]} material={wood}>
          <cylinderGeometry args={[0.019, 0.019, 1.55, 6]} />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[0, 0, 0.05]} material={metal}>
          <boxGeometry args={[0.19, 0.26, 0.02]} />
        </mesh>
      </group>

      {/* FOREGROUND, near the open side: the wide beats shoot past these, so
          the barn has something in front of the subject instead of opening
          on bare floor. All of it sits off-square. */}
      <group position={[-2.85, 0, 4.3]} rotation={[0, 0.34, 0]}>
        <mesh position={[0, 0.3, 0]} material={wood}>
          <boxGeometry args={[0.78, 0.6, 0.62]} />
        </mesh>
        <mesh position={[0.06, 0.83, -0.09]} rotation={[0.02, -0.44, 0.03]} material={wood}>
          <boxGeometry args={[0.72, 0.46, 0.58]} />
        </mesh>
        {/* slats across the crate faces */}
        {[-0.18, 0.16].map((y) => (
          <mesh key={y} position={[0, 0.3 + y, 0.32]} material={beamWood}>
            <boxGeometry args={[0.8, 0.07, 0.02]} />
          </mesh>
        ))}
      </group>

      {/* barrel tipped back against the front-left post */}
      <group position={[-5.15, 0, 4.5]} rotation={[0.07, 0.22, 0.05]}>
        <mesh position={[0, 0.42, 0]} material={metal}>
          <cylinderGeometry args={[0.32, 0.3, 0.84, 14]} />
        </mesh>
        {[0.16, 0.66].map((y) => (
          <mesh key={y} position={[0, y, 0]} material={beamWood}>
            <torusGeometry args={[0.315, 0.018, 6, 16]} />
          </mesh>
        ))}
      </group>

      {/* hose, coiled on the floor where it was dropped */}
      <group position={[-1.15, 0, 4.25]} rotation={[0, 0.5, 0]}>
        {[
          [0.3, 0.035, 0, 0],
          [0.245, 0.05, 0.05, 0.04],
          [0.19, 0.062, -0.03, -0.05],
        ].map(([r, y, dx, dz]) => (
          <mesh key={r} position={[dx, y, dz]} rotation={[Math.PI / 2, 0, 0]} material={rubber}>
            <torusGeometry args={[r, 0.028, 6, 20]} />
          </mesh>
        ))}
        {/* the loose end trailing off toward the door */}
        <mesh position={[0.52, 0.028, 0.3]} rotation={[Math.PI / 2, 0, 0.7]} material={rubber}>
          <cylinderGeometry args={[0.028, 0.028, 0.75, 6]} />
        </mesh>
      </group>
    </group>
  )
}

/* ================= the floor itself ================= */

const STRAW_COUNT = IS_MOBILE ? 130 : 340

// Keep-out box around the statue so nothing crowds his silhouette, plus the
// walking path down the middle that makes the place read as worked-in.
function inStatueClearance(x, z) {
  return x > -4.6 && x < 0.85 && z > -3.2 && z < 1.0
}
function inWalkingPath(x, z) {
  return x > 1.55 && x < 3.45 && z > -4.6
}

function FloorDressing() {
  const hay = useMemo(() => hayMaterial(), [])
  const marks = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: makeFloorMarksTexture(),
        transparent: true,
        roughness: 1,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    []
  )
  const strawGeo = useMemo(() => new THREE.BoxGeometry(0.012, 0.005, 0.13), [])
  const ref = useRef()

  useLayoutEffect(() => {
    const rand = makeRand(9091)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    for (let i = 0; i < STRAW_COUNT; i++) {
      let x = 0
      let z = 0
      // straw drifts out from the hay and the feed sacks; the swept path and
      // the statue's clearance stay comparatively bare
      for (let t = 0; t < 10; t++) {
        if (i % 3 === 0) {
          x = -5.4 + rand() * 2.4
          z = -4.7 + rand() * 2.2
        } else if (i % 3 === 1) {
          x = -5.5 + rand() * 2.6
          z = 1.4 + rand() * 3.2
        } else {
          x = -5.6 + rand() * 11.2
          z = -4.7 + rand() * 9.5
        }
        if (!inStatueClearance(x, z) && !(inWalkingPath(x, z) && rand() > 0.25)) break
      }
      p.set(x, 0.006 + rand() * 0.004, z)
      e.set(0, rand() * Math.PI, (rand() - 0.5) * 0.12)
      const k = 0.6 + rand() * 1.5
      s.set(1, 1, k)
      ref.current.setMatrixAt(i, m.compose(p, q.setFromEuler(e), s))
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <group>
      {/* ruts, scuffs and drag marks, laid over the dirt */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} material={marks}>
        <planeGeometry args={[11.6, 9.6]} />
      </mesh>
      <instancedMesh ref={ref} args={[strawGeo, hay, STRAW_COUNT]} frustumCulled={false} />
    </group>
  )
}

/* ================= practicals: lantern, work light, tack room ================= */

const LANTERN_BRIGHT = new THREE.Color('#d9e98d').multiplyScalar(1.5)
const LANTERN_DIM = new THREE.Color('#495c28').multiplyScalar(0.5)

function Practicals({ focus }) {
  const metal = useMemo(() => metalMaterial({ scale: 1.4, rustBias: 0.18 }), [])
  const flame = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#d9e98d').multiplyScalar(1.5),
        toneMapped: false,
      }),
    []
  )
  // the lantern hangs right in front of the projection wall — it gets its own
  // flame material so it can be turned down without dimming the work light
  const lanternFlame = useMemo(
    () => new THREE.MeshBasicMaterial({ color: LANTERN_BRIGHT.clone(), toneMapped: false }),
    []
  )
  const lanternLight = useRef()
  useFrame((_, delta) => {
    // the projection is at full lamp on the gate beat: the lantern would wash
    // the picture off the wall, so it burns down to an ember and comes back
    const dim = focus === 'gate'
    if (lanternLight.current) {
      lanternLight.current.intensity = THREE.MathUtils.damp(
        lanternLight.current.intensity,
        dim ? 0.3 : 5,
        3,
        delta
      )
    }
    lanternFlame.color.lerp(dim ? LANTERN_DIM : LANTERN_BRIGHT, 1 - Math.exp(-3 * delta))
  })
  const tackGlow = useMemo(() => lightShaftMaterial({ color: '#c9dd80', intensity: 0.5 }), [])
  const dark = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#050403' }),
    []
  )
  return (
    <group>
      {/* hanging lantern over the stalls */}
      <group position={[-4.4, 0, 3.2]}>
        <mesh position={[0, 3.95, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 1.9, 5]} />
          <meshStandardMaterial color="#0e0b08" roughness={0.9} />
        </mesh>
        <mesh position={[0, 3.08, 0]} material={metal}>
          <cylinderGeometry args={[0.075, 0.09, 0.06, 8]} />
        </mesh>
        <mesh position={[0, 2.95, 0]} material={lanternFlame}>
          <sphereGeometry args={[0.06, 10, 8]} />
        </mesh>
        <mesh position={[0, 2.83, 0]} material={metal}>
          <cylinderGeometry args={[0.09, 0.06, 0.05, 8]} />
        </mesh>
        <pointLight ref={lanternLight} position={[0, 2.95, 0]} color="#c3dd74" intensity={5} distance={8} decay={2} />
      </group>

      {/* work light clamped to the loft edge, thrown across the hay */}
      <group position={[-2.2, 2.72, -1.82]}>
        <mesh material={metal}>
          <boxGeometry args={[0.06, 0.14, 0.06]} />
        </mesh>
        <mesh position={[-0.1, 0.1, -0.08]} rotation={[0.5, 0.6, 0]} material={metal}>
          <coneGeometry args={[0.11, 0.16, 10, 1, true]} />
        </mesh>
        <mesh position={[-0.14, 0.06, -0.12]} material={flame}>
          <sphereGeometry args={[0.035, 8, 6]} />
        </mesh>
        <Spot
          position={[-0.1, 0.12, -0.1]}
          targetPos={[-3.8, 2.55, -3.6]}
          angle={0.85}
          penumbra={0.6}
          intensity={6}
          color="#e3f1ca"
          distance={8}
          decay={2}
        />
      </group>

      {/* tack room behind the back-right wall — door ajar, lamp on inside */}
      <group position={[5.05, 0, 0]}>
        <mesh position={[0, 1.05, -4.94]} material={dark}>
          <planeGeometry args={[0.85, 2.1]} />
        </mesh>
        <mesh position={[0, 1.05, -4.93]} material={tackGlow}>
          <planeGeometry args={[0.7, 2.0]} />
        </mesh>
        {/* the door leaf, half open against the wall */}
        <mesh position={[-0.62, 1.08, -4.86]} rotation={[0, 0.5, 0]} material={dark}>
          <boxGeometry args={[0.5, 2.05, 0.05]} />
        </mesh>
        <pointLight position={[0, 1.2, -4.5]} color="#c9dd80" intensity={4} distance={6} decay={2} />
      </group>
    </group>
  )
}

/* ================= moonlight ================= */

function LightShafts({ focus }) {
  const cool = useMemo(() => lightShaftMaterial({ color: '#92bcb1', intensity: 0.5 }), [])
  const wide = useMemo(() => lightShaftMaterial({ color: '#92bcb1', intensity: 0.38 }), [])
  const spill = useMemo(() => lightShaftMaterial({ color: COOL, intensity: 0.3 }), [])
  useFrame((_, delta) => {
    // the thin shafts lie against the projection wall — they'd streak the
    // picture, so they fade while the gate beat has the lamp at full
    cool.uniforms.uIntensity.value = THREE.MathUtils.damp(
      cool.uniforms.uIntensity.value,
      focus === 'gate' ? 0.06 : 0.5,
      3,
      delta
    )
  })
  return (
    <group>
      {/* thin shafts through the -x wall's open seams */}
      <mesh position={[-5.35, 2.35, 3.15]} rotation={[0, 0.75, -0.3]} material={cool}>
        <planeGeometry args={[0.12, 3.6]} />
      </mesh>
      <mesh position={[-5.3, 2.1, -0.55]} rotation={[0, 0.65, -0.35]} material={cool}>
        <planeGeometry args={[0.09, 3.2]} />
      </mesh>
      <mesh position={[-5.4, 2.5, -3.6]} rotation={[0, 0.8, -0.28]} material={cool}>
        <planeGeometry args={[0.14, 3.8]} />
      </mesh>
      {/* wider fall through the loft opening */}
      <mesh position={[2.4, 3.4, -2.6]} rotation={[0, 0.15, -0.12]} material={wide}>
        <planeGeometry args={[0.55, 3.4]} />
      </mesh>
      {/* cool spill across the floor from the open door */}
      <mesh position={[1.5, 0.02, -2.9]} rotation={[-Math.PI / 2, 0, 0]} material={spill}>
        <planeGeometry args={[3.6, 4.5]} />
      </mesh>
    </group>
  )
}

function CoolLights() {
  return (
    <group>
      {/* night coming in through the open door — the cold half of the image */}
      <Spot
        position={[1.5, 3.4, -7.4]}
        targetPos={[1.2, 0.4, -1.6]}
        angle={0.6}
        penumbra={0.7}
        intensity={13}
        color={COOL}
        distance={18}
        decay={1.8}
      />
      {/* moonlight pressing through the gapped -x wall */}
      <Spot
        position={[-9.5, 5.5, 1]}
        targetPos={[-2.5, 0.2, 0.5]}
        angle={0.7}
        penumbra={0.85}
        intensity={6}
        color="#7fb5aa"
        distance={20}
        decay={1.6}
      />
      {/* cool wash where the wall-gap shafts land */}
      <pointLight position={[-5.2, 2.7, 0.8]} color="#89b8ad" intensity={2.2} distance={7} decay={2} />
    </group>
  )
}

/* ================= atmosphere ================= */

const FOG_IN = new THREE.Color('#0c1512')
// cooler and darker than the first pass — that version sat almost exactly on
// top of the shrub colour and the extended ground/grass now covers so much
// more of the frame that a bright olive haze read as a flat green wall
// instead of atmospheric distance. This leans toward the sky's own teal so
// the horizon band actually blends into it rather than fog fighting sky.
const FOG_OUT = new THREE.Color('#1a2620')

// blue hour, not midnight: roughly two stops up from the old grade. The
// pasture pushes further so stepping through the door reads as walking outside
const EXPOSURE_IN = 5.5
const EXPOSURE_OUT = 7.5

// how far the haze reaches once the field has focus — deep enough that the
// near and mid treelines stay clear while the horizon band (out past 100)
// fades almost entirely into it rather than showing a hard edge
const FIELD_FOG_FAR = 130

function Atmosphere({ focus }) {
  const scene = useThree((s) => s.scene)
  const gl = useThree((s) => s.gl)
  useFrame((_, delta) => {
    tickTime(delta) // one tick drives every animated material
    const out = focus === 'field'
    gl.toneMappingExposure = THREE.MathUtils.damp(
      gl.toneMappingExposure,
      out ? EXPOSURE_OUT : EXPOSURE_IN,
      2,
      delta
    )
    const fog = scene.fog
    if (!fog) return
    fog.color.lerp(out ? FOG_OUT : FOG_IN, 1 - Math.exp(-2.5 * delta))
    fog.far = THREE.MathUtils.damp(fog.far, out ? FIELD_FOG_FAR : 30, 2, delta)
    // grassBladeMaterial can't see scene.fog on its own (see materials.js) —
    // mirror the same values into its shared uniforms every frame
    FOG_COLOR.value.copy(fog.color)
    FOG_FAR.value = fog.far
  })
  return null
}

/* ================= assembled barn ================= */

export default function Barn({ focus, onCopyCa, onSelect }) {
  return (
    <group>
      <Shell />
      <Roof />
      <Loft />
      <Stalls />
      <SlidingDoor />
      <Bulb focus={focus} />
      <BullStatue onSelect={onSelect} />
      <Pasture focus={focus} />
      <MuckBoard focus={focus} />
      <GateShow focus={focus} onCopyCa={onCopyCa} />
      <Posters />
      <Dressing />
      <FloorDressing />
      <Practicals focus={focus} />
      <LightShafts focus={focus} />
      <CoolLights />
      <Atmosphere focus={focus} />

      {/* blue-hour fill: cool ambient plus sky/ground bounce so shadow
          detail stays readable — the bulb keeps the warm half of the image */}
      <ambientLight intensity={0.3} color="#8ab0a6" />
      <hemisphereLight color="#375650" groundColor="#2a2a1a" intensity={0.55} />
    </group>
  )
}
