import {
  PACKET_H,
  PACKET_W,
  drawCabbageBall,
  drawMower,
  drawPacket,
  drawPea,
  drawProgress,
  drawShovel,
  drawSun,
  drawSunCounter,
  drawTrophy,
} from '../art/items'
import { drawPlant, flame, plantShadow, type PlantView } from '../art/plants'
import { drawZombie, drawZombieArm, drawZombieArmor, drawZombieHead, zombieShadow, type ZombieView } from '../art/zombies'
import { CELL_H, CELL_W, LAWN_B, LAWN_X, LAWN_Y, MAX_SLOTS, ROWS, VIEW_H, VIEW_W, WORLD_W, colCenter, rowFeet } from '../config'
import { PLANTS } from '../data/plants'
import type { UI } from '../ui'
import { FONT, circle, clamp, easeOutBack, easeOutCubic, ellipse, lerp, linear, paint, radial, rrect, setTint, text, wrapText, type Ctx, type Tint } from '../util'
import { BANK_X, BANK_Y, BELT_LEN, SLOT_STEP, btnMenu, btnSpeed, type Battle } from './battle'
import { lobPos, squashLift } from './behaviors'
import type { Particle, Plant, Zombie } from './types'
import { isEndless } from './waves'

function plantView(b: Battle, p: Plant): PlantView {
  const v: PlantView = { t: b.t + p.uid * 0.37, anim: p.anim, hp: p.hp / p.maxHp, state: p.state, stateT: p.stateT, lookX: p.lookX }
  if (p.id === 'cabbage') v.loaded = p.timer < 2.4
  if (p.id === 'squash' && p.state === 'jump') v.state = 'idle'
  return v
}

function zombieView(b: Battle, z: Zombie): ZombieView {
  return {
    id: z.id,
    t: b.t + z.uid * 0.21,
    phase: z.phase,
    state: z.state,
    stateT: z.stateT,
    deathT: z.deathT,
    hasArm: z.hasArm,
    hasHead: z.hasHead,
    hasPole: z.hasPole,
    hasImp: z.hasImp,
    armorKind: z.armorKind,
    armor: z.armorMax ? Math.max(0, z.armor) / z.armorMax : 0,
    angry: z.angry,
  }
}

function zombieTint(z: Zombie): Tint {
  if (z.state === 'ash') return 'ash'
  if (z.slow > 0) return z.flash > 0 ? 'frostflash' : 'frost'
  return z.flash > 0 ? 'flash' : 'normal'
}

function drawZ(ctx: Ctx, b: Battle, z: Zombie) {
  setTint(zombieTint(z))
  drawZombie(ctx, z.x, z.y, zombieView(b, z), z.lift)
  setTint('normal')
  if (z.state === 'ash' && z.deathT > 0.6) {
    const k = clamp((z.deathT - 0.6) / 0.9, 0, 1)
    ctx.fillStyle = `rgba(40,40,40,${0.6 * (1 - k)})`
    for (let i = 0; i < 12; i++) {
      const sx = z.x - 30 + ((i * 37) % 50)
      ctx.fillRect(sx, z.y - 120 + k * 110 + ((i * 53) % 90) * (1 - k), 4, 4)
    }
  }
}

function drawP(ctx: Ctx, b: Battle, p: Plant) {
  const lift = p.id === 'squash' ? squashLift(p) : 0
  ctx.save()
  if (p.id === 'squash' && p.state === 'done') ctx.globalAlpha = clamp(1 - (p.stateT - 0.4) / 0.4, 0, 1)
  setTint(p.flash > 0 ? 'flash' : 'normal')
  drawPlant(ctx, p.id, p.x, p.y - lift, plantView(b, p))
  setTint('normal')
  ctx.restore()
}

// ------------------------------------------------------------------ particles

function drawParticle(ctx: Ctx, b: Battle, p: Particle) {
  const k = clamp(p.life / p.max, 0, 1)
  ctx.save()
  switch (p.kind) {
    case 'dot':
      ctx.globalAlpha = Math.min(1, k * 2)
      circle(ctx, p.x, p.y, p.size)
      paint(ctx, p.color)
      break
    case 'splat':
      ctx.globalAlpha = k
      for (let i = 0; i < 5; i++) {
        const a = i * 1.26 + p.x
        circle(ctx, p.x + Math.cos(a) * p.size * (1.2 - k), p.y + Math.sin(a) * p.size * (1.2 - k), p.size * 0.35 * (0.5 + k))
        paint(ctx, p.color)
      }
      break
    case 'smoke':
      ctx.globalAlpha = k * 0.55
      circle(ctx, p.x, p.y, p.size * (1.6 - k * 0.6))
      paint(ctx, '#5a5652')
      break
    case 'fire':
      ctx.globalAlpha = Math.min(1, k * 1.6)
      flame(ctx, p.x, p.y, p.size * (0.7 + 0.3 * k), b.t + p.x)
      break
    case 'boom': {
      const r = p.size * (0.35 + (1 - k) * 0.9)
      ctx.globalAlpha = k
      circle(ctx, p.x, p.y, r)
      paint(ctx, radial(ctx, p.x, p.y, r * 0.1, p.x, p.y, r, [[0, '#ffffff'], [0.25, '#fff2a0'], [0.55, '#ff9a2a'], [0.85, '#d2401a'], [1, '#5a1a0a00']]))
      if (k > 0.75) {
        ctx.globalAlpha = (k - 0.75) * 2.4
        ctx.fillStyle = '#fffbe0'
        ctx.fillRect(b.cam, 0, VIEW_W, VIEW_H)
      }
      break
    }
    case 'text': {
      const pop = easeOutBack(clamp((p.max - p.life) / 0.25, 0, 1))
      ctx.globalAlpha = Math.min(1, k * 3)
      ctx.translate(p.x, p.y)
      ctx.scale(pop, pop)
      text(ctx, p.text ?? '', 0, 0, { size: p.size, color: p.color, stroke: '#4a1a04', lw: Math.max(5, p.size / 7), weight: 900 })
      break
    }
    case 'head':
      ctx.globalAlpha = Math.min(1, k * 2.5)
      drawZombieHead(ctx, p.zid ?? 'basic', p.x, p.y, p.rot, 1)
      break
    case 'arm':
      ctx.globalAlpha = Math.min(1, k * 2.5)
      drawZombieArm(ctx, p.zid ?? 'basic', p.x, p.y, p.rot)
      break
    case 'armor':
      ctx.globalAlpha = Math.min(1, k * 2.5)
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      drawArmorPiece(ctx, p)
      break
    case 'leaf':
      ctx.globalAlpha = Math.min(1, k * 2)
      ellipse(ctx, p.x, p.y, p.size, p.size * 0.45, p.rot)
      paint(ctx, p.color)
      break
    case 'shock':
      ctx.globalAlpha = k
      ellipse(ctx, p.x, p.y, p.size * (1.4 - k), p.size * 0.3 * (1.4 - k))
      ctx.lineWidth = 5 * k
      ctx.strokeStyle = '#f5e6c8'
      ctx.stroke()
      break
    case 'ice':
      break
  }
  ctx.restore()
}

function drawArmorPiece(ctx: Ctx, p: Particle) {
  if (p.armorKind) drawZombieArmor(ctx, p.armorKind)
}

// ------------------------------------------------------------------ world

function drawWorld(ctx: Ctx, b: Battle, bg: HTMLCanvasElement) {
  ctx.drawImage(bg, 0, 0, bg.width, bg.height, 0, 0, WORLD_W, VIEW_H)

  if (b.bowling) {
    const x = LAWN_X + 3 * CELL_W
    ctx.save()
    ctx.setLineDash([14, 10])
    ctx.lineWidth = 5
    ctx.strokeStyle = 'rgba(220,40,30,0.85)'
    ctx.beginPath()
    ctx.moveTo(x, LAWN_Y + 4)
    ctx.lineTo(x, LAWN_B - 4)
    ctx.stroke()
    ctx.restore()
  }

  if (b.phase === 'intro' || b.phase === 'choose' || b.phase === 'back') {
    for (const z of b.previews) zombieShadow(ctx, z.x, z.y, z.id)
    for (const z of b.previews) drawZombie(ctx, z.x, z.y, { ...zombieView(b, z), state: 'preview' })
  }

  // placement preview
  if (b.phase === 'play' && !b.paused && b.holding) {
    const cell = b.cellAt(b.mx, b.my)
    if (cell) {
      const cx = LAWN_X + cell.col * CELL_W
      const cy = LAWN_Y + cell.row * CELL_H
      if (b.holding === 'shovel') {
        const p = b.grid[cell.row][cell.col]
        if (p) {
          rrect(ctx, cx + 4, cy + 4, CELL_W - 8, CELL_H - 8, 10)
          paint(ctx, 'rgba(255,80,60,0.18)', 'rgba(255,120,100,0.8)', 3)
        }
      } else {
        const ok = b.canPlace(b.holding, cell.row, cell.col)
        rrect(ctx, cx + 4, cy + 4, CELL_W - 8, CELL_H - 8, 10)
        paint(ctx, ok ? 'rgba(255,255,255,0.16)' : 'rgba(255,60,40,0.16)', ok ? 'rgba(255,255,255,0.55)' : 'rgba(255,90,70,0.6)', 2.5)
        if (ok) {
          ctx.save()
          ctx.globalAlpha = 0.45
          drawPlant(ctx, b.holding, colCenter(cell.col), rowFeet(cell.row), { t: b.t, hp: 1 })
          ctx.restore()
        }
      }
    }
  }

  for (const p of b.plants) plantShadow(ctx, p.x, p.y + 2, p.id === 'tallnut' ? 34 : p.id === 'spikeweed' ? 40 : 30)
  for (const w of b.bowls) plantShadow(ctx, w.x, w.y + 2, w.id === 'giantnut' ? 60 : 30)
  for (const z of b.zombies) if (z.state !== 'mowed') zombieShadow(ctx, z.x, z.y, z.id, z.lift)

  for (let r = 0; r < ROWS; r++) {
    for (const m of b.mowers) if (m.row === r && m.state !== 'gone') drawMower(ctx, m.x, rowFeet(r) + 4, b.t, m.state === 'run')
    const ps = b.plants.filter((p) => p.row === r && p.id === 'spikeweed')
    for (const p of ps) drawP(ctx, b, p)
    for (const p of b.plants) if (p.row === r && p.id !== 'spikeweed') drawP(ctx, b, p)
    for (const w of b.bowls) if (w.row === r) drawPlant(ctx, w.id, w.x, w.y, { t: b.t, rot: w.rot, hp: 1 })
    const zs = b.zombies.filter((z) => z.row === r && z.state !== 'fly').sort((a, c) => c.x - a.x)
    for (const z of zs) drawZ(ctx, b, z)
    for (const s of b.shots) if (s.row === r) drawPea(ctx, s.x, s.y, s.kind, b.t)
  }
  for (const z of b.zombies) if (z.state === 'fly') drawZ(ctx, b, z)
  for (const l of b.lobs) {
    const pos = lobPos(l)
    drawCabbageBall(ctx, pos.x, pos.y, pos.k * 8)
  }
  for (const p of b.particles) drawParticle(ctx, b, p)
  for (const s of b.suns) {
    const blink = s.state === 'idle' && s.life < 2 ? (Math.sin(b.t * 18) > 0 ? 1 : 0.35) : 1
    const grow = s.state === 'pop' ? 0.7 + Math.min(0.3, s.t * 0.8) : s.state === 'collect' ? 1 - s.ct * 0.4 : 1
    drawSun(ctx, s.x, s.y, b.t + s.x * 0.01, grow, blink)
  }
}

// ------------------------------------------------------------------ HUD

function drawBank(ctx: Ctx, b: Battle, ui: UI) {
  const w = BANK_X + MAX_SLOTS * SLOT_STEP
  rrect(ctx, 4, 3, w, 108, 12)
  paint(ctx, linear(ctx, 0, 0, 0, 110, [[0, '#9a6434'], [1, '#6a3e1a']]), '#2e1c08', 3)
  if (b.usesSlots) {
    drawSunCounter(ctx, 10, 5, b.sun, b.t, b.sunFlash)
  } else {
    rrect(ctx, 10, 8, 84, 98, 10)
    paint(ctx, '#4a2c12', '#2e1c08', 2)
    text(ctx, b.bowling ? '保龄球' : '传送带', 52, 40, { size: 17, color: '#ffe9b0', weight: 900 })
    text(ctx, b.bowling ? '最高连击' : '免费种植', 52, 66, { size: 13, color: '#e6c890' })
    if (b.bowling) text(ctx, String(b.bestCombo), 52, 88, { size: 20, color: '#ffe066', weight: 900 })
  }
  for (let i = 0; i < MAX_SLOTS; i++) {
    rrect(ctx, BANK_X + i * SLOT_STEP, BANK_Y, PACKET_W, PACKET_H, 8)
    paint(ctx, 'rgba(30,16,4,0.45)', 'rgba(255,220,160,0.12)', 1.5)
  }
  if (b.usesSlots) {
    const list = b.phase === 'choose' ? b.chosen : b.slots
    list.forEach((id, i) => {
      const r = b.slotRect(i)
      const cd = b.cooldown.get(id) ?? 0
      const hover = ui.over(r.x, r.y, r.w, r.h)
      drawPacket(ctx, r.x, r.y, id, {
        cost: PLANTS[id].cost,
        cd: cd > 0 ? cd / PLANTS[id].cooldown : 0,
        off: b.phase === 'play' && b.sun < PLANTS[id].cost,
        hover,
        picked: b.holding === id,
      })
      if (b.phase === 'choose' && ui.hit(r.x, r.y, r.w, r.h)) b.toggleChoice(id)
    })
  } else {
    ctx.save()
    rrect(ctx, BANK_X - 2, BANK_Y - 4, BELT_LEN, PACKET_H + 8, 8)
    ctx.clip()
    ctx.fillStyle = '#2a2a2e'
    ctx.fillRect(BANK_X - 2, BANK_Y + PACKET_H - 20, BELT_LEN, 28)
    ctx.strokeStyle = '#4a4a50'
    ctx.lineWidth = 3
    const off = (b.t * 70) % 24
    for (let x = BANK_X - off; x < BANK_X + BELT_LEN; x += 24) {
      ctx.beginPath()
      ctx.moveTo(x, BANK_Y + PACKET_H - 18)
      ctx.lineTo(x + 8, BANK_Y + PACKET_H + 6)
      ctx.stroke()
    }
    b.belt.forEach((it, i) => {
      const x = BANK_X + it.x
      const hover = ui.over(x, BANK_Y, PACKET_W, PACKET_H)
      drawPacket(ctx, x, BANK_Y, it.id, { cost: null, hover, picked: b.holding === it.id && b.holdBelt === i })
    })
    ctx.restore()
  }
  if (!b.bowling) {
    const s = b.shovelRect
    const hover = ui.over(s.x, s.y, s.w, s.h)
    rrect(ctx, s.x, s.y, s.w, s.h, 12)
    paint(ctx, linear(ctx, 0, s.y, 0, s.y + s.h, [[0, '#9a6434'], [1, '#6a3e1a']]), hover ? '#ffe9b0' : '#2e1c08', 3)
    rrect(ctx, s.x + 7, s.y + 7, s.w - 14, s.h - 14, 9)
    paint(ctx, '#3a2410')
    if (b.holding !== 'shovel') drawShovel(ctx, s.x + s.w / 2 - 2, s.y + s.h / 2 - 2, 1, 0)
  }
}

function drawButtons(ctx: Ctx, b: Battle, ui: UI) {
  for (const [r, label] of [
    [btnMenu, '菜单'],
    [btnSpeed, b.speed === 2 ? '×2' : '×1'],
  ] as const) {
    const hover = ui.over(r.x, r.y, r.w, r.h)
    rrect(ctx, r.x, r.y + 3, r.w, r.h, 10)
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fill()
    rrect(ctx, r.x, r.y, r.w, r.h, 10)
    const hot = label === '×2'
    paint(ctx, linear(ctx, 0, r.y, 0, r.y + r.h, hot ? [[0, '#ffd36a'], [1, '#d48a14']] : [[0, '#a3d36a'], [1, '#4f8a24']]), hover ? '#ffffff' : '#1e3a0c', 3)
    text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 1, { size: 21, color: '#fff', stroke: '#1e3a0c', lw: 4, weight: 900 })
  }
}

function drawProgressHud(ctx: Ctx, b: Battle) {
  const lv = b.level
  if (isEndless(lv)) {
    text(ctx, `无尽生存 · 第 ${Math.max(1, b.waveIndex)} 波`, VIEW_W - 24, VIEW_H - 22, { size: 20, color: '#fff3c8', stroke: '#3a2408', lw: 5, align: 'right' })
    return
  }
  const flags = lv.flags.map((f) => f / lv.waves)
  const label = lv.id.includes('-') ? `关卡 ${lv.id}` : lv.name
  drawProgress(ctx, VIEW_W - 250, VIEW_H - 32, 226, b.progress, flags, label)
}

function drawMessages(ctx: Ctx, b: Battle) {
  for (const m of b.messages) {
    const k = m.t / m.dur
    ctx.save()
    if (m.style === 'ready' || m.style === 'huge' || m.style === 'final') {
      const pop = m.t < 0.18 ? 1.8 - easeOutCubic(m.t / 0.18) * 0.8 : 1
      const size = m.style === 'ready' ? 78 : m.style === 'huge' ? 120 : 100
      ctx.globalAlpha = k > 0.8 ? (1 - k) / 0.2 : 1
      ctx.translate(VIEW_W / 2, VIEW_H / 2)
      ctx.scale(pop, pop)
      if (m.style === 'huge') ctx.rotate(Math.sin(m.t * 40) * 0.015)
      text(ctx, m.text, 0, 0, { size, color: '#ff3a26', stroke: '#fff6e8', lw: 10, weight: 900, shadow: true })
    } else if (m.style === 'warn') {
      const bob = Math.sin(m.t * 6) * 4
      ctx.globalAlpha = m.dur > 100 ? Math.min(1, m.t * 2) : k > 0.85 ? (1 - k) / 0.15 : Math.min(1, m.t * 4)
      text(ctx, m.text, VIEW_W / 2, VIEW_H / 2 - 20 + bob, { size: 56, color: '#ff3a26', stroke: '#2a0606', lw: 9, weight: 900, shadow: true })
    } else {
      ctx.globalAlpha = k > 0.8 ? (1 - k) / 0.2 : 1
      text(ctx, m.text, VIEW_W / 2, VIEW_H - 120, { size: 26, color: '#fff', stroke: '#000', lw: 5 })
    }
    ctx.restore()
  }
}

function drawTip(ctx: Ctx, b: Battle) {
  if (b.tipT <= 0 || !b.level.tip) return
  ctx.save()
  ctx.globalAlpha = Math.min(1, b.tipT, (11 - b.tipT) * 3)
  ctx.font = `700 20px ${FONT}`
  const lines = wrapText(ctx, b.level.tip, 700)
  const h = 24 + lines.length * 28
  const y = VIEW_H - 64 - h
  rrect(ctx, VIEW_W / 2 - 380, y, 760, h, 14)
  paint(ctx, 'rgba(24,18,8,0.78)', 'rgba(255,230,160,0.6)', 2)
  lines.forEach((ln, i) => text(ctx, ln, VIEW_W / 2, y + 26 + i * 28, { size: 20, color: '#fff3c8', weight: 700 }))
  ctx.restore()
}

function drawHolding(ctx: Ctx, b: Battle) {
  if (b.phase !== 'play' || b.paused || !b.holding) return
  if (b.holding === 'shovel') {
    drawShovel(ctx, b.mx + 10, b.my - 10, 1.1, -0.3)
    return
  }
  ctx.save()
  ctx.globalAlpha = 0.92
  ctx.translate(b.mx, b.my + 30)
  ctx.scale(0.85, 0.85)
  drawPlant(ctx, b.holding, 0, 0, { t: b.t, hp: 1 })
  ctx.restore()
}

// ------------------------------------------------------------------ overlays

function panel(ctx: Ctx, x: number, y: number, w: number, h: number) {
  rrect(ctx, x, y + 6, w, h, 20)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fill()
  rrect(ctx, x, y, w, h, 20)
  paint(ctx, linear(ctx, 0, y, 0, y + h, [[0, '#fbfff5f5'], [1, '#deedddf5']]), '#98b7a1', 1.5)
  rrect(ctx, x + 10, y + 10, w - 20, h - 20, 14)
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'
  ctx.lineWidth = 1
  ctx.stroke()
}

function drawChooser(ctx: Ctx, b: Battle, ui: UI) {
  const x = 18
  const y = 126
  const w = 520
  const h = 572
  panel(ctx, x, y, w, h)
  text(ctx, '选择出战植物', x + w / 2, y + 40, { size: 30, color: '#315447', weight: 900 })
  text(ctx, `已选 ${b.chosen.length} / ${MAX_SLOTS}`, x + w / 2, y + 74, { size: 17, color: '#6c8170' })
  const cols = 6
  b.available.forEach((id, i) => {
    const px = x + 30 + (i % cols) * 78
    const py = y + 100 + Math.floor(i / cols) * 100
    const picked = b.chosen.includes(id)
    const hover = ui.over(px, py, PACKET_W, PACKET_H)
    drawPacket(ctx, px, py, id, { cost: PLANTS[id].cost, picked, hover })
    if (!picked && ui.hit(px, py, PACKET_W, PACKET_H)) b.toggleChoice(id)
  })
  const hoverId = b.available.find((_id, i) => ui.over(x + 30 + (i % cols) * 78, y + 100 + Math.floor(i / cols) * 100, PACKET_W, PACKET_H))
  if (hoverId) {
    const d = PLANTS[hoverId]
    rrect(ctx, x + 24, y + h - 170, w - 48, 82, 10)
    paint(ctx, 'rgba(90,58,16,0.1)')
    text(ctx, `${d.name} · ${d.cost} 阳光`, x + 40, y + h - 146, { size: 19, color: '#315447', align: 'left', weight: 900 })
    ctx.font = `600 15px ${FONT}`
    wrapText(ctx, d.desc.replace(/\n/g, ''), w - 90).slice(0, 2).forEach((ln, i) => text(ctx, ln, x + 40, y + h - 118 + i * 22, { size: 15, color: '#5b7563', align: 'left', weight: 600 }))
  }
  if (ui.button(ctx, '开始种植！', x + w / 2 - 120, y + h - 74, 240, 56, 'green', 26, b.chosen.length === 0)) b.confirmChoice()
  text(ctx, '本关出现的僵尸', VIEW_W - 220, 150, { size: 22, color: '#fff3c8', stroke: '#2a1a08', lw: 5 })
}

function drawPause(ctx: Ctx, b: Battle, ui: UI) {
  ctx.fillStyle = 'rgba(10,14,8,0.55)'
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  const w = 420
  const h = 420
  const x = (VIEW_W - w) / 2
  const y = (VIEW_H - h) / 2
  panel(ctx, x, y, w, h)
  text(ctx, '游戏暂停', VIEW_W / 2, y + 52, { size: 36, color: '#315447', weight: 900 })
  if (ui.button(ctx, '继续游戏', x + 70, y + 92, w - 140, 56, 'green', 24)) b.paused = false
  if (ui.button(ctx, '重新开始', x + 70, y + 160, w - 140, 56, 'wood', 24)) b.host.finish(b.result(false), 'retry')
  if (ui.button(ctx, '返回菜单', x + 70, y + 228, w - 140, 56, 'wood', 24)) b.host.finish(b.result(false), 'menu')
  const a = b.audio
  if (ui.button(ctx, `音乐：${a.musicOn ? '开' : '关'}`, x + 50, y + 312, 150, 48, 'stone', 20)) {
    a.setMusicOn(!a.musicOn)
    b.host.save.music = a.musicOn
  }
  if (ui.button(ctx, `音效：${a.sfxOn ? '开' : '关'}`, x + w - 200, y + 312, 150, 48, 'stone', 20)) {
    a.sfxOn = !a.sfxOn
    b.host.save.sfx = a.sfxOn
  }
  text(ctx, '空格 暂停 · 1–8 选卡 · Q 铲子 · F 加速', VIEW_W / 2, y + h - 26, { size: 14, color: '#6c8170' })
}

function drawLost(ctx: Ctx, b: Battle, ui: UI) {
  const k = clamp(b.phaseT / 2, 0, 1)
  ctx.fillStyle = `rgba(20,0,0,${0.5 * k})`
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  if (b.phaseT < 2.6) return
  if (isEndless(b.level)) {
    text(ctx, `你坚持了 ${Math.max(0, b.waveIndex - 1)} 波`, VIEW_W / 2, VIEW_H / 2 + 50, { size: 30, color: '#fff3c8', stroke: '#2a0606', lw: 6 })
  }
  if (ui.button(ctx, '再试一次', VIEW_W / 2 - 250, VIEW_H / 2 + 100, 230, 60, 'green', 26)) b.host.finish(b.result(false), 'retry')
  if (ui.button(ctx, '返回菜单', VIEW_W / 2 + 20, VIEW_H / 2 + 100, 230, 60, 'wood', 26)) b.host.finish(b.result(false), 'menu')
}

function drawRewardItem(ctx: Ctx, b: Battle, x: number, y: number, s: number) {
  const id = b.level.reward[0]
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.save()
  ctx.rotate(b.t * 0.6)
  ctx.fillStyle = 'rgba(255,245,180,0.35)'
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-9, -84)
    ctx.lineTo(9, -84)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
  circle(ctx, 0, 0, 56)
  paint(ctx, radial(ctx, 0, 0, 4, 0, 0, 56, [[0, '#fff8c8cc'], [1, '#fff8c800']]))
  if (id) drawPacket(ctx, -PACKET_W / 2, -PACKET_H / 2, id, { cost: PLANTS[id].cost })
  else drawTrophy(ctx, 0, 40, 0.55, b.t)
  ctx.restore()
}

function drawWon(ctx: Ctx, b: Battle) {
  const r = b.reward
  if (!r) return
  const bob = r.vy === 0 ? Math.sin(r.t * 3) * 5 : 0
  drawRewardItem(ctx, b, r.x - b.cam, r.y + bob, 1)
  if (r.t > 1) {
    const a = Math.sin(r.t * 5) * 6
    text(ctx, '点击领取', r.x - b.cam, r.y - 78 + a, { size: 22, color: '#fff7c8', stroke: '#3a2408', lw: 5 })
  }
}

function drawRewardPhase(ctx: Ctx, b: Battle) {
  const r = b.reward
  if (!r) return
  const k = easeOutCubic(clamp(b.phaseT / 1.2, 0, 1))
  const x = lerp(r.x - b.cam, VIEW_W / 2, k)
  const y = lerp(r.y, VIEW_H / 2 - 20, k)
  const white = clamp((b.phaseT - 0.9) / 1.5, 0, 1)
  ctx.fillStyle = `rgba(255,252,236,${white})`
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  drawRewardItem(ctx, b, x, y, 1 + k * 1.6)
}

// ------------------------------------------------------------------ entry

export function renderBattle(ctx: Ctx, b: Battle, bg: HTMLCanvasElement, ui: UI) {
  const sx = b.shake > 0 ? (Math.random() - 0.5) * b.shake * 16 : 0
  const sy = b.shake > 0 ? (Math.random() - 0.5) * b.shake * 12 : 0
  ctx.save()
  ctx.translate(-b.cam + sx, sy)
  drawWorld(ctx, b, bg)
  ctx.restore()

  const hudIn = b.phase === 'choose' ? 1 : b.phase === 'intro' ? clamp((b.phaseT - 2.2) / 0.5, 0, 1) : 1
  ctx.save()
  ctx.translate(0, (1 - hudIn) * -130)
  if (b.phase !== 'intro' || hudIn > 0) drawBank(ctx, b, ui)
  ctx.restore()
  if (b.phase === 'play' || b.phase === 'won' || b.phase === 'lost') {
    drawButtons(ctx, b, ui)
    drawProgressHud(ctx, b)
  }
  drawTip(ctx, b)
  if (b.phase === 'choose') drawChooser(ctx, b, ui)
  if (b.phase === 'won') drawWon(ctx, b)
  drawHolding(ctx, b)
  drawMessages(ctx, b)
  if (b.phase === 'lost') drawLost(ctx, b, ui)
  if (b.phase === 'reward') drawRewardPhase(ctx, b)
  if (b.paused) drawPause(ctx, b, ui)
  if (b.phase === 'intro' && b.phaseT < 0.4) {
    ctx.fillStyle = `rgba(0,0,0,${1 - b.phaseT / 0.4})`
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  }
}
