import { CELL_H, CELL_W, COLS, LAWN_B, LAWN_R, LAWN_X, LAWN_Y, ROWS, VIEW_H, WORLD_W } from '../config'
import { circle, ellipse, linear, paint, radial, rrect, seeded, type Ctx } from '../util'

const SIDEWALK_X = LAWN_R + 40
const CURB_X = SIDEWALK_X + 108
const STREET_X = CURB_X + 12

function blob(ctx: Ctx, x: number, y: number, r: number, fill: string | CanvasGradient) {
  circle(ctx, x, y, r)
  ctx.fillStyle = fill
  ctx.fill()
}

function sky(ctx: Ctx, rnd: () => number) {
  ctx.fillStyle = linear(ctx, 0, 0, 0, 150, [
    [0, '#7cc7f2'],
    [1, '#d5f0ff'],
  ])
  ctx.fillRect(0, 0, WORLD_W, 150)
  for (let i = 0; i < 9; i++) {
    const cx = rnd() * WORLD_W
    const cy = 16 + rnd() * 30
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    for (let k = 0; k < 4; k++) {
      ellipse(ctx, cx + k * 18 - 27, cy + (k % 2) * 4, 22, 11)
      ctx.fill()
    }
  }
  // distant tree line
  for (let x = -20; x < WORLD_W + 40; x += 34 + rnd() * 20) {
    const r = 26 + rnd() * 22
    blob(ctx, x, 88 - rnd() * 18, r, '#4f8f45')
  }
  for (let x = -10; x < WORLD_W + 40; x += 30 + rnd() * 18) {
    const r = 18 + rnd() * 16
    blob(ctx, x, 104 - rnd() * 10, r, '#3f7a38')
  }
}

function fence(ctx: Ctx, x0: number, x1: number) {
  ctx.fillStyle = '#b08a5a'
  ctx.fillRect(x0, 70, x1 - x0, 8)
  ctx.fillRect(x0, 108, x1 - x0, 8)
  for (let x = x0; x < x1; x += 30) {
    ctx.beginPath()
    ctx.moveTo(x + 2, 128)
    ctx.lineTo(x + 2, 48)
    ctx.lineTo(x + 14, 36)
    ctx.lineTo(x + 26, 48)
    ctx.lineTo(x + 26, 128)
    ctx.closePath()
    paint(ctx, linear(ctx, x + 2, 0, x + 26, 0, [[0, '#f1dcb4'], [0.6, '#e2c38f'], [1, '#c49e6a']]), '#7e5c32', 2)
    ctx.strokeStyle = 'rgba(126,92,50,0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x + 10, 54)
    ctx.lineTo(x + 10, 120)
    ctx.stroke()
  }
}

function hedge(ctx: Ctx, x0: number, x1: number, y: number, rnd: () => number) {
  for (let x = x0; x < x1; x += 22) {
    const r = 18 + rnd() * 10
    blob(ctx, x, y + rnd() * 6, r, radial(ctx, x - 6, y - 8, 2, x, y, r, [[0, '#7ccf52'], [1, '#2f7a24']]))
  }
  for (let i = 0; i < (x1 - x0) / 9; i++) {
    blob(ctx, x0 + rnd() * (x1 - x0), y - 6 + rnd() * 16, 2.2, rnd() < 0.5 ? '#a6e27a' : '#24601b')
  }
}

function house(ctx: Ctx, rnd: () => number) {
  const w = 150
  ctx.fillStyle = linear(ctx, 0, 0, w, 0, [
    [0, '#c9b694'],
    [1, '#efe2c8'],
  ])
  ctx.fillRect(0, 0, w, VIEW_H)
  ctx.strokeStyle = 'rgba(120,96,60,0.35)'
  ctx.lineWidth = 1.5
  for (let y = 10; y < VIEW_H; y += 16) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  // roof eave
  ctx.fillStyle = '#6a3b26'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(w + 26, 0)
  ctx.lineTo(w + 26, 26)
  ctx.lineTo(0, 54)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#8a4e32'
  for (let x = 0; x < w + 26; x += 18) ctx.fillRect(x, 0, 14, 18 - x * 0.06)
  // window
  rrect(ctx, 28, 140, 86, 96, 4)
  paint(ctx, '#f5f0e6', '#5c4630', 4)
  ctx.fillStyle = linear(ctx, 0, 146, 0, 230, [
    [0, '#8fd0f0'],
    [1, '#3a6f95'],
  ])
  ctx.fillRect(34, 146, 74, 84)
  ctx.fillStyle = '#f5f0e6'
  ctx.fillRect(68, 146, 6, 84)
  ctx.fillRect(34, 185, 74, 6)
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.beginPath()
  ctx.moveTo(38, 150)
  ctx.lineTo(58, 150)
  ctx.lineTo(38, 176)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#b8483a'
  ctx.fillRect(22, 236, 98, 10)
  for (let i = 0; i < 6; i++) blob(ctx, 30 + i * 16, 234, 8, i % 2 ? '#ff7b9c' : '#ffd25a')
  // back door
  rrect(ctx, 34, 330, 80, 170, 6)
  paint(ctx, linear(ctx, 34, 0, 114, 0, [[0, '#7a4a2a'], [1, '#a8693c']]), '#3e2312', 4)
  rrect(ctx, 46, 346, 56, 54, 4)
  paint(ctx, '#e8d9a8', '#3e2312', 3)
  rrect(ctx, 46, 412, 56, 72, 4)
  paint(ctx, null, '#5c3418', 3)
  circle(ctx, 100, 440, 5)
  paint(ctx, '#e7c04a', '#7a5a14', 1.5)
  // steps
  for (let i = 0; i < 3; i++) {
    rrect(ctx, 22 - i * 6, 500 + i * 14, 104 + i * 12, 14, 3)
    paint(ctx, '#cfc6b8', '#8a8274', 2)
  }
  // foundation
  ctx.fillStyle = '#8f8a82'
  ctx.fillRect(0, VIEW_H - 40, w, 40)
  for (let i = 0; i < 18; i++) {
    rrect(ctx, (i % 6) * 26 - (Math.floor(i / 6) % 2) * 12, VIEW_H - 40 + Math.floor(i / 6) * 14, 24, 12, 3)
    paint(ctx, rnd() < 0.5 ? '#a19b92' : '#b3ada3', '#6f6a62', 1)
  }
}

function patio(ctx: Ctx, rnd: () => number) {
  const x0 = 150
  const x1 = LAWN_X
  ctx.fillStyle = '#d7cdb8'
  ctx.fillRect(x0, LAWN_Y - 8, x1 - x0, LAWN_B - LAWN_Y + 16)
  for (let y = LAWN_Y - 8; y < LAWN_B + 8; y += 38) {
    const off = (Math.round((y - LAWN_Y) / 38) % 2) * 28
    for (let x = x0 - off; x < x1; x += 56) {
      rrect(ctx, x + 2, y + 2, 52, 34, 5)
      const k = rnd()
      paint(ctx, k < 0.33 ? '#e2d9c6' : k < 0.66 ? '#d2c7af' : '#c8bca2', '#9c907a', 1.5)
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  ctx.fillRect(x1 - 8, LAWN_Y - 8, 8, LAWN_B - LAWN_Y + 16)
}

function lawn(ctx: Ctx, rows: number[], rnd: () => number) {
  for (let r = 0; r < ROWS; r++) {
    const active = rows.includes(r)
    const y = LAWN_Y + r * CELL_H
    for (let c = 0; c < COLS; c++) {
      const x = LAWN_X + c * CELL_W
      if (active) {
        const light = (r + c) % 2 === 0
        const base = r % 2 === 0 ? (light ? '#71c94a' : '#5fb83a') : light ? '#68c142' : '#57ad35'
        ctx.fillStyle = base
        ctx.fillRect(x, y, CELL_W, CELL_H)
        for (let i = 0; i < 26; i++) {
          const bx = x + rnd() * CELL_W
          const by = y + 6 + rnd() * (CELL_H - 8)
          ctx.strokeStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.13)' : 'rgba(20,70,10,0.18)'
          ctx.lineWidth = 1.6
          ctx.beginPath()
          ctx.moveTo(bx, by)
          ctx.lineTo(bx + (rnd() - 0.5) * 4, by - 5 - rnd() * 4)
          ctx.stroke()
        }
      } else {
        ctx.fillStyle = (r + c) % 2 ? '#9a7144' : '#a57a4b'
        ctx.fillRect(x, y, CELL_W, CELL_H)
        for (let i = 0; i < 16; i++) {
          ellipse(ctx, x + rnd() * CELL_W, y + rnd() * CELL_H, 1.5 + rnd() * 3, 1 + rnd() * 2)
          ctx.fillStyle = rnd() < 0.5 ? 'rgba(60,36,14,0.35)' : 'rgba(220,190,140,0.3)'
          ctx.fill()
        }
      }
    }
    if (!active) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(LAWN_X, y, COLS * CELL_W, 5)
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.07)'
      ctx.fillRect(LAWN_X, y + CELL_H - 4, COLS * CELL_W, 4)
    }
  }
  // flowers sprinkled on the lawn border
  for (let i = 0; i < 24; i++) {
    const fx = LAWN_X + rnd() * COLS * CELL_W
    blob(ctx, fx, LAWN_Y - 4 + rnd() * 6, 3.2, rnd() < 0.5 ? '#fff6d0' : '#ffd0e6')
  }
}

function street(ctx: Ctx, rnd: () => number) {
  // grass verge between lawn and sidewalk
  ctx.fillStyle = '#5aa936'
  ctx.fillRect(LAWN_R, LAWN_Y - 10, SIDEWALK_X - LAWN_R, VIEW_H)
  // sidewalk
  ctx.fillStyle = '#cfcac0'
  ctx.fillRect(SIDEWALK_X, 120, CURB_X - SIDEWALK_X, VIEW_H)
  ctx.strokeStyle = '#a39d92'
  ctx.lineWidth = 2
  for (let y = 120; y < VIEW_H; y += 64) {
    ctx.beginPath()
    ctx.moveTo(SIDEWALK_X, y)
    ctx.lineTo(CURB_X, y)
    ctx.stroke()
  }
  for (let i = 0; i < 60; i++) blob(ctx, SIDEWALK_X + rnd() * 108, 120 + rnd() * 600, 1.2, 'rgba(90,85,78,0.35)')
  ctx.fillStyle = '#e9e5dc'
  ctx.fillRect(CURB_X, 120, 12, VIEW_H)
  // asphalt
  ctx.fillStyle = linear(ctx, STREET_X, 0, WORLD_W, 0, [
    [0, '#4c4f54'],
    [1, '#5c6066'],
  ])
  ctx.fillRect(STREET_X, 120, WORLD_W - STREET_X, VIEW_H)
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)'
    ctx.fillRect(STREET_X + rnd() * (WORLD_W - STREET_X), 120 + rnd() * 600, 2, 2)
  }
  const cx = STREET_X + (WORLD_W - STREET_X) * 0.55
  ctx.fillStyle = '#e8c24a'
  for (let y = 130; y < VIEW_H; y += 70) ctx.fillRect(cx, y, 9, 40)
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(STREET_X + 120, 300)
  ctx.lineTo(STREET_X + 160, 330)
  ctx.lineTo(STREET_X + 150, 380)
  ctx.stroke()
  // houses across the street
  for (let i = 0; i < 3; i++) {
    const hx = STREET_X + 30 + i * 150
    ctx.fillStyle = ['#b9a58e', '#9fb0b8', '#c4a4a0'][i]
    ctx.fillRect(hx, 52, 110, 70)
    ctx.fillStyle = ['#6e4632', '#4e5f6e', '#7a3e3e'][i]
    ctx.beginPath()
    ctx.moveTo(hx - 10, 56)
    ctx.lineTo(hx + 55, 14)
    ctx.lineTo(hx + 120, 56)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#ffeaa6'
    ctx.fillRect(hx + 16, 72, 22, 20)
    ctx.fillRect(hx + 72, 72, 22, 20)
  }
  hedge(ctx, STREET_X - 4, WORLD_W + 20, 124, rnd)
}

/** Paints the whole battlefield once; the battle then blits the visible slice. */
export function renderWorld(rows: number[], scale: number): HTMLCanvasElement {
  const cv = document.createElement('canvas')
  cv.width = Math.ceil(WORLD_W * scale)
  cv.height = Math.ceil(VIEW_H * scale)
  const ctx = cv.getContext('2d')!
  ctx.scale(scale, scale)
  const rnd = seeded(20240611)
  sky(ctx, rnd)
  fence(ctx, 150, LAWN_R + 36)
  hedge(ctx, 150, LAWN_R + 40, 130, rnd)
  ctx.fillStyle = '#4d9a2e'
  ctx.fillRect(150, LAWN_Y - 10, LAWN_R - 150, 12)
  street(ctx, rnd)
  lawn(ctx, rows, rnd)
  ctx.fillStyle = '#3f8a26'
  ctx.fillRect(LAWN_X, LAWN_B, LAWN_R - LAWN_X + 40, VIEW_H - LAWN_B)
  hedge(ctx, 150, LAWN_R + 40, LAWN_B + 16, rnd)
  patio(ctx, rnd)
  house(ctx, rnd)
  return cv
}
