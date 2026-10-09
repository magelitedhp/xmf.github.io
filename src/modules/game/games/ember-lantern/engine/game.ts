import { Input } from './input'
import { Sound } from './audio'
import {
  BEST_KEY,
  BIOMES,
  BOSS_EVERY,
  GRAVITY,
  GROUND_Y,
  MAX_DEPTH,
  STEP,
  SCALE,
  W,
  approach,
  cardRect,
  chance,
  clamp,
  overlap,
  pick,
  rand,
  randi,
  sign,
  weightedPick,
  type Rect,
} from './core'
import { ENEMY_DEFS, createEnemy, enemyName, isFlying, updateEnemy } from './enemies'
import { rollUpgrades, type Upgrade } from './upgrades'
import { render } from './render'
import {
  baseStats,
  type Body,
  type Decor,
  type Enemy,
  type EnemyKind,
  type FloatText,
  type Particle,
  type Pickup,
  type Player,
  type Projectile,
  type ProjectileKind,
  type RunStats,
  type SpawnMark,
} from './types'

export type GameState = 'title' | 'play' | 'upgrade' | 'paused' | 'dead' | 'victory'

const LAYOUTS: Rect[][] = [
  [
    { x: 60, y: 172, w: 90, h: 6 },
    { x: 330, y: 172, w: 90, h: 6 },
    { x: 190, y: 122, w: 100, h: 6 },
  ],
  [
    { x: 36, y: 150, w: 110, h: 6 },
    { x: 200, y: 186, w: 80, h: 6 },
    { x: 334, y: 140, w: 110, h: 6 },
  ],
  [
    { x: 116, y: 176, w: 70, h: 6 },
    { x: 294, y: 176, w: 70, h: 6 },
    { x: 205, y: 126, w: 70, h: 6 },
  ],
  [
    { x: 0, y: 160, w: 120, h: 6 },
    { x: 360, y: 160, w: 120, h: 6 },
    { x: 196, y: 108, w: 88, h: 6 },
  ],
]

const BOSS_LAYOUT: Rect[] = [
  { x: 36, y: 166, w: 80, h: 6 },
  { x: 364, y: 166, w: 80, h: 6 },
]

const POOLS: { kind: EnemyKind; w: number; from: number }[][] = [
  [
    { kind: 'slime', w: 3, from: 1 },
    { kind: 'bat', w: 2, from: 1 },
    { kind: 'archer', w: 1.6, from: 2 },
    { kind: 'brute', w: 1.1, from: 3 },
  ],
  [
    { kind: 'slime', w: 1.4, from: 6 },
    { kind: 'bat', w: 2, from: 6 },
    { kind: 'archer', w: 1.8, from: 6 },
    { kind: 'brute', w: 1.4, from: 6 },
    { kind: 'wisp', w: 2.2, from: 6 },
  ],
]

interface ShotOptions {
  kind: ProjectileKind
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  dmg: number
  color: string
  life?: number
  delay?: number
  pierce?: boolean
  gravity?: number
}

export class Game {
  state: GameState = 'title'
  readonly input = new Input()
  readonly sound = new Sound()
  player: Player
  enemies: Enemy[] = []
  projs: Projectile[] = []
  particles: Particle[] = []
  ambient: Particle[] = []
  texts: FloatText[] = []
  pickups: Pickup[] = []
  marks: SpawnMark[] = []
  platforms: Rect[] = []
  decor: Decor = { far: [], near: [], lanterns: [], stars: [] }

  depth = 1
  wave = 0
  wavesTotal = 0
  waveDelay = 0
  roomCleared = false
  clearT = 0
  boss: Enemy | null = null
  choices: Upgrade[] = []
  choiceIndex = 1
  menuDelay = 0
  taken: Record<string, number> = {}
  run: RunStats = { kills: 0, damage: 0, time: 0, maxCombo: 0 }
  combo = 0
  comboT = 0
  best = 0

  time = 0
  shake = 0
  flash = 0
  freeze = 0
  slowT = 0
  fade = 0
  banner = { title: '', sub: '', color: '#f2c66d', t: 0, max: 1 }

  private ctx: CanvasRenderingContext2D
  private raf = 0
  private last = 0
  private acc = 0
  private nextId = 1

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D not supported')
    this.ctx = ctx
    this.input.onAny = () => this.sound.unlock()
    this.best = Number(localStorage.getItem(BEST_KEY) || 0)
    this.player = this.makePlayer()
    this.buildRoom(1)
  }

  get biome() {
    return this.depth <= BOSS_EVERY ? 0 : 1
  }

  get isBossRoom() {
    return this.depth % BOSS_EVERY === 0
  }

  start() {
    this.input.attach()
    window.addEventListener('blur', this.onBlur)
    document.addEventListener('visibilitychange', this.onBlur)
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.input.detach()
    window.removeEventListener('blur', this.onBlur)
    document.removeEventListener('visibilitychange', this.onBlur)
    this.sound.close()
  }

  /** Pointer input in UI (960×540) coordinates. */
  pointer(x: number, y: number, down: boolean) {
    if (down) this.sound.unlock()
    if (this.state === 'upgrade') {
      const hit = this.choices.findIndex((_, i) => {
        const r = cardRect(i)
        return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
      })
      if (hit >= 0) {
        if (hit !== this.choiceIndex) this.choiceIndex = hit
        if (down && this.menuDelay <= 0) this.choose(hit)
      }
      return
    }
    if (!down) return
    if (this.state === 'title') this.startRun()
    else if ((this.state === 'dead' || this.state === 'victory') && this.menuDelay <= 0) this.startRun()
    else if (this.state === 'paused') this.state = 'play'
  }

  togglePause() {
    if (this.state === 'play') this.state = 'paused'
    else if (this.state === 'paused') this.state = 'play'
  }

  private onBlur = () => {
    this.input.reset()
    if (this.state === 'play') this.state = 'paused'
  }

  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame)
    this.acc += Math.min(0.25, (now - this.last) / 1000)
    this.last = now
    let steps = 0
    while (this.acc >= STEP && steps < 5) {
      this.step()
      this.acc -= STEP
      steps++
    }
    if (steps === 5) this.acc = 0
    render(this.ctx, this)
  }

  private step() {
    this.time += STEP
    this.fade = Math.max(0, this.fade - STEP * 2.2)
    this.flash = Math.max(0, this.flash - STEP * 4)
    this.menuDelay -= STEP
    const inp = this.input

    switch (this.state) {
      case 'title':
        this.tickAmbient(STEP)
        if (inp.pressed('confirm') || inp.pressed('attack')) this.startRun()
        break
      case 'paused':
        if (inp.pressed('pause') || inp.pressed('confirm')) this.state = 'play'
        break
      case 'upgrade':
        this.tickAmbient(STEP)
        this.tickParticles(STEP)
        if (inp.pressed('left')) this.choiceIndex = (this.choiceIndex + this.choices.length - 1) % this.choices.length
        if (inp.pressed('right')) this.choiceIndex = (this.choiceIndex + 1) % this.choices.length
        if ((inp.pressed('left') || inp.pressed('right')) && this.choices.length) this.sound.play('select')
        if (this.menuDelay <= 0 && (inp.pressed('confirm') || inp.pressed('attack'))) this.choose(this.choiceIndex)
        break
      case 'dead':
      case 'victory':
        this.tickAmbient(STEP)
        this.tickParticles(STEP)
        if (this.menuDelay <= 0 && (inp.pressed('confirm') || inp.pressed('attack'))) this.startRun()
        break
      case 'play':
        if (inp.pressed('pause')) this.state = 'paused'
        else this.updatePlay()
        break
    }
    inp.endStep()
  }

  // ------------------------------------------------------------------ run flow

  private makePlayer(): Player {
    return {
      x: 40,
      y: GROUND_Y - 20,
      w: 12,
      h: 20,
      vx: 0,
      vy: 0,
      onGround: true,
      face: 1,
      hp: 100,
      maxHp: 100,
      jumps: 0,
      invuln: 0,
      hurtT: 0,
      attackT: 0,
      attackDur: 0.22,
      combo: 0,
      comboWindow: 0,
      attackCd: 0,
      hitIds: new Set(),
      dashT: 0,
      dashCd: 0,
      dashHitIds: new Set(),
      jumpBuffer: 0,
      coyote: 0,
      dropT: 0,
      stats: baseStats(),
    }
  }

  startRun() {
    this.player = this.makePlayer()
    this.taken = {}
    this.run = { kills: 0, damage: 0, time: 0, maxCombo: 0 }
    this.combo = 0
    this.enterRoom(1)
    this.state = 'play'
    this.fade = 1
    this.sound.play('select')
  }

  private enterRoom(depth: number) {
    this.depth = depth
    this.buildRoom(depth)
    const p = this.player
    p.x = 40
    p.y = GROUND_Y - p.h
    p.vx = 0
    p.vy = 0
    p.face = 1
    p.attackT = 0
    p.dashT = 0
    this.enemies = []
    this.projs = []
    this.marks = []
    this.pickups = []
    this.particles = []
    this.boss = null
    this.wave = 0
    this.wavesTotal = this.isBossRoom ? 1 : depth >= 4 ? 3 : 2
    this.waveDelay = 1
    this.roomCleared = false
    const biome = BIOMES[this.biome]
    if (this.isBossRoom) this.showBanner(`第 ${depth} 层 · 首领`, biome.name, '#ff8a5c')
    else this.showBanner(`第 ${depth} 层`, `${biome.name} · ${biome.sub}`, '#f2c66d')
  }

  private buildRoom(depth: number) {
    const boss = depth % BOSS_EVERY === 0
    this.platforms = (boss ? BOSS_LAYOUT : pick(LAYOUTS)).map((r) => ({ ...r }))
    const far: Decor['far'] = []
    for (let x = -10; x < W; x += randi(34, 60)) far.push({ x, w: randi(22, 40), h: randi(50, 120) })
    const near: Decor['near'] = []
    for (let x = -10; x < W; x += randi(60, 110)) near.push({ x, w: randi(10, 18), h: randi(30, 70) })
    const lanterns: Decor['lanterns'] = []
    for (let i = 0; i < 6; i++) lanterns.push({ x: randi(20, W - 20), y: randi(18, 70), len: randi(6, 22) })
    const stars: Decor['stars'] = []
    for (let i = 0; i < 60; i++) stars.push({ x: randi(0, W), y: randi(0, 150), p: Math.random() * 10 })
    this.decor = { far, near, lanterns, stars }
  }

  private spawnWave() {
    this.wave++
    if (this.isBossRoom) {
      const kind: EnemyKind = this.biome === 0 ? 'warden' : 'frost'
      this.queueSpawn(kind, W - 90, kind === 'frost' ? 100 : GROUND_Y, 1.4)
      this.showBanner(enemyName(kind), this.biome === 0 ? '长廊尽头的灯火守望者' : '高台之上的寒月祭司', '#ff8a5c')
      this.sound.play('boss')
      return
    }
    const pool = POOLS[this.biome].filter((e) => this.depth >= e.from)
    const count = 3 + Math.floor(this.depth * 0.7) + (this.wave - 1)
    for (let i = 0; i < count; i++) {
      const kind = weightedPick(pool).kind
      this.queueSpawn(kind, this.spawnX(), this.spawnBottom(kind), 0.7 + i * 0.12)
    }
  }

  private spawnX() {
    const px = this.player.x + this.player.w / 2
    for (let i = 0; i < 10; i++) {
      const x = rand(24, W - 24)
      if (Math.abs(x - px) > 90) return x
    }
    return px < W / 2 ? W - 40 : 40
  }

  private spawnBottom(kind: EnemyKind) {
    if (isFlying(kind)) return rand(60, 140)
    if (chance(0.3)) {
      const plat = pick(this.platforms)
      return plat.y
    }
    return GROUND_Y
  }

  queueSpawn(kind: EnemyKind, x: number, bottom: number, t = 0.7) {
    this.marks.push({ kind, x, bottom, t, max: t })
  }

  private offerUpgrades() {
    this.choices = rollUpgrades(this.taken, 3, this.isBossRoom)
    this.choiceIndex = Math.min(1, this.choices.length - 1)
    this.menuDelay = 0.4
    this.state = 'upgrade'
  }

  private choose(i: number) {
    const u = this.choices[i]
    if (!u) return
    u.apply(this.player)
    this.taken[u.id] = (this.taken[u.id] ?? 0) + 1
    this.sound.play('pick')
    this.enterRoom(this.depth + 1)
    this.state = 'play'
    this.fade = 1
  }

  private endRun(victory: boolean) {
    const reached = victory ? MAX_DEPTH + 1 : this.depth
    if (reached > this.best) {
      this.best = reached
      localStorage.setItem(BEST_KEY, String(reached))
    }
    this.state = victory ? 'victory' : 'dead'
    this.menuDelay = 1.2
    this.sound.play(victory ? 'clear' : 'die')
  }

  showBanner(title: string, sub: string, color: string) {
    this.banner = { title, sub, color, t: 2.2, max: 2.2 }
  }

  // ------------------------------------------------------------------ update

  private updatePlay() {
    if (this.freeze > 0) {
      this.freeze--
      return
    }
    let dt = STEP
    if (this.slowT > 0) {
      this.slowT -= STEP
      dt *= 0.3
    }
    this.run.time += dt
    if (this.banner.t > 0) this.banner.t -= dt

    this.updatePlayer(dt)
    if (this.state !== 'play') return

    for (const m of this.marks) {
      m.t -= dt
      if (m.t <= 0) this.spawnEnemy(m)
    }
    this.marks = this.marks.filter((m) => m.t > 0)

    const p = this.player
    const hurtBox = { x: p.x + 2, y: p.y + 3, w: p.w - 4, h: p.h - 3 }
    for (const e of this.enemies) {
      if (e.dead) continue
      updateEnemy(this, e, dt)
      if (!e.dead && e.state !== 'intro' && overlap(e, hurtBox)) this.hurtPlayer(e.dmg, e.x + e.w / 2)
      if (this.state !== 'play') return
    }
    this.updateProjectiles(dt)
    if (this.state !== 'play') return
    this.updatePickups(dt)
    this.enemies = this.enemies.filter((e) => !e.dead)
    this.tickParticles(dt)
    this.tickAmbient(dt)

    if (this.comboT > 0) {
      this.comboT -= dt
      if (this.comboT <= 0) this.combo = 0
    }

    if (!this.roomCleared) {
      if (this.enemies.length === 0 && this.marks.length === 0) {
        if (this.wave < this.wavesTotal) {
          this.waveDelay -= dt
          if (this.waveDelay <= 0) {
            this.spawnWave()
            this.waveDelay = 0.8
          }
        } else {
          this.roomCleared = true
          this.clearT = 1.5
          this.projs = this.projs.filter((pr) => pr.friendly)
          this.sound.play('clear')
          if (this.depth < MAX_DEPTH) this.showBanner('肃清', '灯火稍定，择一而行', '#9fe3c0')
        }
      }
    } else {
      this.clearT -= dt
      if (this.clearT <= 0) {
        if (this.depth >= MAX_DEPTH) this.endRun(true)
        else this.offerUpgrades()
      }
    }
  }

  private spawnEnemy(m: SpawnMark) {
    const e = createEnemy(this.nextId++, m.kind, m.x, m.bottom, this.depth)
    e.face = this.player.x < m.x ? -1 : 1
    this.enemies.push(e)
    if (e.boss) this.boss = e
    this.burst(m.x, m.bottom - e.h / 2, e.boss ? 24 : 8, e.boss ? '#ff8a5c' : '#c9a7ff', 90)
  }

  moveBody(b: Body, dt: number, gravityScale: number, ignorePlatforms: boolean) {
    const prevBottom = b.y + b.h
    b.x = clamp(b.x + b.vx * dt, 0, W - b.w)
    b.vy = Math.min(b.vy + GRAVITY * gravityScale * dt, 620)
    b.y += b.vy * dt
    b.onGround = false
    if (b.y + b.h >= GROUND_Y) {
      b.y = GROUND_Y - b.h
      b.vy = 0
      b.onGround = true
      return
    }
    if (ignorePlatforms || b.vy < 0) return
    for (const pl of this.platforms) {
      if (prevBottom <= pl.y + 0.5 && b.y + b.h >= pl.y && b.x + b.w > pl.x && b.x < pl.x + pl.w) {
        b.y = pl.y - b.h
        b.vy = 0
        b.onGround = true
        return
      }
    }
  }

  moveFlyer(e: Enemy, dt: number) {
    e.x = clamp(e.x + e.vx * dt, 0, W - e.w)
    e.y = clamp(e.y + e.vy * dt, 8, GROUND_Y - e.h)
  }

  private standingOnPlatform() {
    const p = this.player
    return p.onGround && p.y + p.h < GROUND_Y - 1
  }

  private updatePlayer(dt: number) {
    const p = this.player
    const s = p.stats
    const inp = this.input
    p.invuln -= dt
    p.hurtT -= dt
    p.attackCd -= dt
    p.comboWindow -= dt
    p.dashCd -= dt
    p.jumpBuffer -= dt
    p.coyote -= dt
    p.dropT -= dt

    if (inp.pressed('jump')) p.jumpBuffer = 0.12
    if (p.onGround) {
      p.coyote = 0.08
      p.jumps = 0
    } else if (p.coyote <= 0 && p.jumps === 0) {
      p.jumps = 1
    }

    if (inp.pressed('dash') && p.dashCd <= 0 && p.dashT <= 0) {
      const dir = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0)
      if (dir) p.face = dir as 1 | -1
      p.dashT = 0.16
      p.dashCd = 0.6 * s.dashCdMult
      p.invuln = Math.max(p.invuln, 0.22)
      p.attackT = 0
      p.dashHitIds.clear()
      this.sound.play('dash')
      this.burst(p.x + p.w / 2, p.y + p.h - 2, 6, '#e4b863', 60)
    }

    if (p.dashT > 0) {
      p.dashT -= dt
      p.vx = p.face * 380
      p.vy = 0
      if (s.dashDamage > 0) {
        for (const e of this.enemies) {
          if (!e.dead && !p.dashHitIds.has(e.id) && overlap(p, e)) {
            p.dashHitIds.add(e.id)
            this.damageEnemy(e, s.dashDamage * s.damage, false, p.face * 60, 0, 'dash')
          }
        }
      }
      if (Math.random() < 0.7) this.addParticle(p.x + p.w / 2, p.y + rand(4, p.h), -p.face * 40, 0, 0.25, '#e4b863', 2, 0)
      this.moveBody(p, dt, 0, p.dropT > 0)
      if (p.dashT <= 0) p.vx = p.face * 140 * s.moveSpeed
      return
    }

    const dir = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0)
    const speed = 130 * s.moveSpeed * (p.attackT > 0 && p.onGround ? 0.35 : 1)
    p.vx = approach(p.vx, dir * speed, (p.onGround ? 1600 : 1100) * dt)
    if (dir && p.attackT <= 0) p.face = dir as 1 | -1

    if (p.jumpBuffer > 0) {
      if (inp.down('down') && this.standingOnPlatform()) {
        p.dropT = 0.25
        p.onGround = false
        p.jumpBuffer = 0
      } else if (p.onGround || p.coyote > 0) {
        p.vy = -330
        p.jumps = 1
        p.coyote = 0
        p.jumpBuffer = 0
        p.onGround = false
        this.sound.play('jump')
        this.dust(p.x + p.w / 2, p.y + p.h, 4, '#d8c8a8')
      } else if (p.jumps < s.maxJumps) {
        p.vy = -300
        p.jumps++
        p.jumpBuffer = 0
        this.sound.play('jump')
        this.burst(p.x + p.w / 2, p.y + p.h, 6, '#f2c66d', 50)
      }
    }
    const gravityScale = !inp.down('jump') && p.vy < 0 ? 2.2 : 1

    if (inp.pressed('attack') && p.attackCd <= 0) {
      p.combo = p.comboWindow > 0 ? (p.combo + 1) % 3 : 0
      p.attackDur = (p.combo === 2 ? 0.3 : 0.22) / s.attackSpeed
      p.attackT = p.attackDur
      p.attackCd = p.attackDur * 0.8
      p.comboWindow = p.attackDur + 0.35
      p.hitIds.clear()
      p.vx += p.face * (p.combo === 2 ? 110 : 60)
      if (!p.onGround && p.vy > 0) p.vy *= 0.4
      this.sound.play('swing')
      if (p.combo === 2 && s.slashWave > 0) {
        this.projs.push({
          kind: 'slash',
          x: p.x + p.w / 2 + p.face * 14,
          y: p.y + 10,
          w: 14,
          h: 26,
          vx: p.face * 300,
          vy: 0,
          gravity: 0,
          dmg: 14 * s.damage * (1 + 0.5 * (s.slashWave - 1)),
          life: 0.6,
          delay: 0,
          friendly: true,
          pierce: true,
          color: '#f6e2a8',
          hitIds: new Set(),
        })
      }
    }

    if (p.attackT > 0) {
      p.attackT -= dt
      const prog = 1 - p.attackT / p.attackDur
      if (prog > 0.12 && prog < 0.75) {
        const box = this.attackBox()
        for (const e of this.enemies) {
          if (e.dead || p.hitIds.has(e.id) || !overlap(box, e)) continue
          p.hitIds.add(e.id)
          const mult = p.combo === 2 ? 1.8 : p.combo === 1 ? 1.1 : 1
          const crit = chance(s.critChance)
          const dmg = 12 * s.damage * mult * (crit ? s.critMult : 1)
          const kx = p.face * (p.combo === 2 ? 220 : 110)
          const ky = p.combo === 1 ? -170 : p.combo === 2 ? -120 : -60
          this.damageEnemy(e, dmg, crit, kx, ky, 'melee')
        }
      }
    }

    this.moveBody(p, dt, gravityScale, p.dropT > 0)
  }

  attackBox(): Rect {
    const p = this.player
    const reach = p.combo === 2 ? 38 : 28
    const h = p.combo === 1 ? 30 : 24
    const x = p.face > 0 ? p.x + p.w - 4 : p.x - reach + 4
    return { x, y: p.y + p.h / 2 - h / 2 - (p.combo === 1 ? 4 : 0), w: reach, h }
  }

  // ------------------------------------------------------------------ combat

  damageEnemy(
    e: Enemy,
    amount: number,
    crit: boolean,
    kx: number,
    ky: number,
    source: 'melee' | 'dash' | 'proj' | 'burst' | 'thorns',
  ) {
    if (e.dead) return
    const dmg = Math.max(1, Math.round(amount))
    e.hp -= dmg
    e.hurtT = 0.12
    if (!e.boss) {
      e.vx = kx / e.weight
      if (ky) {
        e.vy = ky / e.weight
        e.onGround = false
      }
      if (e.kind === 'brute' && e.state === 'charge') e.vx = e.face * 270
    }
    this.texts.push({ x: e.x + e.w / 2 + rand(-4, 4), y: e.y - 2, text: String(dmg), color: crit ? '#ffd36b' : '#ffffff', life: 0.7, big: crit })
    this.burst(e.x + e.w / 2, e.y + e.h / 2, crit ? 10 : 5, crit ? '#ffd36b' : '#ffffff', 110)
    this.run.damage += dmg
    if (source === 'melee' || source === 'dash' || source === 'proj') {
      this.combo++
      this.comboT = 1.8
      this.run.maxCombo = Math.max(this.run.maxCombo, this.combo)
    }
    if (source === 'melee' || source === 'dash') {
      this.freeze = Math.max(this.freeze, crit ? 5 : 3)
      this.shake = Math.max(this.shake, crit ? 4 : 2)
    }
    this.sound.play(crit ? 'crit' : 'hit')
    if (e.hp <= 0) this.killEnemy(e)
  }

  private killEnemy(e: Enemy) {
    e.dead = true
    this.run.kills++
    const cx = e.x + e.w / 2
    const cy = e.y + e.h / 2
    this.burst(cx, cy, e.boss ? 60 : 14, e.boss ? '#ffb067' : '#c9a7ff', e.boss ? 200 : 120)
    this.sound.play('kill')
    const s = this.player.stats
    if (s.killHeal > 0) this.heal(s.killHeal)
    if (s.emberBurst > 0) {
      const radius = 30 + 8 * s.emberBurst
      this.burst(cx, cy, 18, '#ff9b54', 160)
      for (const o of this.enemies) {
        if (o.dead || o === e) continue
        if (Math.hypot(o.x + o.w / 2 - cx, o.y + o.h / 2 - cy) < radius) {
          this.damageEnemy(o, 14 * s.emberBurst * s.damage, false, sign(o.x - e.x) * 120, -80, 'burst')
        }
      }
    }
    if (e.boss) {
      this.boss = null
      this.slowT = 1.2
      this.shake = 14
      this.flash = 1
      this.pickups.push({ x: cx, y: cy, vx: -40, vy: -160, t: 0 }, { x: cx, y: cy, vx: 40, vy: -160, t: 0 })
      this.showBanner('击破', `${ENEMY_DEFS[e.kind].name} 已熄灭`, '#ffd36b')
    } else if (chance(0.09)) {
      this.pickups.push({ x: cx, y: cy, vx: rand(-40, 40), vy: -140, t: 0 })
    }
  }

  heal(amount: number) {
    const p = this.player
    const before = p.hp
    p.hp = Math.min(p.maxHp, p.hp + amount)
    const gained = Math.round(p.hp - before)
    if (gained > 0) this.texts.push({ x: p.x + p.w / 2, y: p.y - 4, text: `+${gained}`, color: '#8ef0a6', life: 0.8, big: false })
  }

  hurtPlayer(amount: number, srcX: number) {
    const p = this.player
    if (p.invuln > 0 || p.dashT > 0 || this.state !== 'play') return
    const s = p.stats
    const dmg = Math.max(1, Math.round(amount * (1 - s.armor)))
    p.hp -= dmg
    p.invuln = 0.9
    p.hurtT = 0.3
    p.attackT = 0
    p.vx = (p.x + p.w / 2 >= srcX ? 1 : -1) * 170
    p.vy = -160
    this.shake = Math.max(this.shake, 6)
    this.flash = 0.35
    this.combo = 0
    this.texts.push({ x: p.x + p.w / 2, y: p.y - 4, text: `-${dmg}`, color: '#ff6b7d', life: 0.8, big: true })
    this.burst(p.x + p.w / 2, p.y + p.h / 2, 10, '#ff6b7d', 120)
    this.sound.play('hurt')
    if (s.thorns > 0) {
      for (const e of this.enemies) {
        if (!e.dead && Math.hypot(e.x + e.w / 2 - (p.x + p.w / 2), e.y + e.h / 2 - (p.y + p.h / 2)) < 56) {
          this.damageEnemy(e, s.thorns, false, sign(e.x - p.x) * 140, -60, 'thorns')
        }
      }
    }
    if (p.hp <= 0) {
      p.hp = 0
      this.burst(p.x + p.w / 2, p.y + p.h / 2, 40, '#e4b863', 160)
      this.endRun(false)
    }
  }

  enemyShot(o: ShotOptions) {
    this.projs.push({
      kind: o.kind,
      x: o.x,
      y: o.y,
      w: o.w,
      h: o.h,
      vx: o.vx,
      vy: o.vy,
      gravity: o.gravity ?? 0,
      dmg: o.dmg,
      life: o.life ?? 4,
      delay: o.delay ?? 0,
      friendly: false,
      pierce: o.pierce ?? false,
      color: o.color,
      hitIds: new Set(),
    })
  }

  private updateProjectiles(dt: number) {
    const p = this.player
    const hurtBox = { x: p.x + 2, y: p.y + 3, w: p.w - 4, h: p.h - 3 }
    for (const pr of this.projs) {
      if (pr.delay > 0) {
        pr.delay -= dt
        continue
      }
      pr.vy += pr.gravity * dt
      pr.x += pr.vx * dt
      pr.y += pr.vy * dt
      pr.life -= dt
      if (pr.kind !== 'shock' && pr.y + pr.h / 2 >= GROUND_Y) {
        pr.life = 0
        this.burst(pr.x, GROUND_Y - 2, 4, pr.color, 60)
      }
      if (pr.x < -30 || pr.x > W + 30 || pr.y < -60) pr.life = 0
      if (pr.kind === 'shock' && Math.random() < 0.5) this.addParticle(pr.x, GROUND_Y - 2, rand(-20, 20), -rand(30, 80), 0.4, pr.color, 2, 200)
      if (pr.life <= 0) continue
      const box = { x: pr.x - pr.w / 2, y: pr.y - pr.h / 2, w: pr.w, h: pr.h }
      if (pr.friendly) {
        for (const e of this.enemies) {
          if (e.dead || pr.hitIds.has(e.id) || !overlap(box, e)) continue
          pr.hitIds.add(e.id)
          this.damageEnemy(e, pr.dmg, false, sign(pr.vx) * 120, -40, 'proj')
          if (!pr.pierce) {
            pr.life = 0
            break
          }
        }
      } else if (overlap(box, hurtBox) && p.invuln <= 0 && p.dashT <= 0) {
        this.hurtPlayer(pr.dmg, pr.x - pr.vx)
        if (!pr.pierce) pr.life = 0
        if (this.state !== 'play') return
      }
    }
    this.projs = this.projs.filter((pr) => pr.life > 0)
  }

  private updatePickups(dt: number) {
    const p = this.player
    const pcx = p.x + p.w / 2
    const pcy = p.y + p.h / 2
    for (const k of this.pickups) {
      k.t += dt
      const d = Math.hypot(pcx - k.x, pcy - k.y)
      if (this.roomCleared || d < 44) {
        k.vx = approach(k.vx, ((pcx - k.x) / (d || 1)) * 260, 900 * dt)
        k.vy = approach(k.vy, ((pcy - k.y) / (d || 1)) * 260, 900 * dt)
      } else {
        k.vx = approach(k.vx, 0, 120 * dt)
        k.vy = Math.min(k.vy + GRAVITY * 0.6 * dt, 300)
      }
      k.x = clamp(k.x + k.vx * dt, 4, W - 4)
      k.y = Math.min(k.y + k.vy * dt, GROUND_Y - 4)
      if (d < 10) {
        k.t = -1
        this.heal(12)
        this.sound.play('heal')
        this.burst(k.x, k.y, 8, '#8ef0a6', 70)
      }
    }
    this.pickups = this.pickups.filter((k) => k.t >= 0)
  }

  // ------------------------------------------------------------------ particles

  addParticle(x: number, y: number, vx: number, vy: number, life: number, color: string, size: number, gravity: number) {
    if (this.particles.length > 600) return
    this.particles.push({ x, y, vx, vy, life, max: life, color, size, gravity })
  }

  burst(x: number, y: number, n: number, color: string, speed: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const v = rand(0.3, 1) * speed
      this.addParticle(x, y, Math.cos(a) * v, Math.sin(a) * v - 20, rand(0.25, 0.6), color, chance(0.3) ? 3 : 2, 260)
    }
  }

  dust(x: number, y: number, n: number, color: string) {
    for (let i = 0; i < n; i++) this.addParticle(x + rand(-6, 6), y - 1, rand(-50, 50), -rand(10, 60), rand(0.2, 0.45), color, 2, 120)
  }

  private tickParticles(dt: number) {
    for (const pt of this.particles) {
      pt.vy += pt.gravity * dt
      pt.x += pt.vx * dt
      pt.y += pt.vy * dt
      pt.life -= dt
    }
    this.particles = this.particles.filter((pt) => pt.life > 0)
    for (const t of this.texts) {
      t.y -= 24 * dt
      t.life -= dt
    }
    this.texts = this.texts.filter((t) => t.life > 0)
  }

  private tickAmbient(dt: number) {
    this.shake = this.shake > 0.2 ? this.shake * 0.86 : 0
    if (this.banner.t > 0 && this.state !== 'play') this.banner.t -= dt
    const snow = this.biome === 1
    if (this.ambient.length < 70 && chance(0.5)) {
      this.ambient.push(
        snow
          ? { x: rand(0, W), y: -4, vx: rand(-12, 4), vy: rand(14, 32), life: 12, max: 12, color: '#e6f3ff', size: chance(0.3) ? 2 : 1, gravity: 0 }
          : { x: rand(0, W), y: GROUND_Y + 2, vx: rand(-6, 6), vy: -rand(10, 26), life: rand(4, 9), max: 9, color: chance(0.5) ? '#ffb067' : '#ff7a4c', size: 1, gravity: 0 },
      )
    }
    for (const a of this.ambient) {
      a.x += (a.vx + Math.sin(this.time * 1.5 + a.y * 0.05) * 6) * dt
      a.y += a.vy * dt
      a.life -= dt
    }
    this.ambient = this.ambient.filter((a) => a.life > 0 && a.y < GROUND_Y + 4 && a.y > -10)
  }

  /** Converts a world-space x/y to UI-space for text rendering. */
  toUi(x: number, y: number) {
    return { x: x * SCALE, y: y * SCALE }
  }
}
