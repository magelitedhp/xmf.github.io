import type { LevelDef } from '../data/levels'
import { ZOMBIES, type ZombieId } from '../data/zombies'
import { weighted } from '../util'

export const isEndless = (level: LevelDef) => level.waves === Infinity

export function isFlagWave(level: LevelDef, index: number) {
  if (isEndless(level)) return (index + 1) % 10 === 0
  return level.flags.includes(index + 1)
}

export function isFinalWave(level: LevelDef, index: number) {
  return !isEndless(level) && index === level.waves - 1
}

/** Picks a spending budget for the wave and fills it with zombies the level allows at this point. */
export function planWave(level: LevelDef, index: number): ZombieId[] {
  const progress = isEndless(level) ? Math.min(1, index / 24) : index / Math.max(1, level.waves - 1)
  const flag = isFlagWave(level, index)
  let budget = level.diff * (1 + index * 0.42)
  if (isEndless(level)) budget *= 1 + Math.max(0, index - 20) * 0.05
  if (flag) budget = budget * 2.2 + 1
  budget = Math.max(1, Math.round(budget))
  const pool = level.pool.filter((id) => ZOMBIES[id].from <= progress + 1e-6 && ZOMBIES[id].weight > 0)
  const out: ZombieId[] = []
  if (flag) out.push('flag')
  // The first sighting of a newly introduced zombie is guaranteed so the preview isn't a lie.
  const newest = pool.filter((id) => ZOMBIES[id].from > 0 && ZOMBIES[id].from <= progress && ZOMBIES[id].from > progress - 0.12)
  for (const id of newest) {
    if (budget >= ZOMBIES[id].cost) {
      out.push(id)
      budget -= ZOMBIES[id].cost
    }
  }
  let guard = 0
  while (budget > 0 && out.length < 44 && guard++ < 200) {
    const fits = pool.filter((id) => ZOMBIES[id].cost <= budget)
    if (!fits.length) break
    const id = weighted(fits, (z) => ZOMBIES[z].weight * (z === 'basic' ? 1 + progress : 1))
    out.push(id)
    budget -= ZOMBIES[id].cost
  }
  return out
}

/** Zombies the level preview on the street should show. */
export function previewList(level: LevelDef): ZombieId[] {
  const ids = level.pool.filter((id) => id !== 'imp')
  const out: ZombieId[] = []
  for (const id of ids) {
    const n = id === 'basic' ? 3 : id === 'garg' ? 1 : 2
    for (let i = 0; i < n; i++) out.push(id)
  }
  return out.slice(0, 14)
}
