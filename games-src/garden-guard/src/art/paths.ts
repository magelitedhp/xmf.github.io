import { C, type Ctx } from '../util'

// Reuse the hand-drawn outlines at every size: lawn, seed packets and almanac.
// Path2D caches geometry, while paint is evaluated per frame so frost / damage
// tinting and animation keep working without rasterizing the characters.
const outlines = new Map<string, Path2D>()

export function shape(ctx: Ctx, d: string, fill: string | CanvasGradient | null, stroke: string | null = '#283619', width = 2.4) {
  let path = outlines.get(d)
  if (!path) {
    path = new Path2D(d)
    outlines.set(d, path)
  }
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (fill) {
    ctx.fillStyle = typeof fill === 'string' ? C(fill) : fill
    ctx.fill(path)
  }
  if (stroke) {
    ctx.strokeStyle = C(stroke)
    ctx.lineWidth = width
    ctx.stroke(path)
  }
}
