interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; diamond: boolean }
interface Wave { x: number; y: number; age: number; max: number; color: string; radius: number }

export class Starfield {
  private context: CanvasRenderingContext2D | null
  private observer: ResizeObserver
  private frame = 0
  private previous = 0
  private width = 1
  private height = 1
  private reduced = false
  private hidden = false
  private color = '#79f0d2'
  private particles: Particle[] = []
  private waves: Wave[] = []
  private stars = Array.from({ length: 100 }, () => ({ x: Math.random(), y: Math.random(), size: Math.random() * 1.2 + .35, phase: Math.random() * 6.28, speed: .3 + Math.random() }))

  constructor(private canvas: HTMLCanvasElement) {
    this.context = canvas.getContext('2d')
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas)
    this.resize()
    this.start()
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect()
    this.width = rect.width || 1
    this.height = rect.height || 1
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(this.width * ratio)
    this.canvas.height = Math.round(this.height * ratio)
    this.context?.setTransform(ratio, 0, 0, ratio, 0, 0)
    if (this.reduced) this.draw(performance.now(), 0)
  }

  setTheme(color: string) { this.color = color; if (this.reduced) this.draw(performance.now(), 0) }
  setReduced(value: boolean) { this.reduced = value; this.stop(); this.draw(performance.now(), 0); this.start() }
  setHidden(value: boolean) { this.hidden = value; if (value) this.stop(); else this.start() }

  private start() {
    if (this.frame || this.reduced || this.hidden || !this.context) return
    this.previous = performance.now()
    const tick = (now: number) => {
      this.frame = requestAnimationFrame(tick)
      if (now - this.previous < 30) return
      const dt = Math.min(.05, (now - this.previous) / 1000)
      this.previous = now
      this.draw(now, dt)
    }
    this.frame = requestAnimationFrame(tick)
  }

  private stop() { cancelAnimationFrame(this.frame); this.frame = 0 }

  burst(x: number, y: number, count = 18, color = this.color, celebration = false) {
    if (this.reduced) return
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2
      const speed = 22 + Math.random() * (celebration ? 220 : 90)
      const life = .5 + Math.random() * (celebration ? 2 : .7)
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - (celebration ? 100 : 12), life, max: life, size: Math.random() * (celebration ? 3.5 : 2) + .8, color, diamond: celebration })
    }
    if (this.particles.length > 350) this.particles.splice(0, this.particles.length - 350)
  }

  wave(x: number, y: number, color = this.color, radius = 160) {
    if (!this.reduced) this.waves.push({ x, y, age: 0, max: 1.4, color, radius })
  }

  private draw(now: number, dt: number) {
    const ctx = this.context
    if (!ctx) return
    const time = this.reduced ? 0 : now / 1000
    ctx.clearRect(0, 0, this.width, this.height)
    for (const star of this.stars) {
      const x = star.x * this.width
      const y = (star.y * this.height + time * star.speed * 1.8) % this.height
      ctx.globalAlpha = .18 + (.5 + Math.sin(time * star.speed + star.phase) * .5) * .4
      ctx.fillStyle = this.color
      ctx.beginPath(); ctx.arc(x, y, star.size, 0, Math.PI * 2); ctx.fill()
      if (star.size > 1.4) {
        ctx.strokeStyle = this.color; ctx.lineWidth = .6
        ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke()
      }
    }
    // A quiet satellite orbit above the command deck.
    const ox = this.width * .82, oy = 124
    ctx.globalAlpha = .12; ctx.strokeStyle = this.color; ctx.lineWidth = 1
    ctx.beginPath(); ctx.ellipse(ox, oy, 130, 51, -.4, 0, Math.PI * 2); ctx.stroke()
    const angle = time * .16
    const px = Math.cos(angle) * 130, py = Math.sin(angle) * 51
    const sx = ox + px * Math.cos(-.4) - py * Math.sin(-.4)
    const sy = oy + px * Math.sin(-.4) + py * Math.cos(-.4)
    ctx.globalAlpha = .8; ctx.fillStyle = this.color
    ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fill()
    if (!this.reduced) {
      const flight = (time % 11) / 1.2
      if (flight < 1) {
        const x = this.width * (.2 + flight * .6), y = 30 + flight * 160
        const trail = ctx.createLinearGradient(x - 90, y - 26, x, y)
        trail.addColorStop(0, 'transparent'); trail.addColorStop(1, this.color)
        ctx.globalAlpha = Math.sin(flight * Math.PI) * .5; ctx.strokeStyle = trail
        ctx.beginPath(); ctx.moveTo(x - 90, y - 26); ctx.lineTo(x, y); ctx.stroke()
      }
    }
    for (const wave of this.waves) {
      wave.age += dt
      const progress = wave.age / wave.max
      ctx.globalAlpha = (1 - progress) * .7; ctx.strokeStyle = wave.color
      ctx.lineWidth = 1.5 * (1 - progress) + .2
      ctx.beginPath(); ctx.arc(wave.x, wave.y, 8 + wave.radius * (1 - (1 - progress) ** 3), 0, Math.PI * 2); ctx.stroke()
    }
    this.waves = this.waves.filter((wave) => wave.age < wave.max)
    for (const particle of this.particles) {
      particle.life -= dt
      particle.x += particle.vx * dt; particle.y += particle.vy * dt
      particle.vx *= 1 - dt * .65
      particle.vy += (particle.diamond ? 110 : 12) * dt
      ctx.globalAlpha = Math.max(0, particle.life / particle.max)
      ctx.fillStyle = particle.color
      if (particle.diamond) {
        ctx.save(); ctx.translate(particle.x, particle.y); ctx.rotate(time * 2 + particle.x)
        ctx.fillRect(-particle.size / 2, -particle.size, particle.size, particle.size * 2); ctx.restore()
      } else { ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill() }
    }
    this.particles = this.particles.filter((particle) => particle.life > 0)
    ctx.globalAlpha = 1
  }

  destroy() { this.stop(); this.observer.disconnect(); this.particles = []; this.waves = [] }
}

export class SpaceAudio {
  enabled = true
  private context: AudioContext | null = null

  private getContext() {
    if (!this.enabled) return null
    try {
      this.context ??= new AudioContext()
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {})
      return this.context
    } catch { return null }
  }

  private note(ctx: AudioContext, frequency: number, delay: number, duration: number, volume = .055, type: OscillatorType = 'sine', end?: number) {
    const start = ctx.currentTime + delay
    const oscillator = ctx.createOscillator(), gain = ctx.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    if (end) oscillator.frequency.exponentialRampToValueAtTime(end, start + duration)
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(volume, start + .012)
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration)
    oscillator.connect(gain); gain.connect(ctx.destination)
    oscillator.start(start); oscillator.stop(start + duration + .02)
  }

  play(kind: 'open' | 'bloom' | 'mark' | 'scan' | 'win' | 'lose' | 'switch', value = 0) {
    const ctx = this.getContext()
    if (!ctx) return
    const scale = [261.63, 329.63, 392, 440, 523.25, 659.25, 783.99, 880, 1046.5]
    if (kind === 'open') this.note(ctx, scale[Math.min(8, value)] * 1.4, 0, .2, .035)
    if (kind === 'bloom') [0, 2, 4, 6].forEach((step, index) => this.note(ctx, scale[step], index * .065, .45, .04))
    if (kind === 'mark') { this.note(ctx, 720, 0, .08, .025, 'triangle'); this.note(ctx, 1080, .04, .12, .025) }
    if (kind === 'scan') { this.note(ctx, 180, 0, .65, .035, 'sine', 1200); this.note(ctx, 880, .38, .65, .04) }
    if (kind === 'switch') this.note(ctx, 520, 0, .16, .02, 'sine', 780)
    if (kind === 'win') [0, 1, 2, 4, 2, 4, 5, 8].forEach((step, index) => this.note(ctx, scale[step], index * .11, .7, .045))
    if (kind === 'lose') {
      this.note(ctx, 110, 0, 1.1, .075, 'triangle', 28)
      this.note(ctx, 220, .05, .6, .035, 'sawtooth', 40)
    }
  }

  destroy() { if (this.context) void this.context.close().catch(() => {}); this.context = null }
}
