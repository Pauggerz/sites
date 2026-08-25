// Every procedural surface in one place, so the look is tunable here rather
// than scattered through scene components. No image files: drawn content
// (posters, notes, labels, the tag, the board idle) is canvas textures in the
// CoinHologram/glyph-atlas manner; surfaces and motion (wood, dirt, rust,
// grass, shafts, dust) are GLSL in the ScreenWall manner.
//
// Lit surfaces are MeshStandardMaterial patched via onBeforeCompile, so the
// bulb, the cool spill, and the exposure rig all keep working. Unlit/animated
// things (grass, shafts, dust, the bull hide) are ShaderMaterials that
// include three's tonemapping/colorspace chunks so exposure applies to them
// too.
import * as THREE from 'three'
import { SCENE_TEXT } from './copy.js'

/* ---------------- shared animation uniforms ---------------- */
// one object, referenced by every animated shader — tick it once per frame
export const TIME = { value: 0 }
// 0..1, how "outside" the lighting is — Pasture damps this on the field beat
export const MOON = { value: 0.25 }

// grassBladeMaterial is a raw ShaderMaterial with its own hand-rolled fog
// chunks (below) rather than three's automatic per-material fog — so it does
// NOT pick up scene.fog changes on its own the way the lit/standard barn
// materials do. Atmosphere mirrors scene.fog into these every frame so the
// pasture's grass hazes out at the same distance as everything else instead
// of clipping hard at a fixed radius.
export const FOG_NEAR = { value: 8 }
export const FOG_FAR = { value: 30 }
export const FOG_COLOR = { value: new THREE.Color('#0c1512') }

export function tickTime(delta) {
  TIME.value += delta
}

/* ---------------- GLSL noise library (shared) ---------------- */
const NOISE_GLSL = /* glsl */ `
  float bsHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float bsNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(bsHash(i), bsHash(i + vec2(1.0, 0.0)), u.x),
      mix(bsHash(i + vec2(0.0, 1.0)), bsHash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float bsFbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * bsNoise(p);
      p *= 2.13;
      a *= 0.5;
    }
    return v;
  }
`

/* ---------------- standard-material patcher ---------------- */
function patchStandard(mat, { uniforms = {}, decls = '', color, rough = '', metal = '' }) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${NOISE_GLSL}\n${decls}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${color}`)
    if (rough) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>\n${rough}`
      )
    }
    if (metal) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>\n${metal}`
      )
    }
  }
  // vUv is only compiled in when a map exists — force it for procedural uvs
  mat.defines = { ...(mat.defines || {}), USE_UV: '' }
  return mat
}

/* ---------------- rough-sawn wood ----------------
   Boards run along uv.y (set across:true to run along uv.x instead). Grain
   follows the board length; each board gets its own tone; battens cover the
   seams; a few seams open into black gaps when gaps > 0. */
export function woodMaterial({
  boards = 12,
  len = 3,
  tone = [0.36, 0.26, 0.155],
  batten = 1,
  gaps = 0,
  seed = 1,
  roughness = 0.88,
  across = false,
} = {}) {
  const mat = new THREE.MeshStandardMaterial({ roughness, metalness: 0.02 })
  return patchStandard(mat, {
    uniforms: {
      uBoards: { value: boards },
      uLen: { value: len },
      uTone: { value: new THREE.Color(...tone) },
      uBatten: { value: batten },
      uGaps: { value: gaps },
      uSeed: { value: seed },
      uAcross: { value: across ? 1 : 0 },
    },
    decls: `
      uniform float uBoards; uniform float uLen; uniform vec3 uTone;
      uniform float uBatten; uniform float uGaps; uniform float uSeed;
      uniform float uAcross;
    `,
    color: /* glsl */ `
    {
      vec2 buv = uAcross > 0.5 ? vUv.yx : vUv;
      vec2 wuv = vec2(buv.x * uBoards, buv.y * uLen);
      float bIdx = floor(wuv.x);
      float bh = bsHash(vec2(bIdx, uSeed));
      vec3 wcol = uTone * (0.7 + bh * 0.6);
      float grain = bsFbm(vec2(wuv.x * 26.0, wuv.y * 1.4) + bh * 37.0);
      wcol *= 0.66 + grain * 0.6;
      float knot = bsNoise(vec2(bIdx * 3.7 + uSeed, wuv.y * 2.3 + bh * 11.0));
      wcol *= 1.0 - 0.4 * smoothstep(0.8, 0.96, knot);
      float fx = fract(wuv.x);
      float seam = smoothstep(0.0, 0.06, fx) * smoothstep(1.0, 0.94, fx);
      wcol *= 0.5 + 0.5 * seam;
      float gapSel = step(0.93, bsHash(vec2(bIdx, uSeed + 9.0))) * uGaps;
      float isBat = (1.0 - step(0.09, fx)) * uBatten * (1.0 - gapSel);
      wcol = mix(wcol, uTone * (0.95 + bh * 0.3), isBat);
      float openness = 1.0 - smoothstep(0.0, 0.045, min(fx, 1.0 - fx));
      wcol = mix(wcol, vec3(0.002, 0.002, 0.004), gapSel * openness);
      // The room is lit green-teal now, which drags bare timber to flat
      // olive. Bias the albedo warm so the barn keeps a readable wood note
      // against the grade instead of going monochrome with it.
      wcol *= vec3(1.16, 1.0, 0.84);
      diffuseColor.rgb = wcol;
    }`,
  })
}

/* ---------------- bulletin board: frame + backing ----------------
   Deliberately NOT built from woodMaterial. That shader always ends with
   `wcol *= vec3(1.16, 1.0, 0.84)` — a warm cast baked in for every call,
   layered on the same grain/knot/seam pattern every timber surface in the
   barn uses — so no matter what tone was fed in, the board kept reading as
   "more barn wood" instead of a distinct object. These have their own
   surface language entirely: flat painted trim (no grain) and a speckled
   cork-like backing (no planks), both a cool oxblood/charcoal rather than
   the barn's warm brown.
   First pass at these landed near-black (base ~0.02) — darker than the
   scene's own background/fog colour (#0c1512 ≈ 0.05-0.08) and an order of
   magnitude below every other wood tone in the barn (0.16-0.36). Against a
   dim scene, "very dark" doesn't read as a distinct material, it reads as
   the absence of one — indistinguishable from shadow. Brightened well above
   that floor so the hue actually has something to be seen against. */
export function boardFrameMaterial() {
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.08 })
  return patchStandard(mat, {
    color: /* glsl */ `
    {
      float w = bsFbm(vUv * 5.0) * 0.5 + bsNoise(vUv * 24.0) * 0.35;
      vec3 base = vec3(0.16, 0.05, 0.045);
      vec3 wornEdge = vec3(0.27, 0.085, 0.06);
      float edge = 1.0 - 2.0 * min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
      vec3 fcol = mix(base, wornEdge, clamp(max(edge, 0.0) * 1.7 + w * 0.35, 0.0, 1.0));
      diffuseColor.rgb = fcol;
    }`,
  })
}

export function corkboardMaterial() {
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.97, metalness: 0 })
  return patchStandard(mat, {
    color: /* glsl */ `
    {
      float speck = bsNoise(vUv * 95.0) * 0.5 + bsNoise(vUv * 42.0 + 8.0) * 0.5;
      float patch = bsFbm(vUv * 7.0 + 3.0);
      vec3 dark = vec3(0.16, 0.095, 0.048);
      vec3 fleck = vec3(0.27, 0.175, 0.09);
      vec3 ccol = mix(dark, fleck, smoothstep(0.55, 0.95, speck) * (0.55 + patch * 0.45));
      // Same problem woodMaterial's warm bias exists to fix: the barn's
      // teal-green ambient/hemisphere light (see Barn.jsx) washes any
      // low-saturation dark colour toward green, and this base was close
      // enough to neutral gray that it bled into the same green as the wall
      // behind it instead of reading as its own dark-oak board.
      ccol *= vec3(1.28, 1.0, 0.72);
      diffuseColor.rgb = ccol;
    }`,
  })
}

/* ---------------- packed dirt with scattered straw ---------------- */
export function dirtMaterial({ scale = 6 } = {}) {
  const mat = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 })
  return patchStandard(mat, {
    uniforms: { uScale: { value: scale } },
    decls: 'uniform float uScale;',
    color: /* glsl */ `
    {
      vec2 duv = vUv * uScale;
      float m = bsFbm(duv * 3.0);
      vec3 dcol = mix(vec3(0.085, 0.062, 0.04), vec3(0.15, 0.11, 0.07), m);
      dcol *= 0.72 + 0.55 * bsFbm(duv * 0.6 + 31.0);
      float sa = smoothstep(0.93, 0.99, bsNoise(vec2(duv.x * 1.6 + duv.y * 7.0, duv.y * 0.5) * vec2(9.0, 1.0)));
      sa = max(sa, smoothstep(0.94, 0.99, bsNoise(vec2(duv.x * -5.0 + duv.y * 2.2, duv.x * 0.6) * vec2(8.0, 1.0) + 17.0)));
      dcol = mix(dcol, vec3(0.5, 0.4, 0.2), sa * 0.75);
      diffuseColor.rgb = dcol;
    }`,
  })
}

/* ---------------- galvanized metal, rust at the joints ---------------- */
export function metalMaterial({ tint = [1, 1, 1], scale = 2, rustBias = 0 } = {}) {
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.75 })
  return patchStandard(mat, {
    uniforms: {
      uTint: { value: new THREE.Color(...tint) },
      uScale: { value: scale },
      uRustBias: { value: rustBias },
    },
    decls: 'uniform vec3 uTint; uniform float uScale; uniform float uRustBias;',
    color: /* glsl */ `
      vec2 muv = vUv * uScale;
      float mn = bsFbm(muv * 6.0);
      vec3 mcol = vec3(0.5, 0.53, 0.55) * (0.75 + mn * 0.4);
      float medge = 1.0 - 2.0 * min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
      float bsRust = smoothstep(0.5, 0.95, bsFbm(muv * 3.2 + 7.0) * 0.55 + max(medge, 0.0) * 0.6 + uRustBias);
      mcol = mix(mcol, vec3(0.29, 0.13, 0.05) * (0.6 + mn * 0.7), bsRust);
      diffuseColor.rgb = mcol * uTint;
    `,
    rough: 'roughnessFactor = mix(roughnessFactor, 0.95, bsRust);',
    metal: 'metalnessFactor = mix(metalnessFactor, 0.08, bsRust);',
  })
}

/* ---------------- hay / straw ---------------- */
export function hayMaterial() {
  const mat = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 })
  return patchStandard(mat, {
    color: /* glsl */ `
    {
      vec3 hcol = vec3(0.6, 0.46, 0.19);
      float st = bsNoise(vec2(vUv.x * 42.0, vUv.y * 3.0));
      hcol *= 0.65 + st * 0.65;
      float st2 = smoothstep(0.9, 0.99, bsNoise(vec2(vUv.y * 36.0 + 5.0, vUv.x * 2.0)));
      hcol = mix(hcol, vec3(0.78, 0.66, 0.32), st2);
      diffuseColor.rgb = hcol;
    }`,
  })
}

/* ---------------- the drop ---------------- */
export function muckMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    roughness: 0.38,
    metalness: 0,
    flatShading: true,
  })
  return patchStandard(mat, {
    color: /* glsl */ `
    {
      float mm = bsFbm(vUv * 9.0);
      diffuseColor.rgb = mix(vec3(0.075, 0.048, 0.02), vec3(0.15, 0.098, 0.045), mm);
    }`,
  })
}

/* ---------------- pasture ground ---------------- */
export function fieldGroundMaterial({ scale = 10 } = {}) {
  const mat = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 })
  return patchStandard(mat, {
    uniforms: { uScale: { value: scale } },
    decls: 'uniform float uScale;',
    color: /* glsl */ `
    {
      float gm = bsFbm(vUv * uScale);
      diffuseColor.rgb = mix(vec3(0.05, 0.085, 0.035), vec3(0.12, 0.17, 0.06), gm);
    }`,
  })
}

/* ---------------- scrub: rounded shrubs dotting the pasture ----------------
   Low-poly icosahedron canopies, mottled dark-to-light green by the same fbm
   noise as everything else. Standard-lit (not the grass shader), so the
   moon spot and the field's exposure ramp light them the same way the barn's
   own dressing gets lit — no separate uniform wiring needed.
   Kept noticeably darker than FOG_OUT/the pasture haze on purpose: the first
   pass here landed almost the same tone as the fog it blends toward, so at
   any real distance the shrubs blended straight into the haze instead of
   reading as clumps. */
export function shrubMaterial() {
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, flatShading: true })
  return patchStandard(mat, {
    color: /* glsl */ `
    {
      float sm = bsFbm(vUv * 6.0);
      vec3 scol = mix(vec3(0.012, 0.03, 0.012), vec3(0.065, 0.13, 0.038), sm);
      float sm2 = bsNoise(vUv * 14.0 + 5.0);
      scol *= 0.72 + sm2 * 0.55;
      diffuseColor.rgb = scol;
    }`,
  })
}

/* ---------------- picture thrown onto the barn wall ----------------
   Additive quad hovering a hair off the boards: a projector ADDS light, so
   dark image areas stay transparent and the wood grain and batten seams read
   through — the picture sits on the wall instead of floating in front of it.
   Soft edge falloff and a slow lamp flicker sell the throw. uGain is the
   projector's output level (damped by focus in the scene). */
export function projectionMaterial(map) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uMap: { value: map },
      uGain: { value: 0 },
      uTime: TIME,
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; uniform float uGain; uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec3 c = texture2D(uMap, vUv).rgb;
        float edge = smoothstep(0.0, 0.035, vUv.x) * smoothstep(1.0, 0.965, vUv.x)
                   * smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.95, vUv.y);
        float flick = 0.965 + 0.035 * sin(uTime * 11.0) * sin(uTime * 4.7);
        gl_FragColor = vec4(c * uGain * edge * flick, 1.0);
      }
    `,
  })
}

/* ---------------- grass blades that move in wind ----------------
   Used on an InstancedMesh of thin blade planes (uv.y = 0 root, 1 tip).
   Sway phase comes from the instance's world offset; MOON lifts the green
   when the field beat has focus. Wind is two layers: a small per-blade idle,
   and gust fronts — a noise field marching across the field so whole patches
   lay over together instead of the field ticking in unison. Pile tufts pass
   their own greener root/tip. */
export function grassBladeMaterial({
  root = [0.018, 0.03, 0.01],
  tip = [0.09, 0.155, 0.04],
  sway = 1,
} = {}) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    fog: true, // fade with the barn's fog like everything else
    uniforms: {
      uTime: TIME,
      uMoon: MOON,
      uRoot: { value: new THREE.Color(...root) },
      uTip: { value: new THREE.Color(...tip) },
      uSway: { value: sway },
      fogColor: FOG_COLOR,
      fogNear: FOG_NEAR,
      fogFar: FOG_FAR,
    },
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      uniform float uTime;
      uniform float uSway;
      varying float vH;
      varying float vVar;
      ${NOISE_GLSL}
      void main() {
        #ifdef USE_INSTANCING
          mat4 im = instanceMatrix;
        #else
          mat4 im = mat4(1.0);
        #endif
        vec2 wxz = vec2(im[3].x, im[3].z);
        float phase = wxz.x * 12.9 + wxz.y * 7.7;
        vec3 p = position;
        float bend = pow(uv.y, 1.7);
        // gust front: rolls roughly west-to-east across the field
        float gust = bsNoise(wxz * 0.11 + vec2(-uTime * 0.5, uTime * 0.17));
        gust = smoothstep(0.5, 0.92, gust);
        float idle = sin(uTime * 1.3 + phase) + 0.5 * sin(uTime * 2.17 + phase * 1.7);
        p.x += bend * uSway * (idle * 0.055 + gust * (0.3 + 0.08 * sin(uTime * 3.4 + phase)));
        p.z += bend * uSway * (cos(uTime * 0.9 + phase) * 0.04 - gust * 0.17);
        vH = uv.y;
        vVar = bsHash(wxz);
        vec4 mvPosition = viewMatrix * modelMatrix * im * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform float uMoon;
      uniform vec3 uRoot;
      uniform vec3 uTip;
      varying float vH;
      varying float vVar;
      void main() {
        vec3 col = mix(uRoot, uTip, vH * vH);
        col *= (0.75 + vVar * 0.5) * (0.3 + uMoon * 0.7);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }
    `,
  })
}

// blade geometry shared by every instance — segments so the bend curves
export function makeBladeGeometry() {
  const g = new THREE.PlaneGeometry(0.075, 0.95, 1, 4)
  g.translate(0, 0.475, 0)
  return g
}

/* ---------------- night sky behind the pasture ----------------
   A flat backdrop past the far fence line: gradient, a scatter of stars, one
   soft moon. Ignores fog on purpose — the sky reads through the door. */
export function skyMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uMoon: MOON },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uMoon;
      varying vec2 vUv;
      ${NOISE_GLSL}
      void main() {
        // blue hour pulled toward teal: a luminous gradient with the last
        // light dying green at the horizon — night-dark only at the zenith
        vec3 sky = mix(vec3(0.062, 0.135, 0.175), vec3(0.010, 0.026, 0.042), vUv.y);
        sky += vec3(0.038, 0.082, 0.095) * pow(1.0 - vUv.y, 3.0);
        sky += vec3(0.055, 0.105, 0.068) * pow(1.0 - vUv.y, 5.0);
        // stars, dimmer against the brighter sky
        vec2 g = vUv * vec2(120.0, 40.0);
        vec2 id = floor(g);
        float star = step(0.992, bsHash(id)) * smoothstep(0.14, 0.03, length(fract(g) - 0.5));
        sky += vec3(0.76, 0.94, 0.95) * star * smoothstep(0.24, 0.4, vUv.y) * (0.25 + 0.45 * bsHash(id + 7.0));
        // the moon (aspect-corrected for the 46x16 backdrop)
        float d = length((vUv - vec2(0.72, 0.74)) * vec2(2.875, 1.0));
        sky += vec3(0.80, 0.97, 0.93) * (smoothstep(0.05, 0.038, d) * 1.1 + exp(-d * 12.0) * 0.22);
        // treeline silhouette along the horizon
        float tl = 0.16 + 0.07 * bsFbm(vec2(vUv.x * 16.0, 3.7)) + 0.04 * bsNoise(vec2(vUv.x * 55.0, 9.1));
        float trees = smoothstep(tl, tl - 0.02, vUv.y);
        sky = mix(sky, vec3(0.010, 0.024, 0.024), trees * 0.94);
        gl_FragColor = vec4(sky * (0.55 + uMoon * 0.95), 1.0);
      }
    `,
  })
}

/* ---------------- fake volumetric light shafts ---------------- */
export function lightShaftMaterial({ color = '#92bcb1', intensity = 0.35 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: TIME,
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    // brightest where the light enters (uv.y = 1), soft edges, slow shimmer
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uIntensity; uniform float uTime;
      varying vec2 vUv;
      void main() {
        float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
        float len = smoothstep(0.0, 0.3, vUv.y) * (0.3 + 0.7 * vUv.y);
        float shimmer = 0.82 + 0.18 * sin(uTime * 0.5 + vUv.y * 5.0 + vUv.x * 9.0);
        float a = edge * len * shimmer * uIntensity;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
  })
}

/* ---------------- soft radial glow disc (billboarded) ----------------
   A camera-facing plane, additive, brighter core + soft falloff — no
   texture, just distance-from-center math. Used for the field piles' hover
   aura (Barn.jsx): color and intensity are mutated per-frame by the caller
   (own uniforms per instance, so each pile flares independently). */
export function glowAuraMaterial({ color = '#a8d84a', intensity = 1 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uIntensity;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float halo = smoothstep(1.0, 0.0, d);
        float core = smoothstep(0.4, 0.0, d);
        float a = (halo * 0.6 + core) * uIntensity;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
  })
}

/* ---------------- low ground mist over the pasture ----------------
   Vertical planes facing the barn; fbm drifts sideways, alpha hugs the
   bottom of the plane and dies before the top. Normal blending — additive
   mist over a lit field goes milky. */
export function mistMaterial({ intensity = 0.16, seed = 0 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: TIME,
      uIntensity: { value: intensity },
      uSeed: { value: seed },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uIntensity; uniform float uSeed;
      varying vec2 vUv;
      ${NOISE_GLSL}
      void main() {
        vec2 p = vec2(vUv.x * 5.0 + uTime * 0.022 + uSeed * 7.0, vUv.y * 1.6 - uTime * 0.005);
        float body = smoothstep(0.35, 0.75, bsFbm(p));
        float band = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.35, vUv.y);
        float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
        float a = body * band * edge * uIntensity;
        gl_FragColor = vec4(vec3(0.60, 0.79, 0.72), a);
      }
    `,
  })
}

/* ---------------- dust in the beam ----------------
   THREE.Points with all motion in the vertex shader: each particle falls
   slowly inside the bulb's cone (radius grows with depth), warm off-white,
   a few pixels across, faded in/out at the cone's ends. */
export function dustMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: TIME },
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute float aSeed;
      varying float vA;
      void main() {
        float t = fract(aSeed * 13.7 + uTime * 0.02 * (0.6 + aSeed));
        float y = -t * 3.1;
        float r = (0.1 + 1.05 * t) * sqrt(fract(aSeed * 7.31));
        float ang = aSeed * 41.0 + uTime * (0.04 + aSeed * 0.08);
        vec3 p = vec3(cos(ang) * r, y, sin(ang) * r);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        // a few pixels at typical viewing distance — motes, not orbs. Floor
        // the size (sub-pixel points alias into flickering colored speckles)
        // and cap it (near-camera points balloon into snowflakes).
        gl_PointSize = clamp((1.6 + fract(aSeed * 3.7) * 1.8) * (3.5 / -mv.z), 1.5, 4.0);
        vA = smoothstep(0.0, 0.12, t) * smoothstep(1.0, 0.82, t);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main() {
        // soft pale disc — no saturated tint for the AA to fringe
        float d = smoothstep(0.5, 0.18, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(vec3(0.85, 0.92, 0.83), d * 0.1 * vA);
      }
    `,
  })
}

export function makeDustGeometry(count) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
  const seed = new Float32Array(count)
  for (let i = 0; i < count; i++) seed[i] = Math.random()
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  // positions are computed in the shader — hand-set bounds so culling works
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -1.55, 0), 4)
  return g
}

/* ================= canvas textures (drawn content) ================= */

function makeCanvas(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

const SLAB = '"Alfa Slab One", Georgia, serif'
const MONO = '"IBM Plex Mono", monospace'

// mottled, stained, edge-darkened paper ground
function agedPaper(g, w, h, base = '#d5c49c') {
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 46; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    const r = 8 + Math.random() * w * 0.14
    const grad = g.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, 'rgba(110, 84, 44, 0.07)')
    grad.addColorStop(1, 'rgba(110, 84, 44, 0)')
    g.fillStyle = grad
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  g.strokeStyle = 'rgba(60, 42, 20, 0.5)'
  g.lineWidth = Math.max(4, w * 0.012)
  g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth)
}

export function makePosterHerdTexture() {
  const T = SCENE_TEXT.posterHerd
  return makeCanvas(512, 683, (g, w, h) => {
    agedPaper(g, w, h)
    g.fillStyle = '#2b1f10'
    g.textAlign = 'center'
    g.font = `400 ${w * 0.17}px ${SLAB}`
    g.fillText(T.title, w / 2, h * 0.22)
    g.font = `600 ${w * 0.055}px ${MONO}`
    g.fillText(T.sub, w / 2, h * 0.32)
    g.fillText(T.sub2, w / 2, h * 0.38)
    // the book: rows of tally marks, all counted
    g.strokeStyle = '#2b1f10'
    g.lineWidth = 3
    for (let row = 0; row < 4; row++) {
      for (let grp = 0; grp < 5; grp++) {
        const gx = w * 0.14 + grp * w * 0.16
        const gy = h * 0.47 + row * h * 0.09
        for (let i = 0; i < 4; i++) {
          g.beginPath()
          g.moveTo(gx + i * 7, gy)
          g.lineTo(gx + i * 7, gy + h * 0.05)
          g.stroke()
        }
        g.beginPath()
        g.moveTo(gx - 4, gy + h * 0.045)
        g.lineTo(gx + 25, gy + h * 0.008)
        g.stroke()
      }
    }
    g.font = `500 ${w * 0.042}px ${MONO}`
    g.fillText(T.foot, w / 2, h * 0.92)
  })
}

export function makePosterFeedTexture() {
  const T = SCENE_TEXT.posterFeed
  return makeCanvas(512, 683, (g, w, h) => {
    agedPaper(g, w, h, '#cdb98c')
    g.textAlign = 'center'
    g.fillStyle = '#3a2510'
    g.font = `400 ${w * 0.155}px ${SLAB}`
    g.fillText(T.title, w / 2, h * 0.24)
    // feed-sack stamp ring
    g.strokeStyle = '#7a2f16'
    g.lineWidth = 8
    g.beginPath()
    g.arc(w / 2, h * 0.5, w * 0.2, 0, Math.PI * 2)
    g.stroke()
    g.fillStyle = '#7a2f16'
    g.font = `400 ${w * 0.11}px ${SLAB}`
    g.fillText(T.stamp, w / 2, h * 0.53)
    g.fillStyle = '#3a2510'
    g.font = `600 ${w * 0.055}px ${MONO}`
    g.fillText(T.sub, w / 2, h * 0.76)
    g.font = `500 ${w * 0.042}px ${MONO}`
    g.fillText(T.foot, w / 2, h * 0.92)
  })
}

export function makePosterWantedTexture() {
  const T = SCENE_TEXT.posterWanted
  return makeCanvas(512, 683, (g, w, h) => {
    agedPaper(g, w, h, '#c9b788')
    g.textAlign = 'center'
    g.fillStyle = '#2b1f10'
    g.font = `400 ${w * 0.16}px ${SLAB}`
    g.fillText(T.title, w / 2, h * 0.2)
    // a couple of curved strokes standing in for horns — no likeness
    // needed, just enough that the poster reads as being about the bull
    g.strokeStyle = '#2b1f10'
    g.lineWidth = w * 0.018
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(w * 0.36, h * 0.44)
    g.quadraticCurveTo(w * 0.27, h * 0.28, w * 0.21, h * 0.3)
    g.moveTo(w * 0.64, h * 0.44)
    g.quadraticCurveTo(w * 0.73, h * 0.28, w * 0.79, h * 0.3)
    g.stroke()
    g.beginPath()
    g.arc(w / 2, h * 0.44, w * 0.15, 0, Math.PI * 2)
    g.stroke()
    g.fillStyle = '#2b1f10'
    g.font = `600 ${w * 0.06}px ${MONO}`
    g.fillText(T.sub, w / 2, h * 0.7)
    g.font = `600 ${w * 0.05}px ${MONO}`
    g.fillText(T.sub2, w / 2, h * 0.77)
    g.font = `500 ${w * 0.042}px ${MONO}`
    g.fillText(T.foot, w / 2, h * 0.92)
  })
}

export function makePosterNoticeTexture() {
  const T = SCENE_TEXT.posterNotice
  return makeCanvas(512, 683, (g, w, h) => {
    agedPaper(g, w, h, '#d8cba3')
    g.textAlign = 'center'
    g.fillStyle = '#241a0c'
    g.font = `400 ${w * 0.155}px ${SLAB}`
    g.fillText(T.title, w / 2, h * 0.26)
    // a posted-order double rule under the title
    g.strokeStyle = '#241a0c'
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(w * 0.16, h * 0.31)
    g.lineTo(w * 0.84, h * 0.31)
    g.moveTo(w * 0.16, h * 0.325)
    g.lineTo(w * 0.84, h * 0.325)
    g.stroke()
    g.font = `600 ${w * 0.075}px ${MONO}`
    g.fillText(T.sub, w / 2, h * 0.5)
    g.fillText(T.sub2, w / 2, h * 0.58)
    g.font = `500 ${w * 0.042}px ${MONO}`
    g.fillText(T.foot, w / 2, h * 0.92)
  })
}

export function makeNoteTexture(i) {
  const line = SCENE_TEXT.notes[i % SCENE_TEXT.notes.length]
  return makeCanvas(256, 320, (g, w, h) => {
    agedPaper(g, w, h, '#e0d2ae')
    g.fillStyle = '#4a4034'
    g.textAlign = 'left'
    g.font = `600 ${w * 0.1}px ${MONO}`
    // wrap by word — these are short declaratives
    const words = line.split(' ')
    let row = 0
    let cur = ''
    for (const word of words) {
      if ((cur + word).length > 9) {
        g.fillText(cur.trim(), w * 0.1, h * 0.24 + row * h * 0.14)
        row++
        cur = ''
      }
      cur += `${word} `
    }
    g.fillText(cur.trim(), w * 0.1, h * 0.24 + row * h * 0.14)
    // a scrawled underline and the pin's shadow
    g.strokeStyle = '#4a4034'
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(w * 0.1, h * 0.8)
    g.quadraticCurveTo(w * 0.5, h * 0.83, w * 0.88, h * 0.79)
    g.stroke()
    g.fillStyle = 'rgba(40, 30, 16, 0.55)'
    g.beginPath()
    g.arc(w / 2, h * 0.07, 7, 0, Math.PI * 2)
    g.fill()
  })
}

export function makeSackTexture() {
  const T = SCENE_TEXT.sack
  return makeCanvas(512, 640, (g, w, h) => {
    // burlap: woven grid over a jute base
    g.fillStyle = '#a98e58'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = 'rgba(70, 54, 26, 0.35)'
    g.lineWidth = 2
    for (let x = 0; x < w; x += 7) {
      g.beginPath()
      g.moveTo(x, 0)
      g.lineTo(x, h)
      g.stroke()
    }
    for (let y = 0; y < h; y += 7) {
      g.beginPath()
      g.moveTo(0, y)
      g.lineTo(w, y)
      g.stroke()
    }
    g.save()
    g.translate(w / 2, h / 2)
    g.rotate(-0.03)
    g.textAlign = 'center'
    g.fillStyle = '#3a2a12'
    g.font = `400 ${w * 0.135}px ${SLAB}`
    g.fillText(T.title, 0, -h * 0.05)
    g.font = `600 ${w * 0.06}px ${MONO}`
    g.fillText(T.sub, 0, h * 0.08)
    g.restore()
    // stitching along top and bottom
    g.strokeStyle = '#5c4322'
    g.lineWidth = 4
    g.setLineDash([12, 9])
    g.beginPath()
    g.moveTo(0, h * 0.045)
    g.lineTo(w, h * 0.045)
    g.stroke()
    g.beginPath()
    g.moveTo(0, h * 0.955)
    g.lineTo(w, h * 0.955)
    g.stroke()
  })
}

export function makeTagTexture() {
  const T = SCENE_TEXT.tag
  return makeCanvas(512, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    // the tag blank — rounded, livestock yellow
    g.fillStyle = '#cdd23f'
    g.beginPath()
    g.roundRect(w * 0.06, h * 0.06, w * 0.88, h * 0.88, 26)
    g.fill()
    g.strokeStyle = '#7a7a18'
    g.lineWidth = 6
    g.stroke()
    // pin hole
    g.fillStyle = '#1c2206'
    g.beginPath()
    g.arc(w / 2, h * 0.2, 13, 0, Math.PI * 2)
    g.fill()
    g.textAlign = 'center'
    g.fillStyle = '#1c2206'
    g.font = `400 ${h * 0.5}px ${SLAB}`
    g.fillText(T.number, w / 2, h * 0.72)
    g.font = `600 ${h * 0.12}px ${MONO}`
    g.fillText(T.brand, w / 2, h * 0.9)
  })
}

// mid-distance tree silhouettes for the pasture — flat blue-black shapes on
// transparent ground, deterministic per seed
export function makeTreeTexture(seed = 1) {
  let a = (seed * 7919) | 0
  const rand = () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return makeCanvas(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    g.fillStyle = '#05070d'
    // trunk
    g.fillRect(w * 0.475, h * 0.55, w * 0.05, h * 0.45)
    // canopy — heavily overlapping blobs so it reads as one solid mass
    for (let i = 0; i < 34; i++) {
      const y = 0.12 + rand() * 0.46
      const spread = 0.3 * Math.sin(Math.PI * Math.min(1, (y - 0.05) / 0.5))
      const x = 0.5 + (rand() - 0.5) * 2 * spread
      const r = 0.09 + rand() * 0.13
      g.beginPath()
      g.arc(w * x, h * y, w * r, 0, Math.PI * 2)
      g.fill()
    }
  })
}

// oversized ear tag carrying the contract address — the gate beat's tap-to-copy
export function makeCaTagTexture(address) {
  const T = SCENE_TEXT.caTag
  const shown =
    address.length > 20 ? `${address.slice(0, 8)}…${address.slice(-8)}` : address
  return makeCanvas(1024, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    g.fillStyle = '#cdd23f'
    g.beginPath()
    g.roundRect(w * 0.04, h * 0.06, w * 0.92, h * 0.88, 40)
    g.fill()
    g.strokeStyle = '#7a7a18'
    g.lineWidth = 10
    g.stroke()
    // pin hole
    g.fillStyle = '#1c2206'
    g.beginPath()
    g.arc(w / 2, h * 0.17, 20, 0, Math.PI * 2)
    g.fill()
    g.textAlign = 'center'
    g.fillStyle = '#1c2206'
    g.font = `400 ${h * 0.34}px ${SLAB}`
    g.fillText(T.title, w / 2, h * 0.55)
    g.font = `600 ${h * 0.115}px ${MONO}`
    g.fillText(shown, w / 2, h * 0.73)
    g.font = `600 ${h * 0.08}px ${MONO}`
    g.fillStyle = '#5a5a12'
    g.fillText(T.hint, w / 2, h * 0.88)
  })
}

// painted plank signs for the socials nailed under the tag
export function makeSignTexture(label) {
  return makeCanvas(512, 128, (g, w, h) => {
    g.fillStyle = '#241a0e'
    g.fillRect(0, 0, w, h)
    // plank grain
    g.strokeStyle = 'rgba(120, 90, 48, 0.18)'
    g.lineWidth = 2
    for (let y = 8; y < h; y += 11) {
      g.beginPath()
      g.moveTo(0, y + Math.sin(y) * 3)
      g.lineTo(w, y + Math.cos(y) * 3)
      g.stroke()
    }
    g.strokeStyle = 'rgba(168, 216, 74, 0.55)'
    g.lineWidth = 4
    g.strokeRect(6, 6, w - 12, h - 12)
    g.textAlign = 'center'
    g.fillStyle = '#a8d84a'
    g.font = `600 ${h * 0.34}px ${MONO}`
    g.fillText(label, w / 2, h * 0.62)
    // nail heads
    g.fillStyle = '#6f5a30'
    for (const x of [w * 0.06, w * 0.94]) {
      g.beginPath()
      g.arc(x, h / 2, 7, 0, Math.PI * 2)
      g.fill()
    }
  })
}

// Scuffs, ruts, and drag marks for the barn floor — a transparent overlay
// laid just above the dirt. The floor is in frame on nearly every beat and
// clean dirt is what makes a set read as a set.
export function makeFloorMarksTexture() {
  return makeCanvas(1024, 854, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    const dark = (a) => `rgba(26, 18, 9, ${a})`

    // wheelbarrow ruts — two parallel arcs curving in from the open side
    g.lineCap = 'round'
    for (const off of [-16, 16]) {
      g.strokeStyle = dark(0.2)
      g.lineWidth = 11
      g.beginPath()
      g.moveTo(w * 0.74 + off, h)
      g.quadraticCurveTo(w * 0.6 + off, h * 0.52, w * 0.78 + off, h * 0.08)
      g.stroke()
    }
    // a second, older pair crossing toward the stalls
    for (const off of [-14, 14]) {
      g.strokeStyle = dark(0.13)
      g.lineWidth = 9
      g.beginPath()
      g.moveTo(w * 0.66, h * 0.92 + off)
      g.quadraticCurveTo(w * 0.4, h * 0.8 + off, w * 0.12, h * 0.7 + off)
      g.stroke()
    }

    // drag marks — short straight scrapes where things got hauled
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      const a = Math.random() * Math.PI
      const len = 30 + Math.random() * 130
      g.strokeStyle = dark(0.05 + Math.random() * 0.08)
      g.lineWidth = 2 + Math.random() * 5
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
      g.stroke()
    }

    // trodden patches — soft dark smudges where feet keep landing
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      const r = 14 + Math.random() * 70
      const grad = g.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0, dark(0.06 + Math.random() * 0.06))
      grad.addColorStop(1, dark(0))
      g.fillStyle = grad
      g.fillRect(x - r, y - r, r * 2, r * 2)
    }

    // kicked-up dust, lighter than the dirt
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      const r = 20 + Math.random() * 80
      const grad = g.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0, `rgba(196, 172, 128, ${0.03 + Math.random() * 0.04})`)
      grad.addColorStop(1, 'rgba(196, 172, 128, 0)')
      g.fillStyle = grad
      g.fillRect(x - r, y - r, r * 2, r * 2)
    }
  })
}

export function makeBoardIdleTexture() {
  const T = SCENE_TEXT.boardIdle
  return makeCanvas(1024, 576, (g, w, h) => {
    g.fillStyle = '#070503'
    g.fillRect(0, 0, w, h)
    // static
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(240, 214, 160, ${Math.random() * 0.06})`
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2)
    }
    g.textAlign = 'center'
    g.fillStyle = '#a8d84a'
    g.font = `400 ${w * 0.085}px ${SLAB}`
    g.fillText(T.title, w / 2, h * 0.46)
    g.fillStyle = '#e8f0e2'
    g.font = `500 ${w * 0.024}px ${MONO}`
    g.fillText(T.sub, w / 2, h * 0.6)
    // scanlines
    g.fillStyle = 'rgba(0, 0, 0, 0.28)'
    for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 2)
  })
}
