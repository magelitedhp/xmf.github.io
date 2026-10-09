import type { App } from './app'
import { PACKET_H, PACKET_W, drawPacket, drawPea, drawTrophy } from './art/items'
import { drawPlant, plantShadow } from './art/plants'
import { drawZombie, drawZombieHead, zombieShadow, type ZombieView } from './art/zombies'
import { VIEW_H, VIEW_W, WORLD_W, colCenter, rowFeet } from './config'
import { BOWLING, ENDLESS, LEVELS, type LevelDef } from './data/levels'
import { ALL_PLANTS, PLANTS, PLANT_ORDER, type PlantId } from './data/plants'
import { ZOMBIES, ZOMBIE_ORDER, type ZombieId } from './data/zombies'
import { resetSave } from './save'
import { FONT, circle, clamp, easeOutBack, linear, paint, radial, rand, rrect, text, wrapText, type Ctx } from './util'

export interface Scene {
  music: 'menu' | 'battle' | null
  update(dt: number): void
  render(ctx: Ctx): void
  down?(x: number, y: number, button: number): void
  up?(x: number, y: number): void
  move?(x: number, y: number): void
  key?(k: string): void
}

const ALL_ROWS = [0, 1, 2, 3, 4]

export function backdrop(ctx: Ctx, app: App, cam: number, dim = 0) {
  const bg = app.world(ALL_ROWS)
  const k = bg.width / WORLD_W
  ctx.drawImage(bg, cam * k, 0, VIEW_W * k, VIEW_H * k, 0, 0, VIEW_W, VIEW_H)
  if (dim > 0) {
    ctx.fillStyle = `rgba(12,18,8,${dim})`
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  }
}

function view(id: ZombieId, t: number, phase: number, state = 'walk'): ZombieView {
  const def = ZOMBIES[id]
  return {
    id,
    t,
    phase,
    state,
    stateT: 0,
    deathT: 0,
    hasArm: true,
    hasHead: true,
    hasPole: id === 'pole',
    hasImp: id === 'garg',
    armorKind: def.armorKind,
    armor: def.armor ? 1 : 0,
    angry: false,
  }
}

function plank(ctx: Ctx, x: number, y: number, w: number, h: number) {
  rrect(ctx,x,y+8,w,h,25);paint(ctx,'rgba(28,67,48,0.15)');rrect(ctx,x,y,w,h,25);paint(ctx,linear(ctx,0,y,0,y+h,[[0,'#ffffed'],[1,'#edf2d5']]),'#93b292',1.5)
  ctx.strokeStyle='#ccd9b7';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+24,y+h-20);ctx.lineTo(x+w-24,y+h-20);ctx.stroke()
}

function parchment(ctx: Ctx, x: number, y: number, w: number, h: number) {
  rrect(ctx, x, y + 6, w, h, 20)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fill()
  rrect(ctx, x, y, w, h, 20)
  paint(ctx, linear(ctx, 0, y, 0, y + h, [[0, '#fcfff9f5'], [1, '#e9f3e6f2']]), '#adc7b4', 1.5)
}

function backButton(ctx: Ctx, app: App) {
  return app.ui.button(ctx, '‹ 返回', 20, 16, 128, 50, 'wood', 22)
}

// ------------------------------------------------------------------ title

export class TitleScene implements Scene {
  music = 'menu' as const
  private t = 0
  private zs: { id: ZombieId; row: number; x: number; phase: number; speed: number; flash: number }[] = []
  private peas: { row: number; x: number }[] = []
  private shootT = [0.3, 0.9, 0.5, 1.2, 0.7]
  private shooters: { id: PlantId; row: number; col: number }[] = [
    { id: 'sunflower', row: 0, col: 0 },
    { id: 'peashooter', row: 0, col: 1 },
    { id: 'repeater', row: 1, col: 1 },
    { id: 'sunflower', row: 1, col: 0 },
    { id: 'snowpea', row: 2, col: 1 },
    { id: 'sunflower', row: 2, col: 0 },
    { id: 'peashooter', row: 3, col: 1 },
    { id: 'cabbage', row: 4, col: 1 },
    { id: 'sunflower', row: 3, col: 0 },
    { id: 'sunflower', row: 4, col: 0 },
    { id: 'wallnut', row: 2, col: 3 },
    { id: 'tallnut', row: 4, col: 3 },
  ]

  constructor(private app: App) {
    const ids: ZombieId[] = ['basic', 'cone', 'bucket', 'pole', 'paper', 'football', 'door']
    for (let i = 0; i < 6; i++) {
      this.zs.push({ id: ids[i % ids.length], row: i % 5, x: 900 + i * 70 + rand(0, 60), phase: rand(0, 6), speed: rand(14, 20), flash: 0 })
    }
  }

  update(dt: number) {
    this.t += dt
    for (const z of this.zs) {
      z.x -= z.speed * dt
      z.phase += dt * z.speed * 0.105
      z.flash = Math.max(0, z.flash - dt)
      if (z.x < 760) {
        z.x = 1240 + rand(0, 120)
        z.id = (['basic', 'cone', 'bucket', 'pole', 'paper', 'football', 'door', 'flag'] as ZombieId[])[Math.floor(rand(0, 8))]
      }
    }
    for (let r = 0; r < 4; r++) {
      this.shootT[r] -= dt
      if (this.shootT[r] <= 0) {
        this.shootT[r] = 1.4
        if (this.zs.some((z) => z.row === r && z.x < 1180)) this.peas.push({ row: r, x: colCenter(1) + 40 })
      }
    }
    for (const p of this.peas) p.x += 430 * dt
    this.peas = this.peas.filter((p) => {
      const z = this.zs.find((zz) => zz.row === p.row && p.x > zz.x - 24 && p.x < zz.x + 30)
      if (z) {
        z.flash = 0.1
        z.x += 4
      }
      return !z && p.x < VIEW_W + 40
    })
  }

  render(ctx: Ctx) {
    const app = this.app
    backdrop(ctx, app, 0)
    for (const s of this.shooters) plantShadow(ctx, colCenter(s.col), rowFeet(s.row) + 2)
    for (let r = 0; r < 5; r++) {
      for (const s of this.shooters) if (s.row === r) drawPlant(ctx, s.id, colCenter(s.col), rowFeet(s.row), { t: this.t + s.col + r, hp: 1 })
      for (const z of this.zs) {
        if (z.row !== r) continue
        zombieShadow(ctx, z.x, rowFeet(r), z.id)
        drawZombie(ctx, z.x, rowFeet(r), { ...view(z.id, this.t, z.phase), state: 'walk' })
      }
      for (const p of this.peas) if (p.row === r) drawPea(ctx, p.x, rowFeet(r) - 61, r === 2 ? 'snow' : 'pea', this.t)
    }

    // Botanical field notes: a translucent menu and living specimen cards.
    ctx.fillStyle = linear(ctx, 0, 0, VIEW_W, 0, [[0, '#eaf4eaf5'], [0.55, '#e5f2ebeb'], [1, '#d9ebe4bd']])
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
    parchment(ctx, 48, 48, 530, 620)
    text(ctx, 'YUMO GARDENS / NO. 02', 86, 91, { size: 13, color: '#637f75', align: 'left', weight: 500 })
    text(ctx, '花园保卫战', 84, 172, { size: 67, color: '#285448', align: 'left', weight: 800 })
    text(ctx, 'A LITTLE DEFENCE OF JOY.', 88, 221, { size: 19, color: '#638975', align: 'left', weight: 500 })
    text(ctx, '种下希望，守住好时光。', 88, 267, { size: 20, color: '#6b8375', align: 'left', weight: 500 })
    ctx.strokeStyle = '#c3d6c7'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(88, 302); ctx.lineTo(537, 302); ctx.stroke()
    const lv = LEVELS[Math.min(app.save.unlocked, LEVELS.length - 1)]
    if (app.ui.button(ctx, '开始冒险  ↗', 88, 329, 450, 70, 'green', 28)) app.startLevel(lv)
    text(ctx, `下一站  ${lv.id} · ${lv.name}`, 313, 425, { size: 15, color: '#628174', weight: 500 })
    if (app.ui.button(ctx, '关卡与小游戏', 88, 459, 450, 57, 'wood', 22)) app.go(new SelectScene(app))
    if (app.ui.button(ctx, '植物图鉴', 88, 532, 218, 54, 'wood', 20)) app.go(new AlmanacScene(app))
    if (app.ui.button(ctx, '设置', 320, 532, 218, 54, 'wood', 20)) app.go(new SettingsScene(app))
    text(ctx, '12 关冒险     /     15 种植物     /     无限好时光', 313, 626, { size: 13, color: '#718b7e', weight: 500 })

    text(ctx, 'GROW.', 660, 124, { size: 64, color: '#325e50', align: 'left', weight: 800 })
    text(ctx, 'GUARD. REPEAT.', 664, 165, { size: 20, color: '#668a79', align: 'left', weight: 500 })
    ctx.save()
    ctx.translate(962, 330); ctx.rotate(0.11)
    parchment(ctx, -153, -144, 306, 322)
    text(ctx, 'SPECIMEN 01 / SUNFLOWER', 0, -112, { size: 11, color: '#738b7b', weight: 500 })
    circle(ctx, 0, 7, 96); paint(ctx, '#ecedce')
    ctx.save(); ctx.translate(0, 98); ctx.scale(1.6, 1.6); drawPlant(ctx, 'sunflower', 0, 0, { t: this.t, hp: 1 }); ctx.restore()
    text(ctx, '阳光，是最好的补给。', 0, 147, { size: 15, color: '#587563', weight: 500 })
    ctx.restore()
    ctx.save()
    ctx.translate(756, 482); ctx.rotate(-0.1)
    parchment(ctx, -116, -127, 232, 271)
    text(ctx, '02 / PEA SHOOTER', 0, -98, { size: 11, color: '#738b7b', weight: 500 })
    circle(ctx, 0, -4, 71); paint(ctx, '#d9e9db')
    ctx.save(); ctx.translate(0, 70); ctx.scale(1.3, 1.3); drawPlant(ctx, 'peashooter', 0, 0, { t: this.t, hp: 1 }); ctx.restore()
    text(ctx, '小小一株，大大勇气。', 0, 115, { size: 13, color: '#587563', weight: 500 })
    ctx.restore()
    text(ctx, '✳', 1084, 592, { size: 72, color: '#83a988', weight: 500 })
    text(ctx, 'KEEP THE GARDEN GROWING.', 896, 668, { size: 13, color: '#557c68', weight: 500 })

  }

  key(k: string) {
    if (k === 'Enter') this.app.startLevel(LEVELS[Math.min(this.app.save.unlocked, LEVELS.length - 1)])
  }
}

// ------------------------------------------------------------------ level select

export class SelectScene implements Scene {
  music = 'menu' as const
  private t = 0
  constructor(private app: App) {}

  update(dt: number) {
    this.t += dt
  }

  render(ctx: Ctx) {
    const app = this.app
    const save = app.save
    backdrop(ctx, app, 120, 0.55)
    if (backButton(ctx, app)) app.go(new TitleScene(app))
    text(ctx, '冒险模式 · 白天的草坪', 172, 42, { size: 30, color: '#fff3c8', stroke: '#2a1a08', lw: 6, align: 'left' })
    const owned = save.plants.length
    text(ctx, `植物收集 ${owned}/${ALL_PLANTS.length}`, 792, 42, { size: 18, color: '#d8f0b0', stroke: '#1a2a08', lw: 4, align: 'right' })

    const cw = 178
    const ch = 132
    LEVELS.forEach((lv, i) => {
      const x = 28 + (i % 4) * (cw + 16)
      const y = 92 + Math.floor(i / 4) * (ch + 16)
      const locked = i > save.unlocked
      const cleared = save.cleared.includes(i)
      const hover = !locked && app.ui.over(x, y, cw, ch)
      ctx.save()
      if (hover) ctx.translate(0, -3)
      plank(ctx, x, y, cw, ch)
      text(ctx, lv.id, x + 18, y + 38, { size: 34, color: '#31594a', align: 'left', weight: 900 })
      text(ctx, lv.name, x + 18, y + 80, { size: 17, color: '#476854', align: 'left' })
      const tag = lv.mode === 'bowling' ? '保龄球' : lv.mode === 'conveyor' ? '传送带' : `${lv.waves} 波`
      text(ctx, tag, x + 18, y + 108, { size: 14, color: '#71856c', align: 'left', weight: 700 })
      if (lv.reward[0]) drawPacket(ctx, x + cw - 58, y + 26, lv.reward[0], { scale: 0.62 })
      else drawTrophy(ctx, x + cw - 38, y + 92, 0.36, this.t)
      if (cleared) {
        circle(ctx, x + cw - 12, y + 12, 16)
        paint(ctx, '#4fbf2a', '#1d4a0e', 3)
        text(ctx, '✓', x + cw - 12, y + 13, { size: 20, color: '#fff', weight: 900 })
      }
      if (locked) {
        rrect(ctx, x, y, cw, ch, 16)
        ctx.fillStyle = 'rgba(10,8,4,0.62)'
        ctx.fill()
        lock(ctx, x + cw / 2, y + ch / 2)
      }
      ctx.restore()
      if (!locked && app.ui.hit(x, y, cw, ch)) {
        app.audio.play('click')
        app.startLevel(lv)
      }
    })

    // mini-games
    const mx = 820
    parchment(ctx, mx, 92, 356, 428)
    text(ctx, '小游戏', mx + 178, 128, { size: 28, color: '#315447', weight: 900 })
    const games: { lv: LevelDef; title: string; sub: string; need: number; best: string }[] = [
      { lv: BOWLING, title: '坚果保龄球 · 挑战', sub: '20 波保龄球，打出最高连击', need: 4, best: `最高连击 ${save.bowlingBest}` },
      { lv: ENDLESS, title: '无尽生存', sub: '一波接一波，看你能撑多久', need: 9, best: `最佳纪录 ${save.endlessBest} 波` },
    ]
    games.forEach((g, i) => {
      const x = mx + 22
      const y = 160 + i * 172
      const locked = !save.cleared.includes(g.need) && save.unlocked <= g.need
      const hover = !locked && app.ui.over(x, y, 312, 152)
      rrect(ctx, x, y - (hover ? 3 : 0), 312, 152, 14)
      paint(ctx, linear(ctx, 0, y, 0, y + 152, i ? [[0, '#5d7f3a'], [1, '#2f4a1a']] : [[0, '#8a5a2c'], [1, '#5c3a18']]), hover ? '#fff3c8' : '#2a1a08', 3)
      if (i === 0) drawPlant(ctx, 'bowlnut', x + 262, y + 112, { t: this.t, rot: this.t * 3, hp: 1 })
      else drawZombieHead(ctx, 'bucket', x + 262, y + 92, -0.1, 1.05)
      text(ctx, g.title, x + 18, y + 36, { size: 21, color: '#fff3c8', stroke: '#1a1006', lw: 4, align: 'left', weight: 900 })
      text(ctx, g.sub, x + 18, y + 72, { size: 14, color: '#f0e0c0', align: 'left', weight: 600 })
      text(ctx, g.best, x + 18, y + 112, { size: 16, color: '#ffe066', align: 'left', weight: 800 })
      if (locked) {
        rrect(ctx, x, y, 312, 152, 14)
        ctx.fillStyle = 'rgba(10,8,4,0.66)'
        ctx.fill()
        lock(ctx, x + 156, y + 56)
        text(ctx, `通关 ${LEVELS[g.need].id} 后解锁`, x + 156, y + 116, { size: 16, color: '#ffe9b0', weight: 700 })
      } else if (app.ui.hit(x, y, 312, 152)) {
        app.audio.play('click')
        app.startLevel(g.lv)
      }
    })
    if (app.ui.button(ctx, '植物图鉴', mx + 22, 540, 150, 54, 'wood', 21)) app.go(new AlmanacScene(app))
    if (app.ui.button(ctx, '设置', mx + 184, 540, 150, 54, 'wood', 21)) app.go(new SettingsScene(app))
  }

  key(k: string) {
    if (k === 'Escape') this.app.go(new TitleScene(this.app))
  }
}

function lock(ctx: Ctx, x: number, y: number) {
  ctx.lineWidth = 6
  ctx.strokeStyle = '#c9c9c9'
  ctx.beginPath()
  ctx.arc(x, y - 8, 13, Math.PI, 0)
  ctx.stroke()
  rrect(ctx, x - 20, y - 8, 40, 32, 6)
  paint(ctx, linear(ctx, 0, y - 8, 0, y + 24, [[0, '#ffd75a'], [1, '#c8901a']]), '#5a3a08', 2.5)
  circle(ctx, x, y + 6, 4)
  paint(ctx, '#5a3a08')
}

// ------------------------------------------------------------------ almanac

export class AlmanacScene implements Scene {
  music = 'menu' as const
  private t = 0
  private tab: 'plants' | 'zombies' = 'plants'
  private plant: PlantId = 'peashooter'
  private zombie: ZombieId = 'basic'
  constructor(private app: App) {}

  update(dt: number) {
    this.t += dt
  }

  render(ctx: Ctx) {
    const app = this.app
    const save = app.save
    backdrop(ctx, app, 300, 0.62)
    if (backButton(ctx, app)) app.go(new TitleScene(app))
    text(ctx, '图鉴', 172, 42, { size: 32, color: '#fff3c8', stroke: '#2a1a08', lw: 6, align: 'left' })
    if (app.ui.button(ctx, '植物', 270, 18, 120, 48, this.tab === 'plants' ? 'green' : 'stone', 22)) this.tab = 'plants'
    if (app.ui.button(ctx, '僵尸', 400, 18, 120, 48, this.tab === 'zombies' ? 'green' : 'stone', 22)) this.tab = 'zombies'

    parchment(ctx, 24, 86, 512, 610)
    parchment(ctx, 556, 86, 620, 610)
    if (this.tab === 'plants') {
      PLANT_ORDER.forEach((id, i) => {
        const x = 54 + (i % 5) * 92
        const y = 110 + Math.floor(i / 5) * 112
        const owned = save.plants.includes(id)
        const hover = app.ui.over(x, y, PACKET_W, PACKET_H)
        if (owned) drawPacket(ctx, x, y, id, { cost: PLANTS[id].cost, hover })
        else {
          rrect(ctx, x, y, PACKET_W, PACKET_H, 8)
          paint(ctx, '#dce7d8', '#8ba38b', 2.4)
          text(ctx, '?', x + PACKET_W / 2, y + PACKET_H / 2, { size: 40, color: '#8ba38b', weight: 900 })
        }
        if (this.plant === id) {
          rrect(ctx, x - 4, y - 4, PACKET_W + 8, PACKET_H + 8, 10)
          ctx.strokeStyle = '#2f8a1a'
          ctx.lineWidth = 4
          ctx.stroke()
        }
        if (app.ui.hit(x, y, PACKET_W, PACKET_H)) {
          this.plant = id
          app.audio.play('pick')
        }
      })
      text(ctx, '保龄球专用：保龄坚果 · 爆炸坚果 · 巨型坚果', 280, 670, { size: 14, color: '#6c8170' })
      this.plantDetail(ctx, this.plant, save.plants.includes(this.plant))
    } else {
      ZOMBIE_ORDER.forEach((id, i) => {
        const x = 50 + (i % 4) * 118
        const y = 108 + Math.floor(i / 4) * 128
        const seen = save.seen.includes(id)
        const hover = app.ui.over(x, y, 104, 112)
        rrect(ctx, x, y - (hover ? 2 : 0), 104, 112, 12)
        paint(ctx, linear(ctx, 0, y, 0, y + 112, [[0, '#7cc152'], [1, '#4c8a2c']]), this.zombie === id ? '#fff3a0' : '#2c4a14', this.zombie === id ? 4 : 2.4)
        if (seen) drawZombieHead(ctx, id, x + 56, y + 52, -0.1, id === 'garg' ? 0.62 : id === 'imp' ? 0.95 : 1)
        else text(ctx, '?', x + 52, y + 52, { size: 46, color: '#2c4a14', weight: 900 })
        text(ctx, seen ? ZOMBIES[id].name : '???', x + 52, y + 98, { size: 14, color: '#fff', stroke: '#1d3a0c', lw: 3, weight: 800 })
        if (app.ui.hit(x, y, 104, 112)) {
          this.zombie = id
          app.audio.play('pick')
        }
      })
      this.zombieDetail(ctx, this.zombie, save.seen.includes(this.zombie))
    }
  }

  private stage(ctx: Ctx) {
    const x = 586
    const y = 112
    rrect(ctx, x, y, 560, 300, 16)
    ctx.save()
    ctx.clip()
    ctx.fillStyle = linear(ctx, 0, y, 0, y + 300, [
      [0, '#9fd9ff'],
      [0.45, '#d8f2ff'],
      [0.46, '#6cc644'],
      [1, '#4f9a2c'],
    ])
    ctx.fillRect(x, y, 560, 300)
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
      ctx.fillRect(x + i * 98, y + 136, 98, 164)
    }
    ctx.restore()
    rrect(ctx, x, y, 560, 300, 16)
    ctx.strokeStyle = '#5b7563'
    ctx.lineWidth = 4
    ctx.stroke()
  }

  private plantDetail(ctx: Ctx, id: PlantId, owned: boolean) {
    this.stage(ctx)
    const d = PLANTS[id]
    if (owned) {
      plantShadow(ctx, 866, 372, 46)
      ctx.save()
      ctx.translate(866, 372)
      ctx.scale(1.6, 1.6)
      const st = id === 'potato' ? 'armed' : id === 'chomper' ? 'ready' : undefined
      drawPlant(ctx, id, 0, 0, { t: this.t, hp: 1, state: st, anim: id === 'sunflower' ? (Math.sin(this.t) + 1) / 2 : 0 })
      ctx.restore()
    } else text(ctx, '尚未获得', 866, 262, { size: 34, color: '#2c4a14', weight: 900 })
    text(ctx, owned ? d.name : '？？？', 866, 446, { size: 32, color: '#315447', weight: 900 })
    if (!owned) return
    text(ctx, `阳光 ${d.cost}　·　冷却 ${d.cooldown >= 30 ? '慢' : '快'}　·　耐久 ${d.hp}`, 866, 484, { size: 17, color: '#8a5a1a', weight: 800 })
    let y = 522
    ctx.font = `600 18px ${FONT}`
    for (const ln of wrapText(ctx, d.desc, 520)) {
      text(ctx, ln, 866, y, { size: 18, color: '#465e51', weight: 600 })
      y += 28
    }
    y += 8
    text(ctx, d.stats.join('　'), 866, y, { size: 16, color: '#2f7a1a', weight: 800 })
  }

  private zombieDetail(ctx: Ctx, id: ZombieId, seen: boolean) {
    this.stage(ctx)
    const d = ZOMBIES[id]
    if (seen) {
      zombieShadow(ctx, 866, 384, id)
      ctx.save()
      ctx.translate(866, 384)
      const s = id === 'garg' ? 0.95 : id === 'imp' ? 1.6 : 1.45
      ctx.scale(s, s)
      drawZombie(ctx, 0, 0, view(id, this.t, this.t * 2.2, 'preview'))
      ctx.restore()
    } else text(ctx, '尚未遭遇', 866, 262, { size: 34, color: '#2c4a14', weight: 900 })
    text(ctx, seen ? d.name : '？？？', 866, 446, { size: 32, color: '#315447', weight: 900 })
    if (!seen) return
    text(ctx, d.toughness, 866, 484, { size: 17, color: '#8a1a1a', weight: 800 })
    let y = 522
    ctx.font = `600 18px ${FONT}`
    for (const ln of wrapText(ctx, d.desc, 520)) {
      text(ctx, ln, 866, y, { size: 18, color: '#465e51', weight: 600 })
      y += 28
    }
  }

  key(k: string) {
    if (k === 'Escape') this.app.go(new TitleScene(this.app))
  }
}

// ------------------------------------------------------------------ settings

export class SettingsScene implements Scene {
  music = 'menu' as const
  private confirmReset = 0
  private toast = ''
  private toastT = 0
  constructor(private app: App) {}

  update(dt: number) {
    this.confirmReset = Math.max(0, this.confirmReset - dt)
    this.toastT = Math.max(0, this.toastT - dt)
  }

  render(ctx: Ctx) {
    const app = this.app
    backdrop(ctx, app, 200, 0.6)
    if (backButton(ctx, app)) app.go(new TitleScene(app))
    const w = 520
    const h = 470
    const x = (VIEW_W - w) / 2
    const y = 120
    parchment(ctx, x, y, w, h)
    text(ctx, '设置', VIEW_W / 2, y + 50, { size: 36, color: '#315447', weight: 900 })
    const a = app.audio
    if (app.ui.button(ctx, `背景音乐：${a.musicOn ? '开' : '关'}`, x + 70, y + 96, w - 140, 58, a.musicOn ? 'green' : 'stone', 24)) {
      a.setMusicOn(!a.musicOn)
      app.save.music = a.musicOn
      app.persist()
    }
    if (app.ui.button(ctx, `音效：${a.sfxOn ? '开' : '关'}`, x + 70, y + 168, w - 140, 58, a.sfxOn ? 'green' : 'stone', 24)) {
      a.sfxOn = !a.sfxOn
      app.save.sfx = a.sfxOn
      app.persist()
    }
    if (app.ui.button(ctx, '解锁全部关卡与植物', x + 70, y + 240, w - 140, 58, 'wood', 22)) {
      app.save.unlocked = LEVELS.length - 1
      app.save.plants = [...ALL_PLANTS]
      app.save.seen = [...ZOMBIE_ORDER]
      app.save.cleared = Array.from({ length: LEVELS.length - 1 }, (_, i) => i)
      app.persist()
      this.toast = '已解锁全部内容'
      this.toastT = 2
    }
    const label = this.confirmReset > 0 ? '再点一次确认重置' : '重置存档'
    if (app.ui.button(ctx, label, x + 70, y + 312, w - 140, 58, 'red', 22)) {
      if (this.confirmReset > 0) {
        const fresh = resetSave()
        Object.assign(app.save, fresh)
        this.confirmReset = 0
        this.toast = '存档已重置'
        this.toastT = 2
      } else this.confirmReset = 3
    }
    text(ctx, '进度保存在浏览器本地 · 快捷键：空格暂停、1–8 选卡、Q 铲子、F 加速', VIEW_W / 2, y + h - 40, { size: 14, color: '#6c8170' })
    if (this.toastT > 0) {
      ctx.save()
      ctx.globalAlpha = Math.min(1, this.toastT * 2)
      text(ctx, this.toast, VIEW_W / 2, y + h + 40, { size: 24, color: '#fff3c8', stroke: '#2a1a08', lw: 5 })
      ctx.restore()
    }
  }

  key(k: string) {
    if (k === 'Escape') this.app.go(new TitleScene(this.app))
  }
}

// ------------------------------------------------------------------ reward

export class RewardScene implements Scene {
  music = 'menu' as const
  private t = 0
  constructor(
    private app: App,
    private level: LevelDef,
    private plants: PlantId[],
    private final: boolean,
  ) {}

  update(dt: number) {
    this.t += dt
  }

  render(ctx: Ctx) {
    const app = this.app
    ctx.fillStyle = linear(ctx, 0, 0, 0, VIEW_H, [
      [0, '#f4faf0'],
      [1, '#dfece0'],
    ])
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
    ctx.save()
    ctx.translate(VIEW_W / 2, 330)
    ctx.rotate(this.t * 0.15)
    ctx.fillStyle = 'rgba(255,214,90,0.18)'
    for (let i = 0; i < 16; i++) {
      ctx.rotate(Math.PI / 8)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(-60, -900)
      ctx.lineTo(60, -900)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
    const pop = easeOutBack(clamp(this.t / 0.6, 0, 1))
    if (this.plants.length) {
      text(ctx, '你获得了新植物！', VIEW_W / 2, 74, { size: 46, color: '#3f8a1c', stroke: '#fff', lw: 8, weight: 900 })
      const n = this.plants.length
      this.plants.forEach((id, i) => {
        const cx = VIEW_W / 2 + (i - (n - 1) / 2) * 420
        const d = PLANTS[id]
        circle(ctx, cx, 300, 120 * pop)
        paint(ctx, radial(ctx, cx, 300, 10, cx, 300, 120, [[0, '#ffffffcc'], [1, '#ffffff00']]))
        ctx.save()
        ctx.translate(cx, 380)
        ctx.scale(1.9 * pop, 1.9 * pop)
        plantShadow(ctx, 0, 2, 34)
        drawPlant(ctx, id, 0, 0, { t: this.t, hp: 1, state: id === 'potato' ? 'armed' : undefined })
        ctx.restore()
        text(ctx, d.name, cx, 430, { size: 34, color: '#315447', weight: 900 })
        ctx.font = `600 18px ${FONT}`
        wrapText(ctx, d.desc, 360).forEach((ln, k) => text(ctx, ln, cx, 470 + k * 28, { size: 18, color: '#5b7563', weight: 600 }))
        text(ctx, `${d.cost} 阳光`, cx, 540, { size: 18, color: '#b07a1a', weight: 800 })
      })
    } else {
      text(ctx, this.final ? '恭喜通关！你守住了花园' : `关卡 ${this.level.id} 完成！`, VIEW_W / 2, 84, { size: 46, color: '#b07a1a', stroke: '#fff', lw: 8, weight: 900 })
      drawTrophy(ctx, VIEW_W / 2, 420, 2.1 * pop, this.t)
      if (this.final) text(ctx, '感谢游玩 · 去小游戏里挑战更高纪录吧', VIEW_W / 2, 500, { size: 22, color: '#5b7563', weight: 700 })
    }
    if (this.t > 0.8 && app.ui.button(ctx, '继续', VIEW_W / 2 - 120, VIEW_H - 120, 240, 64, 'green', 28)) app.go(new SelectScene(app))
  }

  key(k: string) {
    if (k === 'Enter' || k === ' ') this.app.go(new SelectScene(this.app))
  }
}
