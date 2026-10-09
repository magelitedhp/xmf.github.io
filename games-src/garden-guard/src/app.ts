import { AudioEngine } from './audio'
import { renderWorld } from './art/background'
import { STEP, VIEW_H, VIEW_W } from './config'
import { BOWLING, ENDLESS, LEVELS, type LevelDef } from './data/levels'
import { Battle, type BattleHost, type BattleResult } from './game/battle'
import { renderBattle } from './game/render'
import { loadSave, writeSave, type SaveData } from './save'
import { PLANT_ORDER } from './data/plants'
import { ZOMBIE_ORDER } from './data/zombies'
import { AlmanacScene, RewardScene, SelectScene, SettingsScene, TitleScene, type Scene } from './scenes'
import { UI } from './ui'
import type { Ctx } from './util'

class BattleScene implements Scene {
  music = null
  constructor(
    private app: App,
    public battle: Battle,
  ) {}

  update(dt: number) {
    const b = this.battle
    if (b.paused) return
    const n = b.phase === 'play' ? b.speed : 1
    for (let i = 0; i < n; i++) b.update(dt)
  }

  render(ctx: Ctx) {
    renderBattle(ctx, this.battle, this.app.world(this.battle.level.rows), this.app.ui)
  }

  down(x: number, y: number, button: number) {
    this.battle.pointerDown(x, y, button)
  }

  up(x: number, y: number) {
    this.battle.pointerUp(x, y)
  }

  move(x: number, y: number) {
    this.battle.pointerMove(x, y)
  }

  key(k: string) {
    this.battle.key(k)
  }
}

export class App implements BattleHost {
  readonly ctx: Ctx
  audio = new AudioEngine()
  save: SaveData = loadSave()
  ui: UI
  scene: Scene
  t = 0
  private next: Scene | null = null
  private fade = 0
  private fadeDir: 0 | 1 | -1 = 0
  private worlds = new Map<string, HTMLCanvasElement>()
  private scale = 1
  private ox = 0
  private oy = 0
  private dpr = 1
  private acc = 0
  private last = 0

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
    this.audio.musicOn = this.save.music
    this.audio.sfxOn = this.save.sfx
    this.ui = new UI(this.audio)
    this.scene = new TitleScene(this)
    this.resize()
    this.bind()
  }

  // ------------------------------------------------------------- host api

  persist() {
    writeSave(this.save)
  }

  world(rows: number[]) {
    const k = Math.min(2.5, Math.max(1, Math.round(this.scale * this.dpr * 4) / 4))
    const key = `${rows.join('')}@${k}`
    let cv = this.worlds.get(key)
    if (!cv) {
      cv = renderWorld(rows, k)
      this.worlds.set(key, cv)
    }
    return cv
  }

  go(scene: Scene) {
    if (this.fadeDir === 1) return
    this.next = scene
    this.fadeDir = 1
  }

  startLevel(level: LevelDef) {
    this.go(new BattleScene(this, new Battle(level, this)))
  }

  finish(result: BattleResult, action: 'menu' | 'retry' | 'reward') {
    const lv = result.level
    const save = this.save
    if (lv === ENDLESS) save.endlessBest = Math.max(save.endlessBest, result.score)
    if (lv === BOWLING) save.bowlingBest = Math.max(save.bowlingBest, result.score)
    if (action === 'retry') {
      this.persist()
      this.startLevel(lv)
      return
    }
    if (action === 'menu' || !result.won) {
      this.persist()
      this.go(new SelectScene(this))
      return
    }
    const idx = LEVELS.indexOf(lv)
    const fresh = lv.reward.filter((id) => !save.plants.includes(id))
    if (idx >= 0) {
      if (!save.cleared.includes(idx)) save.cleared.push(idx)
      save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length - 1, idx + 1))
      for (const id of fresh) save.plants.push(id)
    }
    this.persist()
    this.go(new RewardScene(this, lv, fresh, idx === LEVELS.length - 1))
  }

  // ------------------------------------------------------------- loop

  start() {
    this.last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - this.last) / 1000)
      this.last = now
      this.tick(dt)
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  tick(dt: number) {
    this.acc += dt
    let steps = 0
    while (this.acc >= STEP && steps < 8) {
      this.step(STEP)
      this.acc -= STEP
      steps++
    }
    if (steps === 8) this.acc = 0
    this.draw()
  }

  private step(dt: number) {
    this.t += dt
    if (this.fadeDir === 1) {
      this.fade = Math.min(1, this.fade + dt / 0.28)
      if (this.fade >= 1 && this.next) {
        this.scene = this.next
        this.next = null
        this.fadeDir = -1
        if (this.scene.music !== null) this.audio.music(this.scene.music)
      }
    } else if (this.fadeDir === -1) {
      this.fade = Math.max(0, this.fade - dt / 0.28)
      if (this.fade <= 0) this.fadeDir = 0
    }
    this.scene.update(dt)
  }

  private draw() {
    const ctx = this.ctx
    const { canvas } = this
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = '#0b0f08'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const s = this.scale * this.dpr
    ctx.setTransform(s, 0, 0, s, this.ox * this.dpr, this.oy * this.dpr)
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, VIEW_W, VIEW_H)
    ctx.clip()
    this.ui.begin()
    this.scene.render(ctx)
    this.ui.end()
    if (this.fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.fade})`
      ctx.fillRect(0, 0, VIEW_W, VIEW_H)
    }
    ctx.restore()
    this.canvas.style.cursor = this.ui.wantsPointer ? 'pointer' : 'default'
  }

  // ------------------------------------------------------------- input / layout

  resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5)
    this.canvas.width = Math.round(w * this.dpr)
    this.canvas.height = Math.round(h * this.dpr)
    this.canvas.style.width = `${w}px`
    this.canvas.style.height = `${h}px`
    this.scale = Math.min(w / VIEW_W, h / VIEW_H)
    this.ox = (w - VIEW_W * this.scale) / 2
    this.oy = (h - VIEW_H * this.scale) / 2
    this.worlds.clear()
  }

  private toView(e: { clientX: number; clientY: number }) {
    return { x: (e.clientX - this.ox) / this.scale, y: (e.clientY - this.oy) / this.scale }
  }

  private bind() {
    let resizeT = 0
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeT)
      resizeT = window.setTimeout(() => this.resize(), 80)
    })
    const c = this.canvas
    c.addEventListener('contextmenu', (e) => e.preventDefault())
    c.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      this.audio.unlock()
      if (this.scene.music !== null) this.audio.music(this.scene.music)
      const p = this.toView(e)
      this.ui.mx = p.x
      this.ui.my = p.y
      this.ui.down = true
      if (this.fadeDir !== 0) return
      if (e.button !== 2) this.ui.queueClick(p.x, p.y)
      this.scene.down?.(p.x, p.y, e.button)
    })
    c.addEventListener('pointermove', (e) => {
      const p = this.toView(e)
      this.ui.mx = p.x
      this.ui.my = p.y
      this.scene.move?.(p.x, p.y)
    })
    window.addEventListener('pointerup', (e) => {
      this.ui.down = false
      const p = this.toView(e)
      this.scene.up?.(p.x, p.y)
    })
    window.addEventListener('keydown', (e) => {
      this.audio.unlock()
      if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault()
      this.scene.key?.(e.key)
    })
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.scene instanceof BattleScene && this.scene.battle.phase === 'play') this.scene.battle.paused = true
    })
  }

  /** Jump straight into a level: `?level=1-5`, `?level=endless`, `?level=bowling`. */
  openFromQuery(q: URLSearchParams) {
    if (q.has('unlock')) {
      this.save.unlocked = LEVELS.length - 1
      this.save.plants = [...PLANT_ORDER]
      this.save.seen = [...ZOMBIE_ORDER]
    }
    const scene = q.get('scene')
    if (scene === 'select') this.scene = new SelectScene(this)
    if (scene === 'almanac') this.scene = new AlmanacScene(this)
    if (scene === 'settings') this.scene = new SettingsScene(this)
    const id = q.get('level')
    if (!id) return false
    const lv = id === 'endless' ? ENDLESS : id === 'bowling' ? BOWLING : LEVELS.find((l) => l.id === id)
    if (!lv) return false
    this.scene = new BattleScene(this, new Battle(lv, this))
    return true
  }

  /** A staged mid-battle tableau, used for the arcade cover screenshot. */
  showcase() {
    const b = new Battle(LEVELS[11], this)
    b.slots = ['sunflower', 'peashooter', 'repeater', 'snowpea', 'wallnut', 'cherry', 'torchwood', 'threepeater']
    b.cam = 0
    b.setPhase('play')
    b.sun = 375
    b.cooldown.set('cherry', 30)
    b.cooldown.set('wallnut', 12)
    b.waveIndex = 13
    const layout: [number, number, Parameters<Battle['place']>[0]][] = [
      [0, 0, 'sunflower'],
      [1, 0, 'sunflower'],
      [2, 0, 'sunflower'],
      [3, 0, 'sunflower'],
      [4, 0, 'sunflower'],
      [0, 1, 'repeater'],
      [1, 1, 'snowpea'],
      [2, 1, 'threepeater'],
      [3, 1, 'repeater'],
      [4, 1, 'cabbage'],
      [0, 2, 'peashooter'],
      [2, 2, 'torchwood'],
      [3, 2, 'chomper'],
      [4, 2, 'peashooter'],
      [1, 3, 'squash'],
      [0, 4, 'wallnut'],
      [2, 4, 'tallnut'],
      [3, 4, 'spikeweed'],
      [4, 3, 'potato'],
      [1, 5, 'wallnut'],
    ]
    for (const [r, c, id] of layout) b.place(id, r, c)
    b.particles = []
    for (const p of b.plants) {
      p.age = 3
      if (p.id === 'potato') {
        p.state = 'armed'
        p.stateT = 20
      }
    }
    const zs: [string, number, number][] = [
      ['bucket', 0, 758],
      ['cone', 1, 856],
      ['football', 2, 762],
      ['basic', 3, 690],
      ['door', 4, 830],
      ['flag', 1, 1000],
      ['pole', 3, 1040],
      ['paper', 0, 930],
      ['garg', 2, 1060],
      ['basic', 4, 1000],
    ]
    for (const [id, row, x] of zs) {
      const z = b.makeZombie(id as Parameters<Battle['makeZombie']>[0], row, x)
      b.zombies.push(z)
    }
    b.zombies[0].state = 'eat'
    b.zombies[0].target = b.grid[0][4]!.uid
    b.zombies[1].slow = 8
    b.suns.push(b.makeSun(470, 300, 0, 0, 300, 25, 'idle'))
    b.suns.push(b.makeSun(820, 520, 0, 0, 520, 25, 'idle'))
    b.tipT = 0
    b.messages = []
    this.scene = new BattleScene(this, b)
    this.audio.sfxOn = false
  }
}
