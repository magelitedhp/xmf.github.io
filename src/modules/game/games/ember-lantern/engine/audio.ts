export type Sfx =
  | 'swing'
  | 'hit'
  | 'crit'
  | 'hurt'
  | 'jump'
  | 'dash'
  | 'kill'
  | 'pick'
  | 'heal'
  | 'shoot'
  | 'slam'
  | 'boss'
  | 'clear'
  | 'select'
  | 'die'

type AudioCtor = typeof AudioContext

export class Sound {
  muted = false
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noiseBuf: AudioBuffer | null = null

  unlock() {
    if (!this.ctx) {
      const Ctor: AudioCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
      if (!Ctor) return
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.35
      this.master.connect(this.ctx.destination)
      const len = Math.floor(this.ctx.sampleRate * 0.5)
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const data = this.noiseBuf.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  close() {
    void this.ctx?.close()
    this.ctx = null
  }

  play(sfx: Sfx) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return
    switch (sfx) {
      case 'swing':
        this.noise(0.08, 0.25, 2400, 900)
        break
      case 'hit':
        this.tone(220, 90, 0.08, 'square', 0.22)
        this.noise(0.06, 0.25, 1800, 400)
        break
      case 'crit':
        this.tone(520, 140, 0.12, 'square', 0.25)
        this.noise(0.1, 0.35, 3000, 600)
        break
      case 'hurt':
        this.tone(180, 60, 0.22, 'sawtooth', 0.3)
        break
      case 'jump':
        this.tone(260, 520, 0.09, 'square', 0.12)
        break
      case 'dash':
        this.noise(0.14, 0.3, 900, 3200)
        break
      case 'kill':
        this.tone(330, 660, 0.12, 'triangle', 0.22)
        break
      case 'pick':
      case 'select':
        this.tone(660, 990, 0.1, 'triangle', 0.18)
        break
      case 'heal':
        this.tone(520, 1040, 0.18, 'sine', 0.2)
        break
      case 'shoot':
        this.tone(700, 300, 0.1, 'square', 0.1)
        break
      case 'slam':
        this.tone(90, 40, 0.3, 'sawtooth', 0.35)
        this.noise(0.25, 0.4, 600, 120)
        break
      case 'boss':
        this.tone(110, 55, 0.8, 'sawtooth', 0.3)
        break
      case 'clear':
        this.tone(440, 880, 0.25, 'triangle', 0.22)
        break
      case 'die':
        this.tone(300, 50, 0.9, 'sawtooth', 0.32)
        break
    }
  }

  private tone(f0: number, f1: number, dur: number, type: OscillatorType, vol: number) {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(f0, t)
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur)
    gain.gain.setValueAtTime(vol, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(gain).connect(this.master)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  private noise(dur: number, vol: number, f0: number, f1: number) {
    if (!this.ctx || !this.master || !this.noiseBuf) return
    const t = this.ctx.currentTime
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuf
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(f0, t)
    filter.frequency.exponentialRampToValueAtTime(f1, t + dur)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(vol, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    src.connect(filter).connect(gain).connect(this.master)
    src.start(t)
    src.stop(t + dur + 0.02)
  }
}
