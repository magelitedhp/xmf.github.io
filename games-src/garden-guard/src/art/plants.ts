import type { PlantId } from '../data/plants'
import { C, TAU, circle, clamp, ellipse, linear, paint, radial, rrect, type Ctx } from '../util'

export interface PlantView {
  t: number
  anim?: number
  hp?: number
  state?: string
  stateT?: number
  lookX?: number
  rot?: number
  loaded?: boolean
}

interface PeaPalette {
  light: string
  base: string
  dark: string
  hole: string
}

const PEA: PeaPalette = { light: '#c4f78a', base: '#5cbf2a', dark: '#24600f', hole: '#143a08' }
const SNOW: PeaPalette = { light: '#e3f7ff', base: '#62b6ee', dark: '#1d5689', hole: '#0f3150' }
const REPEAT: PeaPalette = { light: '#a6e874', base: '#3c9a21', dark: '#1b500d', hole: '#0e2e07' }

export function leaf(ctx: Ctx, x: number, y: number, angle: number, len: number, w: number, light = '#86d957', dark = '#3a8c1f', edge = '#255a12') {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(len * 0.45, -w, len, 0)
  ctx.quadraticCurveTo(len * 0.5, w * 0.9, 0, 0)
  paint(ctx, linear(ctx, 0, -w, 0, w, [[0, light], [1, dark]]), C(edge), 2)
  ctx.beginPath()
  ctx.moveTo(2, 0)
  ctx.quadraticCurveTo(len * 0.5, -w * 0.18, len * 0.88, 0)
  ctx.lineWidth = 1.2
  ctx.strokeStyle = C(edge)
  ctx.stroke()
  ctx.restore()
}

function stem(ctx: Ctx, pts: number[], dark: string, light: string, w = 8) {
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(pts[0], pts[1])
  ctx.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7])
  ctx.lineWidth = w
  ctx.strokeStyle = C(dark)
  ctx.stroke()
  ctx.lineWidth = w - 3.5
  ctx.strokeStyle = C(light)
  ctx.stroke()
}

function eye(ctx: Ctx, x: number, y: number, rx: number, ry: number, px: number, py: number, pr = 3.2) {
  ellipse(ctx, x, y, rx, ry)
  paint(ctx, C('#ffffff'), C('#1a1a1a'), 1.6)
  circle(ctx, x + px, y + py, pr)
  paint(ctx, C('#141414'))
  circle(ctx, x + px + pr * 0.35, y + py - pr * 0.4, pr * 0.32)
  paint(ctx, '#ffffff')
}

function peaHead(ctx: Ctx, hx: number, hy: number, s: number, pal: PeaPalette, recoil: number, crest: 'leaf' | 'ice' | 'double', brow = false) {
  ctx.save()
  ctx.translate(hx, hy)
  ctx.scale(s, s)
  if (crest === 'leaf') leaf(ctx, -15, -12, -2.5, 22, 7)
  if (crest === 'double') {
    leaf(ctx, -15, -10, -2.3, 24, 8)
    leaf(ctx, -16, -2, -2.75, 22, 7)
  }
  if (crest === 'ice') {
    for (const [ax, ay, a, l] of [
      [-14, -12, -2.4, 18],
      [-18, -2, -2.9, 15],
      [-8, -18, -1.95, 14],
    ]) {
      ctx.save()
      ctx.translate(ax, ay)
      ctx.rotate(a)
      ctx.beginPath()
      ctx.moveTo(0, -4)
      ctx.lineTo(l, 0)
      ctx.lineTo(0, 4)
      ctx.closePath()
      paint(ctx, linear(ctx, 0, 0, l, 0, [[0, '#bfe8ff'], [1, '#ffffff']]), C('#3d7fb3'), 1.5)
      ctx.restore()
    }
  }
  const len = 30 - recoil * 8
  rrect(ctx, 5, -12, len + 2, 22, 10)
  paint(ctx, linear(ctx, 0, -12, 0, 10, [[0, pal.light], [1, pal.base]]), C(pal.dark), 2.5)
  circle(ctx, 0, 0, 21)
  paint(ctx, radial(ctx, -7, -9, 2, 0, 0, 23, [[0, pal.light], [0.65, pal.base], [1, pal.dark]]), C(pal.dark), 2.5)
  ellipse(ctx, 6 + len, -1, 6.5 + recoil * 1.5, 11.5)
  paint(ctx, C(pal.base), C(pal.dark), 2.2)
  ellipse(ctx, 7 + len, -1, 3.6, 7.4)
  paint(ctx, C(pal.hole))
  eye(ctx, 3, -7, 6.5, 8, 2.4, 1, 3.3)
  if (brow) {
    ctx.beginPath()
    ctx.moveTo(-5, -18)
    ctx.lineTo(11, -13)
    ctx.lineWidth = 3.4
    ctx.lineCap = 'round'
    ctx.strokeStyle = C(pal.dark)
    ctx.stroke()
  }
  ctx.restore()
}

function shooter(ctx: Ctx, x: number, y: number, v: PlantView, pal: PeaPalette, crest: 'leaf' | 'ice' | 'double', brow = false) {
  const sway = Math.sin(v.t * 2.3) * 1.6
  const recoil = clamp((v.anim ?? 0) / 0.2, 0, 1)
  const hx = x + 6 + sway - recoil * 3
  const hy = y - 60 + Math.cos(v.t * 2.3) * 0.8
  leaf(ctx, x - 2, y - 3, Math.PI + 0.3, 27, 9)
  leaf(ctx, x + 2, y - 3, -0.3, 27, 9)
  stem(ctx, [x, y - 4, x - 7, y - 22, hx - 12, hy + 30, hx - 4, hy + 12], pal.dark, pal.base)
  peaHead(ctx, hx, hy, 1, pal, recoil, crest, brow)
}

function threepeater(ctx: Ctx, x: number, y: number, v: PlantView) {
  const sway = Math.sin(v.t * 2.1) * 1.5
  const recoil = clamp((v.anim ?? 0) / 0.2, 0, 1)
  leaf(ctx, x - 2, y - 3, Math.PI + 0.3, 27, 9)
  leaf(ctx, x + 2, y - 3, -0.3, 27, 9)
  const heads = [
    { x: x + 4 + sway, y: y - 92 },
    { x: x - 22 + sway * 0.6, y: y - 56 },
    { x: x + 24 + sway * 0.8, y: y - 50 },
  ]
  stem(ctx, [x, y - 4, x, y - 20, x, y - 30, x, y - 38], PEA.dark, PEA.base, 9)
  for (const h of heads) stem(ctx, [x, y - 36, x, y - 46, h.x - 10, h.y + 22, h.x - 4, h.y + 10], PEA.dark, PEA.base, 7)
  for (const h of heads) peaHead(ctx, h.x - recoil * 2, h.y, 0.72, PEA, recoil, 'leaf')
}

function sunflower(ctx: Ctx, x: number, y: number, v: PlantView) {
  const sw = Math.sin(v.t * 1.8)
  const hx = x + sw * 3
  const hy = y - 66 + Math.abs(sw) * 1.2
  leaf(ctx, x - 2, y - 4, Math.PI + 0.25, 28, 10)
  leaf(ctx, x + 2, y - 4, -0.25, 28, 10)
  leaf(ctx, x, y - 30, -0.7, 20, 7)
  stem(ctx, [x, y - 4, x - 2, y - 26, hx + 2, hy + 34, hx, hy + 14], '#2e6e17', '#56b02c')
  const glow = clamp(v.anim ?? 0, 0, 1)
  if (glow > 0) {
    circle(ctx, hx, hy, 56)
    paint(ctx, radial(ctx, hx, hy, 10, hx, hy, 56, [[0, '#fff3a0'], [1, '#fff3a000']]))
  }
  ctx.save()
  ctx.translate(hx, hy)
  ctx.rotate(sw * 0.07)
  for (let i = 0; i < 16; i++) {
    ctx.save()
    ctx.rotate((i / 16) * TAU + v.t * 0.05)
    ellipse(ctx, 0, -27, 7.6, 13.5)
    paint(ctx, linear(ctx, 0, -41, 0, -14, [[0, '#ffef6b'], [1, '#ffb41a']]), C('#c98300'), 1.6)
    ctx.restore()
  }
  circle(ctx, 0, 0, 20)
  paint(ctx, radial(ctx, -5, -6, 2, 0, 0, 21, [[0, '#d99a4a'], [0.7, '#9b5a1d'], [1, '#7a4312']]), C('#4f2a0b'), 2.2)
  ctx.fillStyle = C('#7a4312')
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4
    const r = 6 + (i % 3) * 4
    circle(ctx, Math.cos(a) * r, Math.sin(a) * r + 2, 1.2)
    ctx.fill()
  }
  const blink = Math.sin(v.t * 0.9) > 0.97
  if (blink) {
    ctx.lineWidth = 2.2
    ctx.strokeStyle = C('#2a1606')
    ctx.beginPath()
    ctx.moveTo(-10, -4)
    ctx.lineTo(-4, -4)
    ctx.moveTo(4, -4)
    ctx.lineTo(10, -4)
    ctx.stroke()
  } else {
    for (const ex of [-7, 7]) {
      ellipse(ctx, ex, -4, 3.3, 4.8)
      paint(ctx, C('#2a1606'))
      circle(ctx, ex + 1, -6, 1.3)
      paint(ctx, '#ffffff')
    }
  }
  ctx.beginPath()
  ctx.arc(0, 2, 8.5, 0.18 * Math.PI, 0.82 * Math.PI)
  ctx.lineWidth = 2.4
  ctx.lineCap = 'round'
  ctx.strokeStyle = C('#2a1606')
  ctx.stroke()
  for (const cx of [-13, 13]) {
    ellipse(ctx, cx, 5, 3.6, 2.2)
    paint(ctx, 'rgba(255,110,80,0.45)')
  }
  ctx.restore()
}

type NutPal = [string, string, string, string]
const NUT: NutPal = ['#f3c98a', '#c88a44', '#9a5e26', '#5b3311']
const NUT_RED: NutPal = ['#ffb09a', '#e0553a', '#a8291a', '#5a0f08']

function nut(ctx: Ctx, x: number, cy: number, rx: number, ry: number, v: PlantView, pal: NutPal = NUT, rolling = false) {
  const hp = v.hp ?? 1
  ctx.save()
  ctx.translate(x, cy)
  if (v.rot) ctx.rotate(v.rot)
  ellipse(ctx, 0, 0, rx, ry)
  paint(ctx, radial(ctx, -rx * 0.35, -ry * 0.42, 3, 0, 0, Math.max(rx, ry) * 1.05, [[0, pal[0]], [0.62, pal[1]], [1, pal[2]]]), C(pal[3]), 3)
  ctx.lineWidth = 1.7
  ctx.strokeStyle = C(pal[2])
  ctx.beginPath()
  ctx.arc(-rx * 0.5, ry * 0.15, rx * 0.35, 0.3, 1.6)
  ctx.moveTo(rx * 0.55, ry * 0.42)
  ctx.arc(rx * 0.35, ry * 0.42, rx * 0.2, 0, 1.4)
  ctx.moveTo(-rx * 0.2, ry * 0.7)
  ctx.lineTo(rx * 0.05, ry * 0.62)
  ctx.stroke()
  if (hp < 0.67) {
    ctx.lineWidth = 2
    ctx.strokeStyle = C(pal[3])
    ctx.beginPath()
    ctx.moveTo(rx * 0.25, -ry * 0.98)
    ctx.lineTo(rx * 0.1, -ry * 0.7)
    ctx.lineTo(rx * 0.32, -ry * 0.5)
    ctx.lineTo(rx * 0.18, -ry * 0.3)
    ctx.stroke()
  }
  if (hp < 0.34) {
    ctx.beginPath()
    ctx.moveTo(-rx * 0.95, -ry * 0.1)
    ctx.lineTo(-rx * 0.6, ry * 0.05)
    ctx.lineTo(-rx * 0.7, ry * 0.3)
    ctx.lineTo(-rx * 0.4, ry * 0.45)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(rx * 0.55, -ry * 0.82)
    ctx.lineTo(rx * 0.95, -ry * 0.3)
    ctx.lineTo(rx * 0.68, -ry * 0.5)
    ctx.closePath()
    paint(ctx, C(pal[3]))
  }
  const ey = -ry * 0.22
  const look = rolling ? 0 : 2.4
  if (hp < 0.34) {
    eye(ctx, rx * 0.08, ey, 6, 7.5, look, 2, 3)
    eye(ctx, rx * 0.52, ey, 6, 6.5, look, 2, 3)
    ctx.lineWidth = 2.6
    ctx.strokeStyle = C(pal[3])
    ctx.beginPath()
    ctx.moveTo(rx * 0.08 - 7, ey - 13)
    ctx.lineTo(rx * 0.08 + 5, ey - 9)
    ctx.moveTo(rx * 0.52 - 4, ey - 9)
    ctx.lineTo(rx * 0.52 + 7, ey - 13)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(rx * 0.3, ey + 22, 6, 1.15 * Math.PI, 1.85 * Math.PI)
    ctx.stroke()
  } else {
    eye(ctx, rx * 0.08, ey, 6.5, 8.5, look, 0.5, 3.3)
    eye(ctx, rx * 0.52, ey, 6.5, 8.5, look, 0.5, 3.3)
    if (hp < 0.67) {
      ctx.lineWidth = 2.2
      ctx.strokeStyle = C(pal[3])
      ctx.beginPath()
      ctx.moveTo(rx * 0.08 - 6, ey - 12)
      ctx.lineTo(rx * 0.08 + 6, ey - 14)
      ctx.stroke()
    }
  }
  ctx.restore()
}

function cherry(ctx: Ctx, x: number, y: number, v: PlantView) {
  const fuse = v.state === 'fuse' ? v.stateT ?? 0 : 0
  const s = 1 + fuse * 0.32
  const jit = fuse > 0 ? Math.sin(v.t * 70) * fuse * 3 : 0
  ctx.save()
  ctx.translate(x + jit, y)
  ctx.scale(s, s)
  ctx.lineCap = 'round'
  ctx.lineWidth = 3.4
  ctx.strokeStyle = C('#3d7a1f')
  ctx.beginPath()
  ctx.moveTo(-13, -38)
  ctx.quadraticCurveTo(-8, -66, 3, -76)
  ctx.moveTo(15, -44)
  ctx.quadraticCurveTo(12, -64, 3, -76)
  ctx.stroke()
  leaf(ctx, 3, -76, -0.5, 22, 8)
  const red = fuse > 0.5 ? '#ff2a2a' : '#ff7b7b'
  for (const [cx, cy] of [
    [-14, -24],
    [15, -30],
  ]) {
    circle(ctx, cx, cy, 17.5)
    paint(ctx, radial(ctx, cx - 6, cy - 7, 2, cx, cy, 19, [[0, red], [0.7, '#d01b2b'], [1, '#93101c']]), C('#5e0610'), 2.5)
    ellipse(ctx, cx - 7, cy - 8, 4, 2.4, -0.6)
    paint(ctx, 'rgba(255,255,255,0.75)')
    ctx.lineWidth = 2.6
    ctx.strokeStyle = C('#3a0208')
    ctx.beginPath()
    ctx.moveTo(cx - 10, cy - 8)
    ctx.lineTo(cx - 2, cy - 4)
    ctx.moveTo(cx + 9, cy - 8)
    ctx.lineTo(cx + 2, cy - 4)
    ctx.stroke()
    circle(ctx, cx - 5, cy, 2.4)
    paint(ctx, C('#1a0204'))
    circle(ctx, cx + 5, cy, 2.4)
    paint(ctx, C('#1a0204'))
    ctx.beginPath()
    ctx.arc(cx, cy + 10, 4.5, 1.15 * Math.PI, 1.85 * Math.PI)
    ctx.stroke()
  }
  ctx.restore()
}

function jalapeno(ctx: Ctx, x: number, y: number, v: PlantView) {
  const fuse = v.state === 'fuse' ? v.stateT ?? 0 : 0
  const sx = 1 + fuse * 0.5
  const sy = 1 - fuse * 0.15
  const jit = fuse > 0 ? Math.sin(v.t * 70) * fuse * 3 : Math.sin(v.t * 2) * 1.2
  ctx.save()
  ctx.translate(x + jit, y)
  ctx.scale(sx, sy)
  ctx.beginPath()
  ctx.moveTo(0, -86)
  ctx.bezierCurveTo(20, -84, 18, -40, 10, -14)
  ctx.quadraticCurveTo(4, 2, -4, -4)
  ctx.bezierCurveTo(-18, -26, -20, -80, 0, -86)
  paint(ctx, linear(ctx, -16, 0, 18, 0, [[0, '#ff6b4f'], [0.45, '#e02719'], [1, '#9e1208']]), C('#560904'), 2.6)
  ellipse(ctx, -7, -62, 3, 12, 0.1)
  paint(ctx, 'rgba(255,255,255,0.45)')
  ctx.lineCap = 'round'
  ctx.lineWidth = 4
  ctx.strokeStyle = C('#3f8a1e')
  ctx.beginPath()
  ctx.moveTo(0, -86)
  ctx.quadraticCurveTo(4, -100, 14, -98)
  ctx.stroke()
  ctx.lineWidth = 2.6
  ctx.strokeStyle = C('#3a0705')
  ctx.beginPath()
  ctx.moveTo(-9, -60)
  ctx.lineTo(-2, -55)
  ctx.moveTo(11, -60)
  ctx.lineTo(4, -55)
  ctx.stroke()
  circle(ctx, -3, -51, 2.6)
  paint(ctx, C('#1a0202'))
  circle(ctx, 6, -51, 2.6)
  paint(ctx, C('#1a0202'))
  rrect(ctx, -5, -42, 12, 6, 2)
  paint(ctx, C('#3a0705'))
  ctx.restore()
}

function potato(ctx: Ctx, x: number, y: number, v: PlantView) {
  const armed = v.state === 'armed'
  if (!armed) {
    ellipse(ctx, x, y - 6, 26, 10)
    paint(ctx, radial(ctx, x - 6, y - 10, 2, x, y - 6, 26, [[0, '#a87445'], [1, '#6b4422']]), C('#4a2c12'), 2)
    ellipse(ctx, x, y - 12, 13, 6)
    paint(ctx, C('#c8954f'), C('#6b4422'), 1.8)
    const grow = clamp((v.stateT ?? 0) / 15, 0, 1)
    ctx.lineWidth = 2.4
    ctx.strokeStyle = C('#3f8a1e')
    ctx.beginPath()
    ctx.moveTo(x, y - 16)
    ctx.lineTo(x + 1, y - 22 - grow * 8)
    ctx.stroke()
    circle(ctx, x + 1, y - 24 - grow * 8, 2.5 + grow * 1.5)
    paint(ctx, C(grow > 0.95 ? '#ff4040' : '#8a2020'))
    return
  }
  const pop = Math.sin(v.t * 3) * 1
  ellipse(ctx, x, y - 22 + pop, 25, 21)
  paint(ctx, radial(ctx, x - 8, y - 30, 3, x, y - 22, 26, [[0, '#f0c886'], [0.7, '#c8954f'], [1, '#9a6a30']]), C('#5e3c14'), 2.5)
  ctx.fillStyle = C('#9a6a30')
  for (const [dx, dy] of [
    [-12, -14],
    [10, -10],
    [-4, -32],
    [14, -26],
  ]) {
    circle(ctx, x + dx, y + dy + pop, 1.8)
    ctx.fill()
  }
  eye(ctx, x - 3, y - 26 + pop, 4.5, 5.5, 1.5, 0.5, 2.3)
  eye(ctx, x + 9, y - 26 + pop, 4.5, 5.5, 1.5, 0.5, 2.3)
  ctx.lineWidth = 2.2
  ctx.strokeStyle = C('#5a5a5a')
  ctx.beginPath()
  ctx.moveTo(x + 1, y - 42 + pop)
  ctx.lineTo(x + 3, y - 55 + pop)
  ctx.stroke()
  const blink = Math.floor(v.t * 3) % 2 === 0
  if (blink) {
    circle(ctx, x + 3, y - 58 + pop, 11)
    paint(ctx, radial(ctx, x + 3, y - 58 + pop, 1, x + 3, y - 58 + pop, 11, [[0, '#ff4a4aaa'], [1, '#ff4a4a00']]))
  }
  circle(ctx, x + 3, y - 58 + pop, 4.5)
  paint(ctx, C(blink ? '#ff3a3a' : '#9a1c1c'), C('#3a0a0a'), 1.4)
  ellipse(ctx, x, y - 4, 32, 9)
  paint(ctx, radial(ctx, x, y - 6, 2, x, y - 4, 32, [[0, '#9a6a3e'], [1, '#5e3a1a']]))
}

function chomper(ctx: Ctx, x: number, y: number, v: PlantView) {
  const st = v.state ?? 'ready'
  const sway = Math.sin(v.t * 1.7) * 2
  leaf(ctx, x - 2, y - 3, Math.PI + 0.35, 30, 10)
  leaf(ctx, x + 2, y - 3, -0.35, 30, 10)
  leaf(ctx, x - 2, y - 6, Math.PI + 0.9, 24, 8)
  const hx = x + 14 + sway
  const hy = y - 72
  stem(ctx, [x - 2, y - 4, x - 14, y - 30, hx - 30, hy + 30, hx - 16, hy + 10], '#2e6e17', '#56b02c', 9)
  ctx.save()
  ctx.translate(hx, hy)
  const purple = radial(ctx, -8, -12, 3, 0, 0, 38, [[0, '#e3a3ff'], [0.6, '#a548d6'], [1, '#6a1f99']])
  if (st === 'chew' || st === 'swallow') {
    const chew = st === 'chew' ? Math.sin(v.t * 9) * 3 : Math.sin(clamp((v.stateT ?? 0) / 0.6, 0, 1) * Math.PI) * 8
    ellipse(ctx, 0, 0, 32 + chew * 0.5, 26 - chew * 0.3)
    paint(ctx, purple, C('#3e0f5a'), 2.8)
    ctx.lineWidth = 2.2
    ctx.strokeStyle = C('#3e0f5a')
    ctx.beginPath()
    ctx.moveTo(-6, 6)
    for (let i = 0; i < 6; i++) ctx.lineTo(-2 + i * 6, i % 2 ? 2 : 8)
    ctx.stroke()
    ellipse(ctx, 6, 14 + chew * 0.4, 16, 6)
    paint(ctx, C('#8d34bd'))
  } else {
    const bite = st === 'bite' ? clamp((v.stateT ?? 0) / 0.32, 0, 1) : 0
    const open = st === 'bite' ? 1.25 * (1 - bite * bite) : 0.85 + Math.sin(v.t * 3) * 0.12
    const pivot = -20
    ellipse(ctx, 6, 2, 30, 18 * open + 4)
    paint(ctx, C('#5a0e2e'))
    ctx.save()
    ctx.translate(pivot, 0)
    ctx.rotate(-open * 0.5)
    ctx.translate(-pivot, 0)
    ctx.beginPath()
    ctx.ellipse(4, 0, 36, 28, 0, Math.PI, TAU)
    ctx.closePath()
    paint(ctx, purple, C('#3e0f5a'), 2.8)
    ctx.fillStyle = C('#ffffff')
    ctx.strokeStyle = C('#3e0f5a')
    ctx.lineWidth = 1.2
    for (let i = 0; i < 6; i++) {
      const tx = -18 + i * 9
      ctx.beginPath()
      ctx.moveTo(tx, 0)
      ctx.lineTo(tx + 4, 9)
      ctx.lineTo(tx + 8, 0)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      ctx.moveTo(-18 + i * 12, -24 + Math.abs(i - 1.5) * 2)
      ctx.lineTo(-14 + i * 12, -33 + Math.abs(i - 1.5) * 2)
      ctx.lineTo(-10 + i * 12, -24 + Math.abs(i - 1.5) * 2)
      ctx.closePath()
      paint(ctx, C('#f2e9ff'), C('#3e0f5a'), 1.2)
    }
    ctx.restore()
    ctx.save()
    ctx.translate(pivot, 0)
    ctx.rotate(open * 0.35)
    ctx.translate(-pivot, 0)
    ctx.beginPath()
    ctx.ellipse(4, 0, 32, 18, 0, 0, Math.PI)
    ctx.closePath()
    paint(ctx, purple, C('#3e0f5a'), 2.8)
    ctx.fillStyle = C('#ffffff')
    for (let i = 0; i < 5; i++) {
      const tx = -14 + i * 9
      ctx.beginPath()
      ctx.moveTo(tx, 1)
      ctx.lineTo(tx + 4, -7)
      ctx.lineTo(tx + 8, 1)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
    ctx.restore()
  }
  ctx.restore()
}

function squash(ctx: Ctx, x: number, y: number, v: PlantView) {
  const st = v.state ?? 'idle'
  let sy = 1
  let sx = 1
  if (st === 'aim') {
    sy = 1 - Math.sin(clamp((v.stateT ?? 0) / 0.45, 0, 1) * Math.PI) * 0.12
    sx = 2 - sy
  }
  if (st === 'done') {
    sy = 0.62
    sx = 1.25
  }
  const look = clamp(v.lookX ?? 3, -5, 5)
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(sx, sy)
  rrect(ctx, -27, -78, 54, 76, 24)
  paint(ctx, linear(ctx, -27, 0, 27, 0, [[0, '#6bab32'], [0.45, '#a8dc64'], [1, '#4d8a22']]), C('#2b5a12'), 3)
  ctx.lineWidth = 1.8
  ctx.strokeStyle = C('#4d8a22')
  ctx.beginPath()
  ctx.moveTo(-12, -74)
  ctx.quadraticCurveTo(-20, -40, -12, -6)
  ctx.moveTo(12, -74)
  ctx.quadraticCurveTo(20, -40, 12, -6)
  ctx.stroke()
  rrect(ctx, -5, -88, 10, 12, 3)
  paint(ctx, C('#7a5a2a'), C('#3e2a10'), 1.6)
  eye(ctx, -9, -52, 7, 7, look, 1, 3.4)
  eye(ctx, 10, -52, 7, 7, look, 1, 3.4)
  ctx.lineCap = 'round'
  ctx.lineWidth = 4
  ctx.strokeStyle = C('#1f3d0c')
  ctx.beginPath()
  ctx.moveTo(-18, -66)
  ctx.lineTo(-3, -59)
  ctx.moveTo(19, -66)
  ctx.lineTo(4, -59)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-9, -32)
  ctx.quadraticCurveTo(0, -38, 9, -32)
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.restore()
}

function spikeweed(ctx: Ctx, x: number, y: number, v: PlantView) {
  const poke = clamp((v.anim ?? 0) / 0.25, 0, 1) * 5
  ellipse(ctx, x, y - 6, 40, 10)
  paint(ctx, radial(ctx, x, y - 10, 3, x, y - 6, 40, [[0, '#86b84a'], [1, '#4a7422']]), C('#2d4a14'), 2)
  for (let i = -3; i <= 3; i++) {
    const sx = x + i * 10.5
    const h = 12 + (Math.abs(i) % 2 ? 0 : 4) + poke
    ctx.beginPath()
    ctx.moveTo(sx - 4.5, y - 8)
    ctx.lineTo(sx, y - 8 - h)
    ctx.lineTo(sx + 4.5, y - 8)
    ctx.closePath()
    paint(ctx, linear(ctx, sx - 4, 0, sx + 4, 0, [[0, '#f4f6f8'], [1, '#9aa2aa']]), C('#5b636b'), 1.3)
  }
  for (const dx of [-30, 30]) {
    ellipse(ctx, x + dx, y - 9, 8, 4, dx > 0 ? -0.4 : 0.4)
    paint(ctx, C('#6c9e36'), C('#2d4a14'), 1.4)
  }
}

export function flame(ctx: Ctx, x: number, y: number, s: number, t: number) {
  const layers: [string, number][] = [
    ['#ff3d14', 1],
    ['#ff9a1f', 0.72],
    ['#ffe86a', 0.44],
  ]
  circle(ctx, x, y - 26 * s, 60 * s)
  paint(ctx, radial(ctx, x, y - 26 * s, 4, x, y - 26 * s, 60 * s, [[0, '#ff9a3c66'], [1, '#ff9a3c00']]))
  layers.forEach(([col, k], i) => {
    const w = 23 * s * k
    const h = 60 * s * k
    const tip = Math.sin(t * 9 + i * 1.7) * 6 * s
    ctx.beginPath()
    ctx.moveTo(x - w, y)
    ctx.bezierCurveTo(x - w * 1.1, y - h * 0.5, x - w * 0.3 + tip, y - h * 0.7, x + tip, y - h - Math.sin(t * 7 + i) * 5 * s)
    ctx.bezierCurveTo(x + w * 0.4 + tip, y - h * 0.6, x + w * 1.1, y - h * 0.45, x + w, y)
    ctx.quadraticCurveTo(x, y + 6 * s * k, x - w, y)
    paint(ctx, C(col))
  })
}

function torchwood(ctx: Ctx, x: number, y: number, v: PlantView) {
  ctx.beginPath()
  ctx.moveTo(x - 30, y - 2)
  ctx.lineTo(x - 24, y - 64)
  ctx.lineTo(x + 24, y - 64)
  ctx.lineTo(x + 30, y - 2)
  ctx.quadraticCurveTo(x, y + 6, x - 30, y - 2)
  paint(ctx, linear(ctx, x - 30, 0, x + 30, 0, [[0, '#6a3812'], [0.4, '#a8662e'], [1, '#5c2f0e']]), C('#331905'), 2.8)
  ctx.lineWidth = 1.6
  ctx.strokeStyle = C('#4a2508')
  ctx.beginPath()
  for (const dx of [-16, -4, 10, 20]) {
    ctx.moveTo(x + dx, y - 58)
    ctx.quadraticCurveTo(x + dx + 3, y - 30, x + dx - 1, y - 6)
  }
  ctx.stroke()
  ellipse(ctx, x, y - 64, 24, 8)
  paint(ctx, C('#d49a58'), C('#5c2f0e'), 2)
  ellipse(ctx, x, y - 64, 14, 4.5)
  ctx.lineWidth = 1.4
  ctx.strokeStyle = C('#8a5424')
  ctx.stroke()
  for (const ex of [-10, 10]) {
    ellipse(ctx, x + ex, y - 40, 6, 7)
    paint(ctx, C('#2a1204'))
    circle(ctx, x + ex + 1.5, y - 40, 2.6)
    paint(ctx, C('#ffb23a'))
  }
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.strokeStyle = C('#2a1204')
  ctx.beginPath()
  ctx.moveTo(x - 17, y - 51)
  ctx.lineTo(x - 5, y - 47)
  ctx.moveTo(x + 17, y - 51)
  ctx.lineTo(x + 5, y - 47)
  ctx.stroke()
  ellipse(ctx, x, y - 24, 9, 5)
  paint(ctx, C('#2a1204'))
  ellipse(ctx, x, y - 23, 5, 2.5)
  paint(ctx, C('#ff7a1a'))
  flame(ctx, x, y - 64, 0.8, v.t)
}

function cabbage(ctx: Ctx, x: number, y: number, v: PlantView) {
  const a = v.anim ?? 0
  const rest = Math.PI + 0.55
  let angle = rest
  if (a > 0) {
    const p = 1 - a / 0.5
    angle = p < 0.3 ? rest + (-0.45 - rest) * (p / 0.3) : -0.45 + (rest + 0.45) * ((p - 0.3) / 0.7)
  }
  leaf(ctx, x - 4, y - 4, Math.PI + 0.25, 28, 10)
  leaf(ctx, x + 4, y - 4, -0.25, 28, 10)
  const by = y - 28 + Math.sin(v.t * 2) * 1
  const px = x - 2
  const py = by - 18
  ctx.save()
  ctx.translate(px, py)
  ctx.rotate(angle)
  ctx.lineCap = 'round'
  ctx.lineWidth = 6
  ctx.strokeStyle = C('#2d5e14')
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(34, 0)
  ctx.stroke()
  ctx.lineWidth = 3
  ctx.strokeStyle = C('#5fae2e')
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(38, 0, 9, 0, Math.PI)
  paint(ctx, C('#6b8e2a'), C('#2d5e14'), 2)
  if (v.loaded !== false) {
    circle(ctx, 38, -5, 8)
    paint(ctx, radial(ctx, 35, -8, 1, 38, -5, 9, [[0, '#e6ffb8'], [1, '#86c94a']]), C('#3a7a1a'), 1.5)
  }
  ctx.restore()
  circle(ctx, x, by, 24)
  paint(ctx, radial(ctx, x - 8, by - 9, 3, x, by, 25, [[0, '#dcff9e'], [0.6, '#92d651'], [1, '#4f9a26']]), C('#2d5e14'), 2.6)
  ctx.lineWidth = 1.6
  ctx.strokeStyle = C('#5fae2e')
  ctx.beginPath()
  ctx.arc(x - 18, by + 4, 16, -0.9, 0.6)
  ctx.moveTo(x + 22, by + 8)
  ctx.arc(x + 18, by + 4, 16, Math.PI - 0.6, Math.PI + 0.9, false)
  ctx.stroke()
  eye(ctx, x - 4, by - 2, 5, 6, 2, 0.5, 2.6)
  eye(ctx, x + 9, by - 2, 5, 6, 2, 0.5, 2.6)
  ctx.beginPath()
  ctx.arc(x + 3, by + 8, 5, 0.2 * Math.PI, 0.8 * Math.PI)
  ctx.lineWidth = 2
  ctx.strokeStyle = C('#1d3d0a')
  ctx.stroke()
}

export function drawPlant(ctx: Ctx, id: PlantId, x: number, y: number, v: PlantView) {
  switch (id) {
    case 'peashooter':
      return shooter(ctx, x, y, v, PEA, 'leaf')
    case 'snowpea':
      return shooter(ctx, x, y, v, SNOW, 'ice')
    case 'repeater':
      return shooter(ctx, x, y, v, REPEAT, 'double', true)
    case 'threepeater':
      return threepeater(ctx, x, y, v)
    case 'sunflower':
      return sunflower(ctx, x, y, v)
    case 'wallnut':
      return nut(ctx, x, y - 38, 30, 38, v)
    case 'tallnut':
      return nut(ctx, x, y - 62, 31, 62, v)
    case 'bowlnut':
      return nut(ctx, x, y - 30, 30, 30, v, NUT, true)
    case 'bombnut':
      return nut(ctx, x, y - 30, 30, 30, v, NUT_RED, true)
    case 'giantnut':
      return nut(ctx, x, y - 60, 60, 60, v, NUT, true)
    case 'cherry':
      return cherry(ctx, x, y, v)
    case 'jalapeno':
      return jalapeno(ctx, x, y, v)
    case 'potato':
      return potato(ctx, x, y, v)
    case 'chomper':
      return chomper(ctx, x, y, v)
    case 'squash':
      return squash(ctx, x, y, v)
    case 'spikeweed':
      return spikeweed(ctx, x, y, v)
    case 'torchwood':
      return torchwood(ctx, x, y, v)
    case 'cabbage':
      return cabbage(ctx, x, y, v)
  }
}

export function plantShadow(ctx: Ctx, x: number, y: number, w = 30) {
  ellipse(ctx, x, y, w, w * 0.28)
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.fill()
}
