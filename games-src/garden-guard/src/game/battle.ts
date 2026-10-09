import type { AudioEngine, Sfx } from '../audio'
import { PACKET_H, PACKET_W } from '../art/items'
import { zombieScale } from '../art/zombies'
import {
  CELL_H,
  CELL_W,
  COLS,
  HOUSE_X,
  LAWN_B,
  LAWN_R,
  LAWN_X,
  LAWN_Y,
  MAX_SLOTS,
  MOWER_X,
  ROWS,
  SPAWN_X,
  STREET_CAM,
  VIEW_W,
  colAt,
  colCenter,
  rowAt,
  rowFeet,
} from '../config'
import type { LevelDef } from '../data/levels'
import { PLANTS, PLANT_ORDER, type PlantId } from '../data/plants'
import { ZOMBIES, type ZombieId } from '../data/zombies'
import type { SaveData } from '../save'
import { clamp, easeInOut, pick, rand, weighted } from '../util'
import { updateBowls, updateLobs, updateMowers, updatePlant, updateShots, updateZombie } from './behaviors'
import type { BeltItem, Bowl, Lob, Message, Mower, Particle, ParticleKind, Plant, Shot, Sun, Zombie } from './types'
import { isEndless, isFinalWave, isFlagWave, planWave, previewList } from './waves'

export type Phase = 'intro' | 'choose' | 'back' | 'ready' | 'play' | 'won' | 'reward' | 'lost'
export type DamageKind = 'pea' | 'lob' | 'spike' | 'blast' | 'crush' | 'bowl' | 'chomp'

export interface BattleResult {
  level: LevelDef
  won: boolean
  /** Waves survived (endless) or best combo (bowling). */
  score: number
}

export interface BattleHost {
  audio: AudioEngine
  save: SaveData
  finish(result: BattleResult, action: 'menu' | 'retry' | 'reward'): void
}

export const BANK_X = 102
export const BANK_Y = 12
export const SLOT_STEP = 70
export const SUN_HOME = { x: 52, y: 46 }
export const BELT_LEN = MAX_SLOTS * SLOT_STEP

export const btnMenu = { x: VIEW_W - 128, y: 10, w: 116, h: 46 }
export const btnSpeed = { x: VIEW_W - 204, y: 10, w: 66, h: 46 }

const DEAD_STATES = new Set(['dying', 'ash', 'squashed', 'mowed'])

export class Battle {
  phase: Phase = 'intro'
  phaseT = 0
  t = 0
  cam = 0
  shake = 0
  paused = false
  speed = 1
  private uidSeq = 1

  sun: number
  sunFlash = 0
  plants: Plant[] = []
  grid: (Plant | null)[][] = []
  zombies: Zombie[] = []
  previews: Zombie[] = []
  shots: Shot[] = []
  lobs: Lob[] = []
  suns: Sun[] = []
  mowers: Mower[] = []
  particles: Particle[] = []
  bowls: Bowl[] = []
  belt: BeltItem[] = []
  messages: Message[] = []

  slots: PlantId[] = []
  cooldown = new Map<PlantId, number>()
  holding: PlantId | 'shovel' | null = null
  holdBelt = -1
  dragFrom: { x: number; y: number } | null = null
  mx = -999
  my = -999

  waveIndex = 0
  waveTimer: number
  pendingWave = -1
  pendingT = 0
  waveStartHp = 0
  waveSince = 0
  spawnQueue: { id: ZombieId; at: number; wave: number }[] = []
  skyTimer = 5
  beltTimer = 1
  needChooser: boolean
  chosen: PlantId[] = []
  available: PlantId[]
  lastDeath = { x: VIEW_W / 2, y: 400 }
  reward: { x: number; y: number; vy: number; floor: number; t: number } | null = null
  combo = 0
  bestCombo = 0
  tipT = 0
  lostBy: Zombie | null = null

  constructor(
    public level: LevelDef,
    public host: BattleHost,
  ) {
    this.sun = level.startSun
    this.waveTimer = level.firstWave
    for (let r = 0; r < ROWS; r++) this.grid.push(new Array<Plant | null>(COLS).fill(null))
    for (const r of level.rows) this.mowers.push({ row: r, x: MOWER_X, state: 'idle', t: 0 })
    this.available = PLANT_ORDER.filter((id) => host.save.plants.includes(id))
    this.needChooser = this.usesSlots && this.available.length > MAX_SLOTS
    if (!this.needChooser) this.slots = this.usesSlots ? [...this.available] : []
    this.makePreviews()
    const seen = new Set(host.save.seen)
    for (const id of level.pool) seen.add(id)
    if (level.pool.includes('garg')) seen.add('imp')
    host.save.seen = [...seen]
  }

  get audio() {
    return this.host.audio
  }

  get usesSlots() {
    return this.level.mode === 'normal' || this.level.mode === 'endless'
  }

  get usesBelt() {
    return this.level.mode === 'bowling' || this.level.mode === 'conveyor'
  }

  get bowling() {
    return this.level.mode === 'bowling'
  }

  sfx(s: Sfx) {
    this.audio.play(s)
  }

  uid() {
    return this.uidSeq++
  }

  // ------------------------------------------------------------- lifecycle

  private makePreviews() {
    const list = previewList(this.level)
    const spots: { x: number; y: number }[] = []
    for (const id of list) {
      let best = { x: 0, y: 0 }
      let bestD = -1
      for (let k = 0; k < 14; k++) {
        const c = { x: rand(LAWN_R + 230, LAWN_R + 560), y: rand(LAWN_Y + 90, LAWN_B - 6) }
        const d = Math.min(9999, ...spots.map((s) => Math.hypot((s.x - c.x) * 0.8, s.y - c.y)))
        if (d > bestD) {
          bestD = d
          best = c
        }
      }
      spots.push(best)
      const z = this.makeZombie(id, 0, best.x)
      z.y = best.y
      z.state = 'walk'
      z.phase = rand(0, 6)
      this.previews.push(z)
    }
    this.previews.sort((a, b) => a.y - b.y)
  }

  makeZombie(id: ZombieId, row: number, x: number): Zombie {
    const def = ZOMBIES[id]
    return {
      uid: this.uid(),
      id,
      def,
      row,
      x,
      y: rowFeet(row),
      lift: 0,
      hp: def.hp,
      maxHp: def.hp,
      armor: def.armor,
      armorMax: def.armor,
      armorKind: def.armorKind,
      speed: def.speed * rand(0.92, 1.08),
      state: 'walk',
      stateT: 0,
      phase: rand(0, 6.28),
      deathT: 0,
      slow: 0,
      flash: 0,
      hasArm: true,
      hasHead: true,
      hasPole: id === 'pole',
      hasImp: id === 'garg',
      angry: false,
      target: 0,
      biteT: 0,
      wave: this.waveIndex,
      fromX: 0,
      toX: 0,
      remove: false,
    }
  }

  setPhase(p: Phase) {
    this.phase = p
    this.phaseT = 0
  }

  startPlay() {
    this.setPhase('play')
    this.audio.music('battle')
    this.tipT = this.level.tip ? 11 : 0
    if (this.usesBelt) {
      this.beltTimer = 0.6
    }
  }

  // ------------------------------------------------------------- update

  update(dt: number) {
    this.t += dt
    this.phaseT += dt
    this.shake = Math.max(0, this.shake - dt * 1.6)
    this.sunFlash = Math.max(0, this.sunFlash - dt)
    for (const m of this.messages) m.t += dt
    this.messages = this.messages.filter((m) => m.t < m.dur)
    for (const z of this.previews) z.phase += dt * 1.6

    switch (this.phase) {
      case 'intro': {
        const k = clamp((this.phaseT - 0.7) / 1.8, 0, 1)
        this.cam = easeInOut(k) * STREET_CAM
        if (this.phaseT > 2.9) {
          if (this.needChooser) this.setPhase('choose')
          else if (this.phaseT > 4.2) this.setPhase('back')
        }
        break
      }
      case 'choose':
        this.cam = STREET_CAM
        break
      case 'back': {
        const k = clamp(this.phaseT / 1.5, 0, 1)
        this.cam = (1 - easeInOut(k)) * STREET_CAM
        if (k >= 1) {
          this.cam = 0
          this.setPhase('ready')
          this.messages.push({ text: '准备……', t: 0, dur: 0.7, style: 'ready' })
          this.sfx('ready')
        }
        break
      }
      case 'ready':
        if (this.phaseT > 0.7 && this.phaseT - dt <= 0.7) {
          this.messages.push({ text: '就位……', t: 0, dur: 0.7, style: 'ready' })
          this.sfx('ready')
        }
        if (this.phaseT > 1.4 && this.phaseT - dt <= 1.4) {
          this.messages.push({ text: '种植！', t: 0, dur: 1.1, style: 'huge' })
          this.sfx('plantGo')
        }
        if (this.phaseT > 1.6) this.startPlay()
        break
      case 'play':
        this.updatePlay(dt)
        break
      case 'won':
        this.updateWorld(dt, false)
        if (this.reward) {
          const r = this.reward
          r.t += dt
          if (r.y < r.floor || r.vy < 0) {
            r.vy += 900 * dt
            r.y += r.vy * dt
            if (r.y >= r.floor) {
              r.y = r.floor
              r.vy = 0
            }
          }
        }
        break
      case 'reward':
        this.updateWorld(dt, false)
        if (this.phaseT > 2.6) this.host.finish(this.result(true), 'reward')
        break
      case 'lost':
        this.updateLost(dt)
        break
    }
    this.updateParticles(dt)
  }

  private updatePlay(dt: number) {
    if (this.tipT > 0) this.tipT -= dt
    for (const [id, cd] of this.cooldown) this.cooldown.set(id, Math.max(0, cd - dt))
    this.updateWaves(dt)
    if (this.level.skySun) {
      this.skyTimer -= dt
      if (this.skyTimer <= 0) {
        this.skyTimer = rand(8.5, 11.5)
        const x = rand(LAWN_X + 40, LAWN_R - 80)
        this.suns.push(this.makeSun(x, -40, 0, 70, rand(LAWN_Y + 70, LAWN_B - 40), 25, 'fall'))
      }
    }
    if (this.usesBelt) this.updateBelt(dt)
    this.updateWorld(dt, true)
    this.checkWin()
  }

  updateWorld(dt: number, live: boolean) {
    for (const p of this.plants) if (!p.dead) updatePlant(this, p, dt, live)
    for (const z of this.zombies) updateZombie(this, z, dt, live)
    updateShots(this, dt)
    updateLobs(this, dt)
    updateMowers(this, dt)
    updateBowls(this, dt)
    this.updateSuns(dt)
    this.plants = this.plants.filter((p) => !p.dead)
    this.zombies = this.zombies.filter((z) => !z.remove)
  }

  private updateLost(dt: number) {
    const z = this.lostBy
    if (z && z.x > -60) {
      z.x -= 22 * dt
      z.phase += dt * 2.4
    }
    if (this.phaseT > 1.0 && this.phaseT - dt <= 1.0) {
      this.messages.push({ text: '僵尸闯进了你的房子……', t: 0, dur: 999, style: 'warn' })
      this.sfx('groan')
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.life -= dt
      p.vy += p.g * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rot += p.vr * dt
      if (p.y > p.floor && p.g > 0) {
        p.y = p.floor
        p.vy *= -0.35
        p.vx *= 0.6
        p.vr *= 0.5
        if (Math.abs(p.vy) < 30) p.vy = 0
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0)
  }

  // ------------------------------------------------------------- waves

  get totalWaves() {
    return this.level.waves
  }

  get progress() {
    if (isEndless(this.level)) return 0
    return clamp(this.waveIndex / this.level.waves, 0, 1)
  }

  private updateWaves(dt: number) {
    const endless = isEndless(this.level)
    if (this.pendingWave >= 0) {
      this.pendingT -= dt
      if (this.pendingT <= 0) {
        this.spawnWave(this.pendingWave)
        this.pendingWave = -1
      }
    } else if (endless || this.waveIndex < this.level.waves) {
      this.waveTimer -= dt
      this.waveSince += dt
      if (this.waveIndex > 0 && this.waveSince > 6 && this.waveStartHp > 0) {
        const alive = this.waveHp(this.waveIndex - 1)
        if (alive < this.waveStartHp * 0.4) this.waveTimer = Math.min(this.waveTimer, 2.2)
      }
      if (this.waveTimer <= 0) this.launchWave()
    }
    for (const q of this.spawnQueue) {
      q.at -= dt
      if (q.at <= 0) this.spawnZombie(q.id, q.wave)
    }
    this.spawnQueue = this.spawnQueue.filter((q) => q.at > 0)
  }

  private waveHp(wave: number) {
    let hp = 0
    for (const z of this.zombies) if (z.wave === wave && !DEAD_STATES.has(z.state)) hp += Math.max(0, z.hp) + Math.max(0, z.armor)
    for (const q of this.spawnQueue) if (q.wave === wave) hp += ZOMBIES[q.id].hp + ZOMBIES[q.id].armor
    return hp
  }

  private launchWave() {
    const i = this.waveIndex
    this.waveIndex++
    if (isFlagWave(this.level, i)) {
      this.messages.push({ text: '大批僵尸正在逼近！', t: 0, dur: 3.2, style: 'warn' })
      this.sfx('siren')
      this.audio.intense = true
      this.pendingWave = i
      this.pendingT = 3.2
      if (isFinalWave(this.level, i)) {
        window.setTimeout(() => {
          if (this.phase === 'play') this.messages.push({ text: '最后一波！', t: 0, dur: 2.4, style: 'final' })
        }, 3300)
      }
    } else this.spawnWave(i)
    this.waveTimer = (this.bowling ? 17 : 24) + rand(0, 4)
    if (isFlagWave(this.level, i)) this.waveTimer += 6
    this.waveSince = 0
  }

  private spawnWave(i: number) {
    const ids = planWave(this.level, i)
    const flag = isFlagWave(this.level, i)
    let hp = 0
    ids.forEach((id, k) => {
      const at = id === 'flag' ? 0 : rand(0, flag ? 4.5 : 2.5) + k * (flag ? 0.12 : 0.3)
      this.spawnQueue.push({ id, at, wave: i })
      hp += ZOMBIES[id].hp + ZOMBIES[id].armor
    })
    this.waveStartHp = hp
    if (i === 0) this.sfx('groan')
    if (!flag) window.setTimeout(() => (this.audio.intense = false), 8000)
  }

  private spawnZombie(id: ZombieId, wave: number) {
    const rows = this.level.rows
    const load = rows.map((r) => this.zombies.filter((z) => z.row === r && z.x > LAWN_R - 200).length)
    const row = weighted(rows, (r) => 1 / (1 + load[rows.indexOf(r)] * 1.5))
    const z = this.makeZombie(id, row, SPAWN_X + rand(0, 46))
    z.wave = wave
    this.zombies.push(z)
    if (Math.random() < 0.25) this.sfx('groan')
  }

  private checkWin() {
    if (isEndless(this.level)) return
    if (this.waveIndex < this.level.waves || this.pendingWave >= 0 || this.spawnQueue.length) return
    if (this.zombies.some((z) => !DEAD_STATES.has(z.state))) return
    this.setPhase('won')
    this.audio.music(null)
    this.audio.intense = false
    this.sfx('win')
    this.holding = null
    const ld = this.lastDeath
    this.reward = { x: clamp(ld.x, LAWN_X + 60, LAWN_R - 60), y: ld.y - 70, vy: -360, floor: ld.y - 40, t: 0 }
  }

  result(won: boolean): BattleResult {
    return {
      level: this.level,
      won,
      score: this.bowling ? this.bestCombo : isEndless(this.level) ? Math.max(0, this.waveIndex - 1) : 0,
    }
  }

  lose(z: Zombie) {
    if (this.phase !== 'play') return
    this.lostBy = z
    this.setPhase('lost')
    this.holding = null
    this.audio.music(null)
    this.audio.intense = false
    this.sfx('lose')
  }

  // ------------------------------------------------------------- combat helpers

  isAlive(z: Zombie) {
    return !DEAD_STATES.has(z.state) && !z.remove
  }

  targetable(z: Zombie) {
    return this.isAlive(z) && z.state !== 'fly' && z.x < LAWN_R + 36
  }

  zombieById(uid: number) {
    return this.zombies.find((z) => z.uid === uid)
  }

  plantById(uid: number) {
    return this.plants.find((p) => p.uid === uid && !p.dead)
  }

  damage(z: Zombie, amount: number, kind: DamageKind) {
    if (!this.isAlive(z)) return
    z.flash = 0.12
    let rest = amount
    const hadArmor = z.armor > 0
    if (z.armor > 0 && z.armorKind) {
      const bypass = z.armorKind === 'door' && (kind === 'lob' || kind === 'spike')
      if (kind === 'blast' || kind === 'crush') {
        z.armor = Math.max(0, z.armor - amount)
      } else if (!bypass) {
        const take = Math.min(z.armor, rest)
        z.armor -= take
        rest -= take
        if (kind === 'pea') this.sfx(z.armorKind === 'bucket' || z.armorKind === 'door' || z.armorKind === 'helmet' ? 'hitMetal' : 'hitSoft')
      }
    } else if (kind === 'pea') this.sfx('hit')
    if (hadArmor && z.armor <= 0) this.armorBreak(z)
    z.hp -= rest
    if (z.hasArm && z.hp < z.maxHp * 0.5 && z.id !== 'garg' && z.hp > 0) {
      z.hasArm = false
      this.burst('arm', z.x - 14, z.y - 96, { zid: z.id, floor: z.y - 4 })
    }
    if (z.hp <= 0) this.kill(z, kind)
  }

  private armorBreak(z: Zombie) {
    const kind = z.armorKind!
    if (kind === 'paper') {
      for (let i = 0; i < 8; i++) this.burst('leaf', z.x - 50, z.y - 100, { color: '#ecebe3', floor: z.y })
      if (this.isAlive(z) && z.hp > 0 && (z.state === 'walk' || z.state === 'eat')) {
        z.state = 'angry'
        z.stateT = 0
        this.sfx('groan')
      }
      return
    }
    const hy = z.y - 150 * zombieScale(z.id)
    this.burst('armor', kind === 'door' ? z.x - 46 : z.x - 10, kind === 'door' ? z.y - 80 : hy, { armorKind: kind, floor: z.y - 6 })
  }

  kill(z: Zombie, kind: DamageKind | 'mow') {
    if (!this.isAlive(z)) return
    z.hp = Math.min(z.hp, 0)
    z.deathT = 0
    z.lift = Math.min(z.lift, 0)
    this.lastDeath = { x: z.x, y: z.y }
    if (kind === 'blast') z.state = 'ash'
    else if (kind === 'crush') z.state = 'squashed'
    else if (kind === 'mow') z.state = 'mowed'
    else if (kind === 'chomp') {
      z.state = 'dying'
      z.remove = true
    } else {
      z.state = 'dying'
      if (z.hasHead) {
        z.hasHead = false
        this.burst('head', z.x - 14, z.y - 130 * (z.id === 'garg' ? 1.6 : z.id === 'imp' ? 0.7 : 1), { zid: z.id, floor: z.y - 8 })
      }
    }
    if (z.hasImp && z.id === 'garg') z.hasImp = false
  }

  explode(x: number, y: number, row: number, rowsSpan: number, halfW: number, label?: string) {
    for (const z of this.zombies) {
      if (!this.isAlive(z) || z.state === 'fly') continue
      if (Math.abs(z.row - row) > rowsSpan) continue
      if (Math.abs(z.x - 10 - x) > halfW) continue
      this.damage(z, 1800, 'blast')
    }
    this.burst('boom', x, y, { size: 150 + rowsSpan * 30 })
    for (let i = 0; i < 14; i++) this.burst('smoke', x + rand(-60, 60), y + rand(-40, 30))
    this.shake = Math.max(this.shake, 0.55)
    this.sfx('explode')
    if (label) this.particles.push(this.particle('text', x, y - 40, { text: label, life: 1.2, size: 46, color: '#fff2c4' }))
  }

  burnRow(row: number) {
    for (const z of this.zombies) {
      if (z.row !== row || !this.isAlive(z) || z.state === 'fly' || z.x > LAWN_R + 80) continue
      this.damage(z, 1800, 'blast')
    }
    for (let x = LAWN_X + 10; x < LAWN_R + 40; x += 34) {
      this.particles.push(this.particle('fire', x + rand(-8, 8), rowFeet(row) + 4, { life: rand(0.9, 1.3), size: rand(0.9, 1.3) }))
    }
    this.shake = Math.max(this.shake, 0.45)
    this.sfx('fire')
    this.sfx('explode')
  }

  killPlant(p: Plant, crushed = false) {
    if (p.dead) return
    p.dead = true
    if (this.grid[p.row][p.col] === p) this.grid[p.row][p.col] = null
    for (let i = 0; i < (crushed ? 12 : 6); i++) this.burst('leaf', p.x, p.y - 30, { color: pick(['#5cbf2a', '#3c9a21', '#8bd650']), floor: p.y })
    if (crushed) this.burst('shock', p.x, p.y, {})
  }

  // ------------------------------------------------------------- particles

  particle(kind: ParticleKind, x: number, y: number, o: Partial<Particle> = {}): Particle {
    const life = o.life ?? 1
    return {
      kind,
      x,
      y,
      vx: 0,
      vy: 0,
      g: 0,
      floor: 9999,
      life,
      max: life,
      size: 6,
      color: '#ffffff',
      rot: 0,
      vr: 0,
      ...o,
      ...(o.life != null ? { max: o.life } : {}),
    }
  }

  burst(kind: ParticleKind, x: number, y: number, o: Partial<Particle> = {}) {
    switch (kind) {
      case 'head':
        this.particles.push(this.particle('head', x, y, { vx: rand(30, 90), vy: rand(-260, -160), g: 900, vr: rand(4, 9), life: 1.8, ...o }))
        break
      case 'arm':
        this.particles.push(this.particle('arm', x, y, { vx: rand(-40, 30), vy: rand(-200, -120), g: 900, vr: rand(-8, 8), life: 1.6, ...o }))
        break
      case 'armor':
        this.particles.push(this.particle('armor', x, y, { vx: rand(40, 110), vy: rand(-320, -220), g: 950, vr: rand(4, 9), life: 1.8, ...o }))
        break
      case 'leaf':
        this.particles.push(
          this.particle('leaf', x, y, { vx: rand(-140, 140), vy: rand(-320, -120), g: 800, vr: rand(-12, 12), life: rand(0.7, 1.2), size: rand(5, 9), ...o }),
        )
        break
      case 'boom':
        this.particles.push(this.particle('boom', x, y, { life: 0.75, size: o.size ?? 160 }))
        for (let i = 0; i < 26; i++) {
          const a = rand(0, Math.PI * 2)
          const s = rand(200, 520)
          this.particles.push(
            this.particle('dot', x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s - 100, g: 600, life: rand(0.4, 0.9), size: rand(3, 7), color: pick(['#ffd04a', '#ff7a1a', '#fff3b0', '#5a3a1a']) }),
          )
        }
        break
      case 'smoke':
        this.particles.push(this.particle('smoke', x, y, { vx: rand(-30, 30), vy: rand(-70, -30), life: rand(0.8, 1.4), size: rand(16, 30), ...o }))
        break
      case 'shock':
        this.particles.push(this.particle('shock', x, y, { life: 0.6, size: 90 }))
        for (let i = 0; i < 10; i++) this.particles.push(this.particle('dot', x + rand(-40, 40), y - 4, { vx: rand(-160, 160), vy: rand(-280, -80), g: 900, life: 0.8, size: rand(3, 6), color: '#7a5634', floor: y }))
        break
      default:
        this.particles.push(this.particle(kind, x, y, o))
    }
  }

  splat(x: number, y: number, color: string) {
    this.particles.push(this.particle('splat', x, y, { life: 0.22, size: 14, color }))
    for (let i = 0; i < 4; i++) {
      this.particles.push(this.particle('dot', x, y, { vx: rand(-120, 60), vy: rand(-160, 40), g: 700, life: 0.35, size: rand(2, 4), color }))
    }
  }

  dirt(x: number, y: number, n = 8) {
    for (let i = 0; i < n; i++) {
      this.particles.push(this.particle('dot', x + rand(-20, 20), y - 4, { vx: rand(-110, 110), vy: rand(-260, -90), g: 900, life: 0.7, size: rand(2.5, 5), color: pick(['#7a5634', '#9b7448', '#5c3d22']), floor: y + 4 }))
    }
  }

  // ------------------------------------------------------------- sun

  makeSun(x: number, y: number, vx: number, vy: number, floor: number, value: number, state: Sun['state']): Sun {
    return { x, y, vx, vy, floor, t: 0, life: 9, value, state, fromX: 0, fromY: 0, ct: 0, dead: false }
  }

  private updateSuns(dt: number) {
    for (const s of this.suns) {
      s.t += dt
      if (s.state === 'fall') {
        s.y += s.vy * dt
        if (s.y >= s.floor) {
          s.y = s.floor
          s.state = 'idle'
        }
      } else if (s.state === 'pop') {
        s.vy += 700 * dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        if (s.vy > 0 && s.y >= s.floor) {
          s.y = s.floor
          s.state = 'idle'
        }
      } else if (s.state === 'idle') {
        s.life -= dt
        if (s.life <= 0) s.dead = true
      } else {
        s.ct += dt
        const k = clamp(s.ct / 0.55, 0, 1)
        const e = 1 - Math.pow(1 - k, 2)
        s.x = s.fromX + (SUN_HOME.x + this.cam - s.fromX) * e
        s.y = s.fromY + (SUN_HOME.y - s.fromY) * e
        if (k >= 1) s.dead = true
      }
    }
    this.suns = this.suns.filter((s) => !s.dead)
  }

  private collectSun(s: Sun) {
    s.state = 'collect'
    s.fromX = s.x
    s.fromY = s.y
    s.ct = 0
    this.sun = Math.min(9990, this.sun + s.value)
    this.sfx('sun')
  }

  // ------------------------------------------------------------- belt

  private updateBelt(dt: number) {
    this.beltTimer -= dt
    const max = MAX_SLOTS + 2
    if (this.beltTimer <= 0 && this.belt.length < max) {
      const list = this.level.conveyor ?? []
      const id = weighted(list, (it) => it.w).id
      this.belt.push({ id, x: BELT_LEN + 10 })
      const early = this.t < 30
      this.beltTimer = this.bowling ? (early ? rand(2.2, 3) : rand(3.4, 4.6)) : early ? rand(3.5, 4.5) : rand(6, 7.5)
    }
    let minX = 0
    for (const it of this.belt) {
      it.x = Math.max(minX, it.x - 70 * dt)
      minX = it.x + SLOT_STEP
    }
  }

  // ------------------------------------------------------------- input

  get overlay() {
    return this.paused || this.phase === 'choose' || this.phase === 'lost' || this.phase === 'reward'
  }

  slotRect(i: number) {
    return { x: BANK_X + i * SLOT_STEP, y: BANK_Y, w: PACKET_W, h: PACKET_H }
  }

  get shovelRect() {
    return { x: BANK_X + MAX_SLOTS * SLOT_STEP + 14, y: 12, w: 84, h: 84 }
  }

  private inRect(x: number, y: number, r: { x: number; y: number; w: number; h: number }) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
  }

  cellAt(x: number, y: number) {
    const wx = x + this.cam
    if (wx < LAWN_X || wx >= LAWN_R || y < LAWN_Y || y >= LAWN_B) return null
    return { row: rowAt(y), col: colAt(wx) }
  }

  canPlace(_id: PlantId, row: number, col: number) {
    if (!this.level.rows.includes(row)) return false
    if (this.bowling) return col <= 2
    return !this.grid[row][col]
  }

  canAfford(id: PlantId) {
    if (!this.usesSlots) return true
    return this.sun >= PLANTS[id].cost && (this.cooldown.get(id) ?? 0) <= 0
  }

  pointerMove(x: number, y: number) {
    this.mx = x
    this.my = y
  }

  pointerDown(x: number, y: number, button: number) {
    this.mx = x
    this.my = y
    if (button === 2) {
      this.holding = null
      return
    }
    if (this.overlay) return
    if (this.phase === 'won') {
      const r = this.reward
      if (r && Math.hypot(x + this.cam - r.x, y - r.y) < 60) {
        this.setPhase('reward')
        this.sfx('reward')
      }
      return
    }
    if (this.phase !== 'play') return
    const wx = x + this.cam
    for (let i = this.suns.length - 1; i >= 0; i--) {
      const s = this.suns[i]
      if (s.state !== 'collect' && Math.hypot(s.x - wx, s.y - y) < 46) {
        this.collectSun(s)
        return
      }
    }
    if (this.inRect(x, y, btnMenu)) {
      this.paused = true
      this.sfx('click')
      return
    }
    if (this.inRect(x, y, btnSpeed)) {
      this.speed = this.speed === 1 ? 2 : 1
      this.sfx('click')
      return
    }
    if (!this.bowling && this.inRect(x, y, this.shovelRect)) {
      this.holding = this.holding === 'shovel' ? null : 'shovel'
      this.sfx(this.holding ? 'shovel' : 'click')
      return
    }
    if (this.usesSlots) {
      for (let i = 0; i < this.slots.length; i++) {
        if (this.inRect(x, y, this.slotRect(i))) {
          this.selectSlot(i)
          this.dragFrom = { x, y }
          return
        }
      }
    } else {
      for (let i = 0; i < this.belt.length; i++) {
        const it = this.belt[i]
        if (this.inRect(x, y, { x: BANK_X + it.x, y: BANK_Y, w: PACKET_W, h: PACKET_H })) {
          if (this.holding === it.id && this.holdBelt === i) this.holding = null
          else {
            this.holding = it.id
            this.holdBelt = i
            this.sfx('pick')
          }
          this.dragFrom = { x, y }
          return
        }
      }
    }
    const cell = this.cellAt(x, y)
    if (cell && this.holding) {
      this.applyHolding(cell.row, cell.col)
      return
    }
    if (this.holding) this.holding = null
  }

  pointerUp(x: number, y: number) {
    const from = this.dragFrom
    this.dragFrom = null
    if (!from || !this.holding || this.holding === 'shovel' || this.phase !== 'play') return
    if (Math.hypot(x - from.x, y - from.y) < 24) return
    const cell = this.cellAt(x, y)
    if (cell) this.applyHolding(cell.row, cell.col)
  }

  selectSlot(i: number) {
    const id = this.slots[i]
    if (!id) return
    if (this.holding === id) {
      this.holding = null
      return
    }
    if (!this.canAfford(id)) {
      this.sfx('buzz')
      if (this.sun < PLANTS[id].cost) this.sunFlash = 0.5
      return
    }
    this.holding = id
    this.sfx('pick')
  }

  key(k: string) {
    if (this.phase !== 'play') return
    if (k === 'Escape' || k === ' ') {
      if (this.holding && k === 'Escape') this.holding = null
      else this.paused = !this.paused
      return
    }
    if (this.paused) return
    if (k === 'f' || k === 'F') this.speed = this.speed === 1 ? 2 : 1
    if ((k === 'q' || k === 'Q' || k === 's' || k === 'S') && !this.bowling) {
      this.holding = this.holding === 'shovel' ? null : 'shovel'
    }
    const n = Number(k)
    if (n >= 1 && n <= 9) {
      if (this.usesSlots) this.selectSlot(n - 1)
      else if (this.belt[n - 1]) {
        this.holding = this.belt[n - 1].id
        this.holdBelt = n - 1
      }
    }
  }

  private applyHolding(row: number, col: number) {
    const h = this.holding
    if (!h) return
    if (h === 'shovel') {
      const p = this.grid[row][col]
      if (p) {
        this.killPlant(p)
        this.dirt(p.x, p.y)
        this.sfx('shovel')
      }
      this.holding = null
      return
    }
    if (!this.canPlace(h, row, col)) {
      this.sfx('buzz')
      return
    }
    if (this.usesSlots) {
      if (!this.canAfford(h)) {
        this.sfx('buzz')
        return
      }
      this.sun -= PLANTS[h].cost
      this.cooldown.set(h, PLANTS[h].cooldown)
    } else {
      this.belt.splice(this.holdBelt, 1)
      this.holdBelt = -1
    }
    this.holding = null
    if (PLANTS[h].bowling) {
      this.bowls.push({ id: h, row, x: colCenter(col), y: rowFeet(row), vy: 0, toRow: row, rot: 0, hits: 0, hitIds: [], dead: false })
      this.sfx('bowl')
      return
    }
    this.place(h, row, col)
  }

  place(id: PlantId, row: number, col: number) {
    const def = PLANTS[id]
    const p: Plant = {
      uid: this.uid(),
      id,
      row,
      col,
      x: colCenter(col),
      y: rowFeet(row),
      hp: def.hp,
      maxHp: def.hp,
      age: 0,
      timer: 0.5,
      timer2: -1,
      anim: 0,
      state: 'idle',
      stateT: 0,
      flash: 0,
      dead: false,
      target: 0,
      fromX: 0,
      toX: 0,
      lookX: 3,
    }
    switch (id) {
      case 'sunflower':
        p.timer = rand(5, 8)
        break
      case 'cherry':
      case 'jalapeno':
        p.state = 'fuse'
        break
      case 'potato':
        p.state = 'arming'
        break
      case 'chomper':
        p.state = 'ready'
        break
      case 'cabbage':
        p.timer = 1.2
        break
      case 'spikeweed':
        p.timer = 0
        break
    }
    this.plants.push(p)
    this.grid[row][col] = p
    this.sfx('plant')
    this.dirt(p.x, p.y, 6)
    return p
  }

  // ------------------------------------------------------------- chooser

  toggleChoice(id: PlantId) {
    const i = this.chosen.indexOf(id)
    if (i >= 0) this.chosen.splice(i, 1)
    else if (this.chosen.length < MAX_SLOTS) this.chosen.push(id)
    else {
      this.sfx('buzz')
      return
    }
    this.sfx('pick')
  }

  confirmChoice() {
    if (!this.chosen.length) {
      this.sfx('buzz')
      return
    }
    this.slots = [...this.chosen]
    this.setPhase('back')
    this.sfx('click')
  }

  // Mower trigger and house check are shared with behaviors.
  checkHouse(z: Zombie) {
    const m = this.mowers.find((mm) => mm.row === z.row)
    if (m && m.state === 'idle' && z.x - 20 < MOWER_X + 34) {
      m.state = 'run'
      this.sfx('mower')
    }
    if (z.x < HOUSE_X - 24 && (!m || m.state === 'gone')) this.lose(z)
  }

  sunflowerSun(p: Plant) {
    this.suns.push(this.makeSun(p.x + rand(-10, 10), p.y - 70, rand(-60, 60), -260, p.y - 18 + rand(-6, 6), 25, 'pop'))
  }

  /** Width of a cell, exposed for behaviors. */
  readonly cellW = CELL_W
  readonly cellH = CELL_H
}
