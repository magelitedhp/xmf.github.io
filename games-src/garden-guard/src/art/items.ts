import { PLANTS, type PlantId } from '../data/plants'
import type { ZombieId } from '../data/zombies'
import { C, FONT, TAU, circle, ellipse, linear, paint, radial, rrect, text, type Ctx } from '../util'
import { cabbageBall, drawPlant, flame } from './plants'
import { drawZombieHead } from './zombies'

export const PACKET_W = 64
export const PACKET_H = 88

export function drawSun(ctx: Ctx, x: number, y: number, t: number, s = 1, alpha = 1) {
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.translate(x, y)
  ctx.scale(s, s)
  circle(ctx, 0, 0, 48)
  paint(ctx, radial(ctx, 0, 0, 6, 0, 0, 48, [[0, '#fff7b0cc'], [0.5, '#ffe36a55'], [1, '#ffd84a00']]))
  ctx.save()
  ctx.rotate(t * 0.9)
  ctx.beginPath()
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU
    const a1 = a - 0.13
    const a2 = a + 0.13
    ctx.moveTo(Math.cos(a1) * 19, Math.sin(a1) * 19)
    ctx.lineTo(Math.cos(a) * (i % 2 ? 31 : 36), Math.sin(a) * (i % 2 ? 31 : 36))
    ctx.lineTo(Math.cos(a2) * 19, Math.sin(a2) * 19)
  }
  ctx.fillStyle = '#ffd23a'
  ctx.fill()
  ctx.restore()
  circle(ctx, 0, 0, 21)
  paint(ctx, radial(ctx, -6, -7, 2, 0, 0, 22, [[0, '#fffde8'], [0.45, '#ffe25a'], [1, '#f3a414']]), '#d98a0c', 2)
  circle(ctx, 0, 0, 13)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()
}

export type PeaKind = 'pea' | 'snow' | 'fire'

export function drawPea(ctx: Ctx, x: number, y: number, kind: PeaKind, t: number) {
  if (kind === 'fire') {
    ctx.save()
    ctx.translate(x + 6, y)
    ctx.rotate(-Math.PI / 2)
    flame(ctx, 0, 0, 0.42, t * 1.6)
    ctx.restore()
    circle(ctx, x, y, 10)
    paint(ctx, radial(ctx, x - 3, y - 3, 1, x, y, 11, [[0, '#fff6b0'], [0.5, '#ffb030'], [1, '#e2481a']]))
    return
  }
  const snow = kind === 'snow'
  if (snow) {
    circle(ctx, x, y, 16)
    paint(ctx, radial(ctx, x, y, 2, x, y, 16, [[0, '#d8f4ff88'], [1, '#d8f4ff00']]))
  }
  circle(ctx, x, y, 10)
  paint(
    ctx,
    radial(ctx, x - 3.5, y - 3.5, 1, x, y, 11, snow ? [[0, '#ffffff'], [0.5, '#9fd8ff'], [1, '#3d8fd0']] : [[0, '#e6ffc0'], [0.5, '#7fd648'], [1, '#3c8c1c']]),
    C(snow ? '#1d5689' : '#24600f'),
    1.6,
  )
  if (snow) {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    for (let i = 0; i < 3; i++) {
      const a = t * 4 + (i * Math.PI) / 3
      ctx.moveTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5)
      ctx.lineTo(x - Math.cos(a) * 5, y - Math.sin(a) * 5)
    }
    ctx.stroke()
  }
}

export function drawCabbageBall(ctx: Ctx, x: number, y: number, rot: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  cabbageBall(ctx, 0.5)
  ctx.restore()
}

export function drawMower(ctx: Ctx, x: number, y: number, t: number, running: boolean) {
  const shake = running ? Math.sin(t * 60) * 1.2 : 0
  ctx.save()
  ctx.translate(x, y + shake)
  ellipse(ctx, 0, 2, 38, 8)
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fill()
  ctx.lineCap = 'round'
  ctx.lineWidth = 4
  ctx.strokeStyle = C('#3a3a3a')
  ctx.beginPath()
  ctx.moveTo(-22, -26)
  ctx.lineTo(-44, -66)
  ctx.lineTo(-54, -64)
  ctx.stroke()
  rrect(ctx, -34, -34, 66, 28, 9)
  paint(ctx, linear(ctx, 0, -34, 0, -6, [[0, '#ff6a5a'], [1, '#b8261c']]), C('#5e0e08'), 2.4)
  rrect(ctx, -18, -50, 30, 20, 6)
  paint(ctx, linear(ctx, 0, -50, 0, -30, [[0, '#f4f4f4'], [1, '#9ea4aa']]), C('#40464c'), 2)
  rrect(ctx, -10, -56, 12, 7, 2)
  paint(ctx, C('#333'), null)
  ctx.fillStyle = C('#ffd84a')
  ctx.fillRect(14, -26, 12, 5)
  for (const wx of [-22, 20]) {
    circle(ctx, wx, -4, 10)
    paint(ctx, C('#222'), C('#000'), 1.5)
    circle(ctx, wx, -4, 4)
    paint(ctx, C('#c9ced3'))
  }
  if (running) {
    ctx.strokeStyle = 'rgba(160,230,110,0.8)'
    ctx.lineWidth = 2
    for (let i = 0; i < 5; i++) {
      const a = t * 30 + i
      ctx.beginPath()
      ctx.moveTo(30, -10)
      ctx.lineTo(36 + Math.cos(a) * 10, -14 + Math.sin(a) * 10)
      ctx.stroke()
    }
  }
  ctx.restore()
}

// Seed packet icons are vector-heavy, so each one is rendered once into a small bitmap.
const iconCache = new Map<string, HTMLCanvasElement>()
const ICON_W = 56
const ICON_H = 62

function packetIcon(id: PlantId): HTMLCanvasElement {
  const hit = iconCache.get(id)
  if (hit) return hit
  const k = 3
  const cv = document.createElement('canvas')
  cv.width = ICON_W * k
  cv.height = ICON_H * k
  const c = cv.getContext('2d')!
  c.scale(k, k)
  const def = PLANTS[id]
  c.translate(ICON_W / 2, ICON_H - 14 + def.iconY)
  c.scale(def.icon, def.icon)
  drawPlant(c, id, 0, 0, { t: 0.4, hp: 1, state: id === 'potato' ? 'armed' : undefined })
  iconCache.set(id, cv)
  return cv
}

export interface PacketOpts {
  cost?: number | null
  /** Remaining cooldown, 1 → 0. */
  cd?: number
  off?: boolean
  hover?: boolean
  picked?: boolean
  scale?: number
}

export function drawPacket(ctx: Ctx, x: number, y: number, id: PlantId, o: PacketOpts = {}) {
  const s = o.scale ?? 1
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  if (o.hover && !o.off) ctx.translate(0, -3)
  rrect(ctx, 2, 4, PACKET_W, PACKET_H, 8)
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fill()
  rrect(ctx, 0, 0, PACKET_W, PACKET_H, 8)
  paint(ctx, linear(ctx, 0, 0, 0, PACKET_H, [[0, '#fffdec'], [1, '#ebf2d7']]), '#97af89', 1.5)
  rrect(ctx, 4, 4, ICON_W, ICON_H, 6)
  paint(ctx, linear(ctx, 0, 4, 0, 66, [[0, '#ecf4d9'], [1, '#c4dcac']]), '#b4c99c', 1)
  ctx.drawImage(packetIcon(id), 4, 4, ICON_W, ICON_H)
  if (o.cost != null) text(ctx, String(o.cost), PACKET_W / 2, PACKET_H - 11, { size: 17, color: '#395f46', weight: 700 })
  if (o.off || o.picked) {
    rrect(ctx, 0, 0, PACKET_W, PACKET_H, 8)
    ctx.fillStyle = o.picked ? 'rgba(20,20,20,0.6)' : 'rgba(20,20,20,0.42)'
    ctx.fill()
  }
  if (o.cd && o.cd > 0) {
    ctx.save()
    rrect(ctx, 0, 0, PACKET_W, PACKET_H, 8)
    ctx.clip()
    ctx.fillStyle = 'rgba(10,10,10,0.5)'
    ctx.fillRect(0, 0, PACKET_W, PACKET_H * o.cd)
    ctx.restore()
  }
  if (o.hover && !o.off) {
    rrect(ctx, -1, -1, PACKET_W + 2, PACKET_H + 2, 9)
    ctx.strokeStyle = 'rgba(255,255,220,0.9)'
    ctx.lineWidth = 3
    ctx.stroke()
  }
  ctx.restore()
}

export function drawShovel(ctx: Ctx, x: number, y: number, s = 1, rot = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.scale(s, s)
  ctx.lineCap = 'round'
  ctx.lineWidth = 7
  ctx.strokeStyle = '#6b4220'
  ctx.beginPath()
  ctx.moveTo(-20, -20)
  ctx.lineTo(8, 8)
  ctx.stroke()
  ctx.lineWidth = 4
  ctx.strokeStyle = '#a8703a'
  ctx.stroke()
  rrect(ctx, -30, -30, 18, 9, 3)
  paint(ctx, '#3a2a1a')
  ctx.beginPath()
  ctx.moveTo(4, 2)
  ctx.lineTo(22, 4)
  ctx.quadraticCurveTo(32, 18, 26, 30)
  ctx.quadraticCurveTo(14, 34, 4, 22)
  ctx.closePath()
  paint(ctx, linear(ctx, 4, 0, 30, 30, [[0, '#f1f4f7'], [1, '#8c96a0']]), '#4a525a', 2)
  ctx.restore()
}

export function drawFlagIcon(ctx: Ctx, x: number, y: number, raised: boolean) {
  ctx.strokeStyle = '#5a3a1a'
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.moveTo(x, y + 8)
  ctx.lineTo(x, y - 18 - (raised ? 6 : 0))
  ctx.stroke()
  const fy = y - 18 - (raised ? 6 : 0)
  ctx.beginPath()
  ctx.moveTo(x, fy)
  ctx.lineTo(x + 16, fy + 4)
  ctx.lineTo(x, fy + 10)
  ctx.closePath()
  paint(ctx, raised ? '#d23434' : '#8e1d1d', '#300606', 1.2)
}

export function drawProgress(ctx: Ctx, x: number, y: number, w: number, progress: number, flags: number[], label: string) {
  const h = 18
  text(ctx, label, x - 12, y + h / 2, { size: 16, color: '#fff3c8', stroke: '#3a2408', lw: 4, align: 'right' })
  rrect(ctx, x, y, w, h, 9)
  paint(ctx, '#3a2a14', '#1e1408', 2.4)
  const fw = Math.max(0, Math.min(1, progress)) * (w - 6)
  if (fw > 0) {
    rrect(ctx, x + w - 3 - fw, y + 3, fw, h - 6, 6)
    paint(ctx, linear(ctx, 0, y, 0, y + h, [[0, '#b6ef6a'], [1, '#4f9a26']]))
  }
  for (const f of flags) drawFlagIcon(ctx, x + w - 3 - f * (w - 6), y + h - 2, progress >= f - 0.001)
  drawZombieHead(ctx, 'basic', x + w - 3 - fw, y + h / 2 + 2, -0.1, 0.55)
}

export function drawTrophy(ctx: Ctx, x: number, y: number, s: number, t: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  circle(ctx, 0, -40, 90)
  paint(ctx, radial(ctx, 0, -40, 10, 0, -40, 90, [[0, '#fff3b066'], [1, '#fff3b000']]))
  ctx.save()
  ctx.rotate(t * 0.4)
  ctx.fillStyle = 'rgba(255,240,170,0.25)'
  for (let i = 0; i < 10; i++) {
    ctx.rotate(TAU / 10)
    ctx.beginPath()
    ctx.moveTo(0, -40)
    ctx.lineTo(-10, -140)
    ctx.lineTo(10, -140)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
  const gold = (x0: number, x1: number) => linear(ctx, x0, 0, x1, 0, [[0, '#b8860b'], [0.4, '#ffe680'], [1, '#c8961a']])
  ctx.lineWidth = 7
  ctx.strokeStyle = '#d9a520'
  ctx.beginPath()
  ctx.arc(-36, -66, 16, Math.PI * 0.5, Math.PI * 1.5)
  ctx.moveTo(36, -82)
  ctx.arc(36, -66, 16, -Math.PI * 0.5, Math.PI * 0.5)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-38, -92)
  ctx.lineTo(38, -92)
  ctx.quadraticCurveTo(36, -36, 0, -30)
  ctx.quadraticCurveTo(-36, -36, -38, -92)
  paint(ctx, gold(-38, 38), '#7a5208', 3)
  ctx.fillRect(-6, -32, 12, 22)
  rrect(ctx, -6, -32, 12, 22, 2)
  paint(ctx, gold(-6, 6), '#7a5208', 2)
  rrect(ctx, -30, -12, 60, 14, 4)
  paint(ctx, gold(-30, 30), '#7a5208', 2.4)
  ctx.font = `900 22px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#8a5a0a'
  ctx.fillText('★', 0, -64)
  ctx.restore()
}

export function drawZombieIcon(ctx: Ctx, id: ZombieId, x: number, y: number, s: number) {
  drawZombieHead(ctx, id, x, y, 0, s)
}

export function drawSunCounter(ctx: Ctx, x: number, y: number, sun: number, t: number, flash: number) {
  rrect(ctx, x, y, 84, 104, 10)
  paint(ctx, linear(ctx, 0, y, 0, y + 104, [[0, '#8a5a2c'], [1, '#5c3a18']]), '#2e1c08', 3)
  drawSun(ctx, x + 42, y + 38, t, 0.85)
  rrect(ctx, x + 8, y + 72, 68, 24, 7)
  paint(ctx, flash > 0 ? '#ff9a9a' : '#f5ecd2', '#5c3a18', 2)
  text(ctx, String(sun), x + 42, y + 85, { size: 19, color: flash > 0 ? '#8a0000' : '#2a1d08', weight: 900 })
}
