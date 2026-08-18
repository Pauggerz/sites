import { existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')

const keepModelDirs = new Set([
  'classic_laptop',
  'metal_office_desk',
  'mid_century_lounge_chair',
  'modern_coffee_table_01',
  'sofa_03',
  'steel_frame_shelves_02',
  'wall_clock',
])

const modelsDir = join(dist, 'models')
if (existsSync(modelsDir)) {
  for (const name of readdirSync(modelsDir)) {
    if (!keepModelDirs.has(name)) rmSync(join(modelsDir, name), { recursive: true, force: true })
  }
}

// The scene has enough direct lighting now; dropping the HDRI saves several MB.
rmSync(join(dist, 'hdri'), { recursive: true, force: true })
