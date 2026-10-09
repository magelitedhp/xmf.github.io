export type Ctx = CanvasRenderingContext2D

export const TAU = Math.PI * 2
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a)
export const randi = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1))
export const chance = (p: number) => Math.random() < p
export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeInCubic = (t: number) => t * t * t
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOutBack = (t: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export function weighted<T>(items: readonly T[], weight: (item: T) => number): T {
  const total = items.reduce((s, it) => s + weight(it), 0)
  let r = Math.random() * total
  for (const it of items) {
    r -= weight(it)
    if (r <= 0) return it
  }
  return items[items.length - 1]
}

export function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------- tinting
// Every sprite color goes through C(); the active tint recolors whole
// entities (frozen, hit flash, burnt to ash) without offscreen buffers.

export type Tint = 'normal' | 'frost' | 'flash' | 'frostflash' | 'ash' | 'dim' | 'gold'

let tint: Tint = 'normal'
const cache = new Map<string, string>()

export const setTint = (t: Tint) => {
  tint = t
}

function parse(hex: string): [number, number, number] {
  if (hex.length === 4) return [parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16), parseInt(hex[3] + hex[3], 16)]
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

const mix = (c: [number, number, number], d: [number, number, number], t: number): [number, number, number] => [
  c[0] + (d[0] - c[0]) * t,
  c[1] + (d[1] - c[1]) * t,
  c[2] + (d[2] - c[2]) * t,
]

export function C(hex: string): string {
  if (tint === 'normal' || hex[0] !== '#') return hex
  const key = tint + hex
  const hit = cache.get(key)
  if (hit) return hit
  let c = parse(hex)
  switch (tint) {
    case 'frost':
      c = mix(c, [110, 185, 255], 0.42)
      break
    case 'flash':
      c = mix(c, [255, 255, 255], 0.45)
      break
    case 'frostflash':
      c = mix(mix(c, [110, 185, 255], 0.42), [255, 255, 255], 0.4)
      break
    case 'ash': {
      const l = 18 + (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) * 0.16
      c = [l, l, l + 2]
      break
    }
    case 'dim': {
      const l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
      c = mix([l, l, l], [30, 30, 36], 0.55)
      break
    }
    case 'gold':
      c = mix(c, [255, 214, 90], 0.35)
      break
  }
  const alpha = hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1
  const out = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha.toFixed(3)})`
  cache.set(key, out)
  return out
}

// ---------------------------------------------------------------- drawing

export function circle(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
}

export function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, rot = 0) {
  ctx.beginPath()
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU)
}

export function rrect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

type Paint = string | CanvasGradient | null | undefined

export function paint(ctx: Ctx, fill: Paint, stroke?: Paint, lw = 2.5) {
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.lineWidth = lw
    ctx.strokeStyle = stroke
    ctx.stroke()
  }
}

export function radial(ctx: Ctx, x0: number, y0: number, r0: number, x1: number, y1: number, r1: number, stops: [number, string][]) {
  const g = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1)
  for (const [o, c] of stops) g.addColorStop(o, C(c))
  return g
}

export function linear(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  for (const [o, c] of stops) g.addColorStop(o, C(c))
  return g
}

export function line(ctx: Ctx, pts: number[], color: string, lw: number) {
  ctx.beginPath()
  ctx.moveTo(pts[0], pts[1])
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1])
  ctx.lineWidth = lw
  ctx.strokeStyle = color
  ctx.stroke()
}

export const FONT = '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif'

export interface TextOptions {
  size?: number
  color?: string
  stroke?: string
  lw?: number
  align?: CanvasTextAlign
  baseline?: CanvasTextBaseline
  weight?: number
  shadow?: boolean
}

export function text(ctx: Ctx, str: string, x: number, y: number, o: TextOptions = {}) {
  const size = o.size ?? 20
  ctx.font = `${o.weight ?? 800} ${size}px ${FONT}`
  ctx.textAlign = o.align ?? 'center'
  ctx.textBaseline = o.baseline ?? 'middle'
  if (o.shadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillText(str, x + size * 0.06, y + size * 0.08)
  }
  if (o.stroke) {
    ctx.lineJoin = 'round'
    ctx.lineWidth = o.lw ?? Math.max(3, size / 6)
    ctx.strokeStyle = o.stroke
    ctx.strokeText(str, x, y)
  }
  ctx.fillStyle = o.color ?? '#fff'
  ctx.fillText(str, x, y)
}

export function wrapText(ctx: Ctx, str: string, maxW: number): string[] {
  const lines: string[] = []
  for (const para of str.split('\n')) {
    let cur = ''
    for (const ch of para) {
      if (ctx.measureText(cur + ch).width > maxW && cur) {
        lines.push(cur)
        cur = ch
      } else cur += ch
    }
    lines.push(cur)
  }
  return lines
}
