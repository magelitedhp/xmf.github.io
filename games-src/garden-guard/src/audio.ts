export type Sfx =
  | 'plant'
  | 'shoot'
  | 'hit'
  | 'hitMetal'
  | 'hitSoft'
  | 'freeze'
  | 'fire'
  | 'sun'
  | 'explode'
  | 'chomp'
  | 'gulp'
  | 'groan'
  | 'mower'
  | 'siren'
  | 'lose'
  | 'win'
  | 'click'
  | 'buzz'
  | 'shovel'
  | 'vault'
  | 'squash'
  | 'bowl'
  | 'pop'
  | 'lob'
  | 'reward'
  | 'ready'
  | 'plantGo'
  | 'bite'
  | 'smash'
  | 'pick'

type Track = {
  bpm: number
  melody: (number | null)[]
  bass: number[]
  bassPattern: (number | null)[]
  lead: OscillatorType
  drums: boolean
}

const _ = null

// Original compositions — eighth-note grids, MIDI note numbers.
const TRACKS: Record<'menu' | 'battle', Track> = {
  menu: {
    bpm: 96,
    lead: 'triangle',
    drums: false,
    // prettier-ignore
    melody: [
      72, _, 76, _, 79, _, 76, _,   77, _, 74, _, 71, _, _, _,
      72, _, 76, _, 79, _, 84, _,   83, _, 79, _, _, _, _, _,
      81, _, 77, _, 72, _, 77, _,   79, _, 76, _, 72, _, _, _,
      74, _, 77, _, 76, _, 74, _,   72, _, _, _, 67, _, 71, _,
    ],
    bass: [48, 43, 48, 43, 41, 48, 43, 48],
    bassPattern: [0, _, _, _, 7, _, 12, _],
  },
  battle: {
    bpm: 124,
    lead: 'square',
    drums: true,
    // prettier-ignore
    melody: [
      69, _, 72, _, 76, 74, 72, _,   71, _, 67, _, 69, _, _, _,
      69, _, 72, _, 76, 77, 79, _,   77, 76, 74, _, 76, _, _, _,
      81, _, 79, 77, 76, _, 74, _,   72, _, 74, 76, 71, _, 67, _,
      69, 72, 71, 69, 68, _, 71, _,  69, _, _, _, 64, _, 68, _,
    ],
    bass: [45, 43, 45, 38, 41, 36, 38, 40],
    bassPattern: [0, _, 12, _, 0, _, 7, 12],
  },
}

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

export class AudioEngine {
  musicOn = true
  sfxOn = true
  intense = false
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private sfxBus: GainNode | null = null
  private musicBus: GainNode | null = null
  private noiseBuf: AudioBuffer | null = null
  private trackName: 'menu' | 'battle' | null = null
  private wanted: 'menu' | 'battle' | null = null
  private step = 0
  private nextTime = 0
  timer = 0
  private lastPlay = new Map<Sfx, number>()

  unlock() {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      const ctx = new Ctor()
      this.ctx = ctx
      this.master = ctx.createGain()
      this.master.gain.value = 0.8
      this.master.connect(ctx.destination)
      this.sfxBus = ctx.createGain()
      this.sfxBus.gain.value = 0.5
      this.sfxBus.connect(this.master)
      this.musicBus = ctx.createGain()
      this.musicBus.gain.value = this.musicOn ? 0.22 : 0
      this.musicBus.connect(this.master)
      const len = ctx.sampleRate
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate)
      const d = this.noiseBuf.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
      this.timer = window.setInterval(() => this.schedule(), 25)
      if (this.wanted) this.music(this.wanted)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  setMusicOn(on: boolean) {
    this.musicOn = on
    if (this.musicBus && this.ctx) this.musicBus.gain.setTargetAtTime(on ? 0.22 : 0, this.ctx.currentTime, 0.1)
  }

  music(name: 'menu' | 'battle' | null) {
    this.wanted = name
    if (!this.ctx) return
    if (name === this.trackName) return
    this.trackName = name
    this.step = 0
    this.nextTime = this.ctx.currentTime + 0.15
    this.intense = false
  }

  play(s: Sfx) {
    if (!this.sfxOn || !this.ctx || this.ctx.state !== 'running') return
    const now = this.ctx.currentTime
    const minGap = s === 'shoot' || s === 'hit' || s === 'hitSoft' ? 0.035 : s === 'groan' ? 1.2 : 0.02
    if (now - (this.lastPlay.get(s) ?? -1) < minGap) return
    this.lastPlay.set(s, now)
    const t = now
    switch (s) {
      case 'plant':
        this.noise(t, 0.12, 0.5, 'lowpass', 900, 200)
        this.tone(t, 160, 80, 0.12, 'sine', 0.5)
        break
      case 'shoot':
        this.tone(t, 520, 220, 0.07, 'sine', 0.35)
        this.noise(t, 0.04, 0.18, 'highpass', 2000, 2000)
        break
      case 'hit':
        this.noise(t, 0.07, 0.35, 'bandpass', 1400, 500)
        this.tone(t, 300, 140, 0.06, 'triangle', 0.25)
        break
      case 'hitSoft':
        this.noise(t, 0.06, 0.28, 'bandpass', 900, 400)
        break
      case 'hitMetal':
        this.tone(t, 1250, 1180, 0.18, 'square', 0.1)
        this.tone(t, 1870, 1800, 0.14, 'triangle', 0.1)
        this.noise(t, 0.05, 0.2, 'highpass', 3000, 3000)
        break
      case 'freeze':
        this.tone(t, 1800, 2600, 0.12, 'sine', 0.15)
        this.noise(t, 0.08, 0.2, 'highpass', 4000, 6000)
        break
      case 'fire':
        this.noise(t, 0.25, 0.3, 'lowpass', 1600, 400)
        break
      case 'sun':
        this.tone(t, 880, 880, 0.09, 'sine', 0.3)
        this.tone(t + 0.07, 1318, 1318, 0.16, 'sine', 0.3)
        break
      case 'explode':
        this.noise(t, 0.9, 1, 'lowpass', 1800, 60)
        this.tone(t, 120, 30, 0.7, 'sine', 0.9)
        break
      case 'chomp':
        this.noise(t, 0.08, 0.3, 'lowpass', 700, 300)
        this.tone(t, 110, 70, 0.08, 'square', 0.12)
        break
      case 'bite':
        this.noise(t, 0.14, 0.5, 'lowpass', 1200, 200)
        this.tone(t, 200, 60, 0.14, 'square', 0.25)
        break
      case 'gulp':
        this.tone(t, 300, 90, 0.22, 'sine', 0.45)
        break
      case 'groan': {
        const f = 90 + Math.random() * 40
        this.tone(t, f, f * 0.75, 0.9, 'sawtooth', 0.12, 500)
        break
      }
      case 'mower':
        this.tone(t, 70, 90, 1.2, 'sawtooth', 0.25, 900)
        this.noise(t, 1.2, 0.2, 'bandpass', 600, 800)
        break
      case 'siren':
        for (let i = 0; i < 3; i++) {
          this.tone(t + i * 0.55, 330, 660, 0.5, 'sawtooth', 0.18, 1800)
        }
        break
      case 'lose':
        ;[392, 370, 349, 262].forEach((f, i) => this.tone(t + i * 0.32, f, f * 0.97, 0.42, 'triangle', 0.4))
        break
      case 'win':
        ;[523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.tone(t + i * 0.12, f, f, 0.22, 'square', 0.18, 3000))
        break
      case 'reward':
        ;[784, 988, 1175, 1568].forEach((f, i) => this.tone(t + i * 0.09, f, f, 0.3, 'triangle', 0.3))
        break
      case 'click':
        this.tone(t, 900, 600, 0.05, 'triangle', 0.25)
        break
      case 'pick':
        this.tone(t, 600, 900, 0.07, 'triangle', 0.25)
        break
      case 'buzz':
        this.tone(t, 140, 120, 0.18, 'square', 0.15, 900)
        break
      case 'shovel':
        this.noise(t, 0.18, 0.45, 'bandpass', 1200, 300)
        break
      case 'vault':
        this.noise(t, 0.35, 0.25, 'bandpass', 600, 2400)
        break
      case 'squash':
        this.tone(t, 160, 40, 0.3, 'sine', 0.8)
        this.noise(t, 0.2, 0.5, 'lowpass', 800, 100)
        break
      case 'smash':
        this.tone(t, 90, 30, 0.45, 'sine', 0.9)
        this.noise(t, 0.35, 0.7, 'lowpass', 1200, 80)
        break
      case 'bowl':
        this.tone(t, 260, 180, 0.12, 'triangle', 0.4)
        this.noise(t, 0.08, 0.3, 'lowpass', 900, 300)
        break
      case 'pop':
        this.tone(t, 300, 700, 0.08, 'sine', 0.35)
        break
      case 'lob':
        this.tone(t, 220, 330, 0.12, 'triangle', 0.2)
        break
      case 'ready':
        this.tone(t, 523, 523, 0.18, 'triangle', 0.3)
        break
      case 'plantGo':
        this.tone(t, 784, 784, 0.12, 'square', 0.2, 3000)
        this.tone(t + 0.1, 1046, 1046, 0.35, 'square', 0.2, 3000)
        break
    }
  }

  private tone(t: number, f0: number, f1: number, dur: number, type: OscillatorType, vol: number, lowpass = 0, bus?: GainNode) {
    if (!this.ctx) return
    const out = bus ?? this.sfxBus
    if (!out) return
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(f0, t)
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    let node: AudioNode = osc
    if (lowpass) {
      const f = this.ctx.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = lowpass
      node.connect(f)
      node = f
    }
    node.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  }

  private noise(t: number, dur: number, vol: number, type: BiquadFilterType, f0: number, f1: number, bus?: GainNode) {
    if (!this.ctx || !this.noiseBuf) return
    const out = bus ?? this.sfxBus
    if (!out) return
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuf
    const f = this.ctx.createBiquadFilter()
    f.type = type
    f.frequency.setValueAtTime(f0, t)
    f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f).connect(g).connect(out)
    src.start(t, Math.random() * 0.4)
    src.stop(t + dur + 0.05)
  }

  private schedule() {
    const ctx = this.ctx
    if (!ctx || !this.trackName || !this.musicBus) return
    const track = TRACKS[this.trackName]
    const bpm = track.bpm * (this.intense ? 1.12 : 1)
    const eighth = 60 / bpm / 2
    if (this.nextTime < ctx.currentTime - 0.2) this.nextTime = ctx.currentTime + 0.05
    while (this.nextTime < ctx.currentTime + 0.12) {
      this.scheduleStep(track, this.step, this.nextTime, eighth)
      this.nextTime += eighth
      this.step = (this.step + 1) % track.melody.length
    }
  }

  private scheduleStep(track: Track, i: number, t: number, eighth: number) {
    const bus = this.musicBus!
    const note = track.melody[i]
    if (note != null) {
      let len = 1
      while (len < 4 && track.melody[(i + len) % track.melody.length] == null) len++
      const dur = Math.min(len, 3) * eighth * 0.95
      this.tone(t, midi(note), midi(note), dur, track.lead, track.lead === 'square' ? 0.16 : 0.32, 2600, bus)
      this.tone(t, midi(note + 12), midi(note + 12), dur * 0.6, 'sine', 0.06, 0, bus)
    }
    const bar = Math.floor(i / 8) % track.bass.length
    const bp = track.bassPattern[i % 8]
    if (bp != null) this.tone(t, midi(track.bass[bar] + bp), midi(track.bass[bar] + bp), eighth * 1.6, 'triangle', 0.42, 900, bus)
    if (track.drums) {
      const s = i % 8
      if (s === 0 || s === 4 || (this.intense && s === 6)) this.tone(t, 150, 42, 0.16, 'sine', 0.7, 0, bus)
      if (s === 2 || s === 6) this.noise(t, 0.12, 0.28, 'bandpass', 1800, 900, bus)
      if (s % 2 === 1 || this.intense) this.noise(t, 0.03, this.intense ? 0.12 : 0.08, 'highpass', 7000, 7000, bus)
    }
  }
}
