import { SAVE_KEY } from './config'
import type { PlantId } from './data/plants'
import type { ZombieId } from './data/zombies'

export interface SaveData {
  /** Index of the furthest unlocked adventure level. */
  unlocked: number
  cleared: number[]
  plants: PlantId[]
  seen: ZombieId[]
  endlessBest: number
  bowlingBest: number
  music: boolean
  sfx: boolean
}

const fresh = (): SaveData => ({
  unlocked: 0,
  cleared: [],
  plants: ['peashooter'],
  seen: ['basic'],
  endlessBest: 0,
  bowlingBest: 0,
  music: true,
  sfx: true,
})

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return fresh()
    return { ...fresh(), ...(JSON.parse(raw) as Partial<SaveData>) }
  } catch {
    return fresh()
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch {
    // storage may be unavailable (private mode / file://); progress then lives in memory only
  }
}

export function resetSave(): SaveData {
  const data = fresh()
  writeSave(data)
  return data
}
