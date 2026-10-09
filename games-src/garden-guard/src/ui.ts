import type { AudioEngine } from './audio'
import { linear, paint, rrect, text, type Ctx } from './util'

export type ButtonStyle = 'wood' | 'stone' | 'green' | 'red' | 'ghost'

const STYLES: Record<ButtonStyle, { top: string; bottom: string; edge: string; ink: string; stroke: string | undefined }> = {
  wood: { top: '#f4f6de', bottom: '#e2ebc8', edge: '#729874', ink: '#2c5142', stroke: undefined },
  stone: { top: '#e3ece9', bottom: '#ccdcd7', edge: '#76968e', ink: '#2a4e46', stroke: undefined },
  green: { top: '#426f55', bottom: '#2c5a47', edge: '#234638', ink: '#edf7d8', stroke: undefined },
  red: { top: '#e9a389', bottom: '#d17e69', edge: '#a25e51', ink: '#fff8ed', stroke: undefined },
  ghost: { top: 'rgba(255,255,255,0.14)', bottom: 'rgba(255,255,255,0.06)', edge: 'rgba(255,255,255,0.4)', ink: '#ffffff', stroke: undefined },
}

/**
 * Immediate-mode UI: scenes call button()/hit() while drawing, and a click
 * queued by the pointer handler is consumed by the first region that claims it.
 */
export class UI {
  mx = -999
  my = -999
  down = false
  private click: { x: number; y: number } | null = null
  wantsPointer = false
  constructor(private audio: AudioEngine) {}

  queueClick(x: number, y: number) {
    this.click = { x, y }
  }

  begin() {
    this.wantsPointer = false
  }

  end() {
    this.click = null
  }

  hasClick() {
    return this.click !== null
  }

  consume() {
    this.click = null
  }

  over(x: number, y: number, w: number, h: number) {
    const inside = this.mx >= x && this.mx <= x + w && this.my >= y && this.my <= y + h
    if (inside) this.wantsPointer = true
    return inside
  }

  hit(x: number, y: number, w: number, h: number) {
    const c = this.click
    if (!c || c.x < x || c.x > x + w || c.y < y || c.y > y + h) return false
    this.click = null
    return true
  }

  button(ctx: Ctx, label: string, x: number, y: number, w: number, h: number, style: ButtonStyle = 'wood', size = 22, disabled = false) {
    const s = STYLES[style]
    const hover = !disabled && this.over(x, y, w, h)
    const press = hover && this.down
    const oy = press ? 2 : hover ? -1 : 0
    ctx.save()
    if (disabled) ctx.globalAlpha *= 0.45
    rrect(ctx, x, y + 4, w, h, 18)
    ctx.fillStyle = 'rgba(35,69,54,0.12)'
    ctx.fill()
    rrect(ctx, x, y + oy, w, h, 18)
    paint(ctx, linear(ctx, 0, y, 0, y + h, [[0, s.top], [1, s.bottom]]), s.edge, 1.5)
    ctx.beginPath()
    ctx.moveTo(x + 18, y + oy + 2)
    ctx.lineTo(x + w - 18, y + oy + 2)
    ctx.strokeStyle = hover ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 1
    ctx.stroke()
    text(ctx, label, x + w / 2, y + oy + h / 2 + 1, { size, color: s.ink, stroke: s.stroke, lw: 4, weight: 650 })
    ctx.restore()
    if (disabled) return false
    const clicked = this.hit(x, y, w, h)
    if (clicked) this.audio.play('click')
    return clicked
  }
}
