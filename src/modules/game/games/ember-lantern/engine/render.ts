import { BIOMES, GROUND_Y, H, MAX_DEPTH, SCALE, UH, UW, W, cardRect, clamp, easeOut } from './core'
import { ENEMY_DEFS } from './enemies'
import { RARITY_COLOR, RARITY_LABEL, UPGRADES } from './upgrades'
import type { Game } from './game'
import type { Enemy, Player, Projectile } from './types'

const FONT = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif'

const PALETTES = [
  {
    skyTop: '#091b25',
    skyBot: '#285653',
    moon: '#e3f5c2',
    far: '#112f38',
    near: '#193e42',
    ground: '#10282f',
    groundTop: '#76a995',
    groundLine: '#204047',
    plat: '#29484a',
    platTop: '#bed779',
    fog: 'rgba(255, 120, 80, 0.10)',
    slime: '#e08a4f',
  },
  {
    skyTop: '#171b39',
    skyBot: '#48478a',
    moon: '#eef7ff',
    far: '#282748',
    near: '#34345c',
    ground: '#20243f',
    groundTop: '#9eacdf',
    groundLine: '#303354',
    plat: '#3b406d',
    platTop: '#d8ecff',
    fog: 'rgba(150, 210, 255, 0.10)',
    slime: '#7fd0e8',
  },
]

type Ctx = CanvasRenderingContext2D

function px(ctx: Ctx, color: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

export function render(ctx: Ctx, g: Game) {
  const pal = PALETTES[g.biome]
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.imageSmoothingEnabled = false
  const sx = g.shake > 0.3 ? Math.round((Math.random() * 2 - 1) * g.shake) : 0
  const sy = g.shake > 0.3 ? Math.round((Math.random() * 2 - 1) * g.shake) : 0
  ctx.setTransform(SCALE, 0, 0, SCALE, sx * SCALE, sy * SCALE)

  drawBackground(ctx, g, pal)
  drawPlatforms(ctx, g, pal)
  if (g.state !== 'title') {
    drawMarks(ctx, g)
    drawPickups(ctx, g)
    for (const e of g.enemies) drawEnemy(ctx, g, e, pal)
    drawPlayer(ctx, g, g.player)
    for (const pr of g.projs) drawProjectile(ctx, g, pr)
  }
  for (const pt of g.particles) {
    ctx.globalAlpha = clamp(pt.life / pt.max, 0, 1)
    px(ctx, pt.color, pt.x, pt.y, pt.size, pt.size)
  }
  for (const a of g.ambient) {
    ctx.globalAlpha = clamp(Math.min(a.life, 1.5) / 1.5, 0, 1) * 0.8
    px(ctx, a.color, a.x, a.y, a.size, a.size)
  }
  ctx.globalAlpha = 1

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  if (g.flash > 0) {
    ctx.fillStyle = `rgba(255, 240, 230, ${g.flash * 0.35})`
    ctx.fillRect(0, 0, UW, UH)
  }
  drawTexts(ctx, g)
  if (g.state === 'play' || g.state === 'paused' || g.state === 'upgrade') drawHud(ctx, g)
  drawBanner(ctx, g)

  if (g.state === 'title') drawTitle(ctx, g)
  else if (g.state === 'upgrade') drawUpgrade(ctx, g)
  else if (g.state === 'paused') drawPaused(ctx)
  else if (g.state === 'dead' || g.state === 'victory') drawEnd(ctx, g)

  if (g.fade > 0) {
    ctx.fillStyle = `rgba(4, 4, 10, ${g.fade})`
    ctx.fillRect(0, 0, UW, UH)
  }
}

// ---------------------------------------------------------------- world

function drawBackground(ctx: Ctx, g: Game, pal: (typeof PALETTES)[number]) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
  sky.addColorStop(0, pal.skyTop)
  sky.addColorStop(1, pal.skyBot)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  for (const s of g.decor.stars) {
    if (Math.sin(g.time * 1.6 + s.p * 7) > 0.2) px(ctx, 'rgba(255,255,255,0.7)', s.x, s.y, 1, 1)
  }

  const moonX = 384
  const moonY = 54
  const glow = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 70)
  glow.addColorStop(0, g.biome === 0 ? 'rgba(246,217,154,0.35)' : 'rgba(220,240,255,0.35)')
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(moonX - 70, moonY - 70, 140, 140)
  ctx.fillStyle = pal.moon
  ctx.beginPath()
  ctx.arc(moonX, moonY, 20, 0, Math.PI * 2)
  ctx.fill()
  if (g.biome === 0) {
    ctx.fillStyle = pal.skyTop
    ctx.globalAlpha = 0.25
    ctx.beginPath()
    ctx.arc(moonX + 7, moonY - 4, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  for (const b of g.decor.far) {
    const top = GROUND_Y - 18 - b.h
    if (g.biome === 0) {
      px(ctx, pal.far, b.x, top, b.w, b.h + 18)
      for (let tier = 0; tier < 3; tier++) {
        const ty = top + tier * Math.floor(b.h / 3)
        px(ctx, pal.far, b.x - 5, ty, b.w + 10, 3)
        px(ctx, pal.far, b.x - 2, ty - 2, b.w + 4, 2)
      }
      if (b.h > 80) px(ctx, 'rgba(255,170,90,0.35)', b.x + b.w / 2 - 2, top + 18, 3, 4)
    } else {
      ctx.fillStyle = pal.far
      ctx.beginPath()
      ctx.moveTo(b.x - b.w, GROUND_Y)
      ctx.lineTo(b.x + b.w / 2, top)
      ctx.lineTo(b.x + b.w * 2, GROUND_Y)
      ctx.fill()
      ctx.fillStyle = 'rgba(230,245,255,0.18)'
      ctx.beginPath()
      ctx.moveTo(b.x + b.w / 2 - 8, top + 10)
      ctx.lineTo(b.x + b.w / 2, top)
      ctx.lineTo(b.x + b.w / 2 + 8, top + 10)
      ctx.fill()
    }
  }

  for (const n of g.decor.near) {
    const top = GROUND_Y - n.h
    px(ctx, pal.near, n.x, top, n.w, n.h)
    px(ctx, pal.near, n.x - 4, top, n.w + 8, 3)
  }

  if (g.biome === 0) {
    for (const l of g.decor.lanterns) {
      const sway = Math.sin(g.time * 1.4 + l.x) * 1.5
      const ly = l.y + l.len
      ctx.strokeStyle = 'rgba(20,10,20,0.8)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(l.x + 0.5, 0)
      ctx.lineTo(l.x + sway + 0.5, ly)
      ctx.stroke()
      const glowL = ctx.createRadialGradient(l.x + sway, ly + 4, 1, l.x + sway, ly + 4, 16)
      glowL.addColorStop(0, 'rgba(255,120,70,0.45)')
      glowL.addColorStop(1, 'rgba(255,120,70,0)')
      ctx.fillStyle = glowL
      ctx.fillRect(l.x + sway - 16, ly - 12, 32, 32)
      px(ctx, '#c9363e', l.x + sway - 3, ly, 7, 8)
      px(ctx, '#ff8a5c', l.x + sway - 2, ly + 2, 5, 4)
      px(ctx, '#3a1a20', l.x + sway - 2, ly - 1, 5, 1)
      px(ctx, '#3a1a20', l.x + sway - 2, ly + 8, 5, 1)
    }
  }

  const fog = ctx.createLinearGradient(0, GROUND_Y - 60, 0, GROUND_Y)
  fog.addColorStop(0, 'rgba(0,0,0,0)')
  fog.addColorStop(1, pal.fog)
  ctx.fillStyle = fog
  ctx.fillRect(0, GROUND_Y - 60, W, 60)

  px(ctx, pal.ground, 0, GROUND_Y, W, H - GROUND_Y)
  px(ctx, pal.groundTop, 0, GROUND_Y, W, 2)
  for (let x = 0; x < W; x += 16) {
    px(ctx, pal.groundLine, x, GROUND_Y + 2, 1, H - GROUND_Y)
    px(ctx, pal.groundLine, x + 8, GROUND_Y + 14, 1, H - GROUND_Y)
  }
  px(ctx, pal.groundLine, 0, GROUND_Y + 14, W, 1)
}

function drawPlatforms(ctx: Ctx, g: Game, pal: (typeof PALETTES)[number]) {
  for (const p of g.platforms) {
    px(ctx, pal.plat, p.x, p.y, p.w, p.h)
    px(ctx, pal.platTop, p.x, p.y, p.w, 1)
    for (let x = p.x + 6; x < p.x + p.w - 4; x += 20) px(ctx, pal.plat, x, p.y + p.h, 2, 5)
  }
}

function drawMarks(ctx: Ctx, g: Game) {
  for (const m of g.marks) {
    const prog = 1 - m.t / m.max
    const h = ENEMY_DEFS[m.kind].h
    const cy = m.bottom - h / 2
    ctx.strokeStyle = ENEMY_DEFS[m.kind].boss ? 'rgba(255,138,92,0.9)' : 'rgba(201,167,255,0.85)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(m.x, cy, 4 + (1 - prog) * 14, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 0.25 + prog * 0.5
    px(ctx, ENEMY_DEFS[m.kind].boss ? '#ff8a5c' : '#c9a7ff', m.x - 1, m.bottom - h - 10, 2, h + 10)
    ctx.globalAlpha = 1
  }
}

function drawPickups(ctx: Ctx, g: Game) {
  for (const k of g.pickups) {
    const bob = Math.sin(g.time * 6 + k.x) * 1
    const glow = ctx.createRadialGradient(k.x, k.y + bob, 1, k.x, k.y + bob, 8)
    glow.addColorStop(0, 'rgba(142,240,166,0.6)')
    glow.addColorStop(1, 'rgba(142,240,166,0)')
    ctx.fillStyle = glow
    ctx.fillRect(k.x - 8, k.y - 8 + bob, 16, 16)
    px(ctx, '#8ef0a6', k.x - 2, k.y - 1 + bob, 5, 3)
    px(ctx, '#8ef0a6', k.x - 1, k.y - 2 + bob, 3, 5)
    px(ctx, '#e8fff0', k.x, k.y + bob, 1, 1)
  }
}

function drawPlayer(ctx: Ctx, g: Game, p: Player) {
  if (g.state === 'dead') return
  if (p.invuln > 0 && p.dashT <= 0 && Math.floor(g.time * 20) % 2 === 0) return
  const white = p.hurtT > 0.18
  const c = (col: string) => (white ? '#ffffff' : col)
  const x = Math.round(p.x)
  const y = Math.round(p.y)
  const f = p.face

  if (p.dashT > 0) {
    for (let i = 1; i <= 3; i++) {
      ctx.globalAlpha = 0.18 * (4 - i)
      px(ctx, '#e4b863', x - f * i * 7 + 1, y + 6, 10, 12)
    }
    ctx.globalAlpha = 1
  }

  const sway = Math.sin(g.time * 10) * 1.5
  const scarfBase = f > 0 ? x + 3 : x + p.w - 6
  for (let i = 0; i < 5; i++) {
    const lift = p.vy < 0 ? -i * 0.6 : p.vy > 60 ? -i * 1.2 : 0
    px(ctx, c(i % 2 ? '#c9952f' : '#e4b863'), scarfBase - f * (i * 3 + 2), y + 7 + lift + (i > 0 ? sway * (i / 4) : 0), 3, 2)
  }

  const running = p.onGround && Math.abs(p.vx) > 20
  const stepA = running && Math.floor(g.time * 12) % 2 === 0
  if (p.onGround) {
    px(ctx, c('#141522'), x + 2, y + 15 + (stepA ? 1 : 0), 3, stepA ? 4 : 5)
    px(ctx, c('#141522'), x + 7, y + 15 + (stepA ? 0 : 1), 3, stepA ? 5 : 4)
  } else {
    px(ctx, c('#141522'), x + 2, y + 14, 3, 4)
    px(ctx, c('#141522'), x + 7, y + 15, 3, 4)
  }

  px(ctx, c('#2d3150'), x + 1, y + 8, 10, 8)
  px(ctx, c('#3f4670'), x + 1, y + 8, 10, 2)
  px(ctx, c('#b8862f'), x + 1, y + 13, 10, 1)
  px(ctx, c('#f1d7b8'), x + 3, y + 2, 7, 6)
  px(ctx, c('#16141f'), x + 2, y, 9, 3)
  px(ctx, c('#16141f'), f > 0 ? x + 2 : x + 9, y + 2, 2, 4)
  px(ctx, c('#16141f'), f > 0 ? x + 8 : x + 4, y + 4, 1, 2)

  if (p.attackT > 0) {
    drawSlash(ctx, p)
  } else {
    ctx.strokeStyle = c('#cfd6e6')
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x + 6 - f * 6 + 0.5, y + 17)
    ctx.lineTo(x + 6 - f * 1 + 0.5, y + 5)
    ctx.stroke()
    px(ctx, c('#b8862f'), x + 6 - f * 5, y + 14, 2, 2)
  }
}

const SWINGS: [number, number][] = [
  [-1.9, 1.0],
  [1.2, -1.5],
  [-2.4, 1.6],
]

function drawSlash(ctx: Ctx, p: Player) {
  const prog = 1 - p.attackT / p.attackDur
  const [a0, a1] = SWINGS[p.combo]
  const sweep = easeOut(clamp(prog * 1.4, 0, 1))
  const cur = a0 + (a1 - a0) * sweep
  const tail = a0 + (a1 - a0) * Math.max(0, sweep - 0.55)
  const cx = p.x + p.w / 2 + p.face * 3
  const cy = p.y + 10
  const r = p.combo === 2 ? 30 : 22
  const mirror = (a: number) => (p.face > 0 ? a : Math.PI - a)
  const ccw = p.face > 0 ? a1 < a0 : a1 > a0
  const alpha = 1 - Math.max(0, prog - 0.5) * 2

  ctx.lineCap = 'round'
  ctx.strokeStyle = `rgba(242, 198, 109, ${0.55 * alpha})`
  ctx.lineWidth = p.combo === 2 ? 7 : 5
  ctx.beginPath()
  ctx.arc(cx, cy, r - 3, mirror(tail), mirror(cur), ccw)
  ctx.stroke()
  ctx.strokeStyle = `rgba(255, 250, 235, ${alpha})`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r, mirror(tail), mirror(cur), ccw)
  ctx.stroke()
  ctx.lineCap = 'butt'

  const blade = mirror(cur)
  ctx.strokeStyle = '#e8edf7'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + Math.cos(blade) * (r - 4), cy + Math.sin(blade) * (r - 4))
  ctx.stroke()
}

function drawEnemy(ctx: Ctx, g: Game, e: Enemy, pal: (typeof PALETTES)[number]) {
  const white = e.hurtT > 0
  const c = (col: string) => (white ? '#ffffff' : col)
  const x = Math.round(e.x)
  const y = Math.round(e.y)
  const f = e.face
  const warn = e.state === 'wind' || e.state === 'aim' || e.state.endsWith('Wind')
  const blink = warn && Math.floor(g.time * 16) % 2 === 0

  switch (e.kind) {
    case 'slime': {
      const squash = e.onGround ? 0 : 2
      px(ctx, c(pal.slime), x + 1, y + squash, e.w - 2, e.h - squash)
      px(ctx, c(pal.slime), x, y + 3 + squash, e.w, e.h - 3 - squash)
      px(ctx, c('rgba(255,255,255,0.35)'), x + 3, y + 1 + squash, 3, 2)
      px(ctx, c('#1a1020'), x + (f > 0 ? 8 : 3), y + 4 + squash, 2, 2)
      px(ctx, c('#1a1020'), x + (f > 0 ? 11 : 6), y + 4 + squash, 1, 2)
      break
    }
    case 'bat': {
      const flap = Math.sin(g.time * 18 + e.id) > 0
      ctx.fillStyle = c('#3b2550')
      ctx.beginPath()
      ctx.moveTo(x + 4, y + 3)
      ctx.lineTo(x - 5, y + (flap ? -4 : 7))
      ctx.lineTo(x + 1, y + 6)
      ctx.moveTo(x + 8, y + 3)
      ctx.lineTo(x + 17, y + (flap ? -4 : 7))
      ctx.lineTo(x + 11, y + 6)
      ctx.fill()
      px(ctx, c('#4d3170'), x + 3, y + 1, 6, 6)
      px(ctx, c(blink ? '#ffffff' : '#ff5a6e'), x + 4, y + 3, 1, 1)
      px(ctx, c(blink ? '#ffffff' : '#ff5a6e'), x + 7, y + 3, 1, 1)
      break
    }
    case 'archer': {
      px(ctx, c('#2a2238'), x + 2, y + 6, 8, 10)
      px(ctx, c('#3d3352'), x + 1, y, 10, 7)
      px(ctx, c('#16121f'), x + 3, y + 3, 6, 3)
      px(ctx, c('#ffd7a0'), x + (f > 0 ? 6 : 4), y + 4, 2, 1)
      px(ctx, c('#1a1622'), x + 2, y + 16, 3, 2)
      px(ctx, c('#1a1622'), x + 7, y + 16, 3, 2)
      ctx.strokeStyle = c(blink ? '#ffffff' : '#a07a4a')
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x + 6 + f * 4, y + 9, 6, f > 0 ? -1.2 : Math.PI - 1.2, f > 0 ? 1.2 : Math.PI + 1.2, f < 0)
      ctx.stroke()
      break
    }
    case 'brute': {
      const charging = e.state === 'charge'
      px(ctx, c('#3a3442'), x + 2, y + 6, 16, 14)
      px(ctx, c('#57506a'), x, y + 8, 20, 6)
      px(ctx, c('#4a4258'), x + 4, y, 12, 8)
      px(ctx, c('#d9cbb0'), x + (f > 0 ? 15 : 1), y - 2, 3, 4)
      px(ctx, c('#d9cbb0'), x + (f > 0 ? 2 : 16), y - 2, 2, 3)
      px(ctx, c(blink || charging ? '#ffffff' : '#ff6a3d'), x + (f > 0 ? 11 : 6), y + 3, 3, 2)
      px(ctx, c('#221e2a'), x + 3, y + 20, 5, 4)
      px(ctx, c('#221e2a'), x + 12, y + 20, 5, 4)
      if (charging) {
        ctx.globalAlpha = 0.35
        px(ctx, '#ff6a3d', x - f * 8, y + 8, 8, 10)
        ctx.globalAlpha = 1
      }
      break
    }
    case 'wisp': {
      const r = 5 + Math.sin(g.time * 8 + e.id) * 1
      const glow = ctx.createRadialGradient(x + 5, y + 5, 1, x + 5, y + 5, 14)
      glow.addColorStop(0, blink ? 'rgba(255,255,255,0.7)' : 'rgba(150,220,255,0.55)')
      glow.addColorStop(1, 'rgba(150,220,255,0)')
      ctx.fillStyle = glow
      ctx.fillRect(x - 9, y - 9, 28, 28)
      ctx.fillStyle = c('#bfe9ff')
      ctx.beginPath()
      ctx.arc(x + 5, y + 5, r, 0, Math.PI * 2)
      ctx.fill()
      px(ctx, c('#1a3050'), x + 3, y + 4, 1, 2)
      px(ctx, c('#1a3050'), x + 6, y + 4, 1, 2)
      break
    }
    case 'warden':
      drawWarden(ctx, g, e, c, blink)
      break
    case 'frost':
      drawFrost(ctx, g, e, c, blink)
      break
  }

  if (!e.boss && e.hp < e.maxHp) {
    px(ctx, 'rgba(0,0,0,0.6)', x, y - 5, e.w, 2)
    px(ctx, '#ff6b7d', x, y - 5, Math.max(1, (e.w * e.hp) / e.maxHp), 2)
  }
}

function drawWarden(ctx: Ctx, g: Game, e: Enemy, c: (s: string) => string, blink: boolean) {
  const x = Math.round(e.x)
  const y = Math.round(e.y)
  const f = e.face
  const rage = e.phase === 2
  const core = rage ? '#ff5a3c' : '#ffb067'
  const glow = ctx.createRadialGradient(x + 17, y + 20, 2, x + 17, y + 20, 34)
  glow.addColorStop(0, rage ? 'rgba(255,90,60,0.35)' : 'rgba(255,176,103,0.3)')
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(x - 20, y - 16, 74, 72)

  px(ctx, c('#3a3036'), x + 4, y + 10, 26, 22)
  px(ctx, c('#4d4048'), x, y + 12, 34, 8)
  px(ctx, c('#5c4c55'), x + 8, y, 18, 12)
  px(ctx, c('#2a2228'), x + 6, y - 3, 22, 4)
  px(ctx, c('#2a2228'), x + 14, y - 7, 6, 4)
  px(ctx, c(blink ? '#ffffff' : core), x + (f > 0 ? 18 : 10), y + 5, 6, 2)
  px(ctx, c('#2a2228'), x + 11, y + 18, 12, 10)
  px(ctx, c(core), x + 13, y + 20, 8, 6)
  px(ctx, c('#fff1c9'), x + 15, y + 22, 4, 2)
  px(ctx, c('#2a2228'), x + 5, y + 32, 9, 8)
  px(ctx, c('#2a2228'), x + 20, y + 32, 9, 8)
  const arm = e.state === 'slamAir' ? -8 : e.state === 'volleyWind' ? -4 : 0
  px(ctx, c('#4d4048'), x + (f > 0 ? 30 : -4), y + 14 + arm, 8, 14)
  px(ctx, c('#4d4048'), x + (f > 0 ? -4 : 30), y + 14, 8, 12)
}

function drawFrost(ctx: Ctx, g: Game, e: Enemy, c: (s: string) => string, blink: boolean) {
  const x = Math.round(e.x)
  const y = Math.round(e.y)
  const rage = e.phase === 2
  const halo = ctx.createRadialGradient(x + 14, y + 6, 2, x + 14, y + 6, 30)
  halo.addColorStop(0, rage ? 'rgba(160,200,255,0.5)' : 'rgba(200,235,255,0.35)')
  halo.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = halo
  ctx.fillRect(x - 16, y - 24, 60, 60)
  ctx.strokeStyle = c(rage ? '#9fc4ff' : '#e6f4ff')
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x + 14, y + 4, 12, Math.PI * 1.1, Math.PI * 1.9)
  ctx.stroke()

  const hem = Math.sin(g.time * 4) * 2
  ctx.fillStyle = c('#2b4366')
  ctx.beginPath()
  ctx.moveTo(x + 8, y + 10)
  ctx.lineTo(x + 20, y + 10)
  ctx.lineTo(x + 28 + hem, y + 36)
  ctx.lineTo(x - hem, y + 36)
  ctx.fill()
  px(ctx, c('#3f5f8c'), x + 9, y + 12, 10, 8)
  px(ctx, c('#dce9f6'), x + 9, y + 2, 10, 9)
  px(ctx, c('#9ab8d8'), x + 8, y, 12, 4)
  px(ctx, c(blink ? '#ffffff' : '#6ec9ff'), x + 11, y + 6, 2, 1)
  px(ctx, c(blink ? '#ffffff' : '#6ec9ff'), x + 15, y + 6, 2, 1)
  px(ctx, c('#cfeaff'), x + 13, y + 22, 2, 8)
}

function drawProjectile(ctx: Ctx, g: Game, pr: Projectile) {
  switch (pr.kind) {
    case 'orb': {
      const glow = ctx.createRadialGradient(pr.x, pr.y, 1, pr.x, pr.y, pr.w * 1.6)
      glow.addColorStop(0, pr.color)
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.fillRect(pr.x - pr.w * 1.6, pr.y - pr.w * 1.6, pr.w * 3.2, pr.w * 3.2)
      px(ctx, '#ffffff', pr.x - 1, pr.y - 1, 3, 3)
      break
    }
    case 'arrow': {
      const len = Math.hypot(pr.vx, pr.vy) || 1
      ctx.strokeStyle = pr.color
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(pr.x - (pr.vx / len) * 6, pr.y - (pr.vy / len) * 6)
      ctx.lineTo(pr.x + (pr.vx / len) * 3, pr.y + (pr.vy / len) * 3)
      ctx.stroke()
      px(ctx, '#ffffff', pr.x + (pr.vx / len) * 3 - 1, pr.y + (pr.vy / len) * 3 - 1, 2, 2)
      break
    }
    case 'shock': {
      const flick = Math.floor(g.time * 30) % 2 === 0
      px(ctx, flick ? '#ffe2b0' : pr.color, pr.x - pr.w / 2, pr.y - pr.h / 2, pr.w, pr.h)
      px(ctx, '#fff4dc', pr.x - pr.w / 2 + 2, pr.y - pr.h / 2, pr.w - 4, 2)
      break
    }
    case 'icicle': {
      if (pr.delay > 0) {
        ctx.globalAlpha = Math.floor(g.time * 12) % 2 === 0 ? 0.45 : 0.2
        px(ctx, '#cfeaff', pr.x - 1, 0, 2, GROUND_Y)
        ctx.globalAlpha = 1
        break
      }
      ctx.fillStyle = pr.color
      ctx.beginPath()
      ctx.moveTo(pr.x - 3, pr.y - 6)
      ctx.lineTo(pr.x + 3, pr.y - 6)
      ctx.lineTo(pr.x, pr.y + 6)
      ctx.fill()
      break
    }
    case 'slash': {
      const dir = pr.vx >= 0 ? 1 : -1
      ctx.strokeStyle = `rgba(246, 226, 168, ${clamp(pr.life / 0.3, 0, 1)})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(pr.x - dir * 6, pr.y, 12, dir > 0 ? -1.1 : Math.PI - 1.1, dir > 0 ? 1.1 : Math.PI + 1.1)
      ctx.stroke()
      break
    }
  }
}

// ---------------------------------------------------------------- UI

function text(ctx: Ctx, str: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left', weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.lineWidth = Math.max(1, size / 25)
  ctx.strokeStyle = 'rgba(5, 24, 29, 0.45)'
  ctx.strokeText(str, x, y)
  ctx.fillStyle = color
  ctx.fillText(str, x, y)
}

function wrap(ctx: Ctx, str: string, maxW: number) {
  const lines: string[] = []
  let line = ''
  for (const ch of str) {
    if (ctx.measureText(line + ch).width > maxW && line) {
      lines.push(line)
      line = ch
    } else line += ch
  }
  if (line) lines.push(line)
  return lines
}

function panel(ctx: Ctx, x: number, y: number, w: number, h: number, border = 'rgba(177,224,207,0.25)') {

  const glass = ctx.createLinearGradient(x, y, x + w, y + h)
  glass.addColorStop(0, 'rgba(38,55,82,0.94)')
  glass.addColorStop(1, 'rgba(19,31,48,0.94)')
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 14)
  ctx.fillStyle = glass; ctx.fill()
  ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.stroke()
  ctx.strokeStyle = 'rgba(207,227,255,0.18)'
  ctx.beginPath(); ctx.moveTo(x + 15, y + 1); ctx.lineTo(x + w - 15, y + 1); ctx.stroke()

}

function drawTexts(ctx: Ctx, g: Game) {
  for (const t of g.texts) {
    ctx.globalAlpha = clamp(t.life / 0.3, 0, 1)
    const p = g.toUi(t.x, t.y)
    text(ctx, t.text, p.x, p.y, t.big ? 22 : 15, t.color, 'center', 800)
  }
  ctx.globalAlpha = 1
}

function drawHud(ctx: Ctx, g: Game) {
  const p = g.player
  panel(ctx, 18, 16, 272, 50)
  text(ctx, '烬', 40, 41, 20, '#d5fa65', 'center', 800)
  const bw = 210
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fillRect(62, 30, bw, 14)
  const ratio = clamp(p.hp / p.maxHp, 0, 1)
  const grad = ctx.createLinearGradient(62, 0, 62 + bw, 0)
  grad.addColorStop(0, '#c9363e')
  grad.addColorStop(1, ratio < 0.3 ? '#ff4d5e' : '#ff8a5c')
  ctx.fillStyle = grad
  ctx.fillRect(62, 30, bw * ratio, 14)
  text(ctx, `${Math.ceil(p.hp)} / ${p.maxHp}`, 62 + bw / 2, 37, 12, '#ffffff', 'center')
  ctx.fillStyle = p.dashCd <= 0 ? '#d5fa65' : 'rgba(242,198,109,0.25)'
  const dashRatio = p.dashCd <= 0 ? 1 : 1 - p.dashCd / (0.6 * p.stats.dashCdMult)
  ctx.fillRect(62, 50, bw * clamp(dashRatio, 0, 1), 4)

  let ix = 20
  for (const u of UPGRADES) {
    const lv = g.taken[u.id]
    if (!lv) continue
    ctx.fillStyle = 'rgba(8,8,18,0.7)'
    ctx.fillRect(ix, 74, 26, 26)
    ctx.strokeStyle = RARITY_COLOR[u.rarity]
    ctx.lineWidth = 1
    ctx.strokeRect(ix + 0.5, 74.5, 25, 25)
    text(ctx, u.name[0], ix + 13, 87, 13, RARITY_COLOR[u.rarity], 'center')
    if (lv > 1) text(ctx, String(lv), ix + 22, 97, 10, '#ffffff', 'center')
    ix += 30
  }

  const biome = BIOMES[g.biome]
  panel(ctx, UW - 218, 16, 200, 50)
  text(ctx, `第 ${g.depth} / ${MAX_DEPTH} 层`, UW - 32, 32, 16, '#d5fa65', 'right', 800)
  const waveText = g.isBossRoom ? '首领战' : g.roomCleared ? '已肃清' : `波次 ${Math.max(1, g.wave)} / ${g.wavesTotal}`
  text(ctx, `${biome.name} · ${waveText}`, UW - 32, 52, 12, '#c9d2e3', 'right', 600)

  if (g.combo >= 3) {
    const pulse = 1 + Math.max(0, g.comboT - 1.6) * 1.5
    ctx.save()
    ctx.translate(UW - 40, 120)
    ctx.scale(pulse, pulse)
    text(ctx, `${g.combo}`, 0, 0, 34, '#d5fa65', 'right', 900)
    ctx.restore()
    text(ctx, '连击', UW - 40, 148, 13, '#c9d2e3', 'right', 700)
  }

  if (g.boss) {
    const b = g.boss
    const w = 520
    const x = (UW - w) / 2
    text(ctx, ENEMY_DEFS[b.kind].name + (b.phase === 2 ? ' · 第二相' : ''), UW / 2, UH - 52, 16, '#ff8a5c', 'center', 800)
    ctx.fillStyle = 'rgba(8,8,18,0.8)'
    ctx.fillRect(x - 3, UH - 38, w + 6, 16)
    ctx.fillStyle = b.phase === 2 ? '#ff5a3c' : '#ff8a5c'
    ctx.fillRect(x, UH - 35, w * clamp(b.hp / b.maxHp, 0, 1), 10)
  }

  if (g.depth === 1 && g.run.time < 9 && g.state === 'play') {
    ctx.globalAlpha = clamp(9 - g.run.time, 0, 1)
    text(ctx, 'A/D 移动 · K/空格 跳跃 · J 攻击 · L/Shift 冲刺 · ↓+跳 穿透平台 · Esc 暂停', UW / 2, UH - 20, 13, '#c9d2e3', 'center', 600)
    ctx.globalAlpha = 1
  }
}

function drawBanner(ctx: Ctx, g: Game) {
  const b = g.banner
  if (b.t <= 0 || g.state === 'title') return
  const alpha = clamp(Math.min(b.t * 2, (b.max - b.t) * 5), 0, 1)
  ctx.globalAlpha = alpha
  const grad = ctx.createLinearGradient(0, 0, UW, 0)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(0.5, 'rgba(6,6,14,0.7)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 150, UW, 86)
  text(ctx, b.title, UW / 2, 182, 36, b.color, 'center', 900)
  text(ctx, b.sub, UW / 2, 216, 14, '#e6e0f0', 'center', 600)
  ctx.globalAlpha = 1
}

function dim(ctx: Ctx, a = 0.62) {
  ctx.fillStyle = `rgba(4, 4, 12, ${a})`
  ctx.fillRect(0, 0, UW, UH)
}

function drawTitle(ctx: Ctx, g: Game) {
  dim(ctx, 0.35)
  const shade=ctx.createLinearGradient(0,0,UW,0);shade.addColorStop(0,'#0a1f2afa');shade.addColorStop(.6,'#0a1f2ac0');shade.addColorStop(1,'#0a1f2a10');ctx.fillStyle=shade;ctx.fillRect(0,0,UW,UH)
  text(ctx,'Yumo ARCADE / 01',55,53,12,'#91b6a7','left',500)
  text(ctx,'烬灯行',50,154,92,'#e9f4df','left',900)
  text(ctx,'EMBER LANTERN',57,227,32,'#d5fa65','left',500)
  text(ctx,'十层长夜，一盏孤灯。',57,275,17,'#8fafab','left',500)
  ctx.beginPath();ctx.roundRect(55,316,315,57,28);ctx.fillStyle='#d5fa65';ctx.fill();
  text(ctx,'点亮长夜  ↗',212,344,19,'#183a31','center',800)
  text(ctx,'点击画面 / J / Enter 开始',57,401,12,'#90b3a5','left',500)
  const cx=738,cy=230+Math.sin(g.time)*5
  ctx.strokeStyle='#8dccbd45';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,143,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(cx,cy,174,53,-.55,0,Math.PI*2);ctx.stroke()
  const glow=ctx.createRadialGradient(cx,cy,8,cx,cy,115);glow.addColorStop(0,'#e9ff9a77');glow.addColorStop(1,'#d5fa6500');ctx.fillStyle=glow;ctx.fillRect(cx-120,cy-120,240,240)
  ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.sin(g.time*.6)*.055);ctx.strokeStyle='#ceefb5';ctx.lineWidth=3;ctx.strokeRect(-47,-54,94,112);ctx.fillStyle='#d5fa6522';ctx.fillRect(-44,-51,88,106);ctx.fillStyle='#d5fa65';ctx.fillRect(-31,-30,62,70);ctx.fillStyle='#ecffc7';ctx.fillRect(-8,-20,16,42);ctx.fillStyle='#345b52';ctx.fillRect(-57,-63,114,12);ctx.fillRect(-57,54,114,12);ctx.fillStyle='#91b38c';ctx.fillRect(-2,-99,4,34);ctx.fillRect(-2,66,4,48);ctx.restore()
  text(ctx,'KEEP THE LIGHT.',cx,432,12,'#b9daaa','center',500)
  ctx.strokeStyle='#a9ceae30';ctx.beginPath();ctx.moveTo(55,464);ctx.lineTo(UW-55,464);ctx.stroke()
  text(ctx,'A D 移动   /   K 跳跃   /   J 攻击   /   L 冲刺',55,492,12,'#82a398','left',500)
  text(ctx,g.best>MAX_DEPTH?'最佳：已通关':'最佳：第 '+g.best+' 层',UW-55,492,12,'#d5fa65','right',500)
}

function drawUpgrade(ctx: Ctx, g: Game) {
  dim(ctx, 0.66)
  text(ctx, '择 一 而 行', UW / 2, 92, 34, '#d5fa65', 'center', 900)
  text(ctx, `第 ${g.depth} 层已肃清 · 选择一盏灯火带入下一层`, UW / 2, 128, 14, '#c9d2e3', 'center', 600)
  g.choices.forEach((u, i) => {
    const r = cardRect(i)
    const selected = i === g.choiceIndex
    const lift = selected ? -10 : 0
    const color = RARITY_COLOR[u.rarity]

    panel(ctx, r.x, r.y + lift, r.w, r.h, selected ? color : '#aec9f02e')
    text(ctx, '0' + (i + 1) + ' / LANTERN', r.x + 20, r.y + lift + 25, 10, selected ? color : '#7894b6', 'left', 500)
    if (selected) {
      ctx.fillStyle = color
      ctx.beginPath(); ctx.roundRect(r.x + r.w - 31, r.y + lift + 13, 16, 16, 8); ctx.fill()
      text(ctx, '✓', r.x + r.w - 23, r.y + lift + 21, 11, '#1c3042', 'center', 800)
    }

    const glow = ctx.createRadialGradient(r.x + r.w / 2, r.y + lift + 70, 4, r.x + r.w / 2, r.y + lift + 70, 50)
    glow.addColorStop(0, color + '66')
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glow
    ctx.fillRect(r.x + r.w / 2 - 50, r.y + lift + 20, 100, 100)
    text(ctx, u.name[0], r.x + r.w / 2, r.y + lift + 70, 38, color, 'center', 900)
    text(ctx, u.name, r.x + r.w / 2, r.y + lift + 130, 22, '#ffffff', 'center', 800)
    text(ctx, RARITY_LABEL[u.rarity], r.x + r.w / 2, r.y + lift + 158, 12, color, 'center', 700)
    ctx.font = `600 14px ${FONT}`
    wrap(ctx, u.desc, r.w - 24).forEach((line, li) => {
      text(ctx, line, r.x + r.w / 2, r.y + lift + 190 + li * 22, 14, '#d8d2e6', 'center', 600)
    })
    const lv = g.taken[u.id] ?? 0
    if (lv > 0 && u.max < 99) text(ctx, `已有 ${lv} / ${u.max}`, r.x + r.w / 2, r.y + lift + r.h - 20, 12, '#9aa3b8', 'center', 600)
  })
  text(ctx, '← → 选择 · J / Enter 确认 · 也可直接点击', UW / 2, 470, 13, '#9aa3b8', 'center', 600)
}

function drawPaused(ctx: Ctx) {
  dim(ctx, 0.67)
  panel(ctx, UW / 2 - 230, 128, 460, 275, '#adc8ef55')
  text(ctx, 'INTERMISSION / 长夜未央', UW / 2, 172, 12, '#92afd2', 'center', 500)
  text(ctx, '灯火，为你停留。', UW / 2, 230, 36, '#edf3e4', 'center', 700)
  text(ctx, '歇一会儿，再走下一程。', UW / 2, 280, 15, '#91a9bb', 'center', 500)
  ctx.beginPath(); ctx.roundRect(UW / 2 - 140, 316, 280, 48, 24)
  ctx.fillStyle = '#d5fa65'; ctx.fill()
  text(ctx, '继续前行  ↗', UW / 2, 340, 17, '#243c38', 'center', 700)
  text(ctx, 'ESC / ENTER / 点击画面', UW / 2, 434, 11, '#8bacc8', 'center', 500)
}

function drawEnd(ctx: Ctx, g: Game) {
  const win = g.state === 'victory'
  dim(ctx, 0.72)
  text(ctx, win ? 'DAWN BREAKS / RUN COMPLETE' : 'THE LIGHT WILL RETURN', UW / 2, 66, 12, '#97b4ce', 'center', 500)
  text(ctx, win ? '长夜，终有回响。' : '灯熄了，勇气还在。', UW / 2, 129, 43, win ? '#d5fa65' : '#eac1c7', 'center', 800)
  text(ctx, win ? '十层长夜尽数肃清，孤灯照见黎明。' : `止步第 ${g.depth} 层 · ${BIOMES[g.biome].name}，下一程会更远。`, UW / 2, 184, 15, '#a9bdd0', 'center', 500)
  const r = g.run
  const rows = [['击杀', String(r.kills)], ['总伤害', String(r.damage)], ['最高连击', String(r.maxCombo)], ['用时', `${Math.floor(r.time / 60)}:${String(Math.floor(r.time % 60)).padStart(2, '0')}`]]
  rows.forEach(([label, value], i) => {
    const x = 100 + i * 195
    panel(ctx, x, 229, 177, 109)
    text(ctx, label, x + 88, 258, 12, '#8da8c0', 'center', 500)
    text(ctx, value, x + 88, 300, 29, '#e7f3e9', 'center', 700)
  })
  text(ctx, g.best > MAX_DEPTH ? '个人最佳 / 已通关' : `个人最佳 / 第 ${g.best} 层`, UW / 2, 373, 12, '#a6bfae', 'center', 500)
  ctx.beginPath(); ctx.roundRect(UW / 2 - 162, 406, 324, 53, 26)
  ctx.fillStyle = g.menuDelay > 0 ? '#85966e' : '#d5fa65'; ctx.fill()
  text(ctx, '再点一盏灯  ↗', UW / 2, 433, 18, '#233c34', 'center', 700)
  text(ctx, 'J / ENTER / 点击画面 · 再战一夜', UW / 2, 489, 11, '#849bb5', 'center', 500)
}
