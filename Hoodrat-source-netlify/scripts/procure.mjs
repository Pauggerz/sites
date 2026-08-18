// Downloads CC0 assets from Poly Haven into public/ for local, offline use.
// Usage: node scripts/procure.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const MODELS = [
  'sofa_03',
  'modern_coffee_table_01',
  'mid_century_lounge_chair',
  'modern_arm_chair_01',
  'metal_office_desk',
  // round 2 — set dressing
  'chess_set',
  'concrete_cat_statue',
  'dartboard',
  'book_encyclopedia_set_01',
  'potted_plant_01',
  'potted_plant_04',
  'classic_laptop',
  'desk_lamp_arm_01',
  'wall_clock',
  'steel_frame_shelves_02',
  'hanging_industrial_lamp',
  'old_military_crate',
  'wooden_crate_02',
  'wine_bottles_01',
]
const HDRI = 'moonless_golf'

import { existsSync } from 'node:fs'

async function dl(url, dest) {
  if (existsSync(dest)) return
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, Buffer.from(await res.arrayBuffer()))
  console.log('✓', dest)
}

for (const name of MODELS) {
  const files = await (await fetch(`https://api.polyhaven.com/files/${name}`)).json()
  const res = files.gltf['1k'] ? '1k' : Object.keys(files.gltf)[0]
  const g = files.gltf[res].gltf
  const root = join('public', 'models', name)
  await dl(g.url, join(root, `${name}.gltf`))
  for (const [rel, f] of Object.entries(g.include)) {
    await dl(f.url, join(root, rel))
  }
}

const h = await (await fetch(`https://api.polyhaven.com/files/${HDRI}`)).json()
await dl(h.hdri['2k'].hdr.url, join('public', 'hdri', `${HDRI}_2k.hdr`))
console.log('done')
