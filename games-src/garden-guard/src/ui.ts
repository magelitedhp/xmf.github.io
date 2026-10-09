import type { AudioEngine } from './audio'
import { linear, paint, rrect, text, type Ctx } from './util'

export type ButtonStyle = 'wood' | 'stone' | 'green' | 'red' | 'ghost'

const STYLES: Record<ButtonStyle, { top: string; bottom: string; edge: string; ink: string; stroke: string | undefined }> = {
  wood: { top: '#c98a4b', bottom: '#8a5426', edge: '#3e2210', ink: '#fff3d6', stroke: '#4a2a10' },
  stone: { top: '#b9bcc0', bottom: '#7d8186', edge: '#3a3d41', ink: '#2a2d31', stroke: undefined },
  green: { top: '#8fdc58', bottom: '#3f9424', edge: '#1d4a0e', ink: '#ffffff', stroke: '#1d4a0e' },
  red: { top: '#f0705a', bottom: '#a8281a', edge: '#4a0c06', ink: '#ffffff', stroke: '#4a0c06' },
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
    rrect(ctx, x, y + 4, w, h, 12)
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fill()
    rrect(ctx, x, y + oy, w, h, 12)
    paint(ctx, linear(ctx, 0, y, 0, y + h, [[0, s.top], [1, s.bottom]]), s.edge, 3)
    if (style === 'wood') {
      ctx.strokeStyle = 'rgba(60,30,10,0.25)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let i = 1; i < 3; i++) {
        ctx.moveTo(x + 10, y + oy + (h * i) / 3)
        ctx.quadraticCurveTo(x + w / 2, y + oy + (h * i) / 3 + 3, x + w - 10, y + oy + (h * i) / 3)
      }
      ctx.stroke()
    }
    rrect(ctx, x + 4, y + oy + 3, w - 8, h * 0.38, 9)
    ctx.fillStyle = hover ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.16)'
    ctx.fill()
    text(ctx, label, x + w / 2, y + oy + h / 2 + 1, { size, color: s.ink, stroke: s.stroke, lw: 4, weight: 900 })
    ctx.restore()
    if (disabled) return false
    const clicked = this.hit(x, y, w, h)
    if (clicked) this.audio.play('click')
    return clicked
  }
}
