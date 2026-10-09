/** World is rendered at 480×270 and scaled 2× onto a 960×540 canvas. */
export const W = 480
export const H = 270
export const SCALE = 2
export const UW = W * SCALE
export const UH = H * SCALE
export const STEP = 1 / 60
export const GRAVITY = 980
export const GROUND_Y = 232
export const MAX_DEPTH = 10
export const BOSS_EVERY = 5
export const BEST_KEY = 'nocturne-ember-best'

export const BIOMES = [
  { name: '灯笼回廊', sub: 'Lantern Cloister' },
  { name: '霜月高台', sub: 'Frostmoon Terrace' },
] as const

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a)
export const randi = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1))
export const chance = (p: number) => Math.random() < p
export const sign = (v: number) => (v < 0 ? -1 : v > 0 ? 1 : 0)
export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]
export const approach = (v: number, t: number, s: number) => (v < t ? Math.min(v + s, t) : Math.max(v - s, t))
export const easeOut = (t: number) => 1 - (1 - t) * (1 - t)

export const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

export function weightedPick<T extends { w: number }>(items: readonly T[]): T {
  const total = items.reduce((sum, item) => sum + item.w, 0)
  let r = Math.random() * total
  for (const item of items) {
    r -= item.w
    if (r <= 0) return item
  }
  return items[items.length - 1]
}

/** Upgrade card hit areas in UI (960×540) coordinates. */
export function cardRect(i: number): Rect {
  return { x: 85 + i * 270, y: 160, w: 250, h: 260 }
}
