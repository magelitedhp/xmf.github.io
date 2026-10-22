import type { Texture } from 'pixi.js'
import type { MeasureText } from './latticeLyrics'

type Pixi = typeof import('pixi.js')

const MEASURE_CACHE_LIMIT = 4096

/**
 * One measurement context per runtime; textures are owned by visible pieces and
 * released with them. Ported from `latticeLyricRaster.ts`.
 */
export function createLatticeRaster(pixi: Pixi) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Lattice text rasterization is unavailable')

  const measurements = new Map<string, Map<string, { width: number; height: number }>>()
  let measured = 0

  const clearMeasureCache = () => {
    measurements.clear()
    measured = 0
  }

  const measure: MeasureText = (text, font) => {
    let byText = measurements.get(font)
    const cached = byText?.get(text)
    if (cached) return cached
    context.font = font
    const metrics = context.measureText(text)
    const size = {
      width: metrics.width,
      height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
    }
    if (measured >= MEASURE_CACHE_LIMIT) {
      clearMeasureCache()
      byText = undefined
    }
    if (!byText) {
      byText = new Map()
      measurements.set(font, byText)
    }
    byText.set(text, size)
    measured += 1
    return size
  }

  const rasterize = (
    text: string,
    font: string,
    fontPx: number,
    resolution: number,
  ): { texture: Texture; width: number; height: number; pad: number } => {
    context.font = font
    const metrics = context.measureText(text)
    const pad = Math.ceil(
      Math.max(
        fontPx * 0.5,
        metrics.actualBoundingBoxLeft,
        metrics.actualBoundingBoxRight - metrics.width,
        2,
      ),
    )
    const width = Math.max(1, Math.ceil(metrics.width + pad * 2))
    const ascent = Math.max(fontPx, metrics.actualBoundingBoxAscent)
    const height = Math.ceil(
      ascent + Math.max(fontPx * 0.3, metrics.actualBoundingBoxDescent) + pad * 2,
    )

    const surface = document.createElement('canvas')
    surface.width = Math.ceil(width * resolution)
    surface.height = Math.ceil(height * resolution)
    const paint = surface.getContext('2d')
    if (!paint) throw new Error('Lattice text texture is unavailable')
    paint.scale(resolution, resolution)
    paint.font = font
    paint.fillStyle = '#ffffff'
    paint.fillText(text, pad, pad + ascent)

    // Construct at resolution 1, then set the real density: constructing with it
    // directly can re-run resizeCanvas() for inexact round trips and wipe the glyph.
    const source = new pixi.CanvasSource({ resource: surface, resolution: 1 })
    source.resolution = resolution
    return { texture: new pixi.Texture({ source }), width, height, pad }
  }

  return { measure, rasterize, clearMeasureCache }
}

export type LatticeRaster = ReturnType<typeof createLatticeRaster>
